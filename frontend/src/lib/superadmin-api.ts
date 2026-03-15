import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

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

// Helper
const get = (url: string, params?: Record<string, unknown>) =>
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
export const getAdmins = (params?: Record<string, unknown>) => get("/admins", params);
export const getAdmin = (id: number) => get(`/admins/${id}`);
export const createAdmin = (data: Record<string, unknown>) => post("/admins", data);
export const updateAdmin = (id: number, data: Record<string, unknown>) => put(`/admins/${id}`, data);
export const deleteAdmin = (id: number) => del(`/admins/${id}`);
export const blockAdmin = (id: number) => patch(`/admins/${id}/block`);
export const unblockAdmin = (id: number) => patch(`/admins/${id}/unblock`);

// ============================================
// Users
// ============================================
export const getUsers = (params?: Record<string, unknown>) => get("/users", params);
export const getUser = (id: number) => get(`/users/${id}`);
export const createUser = (data: { username: string; password: string }) => post("/users", data);
export const blockUser = (id: number) => patch(`/users/${id}/block`);
export const unblockUser = (id: number) => patch(`/users/${id}/unblock`);
export const verifyUser = (id: number) => patch(`/users/${id}/verify`);
export const deleteUser = (id: number) => del(`/users/${id}`);

// ============================================
// Olympiads
// ============================================
export const getOlympiads = (params?: Record<string, unknown>) => get("/olympiads", params);
export const getOlympiad = (id: number) => get(`/olympiads/${id}`);
export const createOlympiad = (data: Record<string, unknown>) => post("/olympiads", data);
export const updateOlympiad = (id: number, data: Record<string, unknown>) => put(`/olympiads/${id}`, data);
export const deleteOlympiad = (id: number) => del(`/olympiads/${id}`);

// ============================================
// Mock Tests
// ============================================
export const getMockTests = (params?: Record<string, unknown>) => get("/mock-tests", params);
export const getMockTest = (id: number) => get(`/mock-tests/${id}`);
export const createMockTest = (data: Record<string, unknown>) => post("/mock-tests", data);
export const updateMockTest = (id: number, data: Record<string, unknown>) => put(`/mock-tests/${id}`, data);
export const deleteMockTest = (id: number) => del(`/mock-tests/${id}`);

// ============================================
// Questions
// ============================================
export const getQuestions = (params?: Record<string, unknown>) => get("/questions", params);
export const getQuestion = (id: number) => get(`/questions/${id}`);
export const getQuestionsBySource = (params: { source_type: string; source_id: number }) =>
  get("/questions/by-source", params as unknown as Record<string, unknown>);
export const createQuestion = (data: Record<string, unknown>) => post("/questions", data);
export const bulkCreateQuestions = (data: { questions: Record<string, unknown>[] }) => post("/questions/bulk", data);
export const updateQuestion = (id: number, data: Record<string, unknown>) => put(`/questions/${id}`, data);
export const deleteQuestion = (id: number) => del(`/questions/${id}`);

// ============================================
// Results
// ============================================
export const getResults = (params?: Record<string, unknown>) => get("/results", params);
export const getResult = (id: number, type: string) => get(`/results/${id}`, { type });
export const getOlympiadRanking = (olympiadId: number) => get(`/results/olympiad/${olympiadId}/ranking`);

// ============================================
// News
// ============================================
export const getNewsList = (params?: Record<string, unknown>) => get("/news", params);
export const getNewsItem = (id: number) => get(`/news/${id}`);
export const createNews = (data: Record<string, unknown>) => post("/news", data);
export const updateNews = (id: number, data: Record<string, unknown>) => put(`/news/${id}`, data);
export const deleteNews = (id: number) => del(`/news/${id}`);

// ============================================
// Certificates
// ============================================
export const getCertificates = (params?: Record<string, unknown>) => get("/certificates", params);
export const getCertificate = (id: number) => get(`/certificates/${id}`);
export const createCertificate = (data: Record<string, unknown>) => post("/certificates", data);
export const updateCertificate = (id: number, data: Record<string, unknown>) => put(`/certificates/${id}`, data);

// Certificate Templates
export const getCertTemplates = (params?: Record<string, unknown>) => get("/certificate-templates", params);
export const getCertTemplate = (id: number) => get(`/certificate-templates/${id}`);
export const createCertTemplate = (data: Record<string, unknown>) => post("/certificate-templates", data);
export const updateCertTemplate = (id: number, data: Record<string, unknown>) => put(`/certificate-templates/${id}`, data);
export const deleteCertTemplate = (id: number) => del(`/certificate-templates/${id}`);

// ============================================
// Feedback
// ============================================
export const getFeedbacks = (params?: Record<string, unknown>) => get("/feedback", params);
export const getFeedback = (id: number) => get(`/feedback/${id}`);
export const replyFeedback = (id: number, data: { reply: string; status?: string }) => put(`/feedback/${id}/reply`, data);

// ============================================
// Payments
// ============================================
export const getPayments = (params?: Record<string, unknown>) => get("/payments", params);
export const getPayment = (id: number) => get(`/payments/${id}`);
export const getPaymentStats = () => get("/payments/stats");
export const updatePaymentStatus = (id: number, data: Record<string, unknown>) => patch(`/payments/${id}/status`, data);
export const approvePayment = (id: number) => post(`/payments/${id}/approve`);
export const refundPayment = (id: number, data: { reason: string }) => post(`/payments/${id}/refund`, data);
export const createManualPayment = (data: Record<string, unknown>) => post("/payments/manual", data);

// ============================================
// Promo Codes (under payments)
// ============================================
export const getPromoCodes = (params?: Record<string, unknown>) => get("/payments/promo-codes", params);
export const getPromoCode = (id: number) => get(`/payments/promo-codes/${id}`);
export const createPromoCode = (data: Record<string, unknown>) => post("/payments/promo-codes", data);
export const updatePromoCode = (id: number, data: Record<string, unknown>) => put(`/payments/promo-codes/${id}`, data);
export const deletePromoCode = (id: number) => del(`/payments/promo-codes/${id}`);
export const togglePromoCode = (id: number) => patch(`/payments/promo-codes/${id}/toggle`);
export const getPromoCodeUsages = (id: number) => get(`/payments/promo-codes/${id}/usages`);
export const getPromoCodeStats = () => get("/payments/promo-codes/stats");

// ============================================
// Permissions
// ============================================
export const getPermissions = (params?: Record<string, unknown>) => get("/permissions", params);
export const seedPermissions = () => post("/permissions/seed");
export const getStaffPermissions = (staffId: number) => get(`/permissions/staff/${staffId}`);
export const assignPermissions = (staffId: number, data: { permission_ids: number[] }) =>
  put(`/permissions/staff/${staffId}`, data);

// ============================================
// Security
// ============================================
export const getSecuritySettings = () => get("/security/settings");
export const updateSecuritySettings = (data: Record<string, unknown>) => put("/security/settings", data);

// ============================================
// Audit Logs
// ============================================
export const getAuditLogs = (params?: Record<string, unknown>) => get("/audit-logs", params);

// ============================================
// Settings
// ============================================
export const getSettings = () => get("/settings");
export const updateSettings = (data: Record<string, unknown>) => put("/settings", data);
