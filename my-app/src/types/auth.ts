export type UserRole =
  | "super_admin"
  | "admin"
  | "moderator"
  | "user";

export interface User {
  _id: string;

  name: string;

  username: string;

  email: string;

  image?: string | null;

  role: UserRole;

  isActive: boolean;
}

export interface LoginResponse {
  message: string;

  token: string;

  user: User;
}

export interface RegisterData {
  name: string;
  username: string;
  email: string;
  password: string;
}