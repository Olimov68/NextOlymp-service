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
}

// --- MockTest DTOs ---

type CreateMockTestRequest struct {
	Title              string   `json:"title" binding:"required,min=3,max=300"`
	Description        string   `json:"description"`
	Subject            string   `json:"subject" binding:"required"`
	Grade              int      `json:"grade"`
	Language           string   `json:"language" binding:"required"`
	DurationMins       int      `json:"duration_minutes" binding:"required,min=1"`
	TotalQuestions     int      `json:"total_questions"`
	ScoringType        string   `json:"scoring_type"`          // simple | rasch
	ScalingFormulaType string   `json:"scaling_formula_type"`  // none | prop_93_65 | prop_63_65
	Status             string   `json:"status"`
	IsPaid             bool     `json:"is_paid"`
	Price              *float64 `json:"price"`
}

type UpdateMockTestRequest struct {
	Title              *string  `json:"title"`
	Description        *string  `json:"description"`
	Subject            *string  `json:"subject"`
	Grade              *int     `json:"grade"`
	Language           *string  `json:"language"`
	DurationMins       *int     `json:"duration_minutes"`
	TotalQuestions     *int     `json:"total_questions"`
	ScoringType        *string  `json:"scoring_type"`          // simple | rasch
	ScalingFormulaType *string  `json:"scaling_formula_type"`  // none | prop_93_65 | prop_63_65
	Status             *string  `json:"status"`
	IsPaid             *bool    `json:"is_paid"`
	Price              *float64 `json:"price"`
}

type TestListParams struct {
	Type     string `form:"type"` // olympiad | mock_test
	Status   string `form:"status"`
	Subject  string `form:"subject"`
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
	CreatedAt      time.Time  `json:"created_at"`
}

type MockTestResponse struct {
	ID                 uint      `json:"id"`
	Title              string    `json:"title"`
	Slug               string    `json:"slug"`
	Subject            string    `json:"subject"`
	Grade              int       `json:"grade"`
	Language           string    `json:"language"`
	DurationMins       int       `json:"duration_minutes"`
	TotalQuestions     int       `json:"total_questions"`
	ScoringType        string    `json:"scoring_type"`
	ScalingFormulaType string    `json:"scaling_formula_type"`
	Status             string    `json:"status"`
	IsPaid             bool      `json:"is_paid"`
	Price              *float64  `json:"price,omitempty"`
	CreatedAt          time.Time `json:"created_at"`
}

func ToOlympiadResponse(o *models.Olympiad) OlympiadResponse {
	return OlympiadResponse{
		ID: o.ID, Title: o.Title, Slug: o.Slug, Subject: o.Subject,
		Grade: o.Grade, Language: o.Language, StartTime: o.StartTime,
		EndTime: o.EndTime, DurationMins: o.DurationMins, TotalQuestions: o.TotalQuestions,
		Status: string(o.Status), IsPaid: o.IsPaid, Price: o.Price, CreatedAt: o.CreatedAt,
	}
}

func ToMockTestResponse(m *models.MockTest) MockTestResponse {
	return MockTestResponse{
		ID: m.ID, Title: m.Title, Slug: m.Slug, Subject: m.Subject,
		Grade: m.Grade, Language: m.Language, DurationMins: m.DurationMins,
		TotalQuestions: m.TotalQuestions, ScoringType: m.ScoringType,
		ScalingFormulaType: m.ScalingFormulaType,
		Status: string(m.Status), IsPaid: m.IsPaid, Price: m.Price, CreatedAt: m.CreatedAt,
	}
}
