import { Booking } from "../models/Booking.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getString } from "../utils/validation.js";

/** Public endpoint — visitor submits a safari booking inquiry. */
export const submitBooking = asyncHandler(async (req, res) => {
  const name = getString(req.body, "name", { required: true, max: 120 });
  const email = getString(req.body, "email", { max: 160 });
  const phone = getString(req.body, "phone", { max: 30 });
  const zone = getString(req.body, "zone", { required: true, max: 100 });
  const date = getString(req.body, "date", { required: true, max: 30 });
  const shift = getString(req.body, "shift", { required: true, max: 80 });
  const specialRequests = getString(req.body, "specialRequests", { max: 500 });

  let guests = Number(req.body.guests);
  if (isNaN(guests) || guests < 1) guests = 2;
  if (guests > 50) guests = 50;

  const refNumber = `RTR-${Date.now().toString().slice(-6)}`;

  const booking = await Booking.create({
    name,
    email,
    phone,
    zone,
    date,
    shift,
    guests,
    specialRequests,
    refNumber,
  });

  res.status(201).json({
    success: true,
    message: "Booking inquiry saved. Our team will contact you shortly.",
    booking,
  });
});

/** Admin endpoint — list all booking inquiries. */
export const listBookings = asyncHandler(async (req, res) => {
  const query = {};
  if (req.query.status && req.query.status !== "All") {
    query.status = req.query.status;
  }

  const bookings = await Booking.find(query).sort({ createdAt: -1 }).lean();
  res.json({ success: true, count: bookings.length, bookings });
});

/** Admin endpoint — update booking status. */
export const updateBooking = asyncHandler(async (req, res) => {
  const id = getString(req.body, "bookingId", { required: true });
  const status = getString(req.body, "status", { required: true });

  if (!["new", "contacted", "confirmed", "cancelled"].includes(status)) {
    throw new AppError("Invalid status", 400);
  }

  const booking = await Booking.findByIdAndUpdate(id, { status }, { new: true });
  if (!booking) throw new AppError("Booking not found", 404);

  res.json({ success: true, message: "Booking updated", booking });
});

/** Admin endpoint — delete a booking inquiry. */
export const deleteBooking = asyncHandler(async (req, res) => {
  const id = getString(req.body, "bookingId", { required: true });
  const booking = await Booking.findByIdAndDelete(id);
  if (!booking) throw new AppError("Booking not found", 404);

  res.json({ success: true, message: "Booking deleted" });
});
