/**
 * Dynamic Corporate Avatar Helper
 * Provides real employee photos when uploaded, deterministic distinct placeholder photos per employee,
 * and dynamic initials fallback.
 */

const PROFESSIONAL_PLACEHOLDER_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80", // Executive / Admin
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80", // Tech Lead / Developer
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80", // Software Engineer
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80", // HR / Operations Manager
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=250&q=80", // Finance / Accounts Lead
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=250&q=80", // Growth & Sales Lead
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=250&q=80", // UI/UX Product Designer
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=250&q=80", // Senior Developer
];

function stringHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getEmployeeAvatarUrl(user: {
  avatarUrl?: string | null;
  employeeId?: string | null;
  id?: string | null;
  email?: string | null;
}): string {
  // 1st Priority: Real employee-uploaded profile photo from database
  if (user?.avatarUrl && user.avatarUrl.trim()) {
    return user.avatarUrl.trim();
  }

  // 2nd Priority: Deterministic distinct professional placeholder image based on unique identity key
  const identityKey = user?.employeeId || user?.id || user?.email || "EMP";
  const index = stringHash(identityKey) % PROFESSIONAL_PLACEHOLDER_AVATARS.length;
  return PROFESSIONAL_PLACEHOLDER_AVATARS[index];
}

export function getInitials(name: string): string {
  if (!name || !name.trim()) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
