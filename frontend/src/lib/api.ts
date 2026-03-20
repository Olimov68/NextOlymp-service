import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://nextolymp.uz/api/v1";
const BACKEND_URL = API_BASE.replace("/api/v1", "");

export const api = axios.create({
  baseURL: API_BASE,
});

/** Backend'dan kelgan /uploads/... URL'larni to'liq URL'ga aylantiradi */
export function mediaUrl(path: string | undefined | null): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${BACKEND_URL}${path}`;
}

// ============================================================
// REQUEST INTERCEPTOR — token qo'shish
// ============================================================
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ============================================================
// RESPONSE INTERCEPTOR — 401 da avtomatik token yangilash
// ============================================================
let isRefreshing = false;
let failedQueue: Array<{ resolve: (value: unknown) => void; reject: (reason?: unknown) => void }> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry && typeof window !== "undefined") {
      if (originalRequest.url?.includes("/auth/login") ||
          originalRequest.url?.includes("/auth/register") ||
          originalRequest.url?.includes("/auth/refresh")) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      // Session boshqa qurilmadan bekor qilinganini tekshirish
      const errMsg = error.response?.data?.message || "";
      if (errMsg.includes("Session expired") || errMsg.includes("invalidated") || errMsg.includes("sessiya")) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        sessionStorage.setItem("session_ended_reason", "another_device");
        window.location.href = "/login";
        return Promise.reject(error);
      }

      const refreshToken = localStorage.getItem("refresh_token");
      if (!refreshToken) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        const res = await api.post("/auth/refresh", { refresh_token: refreshToken });
        const tokens = res.data.data;
        localStorage.setItem("access_token", tokens.access_token);
        localStorage.setItem("refresh_token", tokens.refresh_token);
        processQueue(null, tokens.access_token);
        originalRequest.headers.Authorization = `Bearer ${tokens.access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ============================================================
// TYPES
// ============================================================
export interface Stats {
  total_users: number;
  total_olympiads: number;
  total_regions: number;
  total_mock_tests: number;
}

export interface Olympiad {
  id: number;
  title: string;
  slug: string;
  subject: string;
  description: string;
  price: number;
  status: string;
  start_date: string | null;
  end_date: string | null;
  duration_minutes: number;
  max_attempts: number;
  created_at: string;
  updated_at: string;
  questions_count: number;
  participants_count: number;
}

export interface NewsItem {
  id: number;
  title: string;
  slug: string;
  description: string;
  excerpt: string;
  image: string;
  cover_image: string;
  body: string;
  type: string;
  status: string;
  views_count: number;
  published_at: string;
  created_at: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  avatar_url: string;
  status: string;
  is_profile_completed: boolean;
  is_telegram_linked: boolean;
  created_at?: string;
}

export interface UserProfile {
  first_name: string;
  last_name: string;
  middle_name?: string;
  birth_date: string;
  gender: string;
  region: string;
  district: string;
  school_name: string;
  grade: number;
  photo_url: string;
  bio?: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface AuthResponse {
  user: User;
  tokens: TokenPair;
  next_step: string;
}

export interface MeResponse {
  user: User;
  profile?: UserProfile;
  next_step: string;
}

export interface MockExam {
  id: number;
  title: string;
  subject: string;
  description: string;
  language: string;
  format: string;
  status: string;
  assessment_method: string;
  duration_minutes: number;
  max_attempts: number;
  price: number;
  created_at: string;
  updated_at: string;
  questions_count: number;
  attempts_count: number;
}

export interface PanelStaff {
  id: number;
  username: string;
  full_name: string;
  role: "admin" | "superadmin";
  status: string;
}

export interface PanelLoginResponse {
  staff: PanelStaff;
  tokens: TokenPair;
  next_step: string;
}

export interface PanelMeResponse {
  staff: PanelStaff;
}

// ============================================================
// PUBLIC API — auth talab qilinmaydi
// ============================================================
export const fetchStats = (): Promise<Stats> =>
  api.get("/stats").then((r) => r.data?.data ?? r.data).catch(() => ({
    total_users: 0,
    total_olympiads: 0,
    total_regions: 12,
    total_mock_tests: 0,
  }));

export const fetchNews = (): Promise<NewsItem[]> =>
  api.get("/news").then((r) => r.data?.data?.news ?? r.data?.data ?? []);

export const fetchNewsItem = (id: number): Promise<NewsItem> =>
  api.get(`/news/${id}`).then((r) => r.data?.data ?? r.data);

export const fetchPublicSettings = () =>
  api.get("/settings/public").then((r) => r.data?.data ?? r.data);

// ============================================================
// AUTH API
// ============================================================
export interface RegisterData {
  username: string;
  password: string;
  confirm_password: string;
}

export const login = (username: string, password: string): Promise<AuthResponse> =>
  api.post("/auth/login", { username, password }).then((r) => r.data.data);

export const googleAuth = (id_token: string): Promise<AuthResponse & { is_new?: boolean }> =>
  api.post("/auth/google", { id_token }).then((r) => r.data.data);

export const register = (data: RegisterData): Promise<AuthResponse> =>
  api.post("/auth/register", data).then((r) => r.data.data);

export const refreshTokens = (refresh_token: string): Promise<TokenPair> =>
  api.post("/auth/refresh", { refresh_token }).then((r) => r.data.data);

export const logout = () =>
  api.post("/auth/logout").then((r) => r.data);

export const getMe = (): Promise<MeResponse> =>
  api.get("/auth/me").then((r) => r.data.data);

// ============================================================
// PROFILE API
// ============================================================
export const completeProfile = (data: FormData) =>
  api.post("/profile/complete", data).then((r) => r.data.data);

export const updateProfile = (data: Partial<UserProfile>) =>
  api.put("/profile/me", data).then((r) => r.data.data);

export const getProfile = () =>
  api.get("/profile/me").then((r) => r.data.data);

export const uploadPhoto = (file: File) => {
  const formData = new FormData();
  formData.append("photo", file);
  return api.post("/profile/photo", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }).then((r) => r.data.data);
};

// ============================================================
// TELEGRAM API
// ============================================================
export const verifyTelegramCode = (code: string): Promise<void> =>
  api.post("/telegram/verify", { code }).then((r) => r.data);

export const checkTelegramStatus = (): Promise<{ linked: boolean; telegram_username: string }> =>
  api.get("/telegram/status").then((r) => r.data.data);

// ============================================================
// PANEL AUTH API (Admin + SuperAdmin)
// ============================================================
export const panelLogin = (username: string, password: string): Promise<PanelLoginResponse> =>
  api.post("/panel/auth/login", { username, password }).then((r) => r.data.data);

export const panelRefreshTokens = (refresh_token: string): Promise<TokenPair> =>
  api.post("/panel/auth/refresh", { refresh_token }).then((r) => r.data.data);

export const panelGetMe = (): Promise<PanelMeResponse> =>
  api.get("/panel/auth/me").then((r) => r.data.data);

export const panelGetPermissions = (): Promise<string[]> =>
  api.get("/panel/auth/permissions").then((r) => r.data?.data?.permissions ?? []);

export const panelLogout = () =>
  api.post("/panel/auth/logout").then((r) => r.data);

// ============================================================
// LEGACY COMPATIBILITY — eski komponentlar uchun
// Bu funksiyalar to'g'ri endpointlarga yo'naltirilgan
// ============================================================

// Landing page public endpointlar uchun — ular news endpointdan foydalanadi
export const fetchAnnouncements = (): Promise<NewsItem[]> =>
  api.get("/news").then((r) => r.data?.data?.news ?? r.data?.data ?? []);

export const fetchAnnouncementItem = (id: number): Promise<NewsItem> =>
  api.get(`/news/${id}`).then((r) => r.data?.data ?? r.data);

// Public results — hozircha bo'sh array qaytaradi (backend da public endpoint yo'q)
export interface ResultEntry {
  rank: number;
  name: string;
  country: string;
  score: number;
  medal: string;
  subject: string;
}
export const fetchResults = (_subject?: string): Promise<ResultEntry[]> =>
  Promise.resolve([]);

// Public olympiads — news kabi public endpoint bor
export const fetchOlympiads = (): Promise<Olympiad[]> =>
  api.get("/news").then(() => []).catch(() => []);

// ============================================================
// ADMIN FUNKSIYALAR — superadmin-api.ts va admin-api.ts ishlatilsin
// Bu yerda faqat admin/olympiads/[id] sahifasi uchun kerak bo'lganlar
// ============================================================
export const adminFetchOlympiad = (id: number) =>
  api.get(`/admin/olympiads/${id}`).then((r) => r.data);
export const adminUpdateOlympiad = (id: number, data: Partial<Olympiad>) =>
  api.put(`/admin/olympiads/${id}`, data).then((r) => r.data);

// Superadmin questions endpoint orqali (admin uchun ham ishlaydi)
export const adminFetchOlympiadQuestions = (olympiadId: number) =>
  api.get(`/superadmin/questions/by-source`, { params: { source_type: "olympiad", source_id: olympiadId } }).then((r) => r.data);
export const adminCreateOlympiadQuestion = (data: Record<string, unknown>) =>
  api.post(`/superadmin/questions`, data).then((r) => r.data);
export const adminUpdateOlympiadQuestion = (id: number, data: Record<string, unknown>) =>
  api.put(`/superadmin/questions/${id}`, data).then((r) => r.data);
export const adminDeleteOlympiadQuestion = (id: number) =>
  api.delete(`/superadmin/questions/${id}`).then((r) => r.data);

// Admin mock exam funksiyalar — admin-api.ts ga ko'chirilishi kerak
export const adminFetchMockExams = (params?: Record<string, unknown>) =>
  api.get("/admin/mock-tests", { params }).then((r) => r.data);
export const adminFetchMockExam = (id: number | string) =>
  api.get(`/admin/mock-tests/${id}`).then((r) => r.data?.data ?? r.data);
export const adminCreateMockExam = (data: Record<string, unknown>) =>
  api.post("/admin/mock-tests", data).then((r) => r.data);
export const adminUpdateMockExam = (id: number | string, data: Record<string, unknown>) =>
  api.put(`/admin/mock-tests/${id}`, data).then((r) => r.data);
export const adminDeleteMockExam = (id: number | string) =>
  api.delete(`/admin/mock-tests/${id}`).then((r) => r.data);

// Mock questions — superadmin endpoint orqali
export const adminFetchMockQuestions = (examId: number | string) =>
  api.get(`/superadmin/questions/by-source`, { params: { source_type: "mock_test", source_id: examId } }).then((r) => r.data?.data ?? r.data);
export const adminCreateMockQuestion = (examId: number | string, data: Record<string, unknown>) =>
  api.post(`/superadmin/questions`, { ...data, source_type: "mock_test", source_id: Number(examId) }).then((r) => r.data);
export const adminUpdateMockQuestion = (id: number, data: Record<string, unknown>) =>
  api.put(`/superadmin/questions/${id}`, data).then((r) => r.data);
export const adminDeleteMockQuestion = (id: number) =>
  api.delete(`/superadmin/questions/${id}`).then((r) => r.data);

// Mock sections — hozircha yo'q, bo'sh array qaytaradi
export const adminFetchMockExamSections = (_examId: number) =>
  Promise.resolve({ data: [] });
export const adminCreateMockExamSection = (_examId: number, _data: unknown) =>
  Promise.resolve({ data: null });
export const adminUpdateMockExamSection = (_sectionId: number, _data: unknown) =>
  Promise.resolve({ data: null });
export const adminDeleteMockExamSection = (_sectionId: number) =>
  Promise.resolve({ data: null });

// Rasch config
export const adminFetchRaschConfig = (_examId: number | string) =>
  Promise.resolve({ assessment_method: "simple", config: null, scales: [] });
export const adminUpdateRaschConfig = (_examId: number | string, _data: unknown) =>
  Promise.resolve({ data: null });
export const adminUpdateRaschScales = (_examId: number | string, _data: unknown) =>
  Promise.resolve({ data: null });

// Mock exam participants/results
export const adminFetchMockExamParticipants = (id: number, params?: Record<string, unknown>) =>
  api.get(`/superadmin/results`, { params: { ...params, type: "mock_test" } }).then((r) => r.data);
export const adminFetchMockExamResults = (id: number, params?: Record<string, unknown>) =>
  api.get(`/superadmin/results`, { params: { ...params, type: "mock_test" } }).then((r) => r.data);
export const adminRecalculateMockResults = (_id: number) =>
  Promise.resolve({ data: null });

// Olympiad participants/results
export const adminFetchOlympiadParticipants = (id: number, params?: Record<string, unknown>) =>
  api.get(`/superadmin/results`, { params: { ...params, type: "olympiad" } }).then((r) => r.data);
export const adminFetchOlympiadResults = (id: number, params?: Record<string, unknown>) =>
  api.get(`/superadmin/results`, { params: { ...params, type: "olympiad" } }).then((r) => r.data);

// Certificate config
export const adminFetchCertificateConfig = (_type: string, _id: number) =>
  Promise.resolve({ data: null });
export const adminUpdateCertificateConfig = (_type: string, _id: number, _data: unknown) =>
  Promise.resolve({ data: null });

// Type exports for backward compatibility
export type Announcement = NewsItem;
export interface Question {
  id: number;
  text: string;
  image: string;
  type?: string;
  options: { id?: number; text: string; image?: string; is_correct: boolean; order_num: number }[];
  correctIdx?: number;
  points: number;
  orderNum?: number;
  order_num?: number;
}
export type OlympiadQuestion = Question;
export interface MockExamSection {
  id: number;
  mock_exam_id: number;
  title: string;
  description: string;
  order_num: number;
  created_at: string;
}
export interface MockOption {
  id?: number;
  content: string;
  is_correct: boolean;
  order_num: number;
}
export interface MockQuestion {
  id: number;
  mock_exam_id: number;
  section_id: number | null;
  title: string;
  content: string;
  type: string;
  points: number;
  order_num: number;
  options: MockOption[];
}
export interface RaschConfig {
  assessment_method: string;
  config?: unknown;
  scales?: unknown[];
}
export type RaschScale = { raw_score: number; theta: number; scaled_score: number; level: string };
