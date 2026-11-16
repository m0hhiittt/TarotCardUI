import { createContext, useContext } from "react";
import type { AppNotification, User } from "./types";
import type { TarotCard } from "./tarot";
import type { NotifyState } from "./notifications";

export interface Ctx {
  user: User | null;
  isAdmin: boolean;
  setUser: (u: User | null) => void;
  logout: () => void;
  openAuth: (mode?: "login" | "register", reason?: string, then?: "room") => void;
  openCardChat: (card: Pick<TarotCard, "name" | "num" | "text">) => void;
  /** client: opens the private room; reader (admin): opens the admin panel on the Private chats tab */
  openChats: () => void;
  go: (view: "home" | "account" | "admin" | "room") => void;
  toast: (m: string, kind?: "ok" | "err") => void;
  /** unread private messages (client: from the reader, reader: from clients) */
  unread: number;
  refreshUnread: () => void;
  /** notifications (bell + pop-ups + sound) */
  notify: NotifyState;
  openNotification: (n: AppNotification) => void;
  /** tells the notifier what the person is looking at, so a chat they are reading does not pop up again */
  setViewing: (v: string) => void;
  /** bump to make lists (reviews, bookings) reload */
  version: number;
  refresh: () => void;
}
export const AppCtx = createContext<Ctx>(null!);
export const useApp = () => useContext(AppCtx);
