package admintests

import (
	"time"

	"github.com/nextolympservice/go-backend/internal/models"
)

// --- Olympiad DTOs ---

type CreateOlympiadRequest struct {
	Title          string     `json:"title" binding:"required,min=3,max=300"`
	Description    string     `json:"description"`
	Subject        string     `json:"subject" binding:"required"`
	Grade          int        `json:"grade"`
	Language       string     `json:"language" binding:"required"`
	StartTime      *time.Time `json:"start_time"`
	EndTime        *time.Time `json:"end_time"`
	DurationMins   int        `json:"duration_minutes" binding:"required,min=1"`
	TotalQuestions int        `json:"total_questions"`
	Rules          string     `json:"rules"`
	Status         string     `json:"status"`
	IsPaid         bool       `json:"is_paid"`
	Price          *float64   `json:"price"`

	// Media
	BannerURL string `json:"banner_url"`
	IconURL   string `json:"icon_url"`

	// Registration
	RegistrationStartTime *time.Time `json:"registration_start_time"`
	RegistrationEndTime   *time.Time `json:"registration_end_time"`
	MaxSeats              int        `json:"max_seats"`

	// Settings
	ShuffleQuestions      bool `json:"shuffle_questions"`
	ShuffleAnswers        bool `json:"shuffle_answers"`
	AutoSubmit            bool `json:"auto_submit"`
	AllowRetake           bool `json:"allow_retake"`
	ShowResultImmediately bool `json:"show_result_immediately"`
	GiveCertificate       bool `json:"give_certificate"`
	ManualReview          bool `json:"manual_review"`
	AdminApproval         bool `json:"admin_approval"`
}

type UpdateOlympiadRequest struct {
	Title          *string    `json:"title"`
	Description    *string    `json:"description"`
	Subject        *string    `json:"subject"`
	Grade          *int       `json:"grade"`
	Language       *string    `json:"language"`
	StartTime      *time.Time `json:"start_time"`
	EndTime        *time.Time `json:"end_time"`
	DurationMins   *int       `json:"duration_minutes"`
	TotalQuestions *int       `json:"total_questions"`
	Rules          *string    `json:"rules"`
	Status         *string    `json:"status"`
	IsPaid         *bool      `json:"is_paid"`
	Price          *float64   `json:"price"`

	// Media
	BannerURL *string `json:"banner_url"`
	IconURL   *string `json:"icon_url"`

	// Registration
	RegistrationStartTime *time.Time `json:"registration_start_time"`
	RegistrationEndTime   *time.Time `json:"registration_end_time"`
	MaxSeats              *int       `json:"max_seats"`

	// Settings
	ShuffleQuestions      *bool `json:"shuffle_questions"`
	ShuffleAnswers        *bool `json:"shuffle_answers"`
	AutoSubmit            *bool `json:"auto_submit"`
	AllowRetake           *bool `json:"allow_retake"`
	ShowResultImmediately *bool `json:"show_result_immediately"`
	GiveCertificate       *bool `json:"give_certificate"`
	ManualReview          *bool `json:"manual_review"`
	AdminApproval         *bool `json:"admin_approval"`
}

// --- MockTest DTOs ---

type CreateMockTestRequest struct {
	Title              string     `json:"title" binding:"required,min=3,max=300"`
	Description        string     `json:"description"`
	Subject            string     `json:"subject" binding:"required"`
	Grade              int        `json:"grade"`
	Language           string     `json:"language" binding:"required"`
	StartTime          *time.Time `json:"start_time"`
	EndTime            *time.Time `json:"end_time"`
	DurationMins       int        `json:"duration_minutes" binding:"required,min=1"`
	TotalQuestions     int        `json:"total_questions"`
	Rules              string     `json:"rules"`
	ScoringType        string     `json:"scoring_type"`          // simple | rasch
	ScalingFormulaType string     `json:"scaling_formula_type"`  // none | prop_93_65 | prop_63_65
	Status             string     `json:"status"`
	IsPaid             bool       `json:"is_paid"`
	Price              *float64   `json:"price"`

	// Media
	BannerURL string `json:"banner_url"`
	IconURL   string `json:"icon_url"`

	// Registration
	RegistrationStartTime *time.Time `json:"registration_start_time"`
	RegistrationEndTime   *time.Time `json:"registration_end_time"`
	MaxSeats              int        `json:"max_seats"`

	// Settings
	ShuffleQuestions      bool `json:"shuffle_questions"`
	ShuffleAnswers        bool `json:"shuffle_answers"`
	AutoSubmit            bool `json:"auto_submit"`
	AllowRetake           bool `json:"allow_retake"`
	ShowResultImmediately bool `json:"show_result_immediately"`
	GiveCertificate       bool `json:"give_certificate"`
	ManualReview          bool `json:"manual_review"`
	AdminApproval         bool `json:"admin_approval"`
}

type UpdateMockTestRequest struct {
	Title              *string    `json:"title"`
	Description        *string    `json:"description"`
	Subject            *string    `json:"subject"`
	Grade              *int       `json:"grade"`
	Language           *string    `json:"language"`
	StartTime          *time.Time `json:"start_time"`
	EndTime            *time.Time `json:"end_time"`
	DurationMins       *int       `json:"duration_minutes"`
	TotalQuestions     *int       `json:"total_questions"`
	Rules              *string    `json:"rules"`
	ScoringType        *string    `json:"scoring_type"`          // simple | rasch
	ScalingFormulaType *string    `json:"scaling_formula_type"`  // none | prop_93_65 | prop_63_65
	Status             *string    `json:"status"`
	IsPaid             *bool      `json:"is_paid"`
	Price              *float64   `json:"price"`

	// Media
	BannerURL *string `json:"banner_url"`
	IconURL   *string `json:"icon_url"`

	// Registration
	RegistrationStartTime *time.Time `json:"registration_start_time"`
	RegistrationEndTime   *time.Time `json:"registration_end_time"`
	MaxSeats              *int       `json:"max_seats"`

	// Settings
	ShuffleQuestions      *bool `json:"shuffle_questions"`
	ShuffleAnswers        *bool `json:"shuffle_answers"`
	AutoSubmit            *bool `json:"auto_submit"`
	AllowRetake           *bool `json:"allow_retake"`
	ShowResultImmediately *bool `json:"show_result_immediately"`
	GiveCertificate       *bool `json:"give_certificate"`
	ManualReview          *bool `json:"manual_review"`
	AdminApproval         *bool `json:"admin_approval"`
}

type TestListParams struct {
	Type     string `form:"type"` // olympiad | mock_test
	Status   string `form:"status"`
	Subject  string `form:"subject"`
	Grade    int    `form:"grade"`
	Language string `form:"language"`
	IsPaid   *bool  `form:"is_paid"`
	Page     int    `form:"page,default=1"`
	PageSize int    `form:"page_size,default=20"`
}

type OlympiadResponse struct {
	ID             uint       `json:"id"`
	Title          string     `json:"title"`
	Slug           string     `json:"slug"`
	Subject        string     `json:"subject"`
	Grade          int        `json:"grade"`
	Language       string     `json:"language"`
	StartTime      *time.Time `json:"start_time,omitempty"`
	EndTime        *time.Time `json:"end_time,omitempty"`
	DurationMins   int        `json:"duration_minutes"`
	TotalQuestions int        `json:"total_questions"`
	Status         string     `json:"status"`
	IsPaid         bool       `json:"is_paid"`
	Price          *float64   `json:"price,omitempty"`

	// Media
	BannerURL string `json:"banner_url"`
	IconURL   string `json:"icon_url"`

	// Registration
	RegistrationStartTime *time.Time `json:"registration_start_time,omitempty"`
	RegistrationEndTime   *time.Time `json:"registration_end_time,omitempty"`
	MaxSeats              int        `json:"max_seats"`

	// Settings
	ShuffleQuestions      bool `json:"shuffle_questions"`
	ShuffleAnswers        bool `json:"shuffle_answers"`
	AutoSubmit            bool `json:"auto_submit"`
	AllowRetake           bool `json:"allow_retake"`
	ShowResultImmediately bool `json:"show_result_immediately"`
	GiveCertificate       bool `json:"give_certificate"`
	ManualReview          bool `json:"manual_review"`
	AdminApproval         bool `json:"admin_approval"`

	CreatedAt time.Time `json:"created_at"`
}

type MockTestResponse struct {
	ID                 uint       `json:"id"`
	Title              string     `json:"title"`
	Slug               string     `json:"slug"`
	Subject            string     `json:"subject"`
	Grade              int        `json:"grade"`
	Language           string     `json:"language"`
	StartTime          *time.Time `json:"start_time,omitempty"`
	EndTime            *time.Time `json:"end_time,omitempty"`
	DurationMins       int        `json:"duration_minutes"`
	TotalQuestions     int        `json:"total_questions"`
	Rules              string     `json:"rules"`
	ScoringType        string     `json:"scoring_type"`
	ScalingFormulaType string     `json:"scaling_formula_type"`
	Status             string     `json:"status"`
	IsPaid             bool       `json:"is_paid"`
	Price              *float64   `json:"price,omitempty"`

	// Media
	BannerURL string `json:"banner_url"`
	IconURL   string `json:"icon_url"`

	// Registration
	RegistrationStartTime *time.Time `json:"registration_start_time,omitempty"`
	RegistrationEndTime   *time.Time `json:"registration_end_time,omitempty"`
	MaxSeats              int        `json:"max_seats"`

	// Settings
	ShuffleQuestions      bool `json:"shuffle_questions"`
	ShuffleAnswers        bool `json:"shuffle_answers"`
	AutoSubmit            bool `json:"auto_submit"`
	AllowRetake           bool `json:"allow_retake"`
	ShowResultImmediately bool `json:"show_result_immediately"`
	GiveCertificate       bool `json:"give_certificate"`
	ManualReview          bool `json:"manual_review"`
	AdminApproval         bool `json:"admin_approval"`

	CreatedAt time.Time `json:"created_at"`
}

func ToOlympiadResponse(o *models.Olympiad) OlympiadResponse {
	return OlympiadResponse{
		ID: o.ID, Title: o.Title, Slug: o.Slug, Subject: o.Subject,
		Grade: o.Grade, Language: o.Language, StartTime: o.StartTime,
		EndTime: o.EndTime, DurationMins: o.DurationMins, TotalQuestions: o.TotalQuestions,
		Status: string(o.Status), IsPaid: o.IsPaid, Price: o.Price,
		BannerURL: o.BannerURL, IconURL: o.IconURL,
		RegistrationStartTime: o.RegistrationStartTime, RegistrationEndTime: o.RegistrationEndTime,
		MaxSeats: o.MaxSeats,
		ShuffleQuestions: o.ShuffleQuestions, ShuffleAnswers: o.ShuffleAnswers,
		AutoSubmit: o.AutoSubmit, AllowRetake: o.AllowRetake,
		ShowResultImmediately: o.ShowResultImmediately, GiveCertificate: o.GiveCertificate,
		ManualReview: o.ManualReview, AdminApproval: o.AdminApproval,
		CreatedAt: o.CreatedAt,
	}
}

func ToMockTestResponse(m *models.MockTest) MockTestResponse {
	return MockTestResponse{
		ID: m.ID, Title: m.Title, Slug: m.Slug, Subject: m.Subject,
		Grade: m.Grade, Language: m.Language, StartTime: m.StartTime, EndTime: m.EndTime,
		DurationMins: m.DurationMins, TotalQuestions: m.TotalQuestions, Rules: m.Rules,
		ScoringType: m.ScoringType, ScalingFormulaType: m.ScalingFormulaType,
		Status: string(m.Status), IsPaid: m.IsPaid, Price: m.Price,
		BannerURL: m.BannerURL, IconURL: m.IconURL,
		RegistrationStartTime: m.RegistrationStartTime, RegistrationEndTime: m.RegistrationEndTime,
		MaxSeats: m.MaxSeats,
		ShuffleQuestions: m.ShuffleQuestions, ShuffleAnswers: m.ShuffleAnswers,
		AutoSubmit: m.AutoSubmit, AllowRetake: m.AllowRetake,
		ShowResultImmediately: m.ShowResultImmediately, GiveCertificate: m.GiveCertificate,
		ManualReview: m.ManualReview, AdminApproval: m.AdminApproval,
		CreatedAt: m.CreatedAt,
	}
}
