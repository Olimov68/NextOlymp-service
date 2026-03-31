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
// Chat Moderation
// ============================================
export const getAdminChatMessages = (params?: Record<string, unknown>) =>
  get("/chat/messages", params);
export const sendAdminChatMessage = (content: string, replyToId?: number) =>
  post("/chat/messages", { content, reply_to_id: replyToId });
export const deleteAdminChatMessage = (id: number) =>
  del(`/chat/messages/${id}`);
export const banChatUser = (userId: number, data: { reason?: string; type?: string; duration?: number }) =>
  post(`/chat/ban/${userId}`, data);
export const unbanChatUser = (userId: number) =>
  post(`/chat/unban/${userId}`);
export const toggleChat = (data: { is_open: boolean }) =>
  post("/chat/toggle", data);
export const getChatBans = () =>
  get("/chat/bans");
export const getChatOnline = () =>
  get("/chat/online");
export const getChatSettings = () =>
  get("/chat/settings");
export const updateChatSettings = (data: Record<string, unknown>) =>
  put("/chat/settings", data);
export const getChatModerationLogs = (params?: Record<string, unknown>) =>
  get("/chat/moderation-logs", params);

// ============================================
// Permissions
// ============================================
// ============================================
// Verifications
// ============================================
export const getVerifications = (params?: Record<string, unknown>) => get("/verifications", params);
export const getVerification = (id: number) => get(`/verifications/${id}`);
export const approveVerification = (id: number, data?: { note?: string }) => post(`/verifications/${id}/approve`, data);
export const rejectVerification = (id: number, data: { reason: string }) => post(`/verifications/${id}/reject`, data);

export const approveUserVerification = (userId: number, note?: string) =>
  post(`/verifications/user/${userId}/approve`, { note });
export const rejectUserVerification = (userId: number, reason: string) =>
  post(`/verifications/user/${userId}/reject`, { reason });

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
