import { NavLink, useLocation } from "react-router-dom";
import { CgMenuGridR, CgLogOut } from "react-icons/cg";
import { useAuth } from "../context/AuthContext";
import { RiDashboardFill } from "react-icons/ri";
import { BiCategory } from "react-icons/bi";
import { FilePenLine, Video } from "lucide-react";
import { FaWpforms } from "react-icons/fa";
import { FiUsers } from "react-icons/fi";
import { useState } from "react";
import { GoChevronDown } from "react-icons/go";
import { BsCameraReels } from "react-icons/bs";
import { hasPermission } from "../utils/Permissions";
import { Tv, Upload, Shield, UserRound } from "lucide-react";

export const Sidebar = () => {
  const { logout, user } = useAuth();
  const location = useLocation();
  const [isSettingOpen, setIsSettingOpen] = useState(
    location.pathname.startsWith("/setting"),
  );
  const linkStyles = ({ isActive }: { isActive: boolean }) =>
    `group flex items-center rounded-md px-3 py-2.5 text-[12px] font-medium transition-all duration-200 ${isActive ? "bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white shadow-md shadow-indigo-500/20" : "text-white/75 hover:bg-white/[0.07] hover:text-white"}`;
  return (
    <div className="fixed z-40 flex h-screen w-[200px] flex-col overflow-hidden bg-gradient-to-b from-[#111936] via-[#0b1228] to-[#070d20] text-white shadow-xl">
      <div className="relative z-10 border-b border-white/10 px-3 py-4">
        {user && (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-indigo-500 text-sm font-bold">
              {user.image ? (
                <img
                  src={`http://localhost:3000${user.image}`}
                  alt={user.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                user.name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold">{user.name}</p>
              <p className="truncate text-[10px] text-white/50">
                @{user.username}
              </p>
              <p className="text-[9px] uppercase text-indigo-300">
                {user.role.replace("_", " ")}
              </p>
            </div>
          </div>
        )}
      </div>
      <div className="relative z-10 flex h-[30px] items-center border-b border-white/10 px-3">
        <div className="flex items-center gap-2">
          <CgMenuGridR className="text-[12px]" />
          <span className="text-[10px] font-semibold tracking-wide uppercase opacity-60">
            Menu
          </span>
        </div>
      </div>
      <nav className="relative z-10 mt-5 flex flex-1 flex-col gap-1.5 overflow-y-auto px-2">
        {hasPermission(user?.role!, "dashboard") && (
          <NavLink to="/" className={linkStyles}>
            <div className="mr-2.5 flex w-4 justify-center text-[16px]">
              <RiDashboardFill />
            </div>
            <span>Dashboard</span>
          </NavLink>
        )}
        {hasPermission(user?.role!, "category") && (
          <NavLink to="/category" className={linkStyles}>
            <div className="mr-2.5 flex w-4 justify-center text-[16px]">
              <BiCategory />
            </div>
            <span>Category</span>
          </NavLink>
        )}
        {hasPermission(user?.role!, "blog") && (
          <NavLink to="/blogs" className={linkStyles}>
            <div className="mr-2.5 flex w-4 justify-center text-[16px]">
              <FilePenLine />
            </div>
            <span>Blog</span>
          </NavLink>
        )}
        <NavLink to="/anime" className={linkStyles}>
          <div className="mr-2.5 flex w-4 justify-center text-[16px]">
            <Tv />
          </div>
          <span>Anime</span>
        </NavLink>
        <NavLink to="/anime/room" className={linkStyles}>
          <div className="mr-2.5 flex w-4 justify-center text-[16px]">
            <UserRound />
          </div>
          <span>My Room</span>
        </NavLink>
        {(user?.role === "super_admin" || user?.role === "admin") && (
          <NavLink to="/anime/upload" className={linkStyles}>
            <div className="mr-2.5 flex w-4 justify-center text-[16px]">
              <Upload />
            </div>
            <span>Upload</span>
          </NavLink>
        )}
        {user?.role === "super_admin" && (
          <NavLink to="/anime/admin" className={linkStyles}>
            <div className="mr-2.5 flex w-4 justify-center text-[16px]">
              <Shield />
            </div>
            <span>Anime Admin</span>
          </NavLink>
        )}
        {hasPermission(user?.role!, "reels") && (
          <NavLink to="/trendingreelslist" className={linkStyles}>
            <div className="mr-2.5 flex w-4 justify-center text-[16px]">
              <BsCameraReels />
            </div>
            <span>Reels</span>
          </NavLink>
        )}
        <NavLink to="/live-meet" className={linkStyles}>
          <div className="mr-2.5 flex w-4 justify-center text-[16px]">
            <Video />
          </div>
          <span>Live Meet</span>
        </NavLink>
        {user?.role === "super_admin" && (
          <NavLink to="/users" className={linkStyles}>
            <div className="mr-2.5 flex w-4 justify-center text-[16px]">
              <FiUsers />
            </div>
            <span>Users</span>
          </NavLink>
        )}
        {hasPermission(user?.role!, "setting") && (
          <div className="flex w-full flex-col gap-1">
            <button
              onClick={() => setIsSettingOpen((v) => !v)}
              className={`flex w-full items-center justify-between rounded-md px-3 py-2.5 text-[12px] font-medium transition-all duration-200 ${location.pathname.startsWith("/setting") ? "bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white shadow-md shadow-indigo-500/20" : "text-white/75 hover:bg-white/[0.07] hover:text-white"}`}
            >
              <div className="flex items-center">
                <div className="mr-2.5 flex w-4 justify-center text-[15px]">
                  <FaWpforms />
                </div>
                <span>Setting</span>
              </div>
              <GoChevronDown
                className={`text-[14px] transition-transform ${isSettingOpen ? "rotate-180" : ""}`}
              />
            </button>
            {isSettingOpen && (
              <div className="ml-3 mt-1 flex flex-col gap-1 border-l border-white/10 pl-2">
                <NavLink
                  to="/setting/privacy-and-policy"
                  className={({ isActive }) =>
                    `rounded-md px-2 py-2 text-[10px] ${isActive ? "bg-white/10 font-medium text-white" : "text-white/55 hover:bg-white/[0.06] hover:text-white"}`
                  }
                >
                  Privacy & Policy
                </NavLink>
                <NavLink
                  to="/setting/terms-and-conditions"
                  className={({ isActive }) =>
                    `rounded-md px-2 py-2 text-[10px] ${isActive ? "bg-white/10 font-medium text-white" : "text-white/55 hover:bg-white/[0.06] hover:text-white"}`
                  }
                >
                  Terms & Conditions
                </NavLink>
              </div>
            )}
          </div>
        )}
      </nav>
      <div className="relative z-10 mt-auto border-t border-white/5 p-2">
        <button
          onClick={logout}
          className="flex w-full items-center rounded-md border border-white/10 bg-white/[0.05] px-3 py-2.5 text-[12px] font-medium text-white/80 hover:border-red-400/20 hover:bg-red-500/10 hover:text-red-300"
        >
          <div className="mr-2.5 flex text-[16px]">
            <CgLogOut />
          </div>
          <span>Logout</span>
        </button>
      </div>
      <div className="pointer-events-none absolute bottom-0 left-0 h-[420px] w-full overflow-hidden opacity-75">
        <div className="absolute -bottom-8 -right-24 h-[130px] w-[330px] rotate-[-25deg] rounded-[50%] border-t border-indigo-400/20" />
        <div className="absolute -bottom-4 -right-28 h-[145px] w-[360px] rotate-[-35deg] rounded-[50%] border-t border-purple-400/15" />
        <div className="absolute bottom-2 -right-32 h-[160px] w-[390px] rotate-[-45deg] rounded-[50%] border-t border-blue-400/10" />
      </div>
    </div>
  );
};
