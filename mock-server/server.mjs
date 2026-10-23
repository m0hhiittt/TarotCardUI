// Tiny in-memory stand-in for the .NET API (same routes, same JSON shapes).
// Only for trying the UI without SQL Server:  npm run mock   (then set VITE_API_URL=http://localhost:5000)
import http from "node:http";
import crypto from "node:crypto";

const PORT = process.env.PORT || 5000;
let seq = { booking: 100, review: 100, pkg: 10 };
const now = () => new Date().toISOString();
const hash = (p) => crypto.createHash("sha256").update(p).digest("hex");
const mkUser = (id, firstName, lastName, email, phone, role, pw) => ({ id, firstName, lastName, email, phoneNumber: phone, dob: null, role, createdAt: now(), _pw: hash(pw) });
const users = [
  mkUser("u-admin", "Sambhavi", "Shiva", "admin@sambhavishiva.com", "+919876543210", "Admin", "Admin@123"),
  mkUser("u-1", "Ananya", "Rao", "ananya@example.com", "+919812345678", "User", "Test@1234"),
];
const packages = [
  { id: 1, name: "Single card", description: "One question, one clear answer.", cardCount: 1, price: 50 },
  { id: 2, name: "Double card", description: "Compare two paths, or see cause and effect.", cardCount: 2, price: 99 },
  { id: 3, name: "Past, present, future", description: "Where you've been and where it's heading.", cardCount: 3, price: 199 },
  { id: 4, name: "Celtic Cross", description: "The full ten-card reading for the questions that change things.", cardCount: 10, price: 499 },
];
const future = (d) => new Date(Date.now() + d * 864e5).toISOString();
const bookings = [
  { id: 1, userId: "u-1", packageId: 3, appointmentDateTime: future(2), status: "Pending", question: "Should I change jobs this year?", createdAt: now() },
  { id: 2, userId: "u-1", packageId: 1, appointmentDateTime: future(-3), status: "Completed", question: null, createdAt: now() },
];
const reviews = [
  { id: 1, userId: "u-1", message: "Honest and kind. The reading helped me make a hard decision.", isApproved: true, createdAt: now(), bookingId: null, rating: null },
  { id: 2, userId: "u-1", message: "Waiting for approval — a lovely, clear reading.", isApproved: false, createdAt: now(), bookingId: null, rating: null },
];

const tokens = new Map();
const pub = ({ _pw, ...u }) => ({ ...u, fullName: `${u.firstName} ${u.lastName}` });
const bDto = (b) => { const u = users.find((x) => x.id === b.userId), p = packages.find((x) => x.id === b.packageId); return { ...b, userName: `${u.firstName} ${u.lastName}`, userEmail: u.email, userPhone: u.phoneNumber, packageName: p.name, cardCount: p.cardCount, price: p.price }; };
const rDto = (r, publicView) => { const u = users.find((x) => x.id === r.userId); return { ...r, userId: publicView ? "" : r.userId, userName: u ? (publicView ? `${u.firstName} ${u.lastName[0]}.` : `${u.firstName} ${u.lastName}`) : "Former user" }; };
const paged = (arr, q) => { const page = +q.get("page") || 1, size = +q.get("pageSize") || 20; return { items: arr.slice((page - 1) * size, page * size), page, pageSize: size, totalCount: arr.length, totalPages: Math.ceil(arr.length / size) }; };

class Err extends Error { constructor(s, m) { super(m); this.s = s; } }
const PASS_RE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

const routes = [];
const on = (m, path, h) => routes.push({ m, re: new RegExp("^" + path.replace(/:\w+/g, "([^/]+)") + "$"), h });

const needUser = (ctx) => { if (!ctx.user) throw new Err(401, "Unauthorized"); return ctx.user; };
const needAdmin = (ctx) => { const u = needUser(ctx); if (u.role !== "Admin") throw new Err(403, "Forbidden"); return u; };
const issue = (u) => { const t = crypto.randomUUID(); tokens.set(t, u.id); return { token: t, expiresAtUtc: future(0.08), user: pub(u) }; };

on("POST", "/api/auth/register", (c) => {
  const b = c.body;
  if (!b.firstName || !b.lastName || !b.email || !b.phoneNumber) throw new Err(400, "Please fill in all required fields.");
  if (!PASS_RE.test(b.password || "")) throw new Err(400, "Password must contain at least one letter and one number.");
  if (users.some((u) => u.email.toLowerCase() === b.email.toLowerCase())) throw new Err(409, "An account with this email already exists.");
  const u = mkUser(crypto.randomUUID(), b.firstName, b.lastName, b.email.toLowerCase(), b.phoneNumber, "User", b.password); u.dob = b.dob || null; users.push(u); return issue(u);
});
on("POST", "/api/auth/login", (c) => { const u = users.find((x) => x.email.toLowerCase() === (c.body.email || "").toLowerCase()); if (!u || u._pw !== hash(c.body.password || "")) throw new Err(401, "Invalid email or password."); return issue(u); });
on("GET", "/api/auth/me", (c) => pub(needUser(c)));
on("PUT", "/api/auth/me", (c) => { const u = needUser(c); Object.assign(u, { firstName: c.body.firstName, lastName: c.body.lastName, phoneNumber: c.body.phoneNumber, dob: c.body.dob || null }); return pub(u); });
on("POST", "/api/auth/change-password", (c) => { const u = needUser(c); if (u._pw !== hash(c.body.currentPassword || "")) throw new Err(400, "Current password is incorrect."); if (!PASS_RE.test(c.body.newPassword || "")) throw new Err(400, "Password must contain at least one letter and one number."); u._pw = hash(c.body.newPassword); return null; });

on("GET", "/api/packages", () => packages);
on("GET", "/api/packages/:id", (c, id) => packages.find((p) => p.id === +id) ?? (() => { throw new Err(404, "Package not found."); })());

on("POST", "/api/bookings", (c) => {
  const u = needUser(c); const p = packages.find((x) => x.id === c.body.packageId); if (!p) throw new Err(404, "Package not found.");
  if (new Date(c.body.appointmentDateTime) <= new Date()) throw new Err(400, "Please choose a time in the future.");
  const b = { id: ++seq.booking, userId: u.id, packageId: p.id, appointmentDateTime: c.body.appointmentDateTime, status: "Pending", question: c.body.question || null, createdAt: now() }; bookings.push(b); return bDto(b);
});
on("GET", "/api/bookings/my", (c) => { const u = needUser(c); return bookings.filter((b) => b.userId === u.id).sort((a, b) => b.id - a.id).map(bDto); });
on("PUT", "/api/bookings/:id/cancel", (c, id) => { const u = needUser(c); const b = bookings.find((x) => x.id === +id && x.userId === u.id); if (!b) throw new Err(404, "Booking not found."); if (!["Pending", "Confirmed"].includes(b.status)) throw new Err(409, "Only pending or confirmed bookings can be cancelled."); b.status = "Cancelled"; return bDto(b); });

on("GET", "/api/reviews", () => reviews.filter((r) => r.isApproved).sort((a, b) => b.id - a.id).map((r) => rDto(r, true)));
on("GET", "/api/reviews/my", (c) => { const u = needUser(c); return reviews.filter((r) => r.userId === u.id).sort((a, b) => b.id - a.id).map((r) => rDto(r)); });
on("POST", "/api/reviews", (c) => { const u = needUser(c); const m = (c.body.message || "").trim(); if (m.length < 5) throw new Err(400, "The field Message must be a string with a minimum length of 5."); const r = { id: ++seq.review, userId: u.id, message: m, isApproved: u.role === "Admin", createdAt: now(), bookingId: null, rating: null }; reviews.push(r); return rDto(r); });
on("DELETE", "/api/reviews/:id", (c, id) => { const u = needUser(c); const i = reviews.findIndex((r) => r.id === +id); if (i < 0) throw new Err(404, "Review not found."); if (reviews[i].userId !== u.id && u.role !== "Admin") throw new Err(404, "Review not found."); reviews.splice(i, 1); return null; });

on("GET", "/api/admin/dashboard", (c) => { needAdmin(c); return { totalUsers: users.length, totalBookings: bookings.length, pendingBookings: bookings.filter((b) => b.status === "Pending").length, totalReviews: reviews.length, pendingReviews: reviews.filter((r) => !r.isApproved).length, revenue: bookings.filter((b) => ["Confirmed", "Completed"].includes(b.status)).reduce((s, b) => s + packages.find((p) => p.id === b.packageId).price, 0) }; });
on("GET", "/api/admin/users", (c) => { needAdmin(c); const s = (c.q.get("search") || "").toLowerCase(); return paged(users.filter((u) => !s || `${u.firstName} ${u.lastName} ${u.email} ${u.phoneNumber}`.toLowerCase().includes(s)).map(pub), c.q); });
on("PUT", "/api/admin/users/:id/role", (c, id) => { const a = needAdmin(c); const u = users.find((x) => x.id === id); if (!u) throw new Err(404, "User not found."); if (u.id === a.id) throw new Err(400, "You cannot change your own role."); if (!["Admin", "User"].includes(c.body.role)) throw new Err(400, "Invalid role."); u.role = c.body.role; return pub(u); });
on("DELETE", "/api/admin/users/:id", (c, id) => { const a = needAdmin(c); const i = users.findIndex((x) => x.id === id); if (i < 0) throw new Err(404, "User not found."); if (users[i].id === a.id) throw new Err(400, "You cannot delete your own account."); const uid = users[i].id; users.splice(i, 1); for (const arr of [bookings, reviews]) for (let k = arr.length - 1; k >= 0; k--) if (arr[k].userId === uid) arr.splice(k, 1); return null; });
on("GET", "/api/admin/bookings", (c) => { needAdmin(c); const st = c.q.get("status"), s = (c.q.get("search") || "").toLowerCase(); return paged(bookings.map(bDto).filter((b) => (!st || b.status === st) && (!s || `${b.userName} ${b.userEmail} ${b.packageName}`.toLowerCase().includes(s))).sort((a, b) => b.id - a.id), c.q); });
on("PUT", "/api/admin/bookings/:id/status", (c, id) => { needAdmin(c); const b = bookings.find((x) => x.id === +id); if (!b) throw new Err(404, "Booking not found."); if (!["Pending", "Confirmed", "Completed", "Cancelled"].includes(c.body.status)) throw new Err(400, "Invalid status."); b.status = c.body.status; return bDto(b); });
on("DELETE", "/api/admin/bookings/:id", (c, id) => { needAdmin(c); const i = bookings.findIndex((x) => x.id === +id); if (i < 0) throw new Err(404, "Booking not found."); bookings.splice(i, 1); return null; });
on("GET", "/api/admin/reviews", (c) => { needAdmin(c); const f = c.q.get("isApproved"); return paged(reviews.filter((r) => f === null || String(r.isApproved) === f).sort((a, b) => b.id - a.id).map((r) => rDto(r)), c.q); });
on("PUT", "/api/admin/reviews/:id/approve", (c, id) => { needAdmin(c); const r = reviews.find((x) => x.id === +id); if (!r) throw new Err(404, "Review not found."); r.isApproved = true; return rDto(r); });
on("DELETE", "/api/admin/reviews/:id", (c, id) => { needAdmin(c); const i = reviews.findIndex((x) => x.id === +id); if (i < 0) throw new Err(404, "Review not found."); reviews.splice(i, 1); return null; });
on("POST", "/api/admin/packages", (c) => { needAdmin(c); const p = { id: ++seq.pkg, name: c.body.name, description: c.body.description, cardCount: c.body.cardCount, price: c.body.price }; packages.push(p); return p; });
on("PUT", "/api/admin/packages/:id", (c, id) => { needAdmin(c); const p = packages.find((x) => x.id === +id); if (!p) throw new Err(404, "Package not found."); Object.assign(p, { name: c.body.name, description: c.body.description, cardCount: c.body.cardCount, price: c.body.price }); return p; });
on("DELETE", "/api/admin/packages/:id", (c, id) => { needAdmin(c); if (bookings.some((b) => b.packageId === +id)) throw new Err(409, "This package has bookings and cannot be deleted."); const i = packages.findIndex((x) => x.id === +id); if (i < 0) throw new Err(404, "Package not found."); packages.splice(i, 1); return null; });

http.createServer(async (req, res) => {
  const cors = { "Access-Control-Allow-Origin": req.headers.origin || "*", "Access-Control-Allow-Headers": "authorization,content-type", "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS" };
  if (req.method === "OPTIONS") { res.writeHead(204, cors); return res.end(); }
  const url = new URL(req.url, "http://x");
  let raw = ""; for await (const ch of req) raw += ch;
  let body = {}; try { body = raw ? JSON.parse(raw) : {}; } catch { /* */ }
  const tok = (req.headers.authorization || "").replace(/^Bearer /i, "");
  const ctx = { body, q: url.searchParams, user: users.find((u) => u.id === tokens.get(tok)) };
  const send = (s, d) => { res.writeHead(s, { ...cors, "Content-Type": s >= 400 ? "application/problem+json" : "application/json" }); res.end(d === null || d === undefined ? "" : JSON.stringify(d)); };
  for (const r of routes) {
    const m = r.m === req.method && url.pathname.match(r.re); if (!m) continue;
    try { const out = r.h(ctx, ...m.slice(1)); return out === null ? send(204) : send(200, out); }
    catch (e) { return e instanceof Err ? send(e.s, { status: e.s, title: e.message }) : (console.error(e), send(500, { status: 500, title: "Something went wrong. Please try again." })); }
  }
  send(404, { status: 404, title: "Not found" });
}).listen(PORT, () => console.log(`Mock API on http://localhost:${PORT}  (admin@sambhavishiva.com / Admin@123, ananya@example.com / Test@1234)`));
