import { useState } from "react";
import { TermsConditionsForm } from "../form/term&conditionform";
import type { TermsConditionsRecord } from "../Api/termsconditionsApi";
import axios from "axios";
import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export const TermConditions = () => {
  const { token } = useAuth();
  const [isOpenForm, setIsOpenForm] = useState<boolean>(false);
  const [updateDate, setUpdateDate] = useState("")
   const [data, setData] = useState<TermsConditionsRecord | null>(null);
   const today = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })


useEffect(() => {
  const loadTermsFromDb = async () => {
    try {
      const response = await axios.get(
        "http://localhost:3000/setting/terms-conditions",
        { headers: { Authorization: `Bearer ${token}` } },
      );
      
      const termsData = Array.isArray(response.data) ? response.data[0] : response.data;
      
      if (termsData) {
        setData(termsData);
        setUpdateDate(termsData.termsDate || termsData.updatedAt || today);
      }
    } catch (err) {
      console.error("Error fetching data from database", err);
    }
  };

  loadTermsFromDb();
}, []);

  
  const handleFormSubmit = (formData: TermsConditionsRecord) => {
    setData(formData);
    setUpdateDate(today)
    setIsOpenForm(false);
    toast.success("Succesfully submit")
  }
  return (
    <div>
      <div>
        <div className="flex justify-between items-center p-5 w-full shadow-sm">
          <div>
            <h1 className="text-2xl mb-1 font-bold">Term & Conditions</h1>
            <p className="text-sm text-zinc-800">See this term & conditions</p>
          </div>
          <div>
            <button
              onClick={() => setIsOpenForm(true)}
              className="bg-sky-200 p-2 rounded-[5px] cursor-pointer font-semibold hover:bg-sky-100"
            >
             {data ? "update" : "+Add"}
            </button>
          </div>
          {isOpenForm && (
            <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
              <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl relative h-[99vh] overflow-y-auto ">
                <TermsConditionsForm
                  onClose={() => setIsOpenForm(false)}
                  onSubmit={handleFormSubmit}
                  initialData= {data}
                />
              </div>
            </div>
          )}
        </div>
      </div>
      {!data ? (
        <div className="border border-dashed border-gray-300 rounded-lg p-12 text-center bg-white shadow-sm">
          <p className="text-gray-400 text-sm italic">
            No terms and conditions created yet. Please click "+Add & Edit" to write your data.
          </p>
        </div>
      ) : (
      <div>
      <div>
        <div className="overflow-hidden rounded-t-lg border border-gray-300 mt-12">
          <table className="w-full text-left border-collapse">
            <thead className="border-b-2 border-slate-900 text-sm text-gray-500 bg-sky-100">
              <tr>
                <th className="py-2 px-2 text-center">Title</th>
                <th className="py-2 px-2 text-center">Slug</th>
                <th className="py-2 px-2 text-center">Status</th>
                <th className="py-2 px-2 text-center">Visibilty</th>
                <th className="py-2 px-2 text-center">Update</th>
              </tr>
            </thead>
               <tbody>
              <tr className="border-b border-gray-200 hover:bg-gray-50/50 transition-all text-sm">
                <td className="py-3 px-2 text-center font-semibold text-gray-800">{data.termstitle}</td>
                <td className="py-3 px-2 text-center text-gray-500 font-mono text-xs">{data.termsSlug}</td>
                <td className="py-3 px-2 text-center">
                  <span className={`px-2.5 py-0.5 rounded-sm text-xs font-medium ${
                    data.termsStatus === "published" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {data.termsStatus}
                  </span>
                </td>
                <td className="py-3 px-2 text-center text-gray-600 capitalize">{data.termsVisiblity}</td>
                <td className="py-3 px-2 text-center text-gray-500 text-xs font-medium">{updateDate}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
       <div className="border border-gray-300 rounded-lg p-6 bg-white shadow-sm mt-6">
        <h2 className="text-lg font-bold border-b pb-3 text-slate-800 flex items-center gap-2">
          📄 Terms Content Live View
        </h2>
        
        {/* Dynamic HTML renderer box */}
        <div className="mt-5">
          {data.termsContent ? (
            <div 
              className="prose max-w-none text-gray-800 text-sm leading-relaxed prose-headings:text-slate-900 prose-strong:text-black"
              dangerouslySetInnerHTML={{ __html: data.termsContent }}
            />
          ) : (
            <p className="text-gray-400 text-sm italic text-center py-6">No content available.</p>
          )}
        </div>
      </div>
      </div>
      )}
    </div>
    
  );
};
