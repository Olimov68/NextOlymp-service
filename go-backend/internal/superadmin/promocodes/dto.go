package promocodes

import (
	"time"

	"github.com/nextolympservice/go-backend/internal/models"
)

// --- Request DTOs ---

type CreatePromoCodeRequest struct {
	Code            string   `json:"code" binding:"required,min=3,max=50"`
	Description     string   `json:"description"`
	DiscountType    string   `json:"discount_type"`                              // percent | fixed (default: percent)
	DiscountPercent float64  `json:"discount_percent"`                           // Foizli chegirma (0-100)
	DiscountFixed   float64  `json:"discount_fixed"`                             // Summali chegirma (UZS)
	MaxUsageCount   int      `json:"max_usage_count"`                            // 0 = cheksiz
	PerUserLimit    int      `json:"per_user_limit"`                             // default 1
	MinAmount       float64  `json:"min_amount"`                                 // minimum to'lov summasi
	MaxDiscount     *float64 `json:"max_discount"`                               // max chegirma summasi (faqat percent uchun)
	ValidFrom       *string  `json:"valid_from"`                                 // ISO 8601 format
	ValidUntil      *string  `json:"valid_until"`                                // ISO 8601 format
	SourceType      string   `json:"source_type"`                                // olympiad | mock_test | all
	Status          string   `json:"status"`                                     // active | inactive
}

type UpdatePromoCodeRequest struct {
	Code            *string  `json:"code"`
	Description     *string  `json:"description"`
	DiscountType    *string  `json:"discount_type"`
	DiscountPercent *float64 `json:"discount_percent"`
	DiscountFixed   *float64 `json:"discount_fixed"`
	MaxUsageCount   *int     `json:"max_usage_count"`
	PerUserLimit    *int     `json:"per_user_limit"`
	MinAmount       *float64 `json:"min_amount"`
	MaxDiscount     *float64 `json:"max_discount"`
	ValidFrom       *string  `json:"valid_from"`
	ValidUntil      *string  `json:"valid_until"`
	SourceType      *string  `json:"source_type"`
	Status          *string  `json:"status"`
}

type ListPromoCodesParams struct {
	Status    string `form:"status"`
	Search    string `form:"search"`
	Page      int    `form:"page,default=1"`
	Limit     int    `form:"limit,default=20"`
	SortBy    string `form:"sort_by"`
	SortOrder string `form:"sort_order"`
}

// --- Response DTOs ---

type PromoCodeResponse struct {
	ID              uint       `json:"id"`
	Code            string     `json:"code"`
	Description     string     `json:"description"`
	DiscountType    string     `json:"discount_type"`
	DiscountPercent float64    `json:"discount_percent"`
	DiscountFixed   float64    `json:"discount_fixed"`
	MaxUsageCount   int        `json:"max_usage_count"`
	UsedCount       int        `json:"used_count"`
	PerUserLimit    int        `json:"per_user_limit"`
	MinAmount       float64    `json:"min_amount"`
	MaxDiscount     *float64   `json:"max_discount,omitempty"`
	ValidFrom       *time.Time `json:"valid_from,omitempty"`
	ValidUntil      *time.Time `json:"valid_until,omitempty"`
	SourceType      string     `json:"source_type"`
	Status          string     `json:"status"`
	CreatedByID     *uint      `json:"created_by_id,omitempty"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}

type PromoCodeUsageResponse struct {
	ID              uint      `json:"id"`
	PromoCodeID     uint      `json:"promo_code_id"`
	UserID          uint      `json:"user_id"`
	PaymentID       *uint     `json:"payment_id,omitempty"`
	OriginalAmount  float64   `json:"original_amount"`
	DiscountPercent float64   `json:"discount_percent"`
	DiscountAmount  float64   `json:"discount_amount"`
	FinalAmount     float64   `json:"final_amount"`
	CreatedAt       time.Time `json:"created_at"`
	UserFullName    string    `json:"user_full_name,omitempty"`
}

type PromoCodeStatsResponse struct {
	TotalCodes      int64   `json:"total_codes"`
	ActiveCodes     int64   `json:"active_codes"`
	TotalUsages     int64   `json:"total_usages"`
	TotalDiscounted float64 `json:"total_discounted"` // Umumiy berilgan chegirma summasi
}

// --- Converters ---

func ToPromoCodeResponse(p *models.PromoCode) PromoCodeResponse {
	return PromoCodeResponse{
		ID:              p.ID,
		Code:            p.Code,
		Description:     p.Description,
		DiscountType:    p.DiscountType,
		DiscountPercent: p.DiscountPercent,
		DiscountFixed:   p.DiscountFixed,
		MaxUsageCount:   p.MaxUsageCount,
		UsedCount:       p.UsedCount,
		PerUserLimit:    p.PerUserLimit,
		MinAmount:       p.MinAmount,
		MaxDiscount:     p.MaxDiscount,
		ValidFrom:       p.ValidFrom,
		ValidUntil:      p.ValidUntil,
		SourceType:      p.SourceType,
		Status:          string(p.Status),
		CreatedByID:     p.CreatedByID,
		CreatedAt:       p.CreatedAt,
		UpdatedAt:       p.UpdatedAt,
	}
}
