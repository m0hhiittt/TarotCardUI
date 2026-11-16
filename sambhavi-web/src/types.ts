// These mirror the DTOs of the .NET API (JSON is camelCase).
export type Role = "Admin" | "User";
export interface User {
  id: string; firstName: string; lastName: string; fullName: string;
  email: string; phoneNumber: string; dob?: string | null; role: Role; emailVerified?: boolean; createdAt: string;
}
export type OtpPurpose = "login" | "register";
export interface OtpSent { email: string; expiresInSeconds: number; resendInSeconds: number }
export interface AuthResponse { token: string; expiresAtUtc: string; user: User }
export interface Review {
  id: number; userId: string; userName: string; bookingId?: number | null; rating?: number | null;
  message: string; isApproved: boolean; createdAt: string;
}
export interface Paged<T> { items: T[]; page: number; pageSize: number; totalCount: number; totalPages: number }
export interface Dashboard {
  totalUsers: number; totalReviews: number;
}
export interface RegisterInput {
  firstName: string; lastName: string; email: string; phoneNumber: string; dob?: string | null;
}

// ---- private room (chat with the reader) ----
export interface ChatMessage { id: number; fromReader: boolean; body: string; createdAt: string; isRead: boolean }
export interface Conversation { userId: string; userName: string; lastMessage: string; lastFromReader: boolean; lastAt: string; unread: number }

export interface AppNotification {
  id: number; type: string; title: string; body?: string | null;
  /** where a click goes: users | bookings | reviews | chats (admin) or room | bookings-mine (client) */
  target: string; refId?: string | null; createdAt: string; isRead: boolean;
}
export interface NotificationList { items: AppNotification[]; unreadCount: number }
