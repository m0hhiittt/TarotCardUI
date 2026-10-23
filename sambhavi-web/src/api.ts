/**
 * ALL calls to the .NET API live in this one file.
 * - Base URL comes from VITE_API_URL (.env).
 * - The JWT is kept in localStorage and sent as "Authorization: Bearer <token>".
 * - Any 401 clears the session (expired token) so the UI falls back to the login prompt.
 */
import type {
  AuthResponse, Booking, BookingStatus, Dashboard, Paged, Pkg, RegisterInput, Review, Role, User,
} from "./types";

export const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "https://localhost:7194";

const TOKEN_KEY = "ss_token";
export const tokenStore = {
  get: () => { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } },
  set: (t: string) => { try { localStorage.setItem(TOKEN_KEY, t); } catch { /* ignore */ } },
  clear: () => { try { localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ } },
};

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

let onUnauthorized: (() => void) | null = null;
export const setUnauthorizedHandler = (fn: () => void) => { onUnauthorized = fn; };

/** Turns the API's error JSON (ProblemDetails / validation errors) into one readable sentence. */
function readableError(status: number, body: any): string {
  if (body?.errors && typeof body.errors === "object") {
    const first = Object.values(body.errors as Record<string, string[]>)[0];
    if (first?.[0]) return first[0];
  }
  if (body?.title && !/validation errors occurred/i.test(body.title)) return body.title;
  if (body?.detail) return body.detail;
  if (status === 0) return "Cannot reach the server. Is the API running?";
  if (status === 401) return "Please log in to continue.";
  if (status === 403) return "You do not have permission to do that.";
  return `Something went wrong (${status}).`;
}

async function request<T>(method: string, path: string, body?: unknown, query?: Record<string, unknown>): Promise<T> {
  const qs = query
    ? "?" + Object.entries(query).filter(([, v]) => v !== undefined && v !== null && v !== "").map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join("&")
    : "";
  const token = tokenStore.get();
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}${qs}`, {
      method,
      headers: { ...(body !== undefined ? { "Content-Type": "application/json" } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, readableError(0, null));
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { /* not json */ }
  if (!res.ok) {
    // A 401 on a request that carried a token = expired/invalid token -> sign out.
    if (res.status === 401 && token) { tokenStore.clear(); onUnauthorized?.(); }
    throw new ApiError(res.status, readableError(res.status, data));
  }
  return data as T;
}
const get = <T,>(p: string, q?: Record<string, unknown>) => request<T>("GET", p, undefined, q);
const post = <T,>(p: string, b?: unknown) => request<T>("POST", p, b ?? {});
const put = <T,>(p: string, b?: unknown) => request<T>("PUT", p, b ?? {});
const del = (p: string) => request<void>("DELETE", p);

// ---------- Auth ----------
export const authApi = {
  async login(email: string, password: string): Promise<User> {
    const r = await post<AuthResponse>("/api/auth/login", { email, password });
    tokenStore.set(r.token); return r.user;
  },
  async register(input: RegisterInput): Promise<User> {
    const r = await post<AuthResponse>("/api/auth/register", { ...input, dob: input.dob || null });
    tokenStore.set(r.token); return r.user;
  },
  logout() { tokenStore.clear(); },
  /** Returns the logged-in user from the saved token, or null. */
  async current(): Promise<User | null> {
    if (!tokenStore.get()) return null;
    try { return await get<User>("/api/auth/me"); } catch { tokenStore.clear(); return null; }
  },
  updateProfile: (p: { firstName: string; lastName: string; phoneNumber: string; dob?: string | null }) =>
    put<User>("/api/auth/me", { ...p, dob: p.dob || null }),
  changePassword: (currentPassword: string, newPassword: string) => post<void>("/api/auth/change-password", { currentPassword, newPassword }),
};

// ---------- Packages (public) ----------
export const packageApi = { list: () => get<Pkg[]>("/api/packages") };

// ---------- Bookings (logged-in user) ----------
export const bookingApi = {
  create: (packageId: number, appointmentDateTime: string, question?: string) =>
    post<Booking>("/api/bookings", { packageId, appointmentDateTime, question: question || null }),
  mine: () => get<Booking[]>("/api/bookings/my"),
  cancel: (id: number) => put<Booking>(`/api/bookings/${id}/cancel`),
};

// ---------- Reviews ----------
export const reviewApi = {
  publicList: () => get<Review[]>("/api/reviews"),
  mine: () => get<Review[]>("/api/reviews/my"),
  create: (message: string) => post<Review>("/api/reviews", { message }),
  remove: (id: number) => del(`/api/reviews/${id}`),
};

// ---------- Admin panel ----------
export const adminApi = {
  dashboard: () => get<Dashboard>("/api/admin/dashboard"),
  users: (q: { search?: string; page?: number; pageSize?: number }) => get<Paged<User>>("/api/admin/users", q),
  changeRole: (id: string, role: Role) => put<User>(`/api/admin/users/${id}/role`, { role }),
  deleteUser: (id: string) => del(`/api/admin/users/${id}`),
  bookings: (q: { status?: string; search?: string; page?: number; pageSize?: number }) => get<Paged<Booking>>("/api/admin/bookings", q),
  setBookingStatus: (id: number, status: BookingStatus) => put<Booking>(`/api/admin/bookings/${id}/status`, { status }),
  deleteBooking: (id: number) => del(`/api/admin/bookings/${id}`),
  reviews: (q: { isApproved?: boolean; page?: number; pageSize?: number }) => get<Paged<Review>>("/api/admin/reviews", q),
  approveReview: (id: number) => put<Review>(`/api/admin/reviews/${id}/approve`),
  deleteReview: (id: number) => del(`/api/admin/reviews/${id}`),
  createPackage: (p: Omit<Pkg, "id">) => post<Pkg>("/api/admin/packages", p),
  updatePackage: (id: number, p: Omit<Pkg, "id">) => put<Pkg>(`/api/admin/packages/${id}`, p),
  deletePackage: (id: number) => del(`/api/admin/packages/${id}`),
};
