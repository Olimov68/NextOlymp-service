package samocktests

import (
	"time"

	"github.com/nextolympservice/go-backend/internal/models"
)

type CreateRequest struct {
	Title          string   `json:"title" binding:"required,min=3,max=300"`
	Description    string   `json:"description"`
	Subject        string   `json:"subject" binding:"required,min=1,max=100"`
	Grade          int      `json:"grade"`
	Language       string   `json:"language"`
	StartTime      *string  `json:"start_time"`
	EndTime        *string  `json:"end_time"`
	DurationMins   int      `json:"duration_minutes" binding:"required,min=1"`
	TotalQuestions int      `json:"total_questions"`
	Rules          string   `json:"rules"`
	ScoringType    string   `json:"scoring_type"`
	Status         string   `json:"status"`
	IsPaid         bool     `json:"is_paid"`
	Price          *float64 `json:"price"`

	// Media
	BannerURL string `json:"banner_url"`
	IconURL   string `json:"icon_url"`

	// Registration
	RegistrationStartTime *string `json:"registration_start_time"`
	RegistrationEndTime   *string `json:"registration_end_time"`
	MaxSeats              int     `json:"max_seats"`

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

type UpdateRequest struct {
	Title          *string  `json:"title"`
	Description    *string  `json:"description"`
	Subject        *string  `json:"subject"`
	Grade          *int     `json:"grade"`
	Language       *string  `json:"language"`
	StartTime      *string  `json:"start_time"`
	EndTime        *string  `json:"end_time"`
	DurationMins   *int     `json:"duration_minutes"`
	TotalQuestions *int     `json:"total_questions"`
	Rules          *string  `json:"rules"`
	ScoringType    *string  `json:"scoring_type"`
	Status         *string  `json:"status"`
	IsPaid         *bool    `json:"is_paid"`
	Price          *float64 `json:"price"`

	// Media
	BannerURL *string `json:"banner_url"`
	IconURL   *string `json:"icon_url"`

	// Registration
	RegistrationStartTime *string `json:"registration_start_time"`
	RegistrationEndTime   *string `json:"registration_end_time"`
	MaxSeats              *int    `json:"max_seats"`

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

type ListParams struct {
	Status   string `form:"status"`
	Subject  string `form:"subject"`
	Grade    int    `form:"grade"`
	Language string `form:"language"`
	IsPaid   *bool  `form:"is_paid"`
	Search   string `form:"search"`
	Page     int    `form:"page,default=1"`
	PageSize int    `form:"page_size,default=20"`
}

type MockTestResponse struct {
	ID             uint       `json:"id"`
	Title          string     `json:"title"`
	Slug           string     `json:"slug"`
	Description    string     `json:"description"`
	Subject        string     `json:"subject"`
	Grade          int        `json:"grade"`
	Language       string     `json:"language"`
	StartTime      *time.Time `json:"start_time,omitempty"`
	EndTime        *time.Time `json:"end_time,omitempty"`
	DurationMins   int        `json:"duration_minutes"`
	TotalQuestions int        `json:"total_questions"`
	Rules          string     `json:"rules"`
	ScoringType    string     `json:"scoring_type"`
	Status         string     `json:"status"`
	IsPaid         bool       `json:"is_paid"`
	Price          *float64   `json:"price,omitempty"`
	CreatedByID    *uint      `json:"created_by_id,omitempty"`

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
	UpdatedAt time.Time `json:"updated_at"`
}

func ToResponse(m *models.MockTest) MockTestResponse {
	return MockTestResponse{
		ID:                    m.ID,
		Title:                 m.Title,
		Slug:                  m.Slug,
		Description:           m.Description,
		Subject:               m.Subject,
		Grade:                 m.Grade,
		Language:              m.Language,
		StartTime:             m.StartTime,
		EndTime:               m.EndTime,
		DurationMins:          m.DurationMins,
		TotalQuestions:        m.TotalQuestions,
		Rules:                 m.Rules,
		ScoringType:           m.ScoringType,
		Status:                string(m.Status),
		IsPaid:                m.IsPaid,
		Price:                 m.Price,
		CreatedByID:           m.CreatedByID,
		BannerURL:             m.BannerURL,
		IconURL:               m.IconURL,
		RegistrationStartTime: m.RegistrationStartTime,
		RegistrationEndTime:   m.RegistrationEndTime,
		MaxSeats:              m.MaxSeats,
		ShuffleQuestions:      m.ShuffleQuestions,
		ShuffleAnswers:        m.ShuffleAnswers,
		AutoSubmit:            m.AutoSubmit,
		AllowRetake:           m.AllowRetake,
		ShowResultImmediately: m.ShowResultImmediately,
		GiveCertificate:       m.GiveCertificate,
		ManualReview:          m.ManualReview,
		AdminApproval:         m.AdminApproval,
		CreatedAt:             m.CreatedAt,
		UpdatedAt:             m.UpdatedAt,
	}
}
