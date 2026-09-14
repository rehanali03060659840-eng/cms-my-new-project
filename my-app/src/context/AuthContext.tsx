import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import axios from "axios";

import type { User } from "../types/auth";

type AuthContextType = {
  token: string | null;

  user: User | null;

  loading: boolean;

  login: (
    token: string,
    user: User,
  ) => void;

  logout: () => void;

  register: (data: {
    name: string;
    username: string;
    email: string;
    password: string;
  }) => Promise<void>;
};

const AuthContext =
  createContext<AuthContextType | null>(
    null,
  );

export const AuthProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [token, setToken] =
    useState<string | null>(
      localStorage.getItem("token"),
    );

  const [user, setUser] =
    useState<User | null>(() => {
      const saved =
        localStorage.getItem("user");

      return saved
        ? JSON.parse(saved)
        : null;
    });

  const [loading, setLoading] =
    useState(true);

  const login = (
    newToken: string,
    newUser: User,
  ) => {
    localStorage.setItem(
      "token",
      newToken,
    );

    localStorage.setItem(
      "user",
      JSON.stringify(newUser),
    );

    setToken(newToken);
    setUser(newUser);
  };

  const register = async (data: {
    name: string;
    username: string;
    email: string;
    password: string;
  }) => {
    const res = await axios.post(
      "http://localhost:3000/auth/register",
      data,
    );

    const newUser: User = {
      _id: res.data.id,
      name: res.data.name,
      username: res.data.username,
      email: res.data.email,
      image: res.data.image || null,
      role: res.data.role,
      isActive: res.data.isActive,
    };

    login(res.data.token || "", newUser);
  };

  const logout = () => {
    localStorage.removeItem("token");

    localStorage.removeItem("user");

    setToken(null);
    setUser(null);

    window.location.href = "/login";
  };

  useEffect(() => {
    const checkAuth = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get<User>(
          "http://localhost:3000/auth/me",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        setUser(res.data);

        localStorage.setItem(
          "user",
          JSON.stringify(res.data),
        );
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        login,
        logout,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider",
    );
  }

  return context;
};
