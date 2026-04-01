import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://nextolymp.uz/api/v1";

const saApi = axios.create({ baseURL: API_URL });

saApi.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("panel_access_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

saApi.interceptors.response.use(
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ApiData = Record<string, any>;

// Helper
const get = (url: string, params?: ApiData) =>
  saApi.get(`/superadmin${url}`, { params }).then((r) => r.data);
const post = (url: string, data?: unknown) =>
  saApi.post(`/superadmin${url}`, data).then((r) => r.data);
const put = (url: string, data?: unknown) =>
  saApi.put(`/superadmin${url}`, data).then((r) => r.data);
const patch = (url: string, data?: unknown) =>
  saApi.patch(`/superadmin${url}`, data).then((r) => r.data);
const del = (url: string) =>
  saApi.delete(`/superadmin${url}`).then((r) => r.data);

// ============================================
// Dashboard
// ============================================
export const getDashboard = () => get("/dashboard");

// ============================================
// Admins
// ============================================
export const getAdmins = (params?: ApiData) => get("/admins", params);
export const getAdmin = (id: number) => get(`/admins/${id}`);
export const createAdmin = (data: ApiData) => post("/admins", data);
export const updateAdmin = (id: number, data: ApiData) => put(`/admins/${id}`, data);
export const deleteAdmin = (id: number) => del(`/admins/${id}`);
export const blockAdmin = (id: number) => patch(`/admins/${id}/block`);
export const unblockAdmin = (id: number) => patch(`/admins/${id}/unblock`);

// ============================================
// Users
// ============================================
export const getUsers = (params?: ApiData) => get("/users", params);
export const getUser = (id: number) => get(`/users/${id}`);
export const createUser = (data: { username: string; password: string }) => post("/users", data);
export const blockUser = (id: number) => patch(`/users/${id}/block`);
export const unblockUser = (id: number) => patch(`/users/${id}/unblock`);
export const verifyUser = (id: number) => patch(`/users/${id}/verify`);
export const deleteUser = (id: number) => del(`/users/${id}`);

// ============================================
// Olympiads
// ============================================
export const getOlympiads = (params?: ApiData) => get("/olympiads", params);
export const getOlympiad = (id: number) => get(`/olympiads/${id}`);
export const createOlympiad = (data: ApiData) => post("/olympiads", data);
export const updateOlympiad = (id: number, data: ApiData) => put(`/olympiads/${id}`, data);
export const deleteOlympiad = (id: number) => del(`/olympiads/${id}`);
export const getOlympiadRegistrations = (id: number, params?: ApiData) => get(`/olympiads/${id}/registrations`, params);
export const getOlympiadParticipants = (id: number, params?: ApiData) => get(`/olympiads/${id}/participants`, params);
export const getOlympiadResults = (id: number, params?: ApiData) => get(`/olympiads/${id}/results`, params);
export const approveOlympiadResult = (olympiadId: number, resultId: number) => post(`/olympiads/${olympiadId}/results/${resultId}/approve`);
export const duplicateOlympiad = (id: number) => post(`/olympiads/${id}/duplicate`);
export const publishOlympiad = (id: number) => patch(`/olympiads/${id}/publish`);
export const unpublishOlympiad = (id: number) => patch(`/olympiads/${id}/unpublish`);
export const toggleOlympiadRegistration = (id: number) => patch(`/olympiads/${id}/toggle-registration`);

// ============================================
// Mock Tests
// ============================================
export const getMockTests = (params?: ApiData) => get("/mock-tests", params);
export const getMockTest = (id: number) => get(`/mock-tests/${id}`);
export const createMockTest = (data: ApiData) => post("/mock-tests", data);
export const updateMockTest = (id: number, data: ApiData) => put(`/mock-tests/${id}`, data);
export const deleteMockTest = (id: number) => del(`/mock-tests/${id}`);
export const getMockTestRegistrations = (id: number, params?: ApiData) => get(`/mock-tests/${id}/registrations`, params);
export const getMockTestParticipants = (id: number, params?: ApiData) => get(`/mock-tests/${id}/participants`, params);
export const getMockTestResults = (id: number, params?: ApiData) => get(`/mock-tests/${id}/results`, params);
export const approveMockTestResult = (mockTestId: number, resultId: number) => post(`/mock-tests/${mockTestId}/results/${resultId}/approve`);
export const duplicateMockTest = (id: number) => post(`/mock-tests/${id}/duplicate`);
export const publishMockTest = (id: number) => patch(`/mock-tests/${id}/publish`);
export const unpublishMockTest = (id: number) => patch(`/mock-tests/${id}/unpublish`);

// ============================================
// Questions
// ============================================
export const getQuestions = (params?: ApiData) => get("/questions", params);
export const getQuestion = (id: number) => get(`/questions/${id}`);
export const getQuestionsBySource = (params: { source_type: string; source_id: number }) =>
  get("/questions/by-source", params);
export const createQuestion = (data: ApiData) => post("/questions", data);
export const bulkCreateQuestions = (data: { questions: ApiData[] }) => post("/questions/bulk", data);
export const updateQuestion = (id: number, data: ApiData) => put(`/questions/${id}`, data);
export const deleteQuestion = (id: number) => del(`/questions/${id}`);

// ============================================
// Results
// ============================================
export const getResults = (params?: ApiData) => get("/results", params);
export const getResult = (id: number, type: string) => get(`/results/${id}`, { type });
export const getOlympiadRanking = (olympiadId: number) => get(`/results/olympiad/${olympiadId}/ranking`);

// ============================================
// News
// ============================================
export const getNewsList = (params?: ApiData) => get("/news", params);
export const getNewsItem = (id: number) => get(`/news/${id}`);
export const createNews = (data: ApiData) => post("/news", data);
export const updateNews = (id: number, data: ApiData) => put(`/news/${id}`, data);
export const deleteNews = (id: number) => del(`/news/${id}`);

// ============================================
// Certificates
// ============================================
export const getCertificates = (params?: ApiData) => get("/certificates", params);
export const getCertificate = (id: number) => get(`/certificates/${id}`);
export const createCertificate = (data: ApiData) => post("/certificates", data);
export const updateCertificate = (id: number, data: ApiData) => put(`/certificates/${id}`, data);
export const regenerateCertificate = (id: number) => post(`/certificates/${id}/regenerate`);
export const revokeCertificate = (id: number) => post(`/certificates/${id}/revoke`);
export const downloadCertificatePDF = async (id: number) => {
  const res = await saApi.get(`/superadmin/certificates/${id}/download`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `certificate_${id}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
};

// Certificate Templates
export const getCertTemplates = (params?: ApiData) => get("/certificate-templates", params);
export const getCertTemplate = (id: number) => get(`/certificate-templates/${id}`);
export const createCertTemplate = (data: ApiData) => post("/certificate-templates", data);
export const updateCertTemplate = (id: number, data: ApiData) => put(`/certificate-templates/${id}`, data);
export const deleteCertTemplate = (id: number) => del(`/certificate-templates/${id}`);

// ============================================
// Payments
// ============================================
export const getPayments = (params?: ApiData) => get("/payments", params);
export const getPayment = (id: number) => get(`/payments/${id}`);
export const getPaymentStats = () => get("/payments/stats");
export const updatePaymentStatus = (id: number, data: ApiData) => patch(`/payments/${id}/status`, data);
export const approvePayment = (id: number) => post(`/payments/${id}/approve`);
export const refundPayment = (id: number, data: { reason: string }) => post(`/payments/${id}/refund`, data);
export const createManualPayment = (data: ApiData) => post("/payments/manual", data);

// ============================================
// Promo Codes (under payments)
// ============================================
export const getPromoCodes = (params?: ApiData) => get("/payments/promo-codes", params);
export const getPromoCode = (id: number) => get(`/payments/promo-codes/${id}`);
export const createPromoCode = (data: ApiData) => post("/payments/promo-codes", data);
export const updatePromoCode = (id: number, data: ApiData) => put(`/payments/promo-codes/${id}`, data);
export const deletePromoCode = (id: number) => del(`/payments/promo-codes/${id}`);
export const togglePromoCode = (id: number) => patch(`/payments/promo-codes/${id}/toggle`);
export const getPromoCodeUsages = (id: number) => get(`/payments/promo-codes/${id}/usages`);
export const getPromoCodeStats = () => get("/payments/promo-codes/stats");

// ============================================
// Permissions
// ============================================
export const getPermissions = (params?: ApiData) => get("/permissions", params);
export const seedPermissions = () => post("/permissions/seed");
export const getStaffPermissions = (staffId: number) => get(`/permissions/staff/${staffId}`);
export const assignPermissions = (staffId: number, data: { permission_ids: number[] }) =>
  put(`/permissions/staff/${staffId}`, data);

// ============================================
// Security
// ============================================
export const getSecuritySettings = () => get("/security/settings");
export const updateSecuritySettings = (data: ApiData) => put("/security/settings", data);

// ============================================
// Audit Logs
// ============================================
export const getAuditLogs = (params?: ApiData) => get("/audit-logs", params);

// ============================================
// Settings
// ============================================
export const getSettings = () => get("/settings");
export const updateSettings = (data: ApiData) => put("/settings", data);

// ============================================
// Chat Moderation
// ============================================
// ============================================
// Verifications
// ============================================
export const getVerifications = (params?: ApiData) => get("/verifications", params);
export const getVerification = (id: number) => get(`/verifications/${id}`);
export const approveVerification = (id: number, data?: { note?: string }) => post(`/verifications/${id}/approve`, data);
export const rejectVerification = (id: number, data: { reason: string }) => post(`/verifications/${id}/reject`, data);
export const approveUserByID = (userId: number, note?: string) => post(`/verifications/user/${userId}/approve`, { note });
export const rejectUserByID = (userId: number, reason: string) => post(`/verifications/user/${userId}/reject`, { reason });

// ============================================
// Chat Moderation
// ============================================
export const getChatMessages = (params?: ApiData) => get("/chat/messages", params);
export const sendChatMessage = (content: string, replyToId?: number) => post("/chat/messages", { content, reply_to_id: replyToId || undefined });
export const deleteChatMessage = (id: number) => del(`/chat/messages/${id}`);
export const banChatUser = (userId: number, data: { reason?: string; type?: string; duration?: number }) =>
  post(`/chat/ban/${userId}`, data);
export const unbanChatUser = (userId: number) => post(`/chat/unban/${userId}`);
export const toggleChat = (data: { is_open: boolean }) => post("/chat/toggle", data);
export const getChatBans = () => get("/chat/bans");
export const getChatOnline = () => get("/chat/online");
export const getChatSettings = () => get("/chat/settings");
export const updateChatSettings = (data: ApiData) => put("/chat/settings", data);
export const getChatModerationLogs = (params?: ApiData) => get("/chat/moderation-logs", params);

// ============================================
// Anti-Cheat Violations
// ============================================
export const getAntiCheatViolations = (params?: ApiData) => get("/anticheat/violations", params);
export const getAntiCheatStats = (params?: ApiData) => get("/anticheat/violations/stats", params);

// ============================================
// Upload
// ============================================
export const uploadImage = async (file: File): Promise<{ url: string }> => {
  const formData = new FormData();
  formData.append("image", file);
  const res = await saApi.post("/superadmin/upload/image", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.data ?? res.data;
};
