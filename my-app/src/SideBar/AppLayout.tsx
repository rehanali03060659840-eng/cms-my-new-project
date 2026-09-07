import { Outlet } from "react-router-dom";
import { Sidebar } from "./sidebar";

export const AppLayout = () => {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-[220px] p-4">
        <Outlet />
      </main>
    </div>
  );
};
