import { createContext, useContext } from "react";
import type { User } from "./types";

export interface Ctx {
  user: User | null;
  isAdmin: boolean;
  setUser: (u: User | null) => void;
  logout: () => void;
  openAuth: (mode?: "login" | "register", reason?: string) => void;
  openBooking: (pkgId?: number) => void;
  go: (view: "home" | "account" | "admin") => void;
  toast: (m: string, kind?: "ok" | "err") => void;
  /** bump to make lists (reviews, bookings) reload */
  version: number;
  refresh: () => void;
}
export const AppCtx = createContext<Ctx>(null!);
export const useApp = () => useContext(AppCtx);
