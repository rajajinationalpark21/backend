import { Contact } from "../models/Contact.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getEmail, getIdFromAliases, getString } from "../utils/validation.js";

const INQUIRY_ID_ALIASES = ["inquiryId", "contactId", "id", "_id"];

/** Public endpoint behind the Contact page form. */
export const submitInquiry = asyncHandler(async (req, res) => {
  const inquiry = await Contact.create({
    name: getString(req.body, "name", { required: true, max: 120 }),
    email: getEmail(req.body, "email"),
    phone: getString(req.body, "phone", { max: 30 }),
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

  res.json({ success: true, message: "Inquiry deleted" });
});
