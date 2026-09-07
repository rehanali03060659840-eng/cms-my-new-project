import { useEffect, useState, type FormEvent } from "react";
import type { CategoryItem } from "../types/categorytypes";
import { categoryApi } from "../Api/categoryapi";

type Props = {
  onClose: () => void;

  refresh: () => void;

  editData: CategoryItem | null;
};

export const AddCategoryForm = ({ onClose, refresh, editData }: Props) => {
  const [categoryName, setCategoryName] = useState("");

  const [status, setStatus] = useState<"active" | "inactive">("active");

  const [dueDate, setDueDate] = useState("");

  // EDIT DATA LOAD

  useEffect(() => {
    if (editData) {
      setCategoryName(editData.name);

      setStatus(editData.status);

      setDueDate(editData.dueDate);
    } else {
      setCategoryName("");

      setStatus("active");

      setDueDate("");
    }
  }, [editData]);

 const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  try {
    if (editData) {
      // UPDATE
      await categoryApi.patch(`/${editData._id}`, {
        name: categoryName,
        status,
        dueDate,
      });
    } else {
      // CREATE
      await categoryApi.post("/", {
        name: categoryName,
        status,
        dueDate,
      });
    }

    refresh();
    onClose();
  } catch (error) {
    console.log(error);
  }
};

  return (
    <div className="bg-white rounded shadow-xl p-6">
      <h2 className="text-xl font-bold mb-5">
        {editData ? "Edit Category" : "Add New Category"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label>Category Name</label>

          <input
            type="text"
            required
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label>Status</label>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "active" | "inactive")}
            className="w-full border p-2 rounded"
          >
            <option value="active">Active</option>

            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div>
          <label>Due Date</label>

          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="border px-4 py-2 rounded"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            {editData ? "Update Category" : "Save Category"}
          </button>
        </div>
      </form>
    </div>
  );
};
