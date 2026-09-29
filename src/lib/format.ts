import { format, formatDistanceToNow } from "date-fns";

export const inr = (n: number | null | undefined) =>
  "₹" + Number(n ?? 0).toLocaleString("en-IN");

export const fmtDate = (d: string | Date | null | undefined) =>
  d ? format(new Date(d), "dd MMM yyyy") : "—";

export const fmtDateTime = (d: string | Date | null | undefined) =>
  d ? format(new Date(d), "dd MMM yyyy, hh:mm a") : "—";

export const ago = (d: string | Date) => formatDistanceToNow(new Date(d), { addSuffix: true });

export const VEHICLE_TYPES = [
  "MOTORCYCLE",
  "SCOOTER",
  "CAR",
  "BUS",
  "TRUCK",
  "AUTO_RICKSHAW",
  "OTHER",
] as const;

export const labelize = (s: string) =>
  s
    .toLowerCase()
    .split("_")
    .map((w) => w[0]?.toUpperCase() + w.slice(1))
    .join(" ");

export const REG_NO_RE = /^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{4}$|^[0-9]{2}BH[0-9]{4}[A-Z]{1,2}$/;
export const normalizeReg = (s: string) => s.toUpperCase().replace(/[\s-]/g, "");

export type DocState = "VALID" | "EXPIRING_SOON" | "EXPIRED" | "UNKNOWN";
export function docState(date: string | null | undefined): { state: DocState; days: number | null } {
  if (!date) return { state: "UNKNOWN", days: null };
  const days = Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
  return { state: days < 0 ? "EXPIRED" : days <= 30 ? "EXPIRING_SOON" : "VALID", days };
}

export function errMsg(e: unknown) {
  if (e && typeof e === "object" && "message" in e) return String((e as { message: string }).message);
  return "Something went wrong";
}
