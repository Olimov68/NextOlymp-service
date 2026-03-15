import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://nextolymp.uz/api/v1";

const adminApi = axios.create({ baseURL: API_URL });

adminApi.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("panel_access_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

adminApi.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("panel_access_token");
      localStorage.removeItem("panel_refresh_token");
      localStorage.removeItem("panel_staff");
      window.location.href = "/admin/login";
    }
    return Promise.reject(err);
  }
);

// Helper
const get = (url: string, params?: Record<string, unknown>) =>
  adminApi.get(`/admin${url}`, { params }).then((r) => r.data);
const post = (url: string, data?: unknown) =>
  adminApi.post(`/admin${url}`, data).then((r) => r.data);
const put = (url: string, data?: unknown) =>
  adminApi.put(`/admin${url}`, data).then((r) => r.data);
const patch = (url: string, data?: unknown) =>
  adminApi.patch(`/admin${url}`, data).then((r) => r.data);
const del = (url: string) =>
  adminApi.delete(`/admin${url}`).then((r) => r.data);

// ============================================
// Dashboard
// ============================================
export const getAdminDashboard = () => get("/dashboard");

// ============================================
// Olympiads
// ============================================
export const getAdminOlympiads = (params?: Record<string, unknown>) => get("/olympiads", params);
export const getAdminOlympiad = (id: number) => get(`/olympiads/${id}`);
export const createAdminOlympiad = (data: Record<string, unknown>) => post("/olympiads", data);
export const updateAdminOlympiad = (id: number, data: Record<string, unknown>) => put(`/olympiads/${id}`, data);
export const deleteAdminOlympiad = (id: number) => del(`/olympiads/${id}`);
export const publishAdminOlympiad = (id: number) => patch(`/olympiads/${id}/publish`);

// ============================================
// Mock Tests
// ============================================
export const getAdminMockTests = (params?: Record<string, unknown>) => get("/mock-tests", params);
export const getAdminMockTest = (id: number) => get(`/mock-tests/${id}`);
export const createAdminMockTest = (data: Record<string, unknown>) => post("/mock-tests", data);
export const updateAdminMockTest = (id: number, data: Record<string, unknown>) => put(`/mock-tests/${id}`, data);
export const deleteAdminMockTest = (id: number) => del(`/mock-tests/${id}`);
export const publishAdminMockTest = (id: number) => patch(`/mock-tests/${id}/publish`);

// ============================================
// News
// ============================================
export const getAdminNews = (params?: Record<string, unknown>) => get("/news", params);
export const getAdminNewsItem = (id: number) => get(`/news/${id}`);
export const createAdminNews = (data: Record<string, unknown>) => post("/news", data);
export const updateAdminNews = (id: number, data: Record<string, unknown>) => put(`/news/${id}`, data);
export const deleteAdminNews = (id: number) => del(`/news/${id}`);

// ============================================
// Results
// ============================================
export const getAdminResults = (params?: Record<string, unknown>) => get("/results", params);
export const getAdminResult = (id: number) => get(`/results/${id}`);

// ============================================
// Certificates
// ============================================
export const getAdminCertificates = (params?: Record<string, unknown>) => get("/certificates", params);
export const getAdminCertificate = (id: number) => get(`/certificates/${id}`);

// ============================================
// Users
// ============================================
export const getAdminUsers = (params?: Record<string, unknown>) => get("/users", params);
export const getAdminUser = (id: number) => get(`/users/${id}`);
export const blockAdminUser = (id: number) => patch(`/users/${id}/block`);
export const unblockAdminUser = (id: number) => patch(`/users/${id}/unblock`);

// ============================================
// Upload
// ============================================
export async function uploadPanelImage(file: File): Promise<string> {
  const form = new FormData();
  form.append('image', file);
  const res = await adminApi.post('/admin/upload/image', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data.url as string;
}

// ============================================
// Feedback
// ============================================
export async function getAdminFeedbacks(params?: { page?: number; limit?: number }) {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  const res = await adminApi.get(`/admin/feedback?${query}`);
  return res.data.data;
}

export async function getAdminFeedback(id: number) {
  const res = await adminApi.get(`/admin/feedback/${id}`);
  return res.data.data;
}

export async function replyAdminFeedback(id: number, data: { reply: string; status?: string }) {
  const res = await adminApi.put(`/admin/feedback/${id}/reply`, data);
  return res.data.data;
}

// ============================================
// Permissions
// ============================================
export const getMyPermissions = () => {
  return adminApi
    .get(`/panel/auth/permissions`, {
      headers: {
        Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("panel_access_token") : ""}`,
      },
    })
    .then((r) => r.data);
};
