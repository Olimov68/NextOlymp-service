package userolympiads

import (
	"time"

	"github.com/nextolympservice/go-backend/internal/models"
	"github.com/nextolympservice/go-backend/pkg/urlutil"
)

type ListParams struct {
	Status   string `form:"status"`
	Subject  string `form:"subject"`
	Grade    int    `form:"grade"`
	Language string `form:"language"`
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
	Status         string     `json:"status"`
	IsPaid         bool       `json:"is_paid"`
	Price          *float64   `json:"price,omitempty"`
	BannerURL      string     `json:"banner_url,omitempty"`
	IconURL        string     `json:"icon_url,omitempty"`
	CreatedAt      time.Time  `json:"created_at"`
}

type RegistrationResponse struct {
	ID         uint      `json:"id"`
	OlympiadID uint      `json:"olympiad_id"`
	Status     string    `json:"status"`
	JoinedAt   time.Time `json:"joined_at"`
}

type PaginatedOlympiads struct {
	Data       []OlympiadResponse `json:"data"`
	Total      int64              `json:"total"`
	Page       int                `json:"page"`
	PageSize   int                `json:"page_size"`
	TotalPages int                `json:"total_pages"`
}

func ToOlympiadResponse(o *models.Olympiad) OlympiadResponse {
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
		Status:         string(o.Status),
		IsPaid:         o.IsPaid,
		Price:          o.Price,
		BannerURL:      urlutil.ToFullURL(o.BannerURL),
		IconURL:        urlutil.ToFullURL(o.IconURL),
		CreatedAt:      o.CreatedAt,
	}
}
