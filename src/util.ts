export const inr = (n: number) => "₹" + n.toLocaleString("en-IN");
export const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
export const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
/** the API stores UTC; make sure a bare ISO string is read as UTC */
export const utc = (iso: string) => (/[zZ]|[+-]\d\d:?\d\d$/.test(iso) ? iso : iso + "Z");
