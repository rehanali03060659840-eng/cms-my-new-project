import { useState } from "react";

import client from "../api/client";

import { useAuth } from "../context/AuthContext";

import { useNavigate } from "react-router-dom";

import toast from "react-hot-toast";

export const Login = () => {
  const {
    login,
  } = useAuth();

  const navigate =
    useNavigate();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const submit = async () => {
    if (!email || !password) {
      toast.error(
        "Email and password are required",
      );

      return;
    }

    try {
      setLoading(true);

      const res =
        await client.post(
          `/auth/login`,
          {
            email,
            password,
          },
        );

      login(
        res.data.token,
        res.data.user,
      );

      toast.success(
        `Welcome ${res.data.user.name}`,
      );

      navigate("/");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Login failed",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">

        <h1 className="mb-2 text-2xl font-bold">
          Welcome Back
        </h1>

        <p className="mb-6 text-sm text-zinc-500">
          Login to continue
        </p>

        <div className="space-y-4">

          <input
            className="w-full rounded-xl border border-zinc-200 p-3 outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
          />

          <input
            className="w-full rounded-xl border border-zinc-200 p-3 outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
          />

          <button
            onClick={submit}
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 p-3 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading
              ? "Logging in..."
              : "Login"}
          </button>

        </div>
      </div>
    </div>
  );
};