import { CONTENT_SECTIONS, getContentDocument } from "../models/Content.js";
import { FOLDERS, destroyImage, uploadImage } from "../config/cloudinary.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getString } from "../utils/validation.js";
import { recordAudit } from "../services/audit.js";

/**
 * The admin panel sends section content as JSON, but the home tab also lets the
 * owner pick a hero image - so a save may arrive as multipart/form-data with the
 * section serialized into a `content` field. Both are accepted.
 */
function parseSectionPayload(raw) {
  if (raw === undefined || raw === null || raw === "") {
    throw new AppError('"content" is required', 400);
  }

  if (typeof raw === "string") {
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new AppError('"content" must be a JSON object', 400);
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new AppError('"content" must be a JSON object', 400);
    }
    return parsed;
  }

  if (typeof raw !== "object" || Array.isArray(raw)) {
    throw new AppError('"content" must be a JSON object', 400);
  }
  return raw;
}

const IMAGE_FIELD_READERS = {
  home: (payload) => [
    payload.heroBanner,
    payload.aboutImage,
    ...(Array.isArray(payload.galleryImages) ? payload.galleryImages : []),
  ],
  about: (payload) =>
    Array.isArray(payload.activities) ? payload.activities.map((activity) => activity?.image) : [],
  safari: (payload) => [
    payload.heroBanner,
    ...(Array.isArray(payload.zones) ? payload.zones.map((z) => z?.heroImage) : []),
  ],
  tickets: (payload) => [payload.heroBanner],
  parkRules: (payload) => [payload.heroBanner],
  stay: (payload) => [
    payload.heroBanner,
    payload.ctaBand?.bgImage,
    payload.wildBrook?.mainImage,
    payload.wildBrook?.leafImage,
    payload.wildBrook?.sunsetImage,
  ],
  faqs: (payload) => [payload.heroBanner],
  activities: (payload) => [
    payload.heroBanner,
    payload.ctaBand?.bgImage,
    ...(Array.isArray(payload.items) ? payload.items.map((item) => item?.image) : []),
  ],
  rafting: (payload) => [
    payload.heroBanner,
    ...(Array.isArray(payload.stretches) ? payload.stretches.map((stretch) => stretch?.image) : []),
  ],
  fauna: (payload) => [payload.heroBanner, payload.hubHeroBanner],
  birds: (payload) => [
    payload.heroBanner,
    ...(Array.isArray(payload.galleryImages) ? payload.galleryImages : []),
  ],
  reptiles: (payload) => [payload.heroBanner],
  flora: (payload) => [payload.heroBanner],
  butterflies: (payload) => [payload.heroBanner],
  booking: (payload) => [payload.heroBanner],
  jeepSafari: (payload) => [payload.heroBanner],
  birdWatching: (payload) => [payload.heroBanner],
  trekking: (payload) => [payload.heroBanner],
  howToReach: (payload) => [payload.heroBanner, payload.mapImage],
  settings: () => [],
};

// Rotating header lists (`heroImages`, zone `heroImages`, home `aboutImages`)
// follow the same URL-only rule as the single image fields above.
function imageListValues(payload) {
  const list = (value) => (Array.isArray(value) ? value : []);
  return [
    ...list(payload.heroImages),
    ...list(payload.aboutImages),
    ...list(payload.galleryImages),
    ...list(payload.zones).flatMap((zone) => [...list(zone?.heroImages), ...list(zone?.galleryImages)]),
  ];
}

/**
 * A browser File survives JSON.stringify as `{}`. Rather than storing garbage or
 * failing with an opaque cast error, tell the caller exactly how to upload.
 */
function assertImagesAreUrls(section, payload) {
  const reader = IMAGE_FIELD_READERS[section];
  if (!reader) return;
  for (const value of [...reader(payload), ...imageListValues(payload)]) {
    if (value != null && value !== "" && typeof value !== "string") {
      throw new AppError(
        'Image fields must be URL strings. Send the file as multipart/form-data under "heroBanner", ' +
          "or POST it to /api/uploads/image and store the URL it returns.",
        400
      );
    }
  }
}

/**
 * Cloudinary ids (`heroBannerPublicId`, a zone's `heroImagePublicId`, …) decide
 * which stored image is deleted when a photo is replaced, so they are only ever
 * set by the server. Whatever the client sends for them is replaced with the
 * stored value at the same place (or dropped when there is none).
 */
function keepServerPublicIds(incoming, current) {
  if (Array.isArray(incoming)) {
    return incoming.map((item, index) => keepServerPublicIds(item, Array.isArray(current) ? current[index] : undefined));
  }
  if (!incoming || typeof incoming !== "object") return incoming;
  const out = {};
  for (const [key, value] of Object.entries(incoming)) {
    if (/PublicId$/.test(key)) {
      const stored = current && typeof current === "object" ? current[key] : undefined;
      if (typeof stored === "string") out[key] = stored;
      continue;
    }
    out[key] = keepServerPublicIds(value, current && typeof current === "object" ? current[key] : undefined);
  }
  return out;
}

export const getContent = asyncHandler(async (req, res) => {
  const doc = await getContentDocument();
  res.json({ success: true, data: doc.toObject() });
});

export const getSection = (section) =>
  asyncHandler(async (req, res) => {
    const doc = await getContentDocument();
    // Returned under both keys so readers can use `data` or the section name.
    res.json({ success: true, data: doc[section], [section]: doc[section] });
  });

/**
 * @param {string|null} fixedSection Set for the per-section endpoints
 *   (`safari/update`, `settings/update`); null reads the section from the body.
 */
const buildUpdateHandler = (fixedSection) =>
  asyncHandler(async (req, res) => {
    // Matched case-insensitively, then resolved to the schema's camelCase key
    // (`parkRules`, `howToReach`, ...).
    const requested = fixedSection ?? getString(req.body, "section", { required: true, max: 20 });
    const section = CONTENT_SECTIONS.find((key) => key.toLowerCase() === requested.toLowerCase());

    if (!section) {
      throw new AppError(
        `Unknown section "${requested}". Expected one of: ${CONTENT_SECTIONS.join(", ")}`,
        400
      );
    }

    const parsed = parseSectionPayload(req.body.content);
    assertImagesAreUrls(section, parsed);

    const doc = await getContentDocument();
    const current = doc[section]?.toObject() ?? {};
    const incoming = keepServerPublicIds(parsed, current);
    const previousBannerPublicId = current.heroBannerPublicId;

    const heroFile = req.files?.heroBanner?.[0];
    if (heroFile) {
      const image = await uploadImage(heroFile, FOLDERS.content);
      incoming.heroBanner = image.url;
      incoming.heroBannerPublicId = image.publicId;
    }

    // Merged rather than replaced: a client that posts only the fields it edited
    // must not wipe the rest of the section.
    doc.set(section, { ...current, ...incoming });
    doc.markModified(section);
    await doc.save();

    if (previousBannerPublicId && previousBannerPublicId !== doc[section].heroBannerPublicId) {
      await destroyImage(previousBannerPublicId);
    }
    await recordAudit(req, "content.update", section, { fields: Object.keys(incoming) });

    res.json({
      success: true,
      message: `${section} content saved`,
      data: { [section]: doc[section] },
    });
  });

export const updateContent = buildUpdateHandler(null);
export const updateSafari = buildUpdateHandler("safari");
export const updateSettings = buildUpdateHandler("settings");
