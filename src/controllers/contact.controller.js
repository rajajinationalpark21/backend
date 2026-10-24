import { Contact } from "../models/Contact.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getEmail, getIdFromAliases, getString } from "../utils/validation.js";
import { isHoneypotFilled, logTrappedSubmission } from "../utils/spam.js";
import { recordAudit } from "../services/audit.js";

const INQUIRY_ID_ALIASES = ["inquiryId", "contactId", "id", "_id"];

/** Public endpoint behind the Contact page form. */
export const submitInquiry = asyncHandler(async (req, res) => {
  if (isHoneypotFilled(req.body)) {
    logTrappedSubmission(req, "contact");
    return res.status(201).json({
      success: true,
      message: "Thank you for reaching out. The safari team will get back to you shortly.",
    });
  }

  // The desk replies by phone or WhatsApp, so a phone number is needed; email is optional.
  const phone = getString(req.body, "phone", { required: true, max: 30 });
  if (phone.replace(/\D/g, "").length < 10) {
    throw new AppError("Please enter a phone number with at least 10 digits.", 400);
  }

  const inquiry = await Contact.create({
    name: getString(req.body, "name", { required: true, max: 120 }),
    email: getEmail(req.body, "email", { required: false }),
    phone,
    subject: getString(req.body, "subject", { max: 160 }),
    message: getString(req.body, "message", { required: true, max: 4000 }),
  });

  res.status(201).json({
    success: true,
    message: "Thank you for reaching out. The safari team will get back to you shortly.",
    id: inquiry._id,
  });
});

export const listInquiries = asyncHandler(async (req, res) => {
  const inquiries = await Contact.find().sort({ createdAt: -1 }).lean();
  res.json({ success: true, count: inquiries.length, inquiries });
});

export const deleteInquiry = asyncHandler(async (req, res) => {
  const id = getIdFromAliases(req.body, INQUIRY_ID_ALIASES, "inquiryId");
  const inquiry = await Contact.findByIdAndDelete(id);

  if (!inquiry) throw new AppError("Inquiry not found", 404);
  await recordAudit(req, "inquiry.delete", inquiry.email || id, { name: inquiry.name });

  res.json({ success: true, message: "Inquiry deleted" });
});
