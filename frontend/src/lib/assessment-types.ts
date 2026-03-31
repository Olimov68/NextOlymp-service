export type ExamType = "olympiad" | "mock_test";

export interface AssessmentBase {
  id: number;
  title: string;
  slug: string;
  description: string;
  subject: string;
  grade: number;
  language: string;
  start_time?: string;
  end_time?: string;
  duration_minutes: number;
  total_questions: number;
  rules: string;
  status: string;
  is_paid: boolean;
  price?: number;
  banner_url: string;
  icon_url: string;
  registration_start_time?: string;
  registration_end_time?: string;
  max_seats: number;
  shuffle_questions: boolean;
  shuffle_answers: boolean;
  auto_submit: boolean;
  allow_retake: boolean;
  show_result_immediately: boolean;
  give_certificate: boolean;
  manual_review: boolean;
  admin_approval: boolean;
  min_score_for_certificate: number;
  scoring_rules: string;
  registration_open?: boolean;
  registered_count?: number;
  participants_count?: number;
  created_at: string;
  updated_at: string;
}

export interface OlympiadAssessment extends AssessmentBase {
  exam_type: "olympiad";
}

export interface MockTestAssessment extends AssessmentBase {
  exam_type: "mock_test";
  scoring_type: string;
  scaling_formula_type: string;
}

export type Assessment = OlympiadAssessment | MockTestAssessment;

export interface AssessmentRegistration {
  id: number;
  user_id: number;
  username: string;
  first_name: string;
  last_name: string;
  status: string;
  joined_at: string;
  registered_at?: string;
  user?: {
    id: number;
    full_name: string;
    username: string;
    avatar_url?: string;
  };
}

export interface AssessmentResult {
  id: number;
  user_id: number;
  username: string;
  first_name: string;
  last_name: string;
  score: number;
  max_score: number;
  percentage: number;
  correct: number;
  wrong: number;
  rank?: number;
  time_taken: number;
  status: string;
  // Mock test specific (Rasch)
  theta_score?: number;
  z_score?: number;
  t_score?: number;
  scaled_score?: number;
  grade_label?: string;
  // Optional nested user
  user?: {
    id: number;
    full_name: string;
    username: string;
    avatar_url?: string;
  };
  created_at?: string;
}

export interface AssessmentFormData {
  title: string;
  description: string;
  subject: string;
  grade: number;
  language: string;
  rules: string;
  duration_minutes: number;
  total_questions: number;
  status: string;
  is_paid: boolean;
  price?: number;
  banner_url: string;
  icon_url: string;
  start_time?: string;
  end_time?: string;
  registration_start_time?: string;
  registration_end_time?: string;
  max_seats: number;
  shuffle_questions: boolean;
  shuffle_answers: boolean;
  auto_submit: boolean;
  allow_retake: boolean;
  show_result_immediately: boolean;
  give_certificate: boolean;
  manual_review: boolean;
  admin_approval: boolean;
  // Olympiad specific
  min_score_for_certificate: number;
  scoring_rules: string;
  // Mock test specific
  scoring_type?: string;
  scaling_formula_type?: string;
}

// Status badge helpers
export type AssessmentDisplayStatus =
  | "draft" | "published" | "registration_pending" | "registration_open"
  | "registration_closed" | "upcoming" | "active" | "completed" | "archived";

export function getAssessmentDisplayStatus(assessment: AssessmentBase): AssessmentDisplayStatus {
  const now = new Date();
  if (assessment.status === "draft") return "draft";
  if (assessment.status === "archived") return "archived";

  const regStart = assessment.registration_start_time ? new Date(assessment.registration_start_time) : null;
  const regEnd = assessment.registration_end_time ? new Date(assessment.registration_end_time) : null;
  const examStart = assessment.start_time ? new Date(assessment.start_time) : null;
  const examEnd = assessment.end_time ? new Date(assessment.end_time) : null;

  if (examEnd && now > examEnd) return "completed";
  if (examStart && now >= examStart && (!examEnd || now <= examEnd)) return "active";
  if (regStart && now < regStart) return "registration_pending";
  if (regStart && now >= regStart && (!regEnd || now <= regEnd)) return "registration_open";
  if (regEnd && now > regEnd && (!examStart || now < examStart)) return "registration_closed";
  if (examStart && now < examStart) return "upcoming";

  return "published";
}

export function getStatusBadgeColor(status: AssessmentDisplayStatus): string {
  const colors: Record<AssessmentDisplayStatus, string> = {
    draft: "bg-gray-600",
    published: "bg-blue-600",
    registration_pending: "bg-yellow-600",
    registration_open: "bg-green-600",
    registration_closed: "bg-orange-600",
    upcoming: "bg-purple-600",
    active: "bg-emerald-600",
    completed: "bg-red-600",
    archived: "bg-gray-700",
  };
  return colors[status] || "bg-gray-600";
}

export function getStatusLabel(status: AssessmentDisplayStatus): string {
  const labels: Record<AssessmentDisplayStatus, string> = {
    draft: "Qoralama",
    published: "E'lon qilingan",
    registration_pending: "Ro'yxat hali ochilmagan",
    registration_open: "Ro'yxatdan o'tish ochiq",
    registration_closed: "Ro'yxat yopilgan",
    upcoming: "Tez kunda",
    active: "Faol",
    completed: "Yakunlangan",
    archived: "Arxivlangan",
  };
  return labels[status] || status;
}
