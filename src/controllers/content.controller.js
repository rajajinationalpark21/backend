import { CONTENT_SECTIONS, getContentDocument } from "../models/Content.js";
import { FOLDERS, destroyImage, uploadImage } from "../config/cloudinary.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getString } from "../utils/validation.js";

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
  home: (payload) => [payload.heroBanner],
  about: (payload) =>
    Array.isArray(payload.activities) ? payload.activities.map((activity) => activity?.image) : [],
  safari: () => [],
  settings: () => [],
};

/**
 * A browser File survives JSON.stringify as `{}`. Rather than storing garbage or
 * failing with an opaque cast error, tell the caller exactly how to upload.
 */
function assertImagesAreUrls(section, payload) {
  for (const value of IMAGE_FIELD_READERS[section](payload)) {
    if (value != null && value !== "" && typeof value !== "string") {
      throw new AppError(
        'Image fields must be URL strings. Send the file as multipart/form-data under "heroBanner", ' +
          "or POST it to /api/uploads/image and store the URL it returns.",
        400
      );
    }
  }
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
    const section = fixedSection ?? getString(req.body, "section", { required: true, max: 20 }).toLowerCase();

    if (!CONTENT_SECTIONS.includes(section)) {
      throw new AppError(
        `Unknown section "${section}". Expected one of: ${CONTENT_SECTIONS.join(", ")}`,
        400
      );
    }

    const incoming = parseSectionPayload(req.body.content);
    assertImagesAreUrls(section, incoming);

    const doc = await getContentDocument();
    const current = doc[section]?.toObject() ?? {};
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

    res.json({
      success: true,
      message: `${section} content saved`,
      data: { [section]: doc[section] },
    });
  });

export const updateContent = buildUpdateHandler(null);
export const updateSafari = buildUpdateHandler("safari");
export const updateSettings = buildUpdateHandler("settings");
