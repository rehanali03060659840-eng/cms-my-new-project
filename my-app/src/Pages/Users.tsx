import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import type { User, UserRole } from "../types/auth";
import { FiPlus, FiUser } from "react-icons/fi";
import { AddUserModal } from "../form/AddPersonModelForm";
import { IoIosArrowForward } from "react-icons/io";
import { IoIosArrowBack } from "react-icons/io";

const allRoles: UserRole[] = ["super_admin", "admin", "moderator", "user"];

const roleBadgeStyles: Record<UserRole, string> = {
  super_admin: "bg-indigo-50 text-indigo-700 border-indigo-200",
  admin: "bg-blue-50 text-blue-700 border-blue-200",
  moderator: "bg-amber-50 text-amber-700 border-amber-200",
  user: "bg-zinc-100 text-zinc-600 border-zinc-200",
};

export const Users = () => {
  const { token } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  const getUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get<User[]>(
        "http://localhost:3000/users",
        authHeader,
      );
      setUsers(res.data);
    } catch {
      toast.error("Unable to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getUsers();
  }, []);

  const changeRole = async (id: string, newRole: UserRole) => {
    const prevUsers = users;
    setUsers((prev) =>
      prev.map((u) => (u._id === id ? { ...u, role: newRole } : u)),
    );

    try {
      await axios.patch(
        `http://localhost:3000/users/${id}/role`,
        { role: newRole },
        authHeader,
      );
      toast.success("Role updated");
    } catch {
      setUsers(prevUsers);
      toast.error("Unable to update role");
    }
  };

  const toggleStatus = async (id: string) => {
    try {
      await axios.patch(
        `http://localhost:3000/users/${id}/status`,
        {},
        authHeader,
      );
      setUsers((prev) =>
        prev.map((u) => (u._id === id ? { ...u, isActive: !u.isActive } : u)),
      );
      toast.success("User status updated");
    } catch {
      toast.error("Unable to update status");
    }
  };

  const removeUser = async (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to remove this user?",
    );
    if (!confirmed) return;

    try {
      await axios.delete(`http://localhost:3000/users/${id}`, authHeader);
      setUsers((prev) => prev.filter((u) => u._id !== id));
      toast.success("User removed successfully");
    } catch {
      toast.error("Unable to remove user");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 p-6 md:p-8">
      {/* HEADER */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Users</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Manage your team and their access levels
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-500/20 transition hover:bg-indigo-700 active:scale-[0.98]"
        >
          <FiPlus className="text-base" />
          Add Person
        </button>
      </div>

      {/* USERS TABLE */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              <th className="px-5 py-3.5">Person</th>
              <th className="px-5 py-3.5">Email</th>
              <th className="px-5 py-3.5">Role</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-14 text-center text-zinc-400">
                  Loading users…
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-14 text-center text-zinc-400">
                  No users yet — click "Add Person" to create one.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr
                  key={user._id.toString()}
                  className="transition-colors hover:bg-zinc-50/70"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      {user.image ? (
                        <img
                          src={`http://localhost:3000${user.image}`}
                          alt={user.name}
                          className="h-9 w-9 rounded-full object-cover ring-1 ring-zinc-200"
                        />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-600">
                          {user.name?.charAt(0).toUpperCase() || <FiUser />}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-medium text-zinc-900">
                          {user.name}
                        </p>
                        <p className="truncate text-xs text-zinc-500">
                          @{user.username}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-3.5 text-zinc-600">{user.email}</td>

                  <td className="px-5 py-3.5">
                    <select
                      className={`h-8 rounded-lg border px-2 text-xs font-medium capitalize outline-none transition focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 ${roleBadgeStyles[user.role]}`}
                      value={user.role}
                      disabled={user.role === "super_admin"}
                      onChange={(e) => {
                        const newRole = e.target.value as UserRole;
                        if (newRole !== user.role) {
                          changeRole(user._id, newRole);
                        }
                      }}
                    >
                      {allRoles.map((item) => (
                        <option key={item} value={item}>
                          {item.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => toggleStatus(user._id)}
                      disabled={user.role === "super_admin"}
                      className={`rounded-full border px-2.5 py-1 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                        user.isActive
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          : "border-zinc-200 bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                      }`}
                    >
                      {user.isActive ? "Active" : "Disabled"}
                    </button>
                  </td>

                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => removeUser(user._id)}
                      disabled={user.role === "super_admin"}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:text-zinc-300 disabled:hover:bg-transparent"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex justify-between item-center py-3 shadow-sm">
        <div className="flex ml-4 font:semi-bold text-bold">
          <label className="p-1 text-blue-400 rounded-lg">Users List</label>
        <select className="w-15 h-6 mr-8 mt-1 rounded-sm border px-2 text-xs font-medium hover:bg-green-50">
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="30">30</option>
          <option value="40">40</option>
        </select>
        </div>
        <div className="grid grid-cols-2 gap-x-8 mr-6 mt-1">
          <button className="disabled:opacity-40">
            <IoIosArrowBack className="w-6 h-6 rounded-[50%] border"/>
          </button>
          <div>
            <button className="disabled:opacity-50">
              <IoIosArrowForward className="w-6 h-6 rounded-[50%] border"/>
            </button>
          </div>
        </div>
      </div>
      <AddUserModal
        isOpen={isModalOpen}
        token={token}
        onClose={() => setIsModalOpen(false)}
        onCreated={(newUser) => setUsers((prev) => [newUser, ...prev])}
      />
    </div>
  );
};
