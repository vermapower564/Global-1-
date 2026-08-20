/**
 * OMS Enterprise Centralized Theme & Light Design System Tokens
 * 
 * Consistent Color Palette:
 * - Card Backgrounds: Pure White (#ffffff)
 * - Page Backgrounds: Light Soft Gray / Slate-50 (#f8fafc)
 * - Borders: Light Gray (#e2e8f0 / #e5e7eb)
 * - Primary Text: Crisp Dark (#0f172a / #000000)
 * - Secondary Text: Muted Slate / Gray (#64748b / #6b7280)
 * 
 * Status Accent System (Soft Pastels):
 * - IN PROGRESS / NEW / ASSIGNED: Soft Blue (bg-blue-50 text-blue-700 border-blue-200)
 * - COMPLETED / ACTIVE / PRESENT: Soft Green (bg-emerald-50 text-emerald-800 border-emerald-200)
 * - BLOCKED / CRITICAL / OVERDUE: Soft Red (bg-rose-50 text-rose-700 border-rose-200)
 * - PENDING / INACTIVE / TO DO: Soft Gray (bg-gray-100 text-gray-700 border-gray-200)
 * - HIGH / ON HOLD / ON LEAVE: Soft Amber/Orange (bg-amber-50 text-amber-800 border-amber-200)
 * - MEDIUM: Soft Yellow (bg-yellow-50 text-yellow-800 border-yellow-200)
 * - IN REVIEW: Soft Purple (bg-purple-50 text-purple-700 border-purple-200)
 */

export const THEME_CLASSES = {
  // Card Styles
  card: "bg-white rounded-2xl sm:rounded-3xl border border-gray-200 shadow-2xs transition hover:shadow-xs",
  cardInteractive: "bg-white rounded-2xl sm:rounded-3xl border border-gray-200 shadow-2xs hover:border-blue-400 hover:shadow-xs transition cursor-pointer group",
  cardHighlight: "bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-white rounded-2xl sm:rounded-3xl border border-blue-200 shadow-xs",

  // Text Typography
  heading1: "text-2xl sm:text-3xl font-black text-black tracking-tight",
  heading2: "text-lg sm:text-xl font-black text-black tracking-tight",
  heading3: "text-sm sm:text-base font-black text-black tracking-tight",
  body: "text-xs text-gray-600 font-medium leading-relaxed",
  bodyMuted: "text-[11px] text-gray-500 font-medium",
  label: "text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block",

  // Interactive Buttons
  btnPrimary: "bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50",
  btnSecondary: "bg-white hover:bg-gray-50 text-black font-extrabold text-xs px-4 py-2.5 rounded-xl border border-gray-300 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs",
  btnSuccess: "bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer",
  btnDanger: "bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer",

  // Inputs
  input: "w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-xs font-semibold text-black placeholder-gray-400 shadow-2xs focus:border-blue-600 focus:outline-none transition",
  select: "rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-bold text-black focus:border-blue-600 focus:outline-none cursor-pointer",
};

export type StatusCategory =
  | "IN_PROGRESS"
  | "COMPLETED"
  | "BLOCKED"
  | "PENDING"
  | "ASSIGNED"
  | "ACTIVE"
  | "INACTIVE"
  | "ON_LEAVE"
  | "NEW"
  | "NEW_JOINER"
  | "ON_HOLD"
  | "CRITICAL"
  | "HIGH"
  | "MEDIUM"
  | "LOW"
  | "IN_REVIEW";

/**
 * Returns consistent Tailwind CSS classes for any status or priority string.
 */
export function getStatusTheme(status: string | undefined | null): {
  bg: string;
  text: string;
  border: string;
  badge: string;
  dot: string;
  label: string;
} {
  const s = (status || "").toString().trim().toUpperCase().replace(/\s+/g, "_");

  switch (s) {
    // 1. IN PROGRESS & ASSIGNED & NEW
    case "IN_PROGRESS":
    case "PROGRESS":
    case "WORKING":
    case "IN_DEVELOPMENT":
      return {
        bg: "bg-blue-50",
        text: "text-blue-700",
        border: "border-blue-200",
        badge: "bg-blue-50 text-blue-700 border border-blue-200",
        dot: "bg-blue-600",
        label: "IN PROGRESS",
      };

    case "NEW":
    case "NEW_PROJECT":
    case "NEW_JOINER":
    case "ASSIGNED":
    case "PLANNED":
      return {
        bg: "bg-blue-50",
        text: "text-blue-700",
        border: "border-blue-200",
        badge: "bg-blue-50 text-blue-700 border border-blue-200 font-extrabold",
        dot: "bg-blue-500",
        label: s.replace(/_/g, " "),
      };

    // 2. COMPLETED & ACTIVE & PRESENT
    case "COMPLETED":
    case "APPROVED":
    case "ACTIVE":
    case "PRESENT":
    case "PAID":
    case "FINAL_APPROVED":
    case "PUBLISHED":
      return {
        bg: "bg-emerald-50",
        text: "text-emerald-800",
        border: "border-emerald-200",
        badge: "bg-emerald-50 text-emerald-800 border border-emerald-200",
        dot: "bg-emerald-500",
        label: s.replace(/_/g, " "),
      };

    // 3. BLOCKED & CRITICAL & OVERDUE & REJECTED
    case "BLOCKED":
    case "CRITICAL":
    case "OVERDUE":
    case "REJECTED":
    case "FAILED":
      return {
        bg: "bg-rose-50",
        text: "text-rose-700",
        border: "border-rose-200",
        badge: "bg-rose-50 text-rose-700 border border-rose-200",
        dot: "bg-rose-600",
        label: s.replace(/_/g, " "),
      };

    // 4. HIGH PRIORITY & ON LEAVE & ON HOLD
    case "HIGH":
    case "ON_LEAVE":
    case "ON_HOLD":
    case "URGENT":
      return {
        bg: "bg-amber-50",
        text: "text-amber-800",
        border: "border-amber-200",
        badge: "bg-amber-50 text-amber-800 border border-amber-200",
        dot: "bg-amber-500",
        label: s.replace(/_/g, " "),
      };

    // 5. MEDIUM PRIORITY
    case "MEDIUM":
      return {
        bg: "bg-yellow-50",
        text: "text-yellow-800",
        border: "border-yellow-200",
        badge: "bg-yellow-50 text-yellow-800 border border-yellow-200",
        dot: "bg-yellow-500",
        label: "MEDIUM",
      };

    // 6. LOW PRIORITY & IN REVIEW
    case "LOW":
      return {
        bg: "bg-slate-100",
        text: "text-slate-700",
        border: "border-slate-200",
        badge: "bg-slate-100 text-slate-700 border border-slate-200",
        dot: "bg-slate-400",
        label: "LOW",
      };

    case "IN_REVIEW":
    case "REVIEW":
    case "EVALUATING":
      return {
        bg: "bg-purple-50",
        text: "text-purple-700",
        border: "border-purple-200",
        badge: "bg-purple-50 text-purple-700 border border-purple-200",
        dot: "bg-purple-500",
        label: "IN REVIEW",
      };

    // 7. PENDING & INACTIVE & DEFAULT
    case "PENDING":
    case "INACTIVE":
    case "DEACTIVATED":
    case "RESIGNED":
    case "BACKLOG":
    default:
      return {
        bg: "bg-gray-100",
        text: "text-gray-700",
        border: "border-gray-200",
        badge: "bg-gray-100 text-gray-700 border border-gray-200",
        dot: "bg-gray-400",
        label: s ? s.replace(/_/g, " ") : "PENDING",
      };
  }
}
