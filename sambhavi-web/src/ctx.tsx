import { createContext, useContext } from "react";
import type { User } from "./types";

export interface Ctx {
  user: User | null;
  isAdmin: boolean;
  setUser: (u: User | null) => void;
  logout: () => void;
  openAuth: (mode?: "login" | "register", reason?: string, then?: "room") => void;
  openBooking: (pkgId?: number) => void;
  go: (view: "home" | "account" | "admin" | "room") => void;
  toast: (m: string, kind?: "ok" | "err") => void;
  /** unread private messages (client: from the reader, reader: from clients) */
  unread: number;
  refreshUnread: () => void;
  /** bump to make lists (reviews, bookings) reload */
  version: number;
  refresh: () => void;
}
export const AppCtx = createContext<Ctx>(null!);
export const useApp = () => useContext(AppCtx);
