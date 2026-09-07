import { Card } from "@heroui/react";
import { useEffect, useState } from "react";
import { BiCategory } from "react-icons/bi";
import { FaRegNewspaper, FaVideo } from "react-icons/fa"; // New icons added
import { dashboardApi } from "../Api/dashboard";
export const Home = () => {

const [stats, setStats] = useState ({
  totalCategories: 0,
  totalBlogs: 0 ,
  totalReels: 0,
})
const [loading, setLoading] = useState(true)
const fetchStats = async () => {
  try {
    setLoading(true)
    const res = await dashboardApi.get('/stats');
    setStats(res.data)
  } catch(err) {
    console.log("Dashboard stats fetch failed", err)
  } finally {
    setLoading(false)
  }
}
useEffect(() => {
  fetchStats();
},[])
  return (
    <div>
      <div className="justify-between items-center p-5 w-full shadow-sm">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-zinc-800">Monitor your overall performance, organize content categories, and manage your blogs and reels.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-5 mt-9">
        
        {/* Card 1: Category */}
        <Card className="shadow-sm bg-white p-4 rounded-sm border border-zinc-100">
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-1">
              <span className="text-2xl font-bold text-zinc-900">{loading ? "...." : stats.totalCategories}</span>
              <span className="text-sm font-semibold text-zinc-700">
                Total Categories
              </span>
            </div>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-md text-xl mt-2">
              <BiCategory />
            </div>
          </div>
        </Card>

        {/* Card 2: Blog */}
        <Card className="shadow-sm bg-white p-4 rounded-sm border border-zinc-100">
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-1">
              <span className="text-2xl font-bold text-zinc-900">{loading ? "...." : stats.totalBlogs}</span>
              <span className="text-sm font-semibold text-zinc-700">
                Total Blogs
              </span>
            </div>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-md text-xl mt-2">
              <FaRegNewspaper />
            </div>
          </div>
        </Card>

        {/* Card 3: Reels */}
        <Card className="shadow-sm bg-white p-4 rounded-sm border border-zinc-100">
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-1">
              <span className="text-2xl font-bold text-zinc-900 font-sans">{loading ? "..." : stats.totalReels}</span>
              <span className="text-sm font-semibold text-zinc-700">
                Total Reels
              </span>
            </div>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-md text-xl mt-2">
              <FaVideo />
            </div>
          </div>
        </Card>
        
      </div>
    </div>
  );
};
