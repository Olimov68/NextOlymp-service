package saolympiads

import (
	"time"

	"github.com/nextolympservice/go-backend/internal/models"
)

type CreateRequest struct {
	Title         string   `json:"title" binding:"required,min=3,max=300"`
	Description   string   `json:"description"`
	Subject       string   `json:"subject" binding:"required,min=1,max=100"`
	Grade         int      `json:"grade"`
	Language      string   `json:"language"`
	StartTime     *string  `json:"start_time"`
	EndTime       *string  `json:"end_time"`
	DurationMins  int      `json:"duration_minutes" binding:"required,min=1"`
	TotalQuestions int     `json:"total_questions"`
	Rules         string   `json:"rules"`
	Status        string   `json:"status"`
	IsPaid        bool     `json:"is_paid"`
	Price         *float64 `json:"price"`

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
	Search   string `form:"search"`
	Grade    *int   `form:"grade"`
	Language string `form:"language"`
	IsPaid   *bool  `form:"is_paid"`
	Page     int    `form:"page,default=1"`
	PageSize int    `form:"page_size,default=20"`
}

type OlympiadResponse struct {
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

func ToResponse(o *models.Olympiad) OlympiadResponse {
	return OlympiadResponse{
		ID:             o.ID,
		Title:          o.Title,
		Slug:           o.Slug,
		Description:    o.Description,
		Subject:        o.Subject,
		Grade:          o.Grade,
		Language:       o.Language,
		StartTime:      o.StartTime,
		EndTime:        o.EndTime,
		DurationMins:   o.DurationMins,
		TotalQuestions: o.TotalQuestions,
		Rules:          o.Rules,
		Status:         string(o.Status),
		IsPaid:         o.IsPaid,
		Price:          o.Price,
		CreatedByID:    o.CreatedByID,

		BannerURL: o.BannerURL,
		IconURL:   o.IconURL,

		RegistrationStartTime: o.RegistrationStartTime,
		RegistrationEndTime:   o.RegistrationEndTime,
		MaxSeats:              o.MaxSeats,

		ShuffleQuestions:      o.ShuffleQuestions,
		ShuffleAnswers:        o.ShuffleAnswers,
		AutoSubmit:            o.AutoSubmit,
		AllowRetake:           o.AllowRetake,
		ShowResultImmediately: o.ShowResultImmediately,
		GiveCertificate:       o.GiveCertificate,
		ManualReview:          o.ManualReview,
		AdminApproval:         o.AdminApproval,

		CreatedAt: o.CreatedAt,
		UpdatedAt: o.UpdatedAt,
	}
}
