import axios from "axios";

// Pichli baar empty string "" bhejne se Axios baseURL ko sahi se trace nahi kar pa raha tha.
// Base URL ke aakhiri mein hamesha ek trailing slash '/' lagana best practice hai.
const API_URL = "http://localhost:3000/setting/privacy-policy/";

export interface PrivacyPolicyPayload {
  privacytitle: string;
  privacySlug: string;
  privacyStatus: string;
  privacyVisiblity: string;
  privacyDate: string;
  privacyContent: string;
}

export interface PrivacyPolicyRecord extends PrivacyPolicyPayload {
  _id: string;
  createdAt: string;
  updatedAt: string;
}

const privacyPolicyApi = axios.create({
  baseURL: API_URL,
});

// Request Interceptor: Token automatically attach karne ke liye
privacyPolicyApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  
  // Debugger logging attach ki hai taaki console mein error clean pata chale
  if (!token) {
    console.warn("⚠️ Warning: LocalStorage mein 'token' naam ki key nahi mili!");
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// GET - Get all records
export const getPrivacyPolicies = async (): Promise<PrivacyPolicyRecord[]> => {
  // Empty string ki jagah relative route '.' ya config baseline URL call karein
  const res = await privacyPolicyApi.get<PrivacyPolicyRecord[]>("");
  return res.data;
};

// POST - Create record
export const createPrivacyPolicy = async (
  data: PrivacyPolicyPayload,
): Promise<PrivacyPolicyRecord> => {
  const res = await privacyPolicyApi.post<PrivacyPolicyRecord>("", data);
  return res.data;
};

// PATCH - Update record
export const updatePrivacyPolicy = async (
  originalSlug: string,
  data: PrivacyPolicyPayload,
): Promise<PrivacyPolicyRecord> => {
  // Base URL ke end mein pehle se slash hai, isliye yahan directly slug attach karein
  const res = await privacyPolicyApi.patch<PrivacyPolicyRecord>(
    `${originalSlug}`,
    data,
  );
  return res.data;
};
