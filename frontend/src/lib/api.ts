import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

export const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// 401 interceptor — avtomatik token yangilash
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

      // Check if session was invalidated (another device login)
      const errMsg = error.response?.data?.message || "";
      if (errMsg.includes("Session expired") || errMsg.includes("invalidated")) {
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

// Types
export interface Stats {
  total_users: number;
  total_olympiads: number;
  total_regions: number;
  total_mock_tests: number;
}

export interface Olympiad {
  id: number;
  title: string;
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

export interface Question {
  id: number;
  olympiadId: number;
  text: string;
  image: string;
  options: string[];
  correctIdx: number;
  points: number;
  orderNum: number;
}

export interface Announcement {
  id: number;
  title: string;
  description: string;
  created_at: string;
}

export interface NewsItem {
  id: number;
  title: string;
  description: string;
  image: string;
  created_at: string;
}

export interface ResultEntry {
  rank: number;
  name: string;
  country: string;
  score: number;
  medal: string;
  subject: string;
}

export interface User {
  id: number;
  username: string;
  status: string;
  is_profile_completed: boolean;
  is_telegram_linked: boolean;
  created_at?: string;
}

export interface UserProfile {
  first_name: string;
  last_name: string;
  birth_date: string;
  gender: string;
  region: string;
  district: string;
  school_name: string;
  grade: number;
  photo_url: string;
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

export interface MockExamSection {
  id: number;
  mock_exam_id: number;
  title: string;
  description: string;
  order_num: number;
  created_at: string;
}

export interface RaschConfig {
  assessment_method: string;
  config?: {
    id: number;
    min_theta: number;
    max_theta: number;
    scaling_method: string;
    pass_threshold: number;
    grading_rules?: any;
  };
  scales?: Array<{
    raw_score: number;
    theta: number;
    scaled_score: number;
    level: string;
  }>;
}

export interface MockOption {
  id?: number;
  question_id?: number;
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
  created_at: string;
  updated_at: string;
  options: MockOption[];
}

export interface RaschScale {
  raw_score: number;
  theta: number;
  scaled_score: number;
  level: string;
}

export interface OlympiadQuestion {
  id: number;
  olympiad_id: number;
  text: string;
  image: string;
  type: string;
  points: number;
  order_num: number;
  options: Array<{
    id: number;
    text: string;
    image: string;
    is_correct: boolean;
    order_num: number;
  }>;
  created_at: string;
}

// Public API
export const fetchStats = (): Promise<Stats> =>
  api.get("/stats").then((r) => r.data?.data ?? r.data).catch(() => ({
    total_users: 0,
    total_olympiads: 0,
    total_regions: 14,
    total_mock_tests: 0,
  }));
export const fetchOlympiads = (): Promise<Olympiad[]> => api.get("/olympiads").then((r) => r.data.data);
export const fetchOlympiad = (id: number): Promise<Olympiad> => api.get(`/olympiads/${id}`).then((r) => r.data.data);
export const fetchAnnouncements = (): Promise<Announcement[]> => api.get("/announcements").then((r) => r.data.data);
export const fetchAnnouncementItem = (id: number): Promise<Announcement> => api.get(`/announcements/${id}`).then((r) => r.data.data);
export const fetchNews = (): Promise<NewsItem[]> => api.get("/news").then((r) => r.data.data);
export const fetchNewsItem = (id: number): Promise<NewsItem> => api.get(`/news/${id}`).then((r) => r.data.data);
export const fetchResults = (subject?: string): Promise<ResultEntry[]> =>
  api.get("/results", { params: subject ? { subject } : {} }).then((r) => r.data.data);
export const fetchUsers = (): Promise<User[]> => api.get("/users").then((r) => r.data.data);

// Auth API
export const login = (username: string, password: string): Promise<AuthResponse> =>
  api.post("/auth/login", { username, password }).then((r) => r.data.data);

export interface RegisterData {
  username: string;
  password: string;
  confirm_password: string;
}
export const register = (data: RegisterData): Promise<AuthResponse> =>
  api.post("/auth/register", data).then((r) => r.data.data);

export const refreshTokens = (refresh_token: string): Promise<TokenPair> =>
  api.post("/auth/refresh", { refresh_token }).then((r) => r.data.data);

export const logout = () =>
  api.post("/auth/logout").then((r) => r.data);

export const getMe = (): Promise<MeResponse> =>
  api.get("/auth/me").then((r) => r.data.data);

export const completeProfile = (data: FormData) =>
  api.post("/profile/complete", data).then((r) => r.data.data);

export const updateProfile = (data: Partial<UserProfile>) =>
  api.put("/profile/me", data).then((r) => r.data.data);

export const uploadPhoto = (file: File) => {
  const formData = new FormData();
  formData.append("photo", file);
  return api.post("/profile/photo", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }).then((r) => r.data.data);
};

// Telegram API
export const verifyTelegramCode = (code: string): Promise<void> =>
  api.post("/telegram/verify", { code }).then((r) => r.data);

export const checkTelegramStatus = (): Promise<{ linked: boolean; telegram_username: string }> =>
  api.get("/telegram/status").then((r) => r.data.data);

// Questions API
export const fetchQuestions = (olympiadId: number) =>
  api.get(`/questions/olympiad/${olympiadId}`).then((r) => r.data.data);
export const createQuestion = (data: Partial<Question> & { olympiadId: number }) =>
  api.post("/questions", data).then((r) => r.data.data);
export const updateQuestion = (id: number, data: Partial<Question>) =>
  api.put(`/questions/${id}`, data).then((r) => r.data.data);
export const deleteQuestion = (id: number) => api.delete(`/questions/${id}`).then((r) => r.data.data);

// Admin CRUD
export const createOlympiad = (data: Partial<Olympiad>) => api.post("/olympiads", data).then((r) => r.data.data);
export const updateOlympiad = (id: number, data: Partial<Olympiad>) =>
  api.put(`/olympiads/${id}`, data).then((r) => r.data.data);
export const deleteOlympiad = (id: number) => api.delete(`/olympiads/${id}`).then((r) => r.data.data);

export const createAnnouncement = (data: Partial<Announcement>) =>
  api.post("/announcements", data).then((r) => r.data.data);
export const updateAnnouncement = (id: number, data: Partial<Announcement>) =>
  api.put(`/announcements/${id}`, data).then((r) => r.data.data);
export const deleteAnnouncement = (id: number) => api.delete(`/announcements/${id}`).then((r) => r.data.data);

export const createNews = (data: Partial<NewsItem>) => api.post("/news", data).then((r) => r.data.data);
export const updateNews = (id: number, data: Partial<NewsItem>) =>
  api.put(`/news/${id}`, data).then((r) => r.data.data);
export const deleteNews = (id: number) => api.delete(`/news/${id}`).then((r) => r.data.data);

export const createResult = (data: {
  userId: number;
  olympiadId: number;
  subject: string;
  score: number;
  medal: string;
  country: string;
}) => api.post("/results", data).then((r) => r.data.data);
export const deleteResult = (id: number) => api.delete(`/results/${id}`).then((r) => r.data.data);

export const updateStats = (data: Partial<Stats>) => api.put("/stats", data).then((r) => r.data.data);
export const deleteUser = (id: number) => api.delete(`/users/${id}`).then((r) => r.data.data);

// Admin Olympiad APIs
export const adminFetchOlympiads = (params?: Record<string, any>) =>
  api.get("/admin/olympiads", { params }).then((r) => r.data);
export const adminFetchOlympiad = (id: number) =>
  api.get(`/admin/olympiads/${id}`).then((r) => r.data);
export const adminCreateOlympiad = (data: Partial<Olympiad>) =>
  api.post("/admin/olympiads", data).then((r) => r.data);
export const adminUpdateOlympiad = (id: number, data: Partial<Olympiad>) =>
  api.put(`/admin/olympiads/${id}`, data).then((r) => r.data);
export const adminDeleteOlympiad = (id: number) =>
  api.delete(`/admin/olympiads/${id}`).then((r) => r.data);

// Olympiad Questions (admin)
export const adminFetchOlympiadQuestions = (olympiadId: number) =>
  api.get(`/admin/olympiads/${olympiadId}/questions`).then((r) => r.data);
export const adminCreateOlympiadQuestion = (data: any) =>
  api.post(`/admin/olympiads/${data.olympiad_id}/questions`, data).then((r) => r.data);
export const adminUpdateOlympiadQuestion = (id: number, data: any) =>
  api.put(`/admin/olympiad-questions/${id}`, data).then((r) => r.data);
export const adminDeleteOlympiadQuestion = (id: number) =>
  api.delete(`/admin/olympiad-questions/${id}`).then((r) => r.data);

// Olympiad Participants & Results
export const adminFetchOlympiadParticipants = (id: number, params?: Record<string, any>) =>
  api.get(`/admin/olympiads/${id}/participants`, { params }).then((r) => r.data);
export const adminFetchOlympiadResults = (id: number, params?: Record<string, any>) =>
  api.get(`/admin/olympiads/${id}/results`, { params }).then((r) => r.data);

// Mock Exam APIs
export const adminFetchMockExams = (params?: Record<string, any>) =>
  api.get("/admin/mock-exams", { params }).then((r) => r.data);
export const adminFetchMockExam = (id: number | string) =>
  api.get(`/admin/mock-exams/${id}`).then((r) => r.data?.data ?? r.data);
export const adminCreateMockExam = (data: Partial<MockExam>) =>
  api.post("/admin/mock-exams", data).then((r) => r.data);
export const adminUpdateMockExam = (id: number | string, data: Partial<MockExam>) =>
  api.put(`/admin/mock-exams/${id}`, data).then((r) => r.data);
export const adminDeleteMockExam = (id: number | string) =>
  api.delete(`/admin/mock-exams/${id}`).then((r) => r.data);

// Mock Exam Sections
export const adminFetchMockExamSections = (examId: number) =>
  api.get(`/admin/mock-exams/${examId}/sections`).then((r) => r.data);
export const adminCreateMockExamSection = (examId: number, data: any) =>
  api.post(`/admin/mock-exams/${examId}/sections`, data).then((r) => r.data);
export const adminUpdateMockExamSection = (sectionId: number, data: any) =>
  api.put(`/admin/mock-sections/${sectionId}`, data).then((r) => r.data);
export const adminDeleteMockExamSection = (sectionId: number) =>
  api.delete(`/admin/mock-sections/${sectionId}`).then((r) => r.data);

// Mock Exam Questions
export const adminFetchMockQuestions = (examId: number | string) =>
  api.get(`/admin/mock-exams/${examId}/questions`).then((r) => r.data?.data ?? r.data);
export const adminCreateMockQuestion = (examId: number | string, data: any) =>
  api.post(`/admin/mock-exams/${examId}/questions`, data).then((r) => r.data);
export const adminUpdateMockQuestion = (id: number, data: any) =>
  api.put(`/admin/mock-questions/${id}`, data).then((r) => r.data);
export const adminDeleteMockQuestion = (id: number) =>
  api.delete(`/admin/mock-questions/${id}`).then((r) => r.data);

// Rasch Config
export const adminFetchRaschConfig = (examId: number | string) =>
  api.get(`/admin/mock-exams/${examId}/rasch-config`).then((r) => r.data?.data ?? r.data);
export const adminUpdateRaschConfig = (examId: number | string, data: any) =>
  api.put(`/admin/mock-exams/${examId}/rasch-config`, data).then((r) => r.data);
export const adminUpdateRaschScales = (examId: number | string, data: any) =>
  api.put(`/admin/mock-exams/${examId}/rasch-scales`, data).then((r) => r.data);

// Mock Exam Participants & Results
export const adminFetchMockExamParticipants = (id: number, params?: Record<string, any>) =>
  api.get(`/admin/mock-exams/${id}/participants`, { params }).then((r) => r.data);
export const adminFetchMockExamResults = (id: number, params?: Record<string, any>) =>
  api.get(`/admin/mock-exams/${id}/results`, { params }).then((r) => r.data);
export const adminRecalculateMockResults = (id: number) =>
  api.post(`/admin/mock-exams/${id}/recalculate-results`).then((r) => r.data);

// Certificate Config
export const adminFetchCertificateConfig = (type: "olympiads" | "mock-exams", id: number) =>
  api.get(`/admin/${type}/${id}/certificate-config`).then((r) => r.data);
export const adminUpdateCertificateConfig = (type: "olympiads" | "mock-exams", id: number, data: any) =>
  api.put(`/admin/${type}/${id}/certificate-config`, data).then((r) => r.data);

// ============================================================
// PANEL AUTH API (Admin + SuperAdmin)
// ============================================================
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

export const panelLogin = (username: string, password: string): Promise<PanelLoginResponse> =>
  api.post("/panel/auth/login", { username, password }).then((r) => r.data.data);

export const panelRefreshTokens = (refresh_token: string): Promise<TokenPair> =>
  api.post("/panel/auth/refresh", { refresh_token }).then((r) => r.data.data);

export const panelGetMe = (): Promise<PanelMeResponse> =>
  api.get("/panel/auth/me").then((r) => r.data.data);

export const panelLogout = () =>
  api.post("/panel/auth/logout").then((r) => r.data);

// ============================================================
// SUPERADMIN API
// ============================================================
export const superadminDashboard = () =>
  api.get("/superadmin/dashboard").then((r) => r.data.data);

export const superadminListAdmins = (params?: Record<string, any>) =>
  api.get("/superadmin/admins", { params }).then((r) => r.data.data);

export const superadminListUsers = (params?: Record<string, any>) =>
  api.get("/superadmin/users", { params }).then((r) => r.data.data);

export const superadminListOlympiads = (params?: Record<string, any>) =>
  api.get("/superadmin/olympiads", { params }).then((r) => r.data.data);

export const superadminListMockTests = (params?: Record<string, any>) =>
  api.get("/superadmin/mock-tests", { params }).then((r) => r.data.data);

export const superadminListNews = (params?: Record<string, any>) =>
  api.get("/superadmin/news", { params }).then((r) => r.data.data);

export const superadminSettings = () =>
  api.get("/superadmin/settings").then((r) => r.data.data);
