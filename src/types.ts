// These mirror the DTOs of the .NET API (JSON is camelCase).
export type Role = "Admin" | "User";
export type BookingStatus = "Pending" | "Confirmed" | "Completed" | "Cancelled";
export const BOOKING_STATUSES: BookingStatus[] = ["Pending", "Confirmed", "Completed", "Cancelled"];

export interface User {
  id: string; firstName: string; lastName: string; fullName: string;
  email: string; phoneNumber: string; dob?: string | null; role: Role; createdAt: string;
}
export interface AuthResponse { token: string; expiresAtUtc: string; user: User }
export interface Pkg { id: number; name: string; description?: string | null; cardCount: number; price: number }
export interface Booking {
  id: number; userId: string; userName: string; userEmail: string; userPhone: string;
  packageId: number; packageName: string; cardCount: number; price: number;
  appointmentDateTime: string; status: BookingStatus; question?: string | null; createdAt: string;
}
export interface Review {
  id: number; userId: string; userName: string; bookingId?: number | null; rating?: number | null;
  message: string; isApproved: boolean; createdAt: string;
}
export interface Paged<T> { items: T[]; page: number; pageSize: number; totalCount: number; totalPages: number }
export interface Dashboard {
  totalUsers: number; totalBookings: number; pendingBookings: number;
  totalReviews: number; pendingReviews: number; revenue: number;
}
export interface RegisterInput {
  firstName: string; lastName: string; email: string; phoneNumber: string; password: string; dob?: string | null;
}
