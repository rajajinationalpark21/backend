import bcrypt from "bcryptjs";
import { MIN_PASSWORD_LENGTH } from "../controllers/admin.controller.js";
import { connectDatabase, disconnectDatabase } from "../config/db.js";
import { env } from "../config/env.js";
import { Admin } from "../models/Admin.js";
import { getContentDocument } from "../models/Content.js";
import { redactUri } from "../utils/redactUri.js";
import { seedContent } from "./content.data.js";

const force = process.argv.includes("--force");
const DEFAULT_PASSWORD = "ChangeMe123!";

/** True when a section still holds nothing but schema defaults. */
function isPristine(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.every(isPristine);
  if (typeof value === "object") {
    return Object.entries(value)
      .filter(([key]) => key !== "_id")
      .every(([, nested]) => isPristine(nested));
  }
  return false;
}

async function seedAdmin() {
  const email = env.seedAdmin.email.toLowerCase();
  const passwordHash = await bcrypt.hash(env.seedAdmin.password, 10);
  const existing = await Admin.findOne({ email });

  if (existing && !force) {
    console.log(`[seed] Admin ${email} already exists - left untouched (use --force to reset)`);
    return { email, created: false };
  }

  if (existing) {
    existing.name = env.seedAdmin.name;
    existing.passwordHash = passwordHash;
    await existing.save();
    console.log(`[seed] Admin ${email} password reset from .env`);
    return { email, created: false };
  }

  await Admin.create({
    name: env.seedAdmin.name,
    email,
    passwordHash,
    role: "admin",
  });
  console.log(`[seed] Created admin ${email}`);
  return { email, created: true };
}

async function seedContentSections() {
  const doc = await getContentDocument();
  const filled = [];
  const skipped = [];

  for (const [section, data] of Object.entries(seedContent)) {
    const current = doc[section]?.toObject?.() ?? doc[section];

    if (force || isPristine(current)) {
      doc.set(section, data);
      doc.markModified(section);
      filled.push(section);
    } else {
      skipped.push(section);
    }
  }

  if (filled.length > 0) await doc.save();

  return { filled, skipped };
}

async function main() {
  console.log(`[seed] Connecting to ${redactUri(env.mongoUri)}`);
  await connectDatabase();

  const admin = await seedAdmin();
  const { filled, skipped } = await seedContentSections();

  console.log(`[seed] Content sections written: ${filled.length > 0 ? filled.join(", ") : "none"}`);
  if (skipped.length > 0) {
    console.log(
      `[seed] Content sections kept as-is (already edited): ${skipped.join(", ")}` +
        " - use --force to overwrite"
    );
  }

  console.log("\n[seed] Done. Sign in to the admin panel with:");
  console.log(`         email:    ${admin.email}`);
  console.log("         password: the ADMIN_PASSWORD value from backend/.env");

  if (env.seedAdmin.password === DEFAULT_PASSWORD) {
    console.warn(
      "\n[seed] WARNING: you are still using the default ADMIN_PASSWORD. " +
        "Change it in backend/.env and run `npm run seed:force`."
    );
  } else if (env.seedAdmin.password.length < MIN_PASSWORD_LENGTH) {
    console.warn(
      `\n[seed] WARNING: ADMIN_PASSWORD is shorter than the ${MIN_PASSWORD_LENGTH}-character ` +
        "minimum enforced by the change-password endpoint."
    );
  }

  await disconnectDatabase();
}

main().catch(async (error) => {
  console.error(`[seed] Failed: ${error.message}`);
  await disconnectDatabase().catch(() => {});
  process.exit(1);
});
