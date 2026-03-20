import { api } from "./api";
import type {
  AuthResponse,
  MeResponse,
  TokenPair,
  User,
  UserProfile,
  Olympiad,
  MockExam,
  NewsItem,
} from "./api";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BalanceInfo {
  balance: number;
  currency: string;
}

export interface Transaction {
  id: number;
  user_id: number;
  type: string;
  amount: number;
  description: string;
  status: string;
  created_at: string;
}

export interface TransactionsResponse {
  data: Transaction[];
  total: number;
  page: number;
  per_page: number;
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export interface Certificate {
  id: number;
  user_id: number;
  title: string;
  source_type: string;
  source_id: number;
  source_title: string;
  certificate_type: string;
  score: number;
  max_score: number;
  percentage: number;
  scaled_score: number;
  grade: string;
  rank: number;
  verification_code: string;
  certificate_number: string;
  issued_at: string;
  valid_until: string;
  status: string;
  pdf_url: string;
  created_at: string;
}

export interface UserResult {
  id: number;
  user_id: number;
  type: string;
  source_id: number;
  title: string;
  subject: string;
  score: number;
  max_score: number;
  percentage: number;
  status: string;
  started_at: string;
  finished_at: string;
  created_at: string;
}

export interface MockAttempt {
  id: number;
  user_id: number;
  mock_exam_id: number;
  status: string;
  score: number;
  max_score: number;
  percentage: number;
  started_at: string;
  finished_at: string;
  created_at: string;
}

export interface ExamStartResponse {
  attempt_id: number;
  questions: ExamQuestion[];
  duration_minutes: number;
  started_at: string;
}

export interface ExamQuestion {
  id: number;
  title: string;
  content: string;
  type: string;
  points: number;
  order_num: number;
  options: ExamOption[];
}

export interface ExamOption {
  id: number;
  content: string;
  order_num: number;
}

export interface AttemptResult {
  attempt_id: number;
  score: number;
  max_score: number;
  percentage: number;
  status: string;
  started_at: string;
  finished_at: string;
  answers: AnswerResult[];
}

export interface AnswerResult {
  question_id: number;
  selected_option_id: number;
  is_correct: boolean;
  points: number;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export const userLogin = (username: string, password: string): Promise<AuthResponse> =>
  api.post("/auth/login", { username, password }).then((r) => r.data.data);

export const userRegister = (data: {
  username: string;
  password: string;
  confirm_password: string;
}): Promise<AuthResponse> => api.post("/auth/register", data).then((r) => r.data.data);

export const userRefreshTokens = (refresh_token: string): Promise<TokenPair> =>
  api.post("/auth/refresh", { refresh_token }).then((r) => r.data.data);

export const userLogout = () => api.post("/auth/logout").then((r) => r.data);

export const userGetMe = (): Promise<MeResponse> =>
  api.get("/auth/me").then((r) => r.data.data);

// ─── Profile ─────────────────────────────────────────────────────────────────

export const getProfile = (): Promise<UserProfile> =>
  api.get("/profile/me").then((r) => r.data.data);

export const updateProfile = (data: Partial<UserProfile>): Promise<UserProfile> =>
  api.put("/profile/me", data).then((r) => r.data.data);

export const uploadPhoto = (file: File) => {
  const formData = new FormData();
  formData.append("photo", file);
  return api
    .post("/profile/photo", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data.data);
};

// ─── Olympiads ───────────────────────────────────────────────────────────────

export const listOlympiads = (params?: Record<string, any>): Promise<Olympiad[]> =>
  api.get("/user/olympiads", { params }).then((r) => r.data.data ?? r.data);

export const getOlympiad = (id: number): Promise<Olympiad> =>
  api.get(`/user/olympiads/${id}`).then((r) => r.data.data ?? r.data);

export const getMyOlympiads = (): Promise<Olympiad[]> =>
  api.get("/user/olympiads/my").then((r) => r.data.data ?? r.data);

export const joinOlympiad = (id: number) =>
  api.post(`/user/olympiads/${id}/join`).then((r) => r.data);

// ─── Mock Tests ──────────────────────────────────────────────────────────────

export const listMockTests = (params?: Record<string, any>): Promise<MockExam[]> =>
  api.get("/user/mock-tests", { params }).then((r) => r.data.data ?? r.data);

export const getMockTest = (id: number): Promise<MockExam> =>
  api.get(`/user/mock-tests/${id}`).then((r) => r.data.data ?? r.data);

export const getMyMockTests = (): Promise<MockExam[]> =>
  api.get("/user/mock-tests/my").then((r) => r.data.data ?? r.data);

export const joinMockTest = (id: number) =>
  api.post(`/user/mock-tests/${id}/join`).then((r) => r.data);

// ─── Exams ───────────────────────────────────────────────────────────────────

export const startMockTest = (id: number): Promise<ExamStartResponse> =>
  api.post(`/user/exams/mock-tests/${id}/start`).then((r) => r.data.data ?? r.data);

export const submitMockAnswer = (
  attemptId: number,
  data: { question_id: number; option_id?: number | null }
) =>
  api
    .post(`/user/exams/mock-tests/attempts/${attemptId}/answer`, data)
    .then((r) => r.data);

export const finishMockTest = (attemptId: number) =>
  api
    .post(`/user/exams/mock-tests/attempts/${attemptId}/finish`)
    .then((r) => r.data.data ?? r.data);

export const getMockAttemptResult = (attemptId: number): Promise<AttemptResult> =>
  api
    .get(`/user/exams/mock-tests/attempts/${attemptId}/result`)
    .then((r) => r.data.data ?? r.data);

export const getMyMockAttempts = (mockTestId: number): Promise<MockAttempt[]> =>
  api
    .get(`/user/exams/mock-tests/${mockTestId}/my-attempts`)
    .then((r) => r.data.data ?? r.data);

export const startOlympiad = (id: number): Promise<ExamStartResponse> =>
  api.post(`/user/exams/olympiads/${id}/start`).then((r) => r.data.data ?? r.data);

export const submitOlympiadAnswer = (
  attemptId: number,
  questionIdOrData: number | { question_id: number; option_id: number },
  optionId?: number
) => {
  const data =
    typeof questionIdOrData === "number"
      ? { question_id: questionIdOrData, option_id: optionId! }
      : questionIdOrData;
  return api
    .post(`/user/exams/olympiads/attempts/${attemptId}/answer`, data)
    .then((r) => r.data);
};

export const finishOlympiad = (attemptId: number) =>
  api
    .post(`/user/exams/olympiads/attempts/${attemptId}/finish`)
    .then((r) => r.data.data ?? r.data);

export const getOlympiadAttemptResult = (attemptId: number): Promise<AttemptResult> =>
  api
    .get(`/user/exams/olympiads/attempts/${attemptId}/result`)
    .then((r) => r.data.data ?? r.data);

// ─── Change Password ────────────────────────────────────────────────────────

export const changePassword = (data: { current_password: string; new_password: string }) =>
  api.put("/profile/password", data).then((r) => r.data);

// ─── Balance ─────────────────────────────────────────────────────────────────

export const getBalance = (): Promise<BalanceInfo> =>
  api.get("/user/balance").then((r) => r.data.data ?? r.data);

export const getTransactions = (params?: {
  page?: number;
  per_page?: number;
}): Promise<TransactionsResponse> =>
  api.get("/user/balance/transactions", { params }).then((r) => r.data);

export interface TopUpResponse {
  payment_id: number;
  amount: number;
  transaction_id: string;
  status: string;
  checkout_url: string;
  payme: {
    merchant_id: string;
    amount: number;
    order_id: number;
    checkout_url: string;
  };
}

export const topUp = (amount: number): Promise<TopUpResponse> =>
  api.post("/user/balance/topup", { amount }).then((r) => r.data.data ?? r.data);

// ─── Promo Code ─────────────────────────────────────────────────────────────

export interface PromoApplyResponse {
  valid: boolean;
  promo_code_id: number;
  code: string;
  discount_type: string;
  discount_percent: number;
  discount_fixed: number;
  discount_amount: number;
  final_amount: number;
  message: string;
}

export const applyPromoCode = (data: {
  code: string;
  amount?: number;
  source_type?: string;
}): Promise<PromoApplyResponse> =>
  api.post("/user/balance/promo-code/apply", data).then((r) => r.data.data ?? r.data);

// ─── Leaderboard ────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  rank: number;
  user_id: number;
  username: string;
  full_name: string;
  first_name: string;
  last_name: string;
  region: string;
  score: number;
  correct: number;
  total: number;
  percentage: number;
  medal: string;
}

export interface MyRankInfo {
  rank: number;
  score: number;
  correct: number;
  total: number;
  percentage: number;
  total_participants: number;
}

export const getLeaderboard = (params?: {
  subject?: string;
  region?: string;
  period?: string;
  page?: number;
  limit?: number;
}): Promise<{ data: LeaderboardEntry[]; total: number }> =>
  api.get("/user/leaderboard", { params }).then((r) => r.data.data ?? r.data);

export const getMyRank = (params?: {
  subject?: string;
  region?: string;
  period?: string;
}): Promise<MyRankInfo> =>
  api.get("/user/leaderboard/my-rank", { params }).then((r) => r.data.data ?? r.data);

// ─── Notifications ───────────────────────────────────────────────────────────

export const listNotifications = (params?: {
  page?: number;
  per_page?: number;
}): Promise<Notification[]> =>
  api.get("/user/notifications", { params }).then((r) => r.data.data ?? r.data);

export const markAsRead = (id: number) =>
  api.patch(`/user/notifications/${id}/read`).then((r) => r.data);

export const markAllAsRead = () =>
  api.post("/user/notifications/read-all").then((r) => r.data);

export const getUnreadCount = (): Promise<number> =>
  api.get("/user/notifications/unread-count").then((r) => r.data.data?.count ?? r.data.count ?? 0);

export const deleteNotification = (id: number) =>
  api.delete(`/user/notifications/${id}`).then((r) => r.data);

// ─── Results ─────────────────────────────────────────────────────────────────

export const getMyResults = (params?: Record<string, any>): Promise<UserResult[]> =>
  api.get("/user/results", { params }).then((r) => r.data.data ?? r.data);

export const getMockTestResults = (params?: Record<string, any>): Promise<UserResult[]> =>
  api.get("/user/results/mock-tests", { params }).then((r) => r.data.data ?? r.data);

export const getOlympiadResults = (params?: Record<string, any>): Promise<UserResult[]> =>
  api.get("/user/results/olympiads", { params }).then((r) => r.data.data ?? r.data);

// ─── Devices ────────────────────────────────────────────────────────────────

export interface DeviceSession {
  id: number;
  device_name: string;
  browser: string;
  os: string;
  device_type: string;
  ip_address: string;
  location: string;
  is_active: boolean;
  is_current: boolean;
  last_active_at: string;
  created_at: string;
}

export const listDevices = (): Promise<{ devices: DeviceSession[]; total: number }> =>
  api.get("/user/devices").then((r) => r.data.data ?? r.data);

export const getCurrentDevice = (): Promise<DeviceSession> =>
  api.get("/user/devices/current").then((r) => r.data.data ?? r.data);

export const logoutDevice = (id: number) =>
  api.delete(`/user/devices/${id}`).then((r) => r.data);

export const logoutAllOtherDevices = (): Promise<{ logged_out_count: number }> =>
  api.post("/user/devices/logout-others").then((r) => r.data.data ?? r.data);

export const logoutAllDevices = () =>
  api.post("/user/devices/logout-all").then((r) => r.data);

// ─── Notification Preferences ───────────────────────────────────────────────

export interface NotificationPreferences {
  olympiads: boolean;
  payments: boolean;
  news: boolean;
  mock_tests: boolean;
  results: boolean;
  certificates: boolean;
  leaderboard: boolean;
  promotions: boolean;
}

export interface NotificationCategory {
  key: string;
  label: string;
  description: string;
}

export const getNotificationPreferences = (): Promise<NotificationPreferences> =>
  api.get("/user/notifications/preferences").then((r) => r.data.data ?? r.data);

export const updateNotificationPreferences = (data: Partial<NotificationPreferences>): Promise<NotificationPreferences> =>
  api.put("/user/notifications/preferences", data).then((r) => r.data.data ?? r.data);

export const getNotificationCategories = (): Promise<NotificationCategory[]> =>
  api.get("/user/notifications/categories").then((r) => r.data.data ?? r.data);

// ─── News ────────────────────────────────────────────────────────────────────

export async function listNews(params?: { page?: number; page_size?: number; type?: string }) {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.page_size) query.set('page_size', String(params.page_size));
  if (params?.type) query.set('type', params.type);
  const res = await api.get(`/user/news?${query}`);
  const d = res.data.data;
  // Pagination response: {data: [...], total, page} yoki to'g'ridan-to'g'ri array
  if (d && Array.isArray(d.data)) return d.data;
  if (Array.isArray(d)) return d;
  return [];
}

export async function getNewsDetail(id: number | string) {
  const res = await api.get(`/user/news/${id}`);
  return res.data.data;
}

// ─── Certificates ────────────────────────────────────────────────────────────

export const listCertificates = (): Promise<Certificate[]> =>
  api.get("/user/certificates").then((r) => r.data.data ?? r.data);

export const getCertificate = (id: number): Promise<Certificate> =>
  api.get(`/user/certificates/${id}`).then((r) => r.data.data ?? r.data);

export const downloadMyCertificatePDF = async (id: number) => {
  const res = await api.get(`/user/certificates/${id}/download`, {
    responseType: "blob",
  });
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `certificate_${id}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

// ─── AI Analysis ──────────────────────────────────────────────────────────────

export interface AIQuestionReview {
  question_num: number;
  question_text: string;
  your_answer: string;
  correct_answer: string;
  explanation: string;
}

export interface AIAnalysisResult {
  overall_grade: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  question_analysis: AIQuestionReview[];
  recommendations: string[];
  motivation: string;
}

export const getAIAnalysis = (attemptId: number): Promise<AIAnalysisResult> =>
  api.get(`/user/exams/mock-tests/attempts/${attemptId}/ai-analysis`).then((r) => r.data.data ?? r.data);

