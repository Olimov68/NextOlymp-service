import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Types
export interface Stats {
  id: number;
  countries: number;
  students: number;
  medals: number;
  volunteers: number;
}

export interface Olympiad {
  id: number;
  title: string;
  subject: string;
  description: string;
  price: number;
  status: string;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  _count?: { questions: number };
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
  createdAt: string;
}

export interface NewsItem {
  id: number;
  title: string;
  description: string;
  image: string;
  createdAt: string;
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
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  region: string;
  district: string;
  city: string;
  grade: string;
  country: string;
  role: string;
  createdAt?: string;
}

// Public API
export const fetchStats = () => api.get<Stats>("/api/stats").then((r) => r.data);
export const fetchOlympiads = () => api.get<Olympiad[]>("/api/olympiads").then((r) => r.data);
export const fetchOlympiad = (id: number) => api.get<Olympiad>(`/api/olympiads/${id}`).then((r) => r.data);
export const fetchAnnouncements = () => api.get<Announcement[]>("/api/announcements").then((r) => r.data);
export const fetchAnnouncementItem = (id: number) => api.get<Announcement>(`/api/announcements/${id}`).then((r) => r.data);
export const fetchNews = () => api.get<NewsItem[]>("/api/news").then((r) => r.data);
export const fetchNewsItem = (id: number) => api.get<NewsItem>(`/api/news/${id}`).then((r) => r.data);
export const fetchResults = (subject?: string) =>
  api.get<ResultEntry[]>("/api/results", { params: subject ? { subject } : {} }).then((r) => r.data);
export const fetchUsers = () => api.get<User[]>("/api/users").then((r) => r.data);

// Auth API - login with username
export const login = (username: string, password: string) =>
  api.post("/api/auth/login", { username, password }).then((r) => r.data);

export interface RegisterData {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  region: string;
  district: string;
  city: string;
  grade: string;
}
export const register = (data: RegisterData) =>
  api.post("/api/auth/register", data).then((r) => r.data);
export const getMe = () => api.get<User>("/api/auth/me").then((r) => r.data);
export const updateProfile = (data: Partial<User>) =>
  api.put("/api/auth/profile", data).then((r) => r.data);

// Questions API
export const fetchQuestions = (olympiadId: number) =>
  api.get<Question[]>(`/api/questions/olympiad/${olympiadId}`).then((r) => r.data);
export const createQuestion = (data: Partial<Question> & { olympiadId: number }) =>
  api.post("/api/questions", data).then((r) => r.data);
export const updateQuestion = (id: number, data: Partial<Question>) =>
  api.put(`/api/questions/${id}`, data).then((r) => r.data);
export const deleteQuestion = (id: number) => api.delete(`/api/questions/${id}`).then((r) => r.data);

// Admin CRUD
export const createOlympiad = (data: Partial<Olympiad>) => api.post("/api/olympiads", data).then((r) => r.data);
export const updateOlympiad = (id: number, data: Partial<Olympiad>) =>
  api.put(`/api/olympiads/${id}`, data).then((r) => r.data);
export const deleteOlympiad = (id: number) => api.delete(`/api/olympiads/${id}`).then((r) => r.data);

export const createAnnouncement = (data: Partial<Announcement>) =>
  api.post("/api/announcements", data).then((r) => r.data);
export const updateAnnouncement = (id: number, data: Partial<Announcement>) =>
  api.put(`/api/announcements/${id}`, data).then((r) => r.data);
export const deleteAnnouncement = (id: number) => api.delete(`/api/announcements/${id}`).then((r) => r.data);

export const createNews = (data: Partial<NewsItem>) => api.post("/api/news", data).then((r) => r.data);
export const updateNews = (id: number, data: Partial<NewsItem>) =>
  api.put(`/api/news/${id}`, data).then((r) => r.data);
export const deleteNews = (id: number) => api.delete(`/api/news/${id}`).then((r) => r.data);

export const createResult = (data: {
  userId: number;
  olympiadId: number;
  subject: string;
  score: number;
  medal: string;
  country: string;
}) => api.post("/api/results", data).then((r) => r.data);
export const deleteResult = (id: number) => api.delete(`/api/results/${id}`).then((r) => r.data);

export const updateStats = (data: Partial<Stats>) => api.put("/api/stats", data).then((r) => r.data);
export const deleteUser = (id: number) => api.delete(`/api/users/${id}`).then((r) => r.data);
