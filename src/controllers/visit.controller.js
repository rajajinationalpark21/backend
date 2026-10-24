import crypto from "node:crypto";
import { PageView } from "../models/PageView.js";
import { Booking } from "../models/Booking.js";
import { Contact } from "../models/Contact.js";
import { env } from "../config/env.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const BOT = /bot|crawl|spider|slurp|preview|monitor|headless|lighthouse|facebookexternalhit|whatsapp\/|curl|wget|python|axios|node-fetch/i;

// Where a visitor came from, named the way the client thinks about it.
const SOURCES = [
  [/google\./, "Google"],
  [/bing\.|duckduckgo\.|yahoo\./, "Other search"],
  [/whatsapp|wa\.me/, "WhatsApp"],
  [/facebook\.|fb\.|fbclid/, "Facebook"],
  [/instagram\./, "Instagram"],
  [/youtube\.|youtu\.be/, "YouTube"],
  [/t\.me|telegram\./, "Telegram"],
  [/twitter\.|x\.com|t\.co$/, "Twitter / X"],
];

const indiaDay = (date = new Date()) =>
  new Date(date.getTime() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);

function sourceOf(referrer, siteHost) {
  let host = "";
  try {
    host = new URL(referrer).hostname.replace(/^www\./, "");
  } catch {
    return { source: "Direct", referrerHost: "" };
  }
  if (!host || host === siteHost) return { source: "Direct", referrerHost: "" };
  const match = SOURCES.find(([pattern]) => pattern.test(host));
  return { source: match ? match[1] : "Other websites", referrerHost: host.slice(0, 120) };
}

const deviceOf = (userAgent) =>
  /iPad|Tablet/i.test(userAgent) ? "tablet" : /Mobi|Android|iPhone/i.test(userAgent) ? "mobile" : "desktop";

/**
 * Public: the website reports a page view. Sent with navigator.sendBeacon as
 * text/plain (no CORS preflight), so the body may arrive as a string.
 */
export const recordVisit = asyncHandler(async (req, res) => {
  // The site is on another origin; without this the browser logs every beacon
  // as a blocked response (helmet's default is same-origin). The reply is empty.
  res.set("Cross-Origin-Resource-Policy", "cross-origin");
  const userAgent = String(req.get("user-agent") || "");
  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }
  const path = typeof body?.path === "string" ? body.path.split("?")[0].slice(0, 200) : "";
  if (!path.startsWith("/") || BOT.test(userAgent)) return res.status(204).end();

  let siteHost = "";
  try {
    siteHost = new URL(String(req.get("origin") || req.get("referer") || "")).hostname.replace(/^www\./, "");
  } catch {
    siteHost = "";
  }
  const day = indiaDay();
  const visitor = crypto
    .createHmac("sha256", env.jwtSecret)
    .update(`${day}|${req.ip}|${userAgent}`)
    .digest("hex")
    .slice(0, 32);

  await PageView.create({
    path,
    ...sourceOf(typeof body?.referrer === "string" ? body.referrer : "", siteHost),
    device: deviceOf(userAgent),
    visitor,
    day,
  });
  res.status(204).end();
});

/** Admin: visits and enquiries for the last `days` days (7-365), newest day last. */
export const visitSummary = asyncHandler(async (req, res) => {
  const days = Math.min(Math.max(Number(req.query.days) || 30, 7), 365);
  const since = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000);
  const firstDay = indiaDay(since);
  const match = { day: { $gte: firstDay } };

  const [totals, byDay, topPages, sources, devices, bookingsByDay, contactsByDay] = await Promise.all([
    PageView.aggregate([
      { $match: match },
      { $group: { _id: null, views: { $sum: 1 }, visitors: { $addToSet: "$visitor" } } },
      { $project: { _id: 0, views: 1, visitors: { $size: "$visitors" } } },
    ]),
    PageView.aggregate([
      { $match: match },
      { $group: { _id: "$day", views: { $sum: 1 }, visitors: { $addToSet: "$visitor" } } },
      { $project: { _id: 0, day: "$_id", views: 1, visitors: { $size: "$visitors" } } },
    ]),
    PageView.aggregate([
      { $match: match },
      { $group: { _id: "$path", views: { $sum: 1 } } },
      { $sort: { views: -1 } },
      { $limit: 10 },
      { $project: { _id: 0, path: "$_id", views: 1 } },
    ]),
    PageView.aggregate([
      { $match: match },
      { $group: { _id: "$source", views: { $sum: 1 } } },
      { $sort: { views: -1 } },
      { $project: { _id: 0, source: "$_id", views: 1 } },
    ]),
    PageView.aggregate([
      { $match: match },
      { $group: { _id: "$device", views: { $sum: 1 } } },
      { $sort: { views: -1 } },
      { $project: { _id: 0, device: "$_id", views: 1 } },
    ]),
    Booking.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "+05:30" } }, count: { $sum: 1 } } },
    ]),
    Contact.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "+05:30" } }, count: { $sum: 1 } } },
    ]),
  ]);

  // Every day in the range, including days with no visits.
  const views = new Map(byDay.map((row) => [row.day, row]));
  const bookings = new Map(bookingsByDay.map((row) => [row._id, row.count]));
  const contacts = new Map(contactsByDay.map((row) => [row._id, row.count]));
  const daily = Array.from({ length: days }, (_, index) => {
    const day = indiaDay(new Date(since.getTime() + index * 24 * 60 * 60 * 1000));
    return {
      day,
      views: views.get(day)?.views || 0,
      visitors: views.get(day)?.visitors || 0,
      enquiries: (bookings.get(day) || 0) + (contacts.get(day) || 0),
    };
  });

  res.json({
    success: true,
    days,
    totals: {
      views: totals[0]?.views || 0,
      visitors: totals[0]?.visitors || 0,
      bookings: bookingsByDay.reduce((sum, row) => sum + row.count, 0),
      contacts: contactsByDay.reduce((sum, row) => sum + row.count, 0),
    },
    daily,
    topPages,
    sources,
    devices,
  });
});
