import { IoSearchOutline } from "react-icons/io5";
import { Filter, ChevronDown, } from "lucide-react";
import { FaRegEdit } from "react-icons/fa";
import { MdOutlineDeleteForever } from "react-icons/md";
import { useState, useEffect } from "react";
import { AddCategoryForm } from "../form/addcategoryform";
import type { CategoryItem } from "../types/categorytypes";
import { categoryApi } from "../Api/categoryapi";
import { toast } from "react-hot-toast";
export const Category = () => {
  const [isOpenForm, setIsOpenForm] = useState<boolean>(false);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [editData, setEditData] = useState<CategoryItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const getCategories = async () => {
    try {
      const res = await categoryApi.get("/");
      setCategories(res.data);
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    getCategories();
  }, []);

  const filteredCategories = categories.filter((item) => {
    const searchMatch = item.name.toLowerCase().includes(search.toLowerCase());
    const filterMatch = filter === "All" ? true : item.status === filter;
    return searchMatch && filterMatch;
  });
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const paginatedCategories = filteredCategories.slice(startIndex, endIndex);
  const deleteCategories = async (id: string) => {
 try {
      await categoryApi.delete(`/${id}`);
      toast.success("Category deleted successfully"); 
      getCategories();
    } catch (error) {
      toast.error("Failed to delete category ⚠️"); 
    }
  };
  return (
    <div>
      {/* header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl mb-1 font-bold">Category Management</h1>
          <p className="text-sm text-zinc-800">
            Manage all your category from here
          </p>
        </div>
        <div>

          <button
            onClick={() => {
              setEditData(null);
              setIsOpenForm(true);
            }}
            className="bg-blue-400 p-2 rounded-[5px] cursor-pointer font-semibold hover:bg-blue-300"
          > 

            + Add Category
          </button>
        </div>
      </div>

      {/* search & filter */}
      <div className="bg-olive-50 rounded-[5px] inset-shadow-2xs ring-1 ring-gray-300 p-5 mb-6 flex justify-between items-center mt-4">
        {/* Search input */}
        <div className="relative w-64">
          <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search"
            className="pl-9 pr-3 py-1 border border-gray-300 w-full rounded-[5px] focus:outline-none focus:ring-1 focus:ring-gray-300"
          />
        </div>

        {/* Filter select */}
        <div className="relative inline-block">
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="appearance-none pl-9 pr-8 py-1 border border-gray-300 rounded-[5px] hover:bg-gray-100 transition-all cursor-pointer font-medium"
          >
            <option value="All">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[5px] shadow-xl p-5">
        <h3 className="mb-3 font-semibold text-gray-400">
          {filteredCategories.length === 0
            ? "No categories found"
            : `Showing ${startIndex + 1} to ${Math.min(
                endIndex,
                filteredCategories.length,
              )} of ${filteredCategories.length}`}
        </h3>
        <div className="overflow-hidden rounded-t-lg border border-gray-300">
          <table className="w-full text-left border-collapse">
            <thead className="border-b-2 border-slate-900 text-sm text-gray-500 bg-sky-100">
              <tr>
                <th className="py-2 px-2 text-center">#ID</th>
                <th className="py-2 px-4 text-center">Name</th>
                <th className="py-2 px-3 text-center">Due Date</th>
                <th className="py-2 px-2 text-center">Status</th>
                <th className="py-2 px-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCategories.map((item, index) => (
                <tr
                  className="border-b border-gray-200 hover:bg-gray-50 transition-all"
                  key={item._id}
                >
                  <td className="py-2 text-center">{startIndex + index + 1}</td>
                  <td className="py-2 text-center">{item.name}</td>
                  <td className="py-2 text-center">{item.dueDate}</td>
                  <td className="py-2 text-center">{item.status}</td>

                  <td className="py-2 flex items-center justify-center gap-3">
                    <button
                      onClick={() => {
                        setEditData(item);
                        setIsOpenForm(true);
                      }}
                      className="hover:scale-105 transition-transform"
                    >
                      <FaRegEdit className="text-blue-500 bg-blue-200 size-[25px] p-1 rounded" />
                    </button>
                    <button
                      onClick={() => deleteCategories(item._id)}
                      className="hover:scale-105 transition-transform"
                    >
                      <MdOutlineDeleteForever className="text-red-500 bg-red-200 size-[25px] p-1 rounded" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between item-center mt-4 py-3 shadow-sm">
          <h4 className="ml-8 text-blue-400 underline underline-offset-6">
            go to more pages {">"}
          </h4>
          <div className="grid grid-cols-2 gap-x-8">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => prev - 1)}
              className="bg-gray-400 px-8 py-2 font-semibold hover:bg-gray-300 rounded-[5px]"
            >
              Previus
            </button>
            <div>
              
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => prev + 1)}
              className="bg-blue-400 px-8 py-2 rounded disabled:opacity-50"
            >
              Next
            </button>
            </div>
          </div>
        </div>

        {/* om form */}
        {isOpenForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="relative w-full max-w-md">
              <AddCategoryForm
                editData={editData}
                refresh={getCategories}
                onClose={() => setIsOpenForm(false)}
              />
              <button
                onClick={() => setIsOpenForm(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
