package usermocktests

import (
	"time"

	"github.com/nextolympservice/go-backend/internal/models"
)

type ListParams struct {
	Status   string `form:"status"`
	Subject  string `form:"subject"`
	Grade    int    `form:"grade"`
	Language string `form:"language"`
	Page     int    `form:"page,default=1"`
	PageSize int    `form:"page_size,default=20"`
}

type MockTestResponse struct {
	ID                 uint      `json:"id"`
	Title              string    `json:"title"`
	Slug               string    `json:"slug"`
	Description        string    `json:"description"`
	Subject            string    `json:"subject"`
	Grade              int       `json:"grade"`
	Language           string    `json:"language"`
	DurationMins       int       `json:"duration_minutes"`
	TotalQuestions     int       `json:"total_questions"`
	ScoringType        string    `json:"scoring_type"`
	ScalingFormulaType string    `json:"scaling_formula_type,omitempty"`
	Status             string    `json:"status"`
	IsPaid             bool      `json:"is_paid"`
	Price              *float64  `json:"price,omitempty"`
	CreatedAt          time.Time `json:"created_at"`
}

type PaginatedMockTests struct {
	Data       []MockTestResponse `json:"data"`
	Total      int64              `json:"total"`
	Page       int                `json:"page"`
	PageSize   int                `json:"page_size"`
	TotalPages int                `json:"total_pages"`
}

type RegistrationResponse struct {
	ID         uint      `json:"id"`
	MockTestID uint      `json:"mock_test_id"`
	Status     string    `json:"status"`
	JoinedAt   time.Time `json:"joined_at"`
}

func ToMockTestResponse(m *models.MockTest) MockTestResponse {
	return MockTestResponse{
		ID:                 m.ID,
		Title:              m.Title,
		Slug:               m.Slug,
		Description:        m.Description,
		Subject:            m.Subject,
		Grade:              m.Grade,
		Language:           m.Language,
		DurationMins:       m.DurationMins,
		TotalQuestions:     m.TotalQuestions,
		ScoringType:        m.ScoringType,
		ScalingFormulaType: m.ScalingFormulaType,
		Status:             string(m.Status),
		IsPaid:             m.IsPaid,
		Price:              m.Price,
		CreatedAt:          m.CreatedAt,
	}
}
