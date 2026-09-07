import axios from "axios";

// 1. Set the Base URL to the server root or the base resource path
const API_URL = "http://localhost:3000/setting/terms-conditions";

export interface TermsConditionsPayload {
  termstitle: string;
  termsSlug: string;
  termsStatus: string;
  termsVisiblity: string;
  termsDate: string;
  termsContent: string;
}

export interface TermsConditionsRecord extends TermsConditionsPayload {
  _id: string;
  createdAt: string;
  updatedAt: string;
}

// 2. Create the custom axios instance
const termsConditionsApi = axios.create({
  baseURL: API_URL,
});

termsConditionsApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 4. Use the `termsConditionsApi` instance everywhere instead of global `axios`
export const getTermsConditions = async (): Promise<TermsConditionsRecord[]> => {
  // Passing "/" or "" targets the base URL directly
  const res = await termsConditionsApi.get<TermsConditionsRecord[]>("");
  return res.data;
};

export const createTermsConditions = async (
  data: TermsConditionsPayload
): Promise<TermsConditionsRecord> => {
  // Fixed: Changed from axios.post to termsConditionsApi.post
  const res = await termsConditionsApi.post<TermsConditionsRecord>("", data);
  return res.data;
};

export const updateTermsConditions = async (
  originalSlug: string,
  data: TermsConditionsPayload
): Promise<TermsConditionsRecord> => {
  // Fixed: Changed from axios.patch to termsConditionsApi.patch
  const res = await termsConditionsApi.patch<TermsConditionsRecord>(`/${originalSlug}`, data);
  return res.data;
};
