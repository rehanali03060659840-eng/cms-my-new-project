import type { UserRole } from "../types/auth";

export const permissions = {
  dashboard: [
    "super_admin",
    "admin",
    "moderator",
  ],

  category: [
    "super_admin",
    "admin",
  ],

  blog: [
    "super_admin",
    "admin",
    "moderator",
  ],

  reels: [
    "super_admin",
    "admin",
    // "moderator",
  ],

  setting: [
    "super_admin",
  ],

  users: [
    "super_admin",
  ],

  live_Meet: [
    "super_admin",
    "admin",
    "moderator",
    "user",
  ],
} as const;

export const hasPermission = (
  role: UserRole,
  feature: keyof typeof permissions,
) => {
  return permissions[feature].includes(
    role as never,
  );
};