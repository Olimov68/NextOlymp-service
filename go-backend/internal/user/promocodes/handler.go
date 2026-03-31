package promocodes

import (
	"math"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/nextolympservice/go-backend/internal/models"
	"github.com/nextolympservice/go-backend/pkg/response"
	"gorm.io/gorm"
)

type Handler struct {
	db *gorm.DB
}

func NewHandler(db *gorm.DB) *Handler {
	return &Handler{db: db}
}

// ApplyPromoRequest — promo kodni tekshirish so'rovi
type ApplyPromoRequest struct {
	Code       string  `json:"code" binding:"required"`
	Amount     float64 `json:"amount" binding:"required,min=0"`
	SourceType string  `json:"source_type"` // olympiad | mock_test
	SourceID   uint    `json:"source_id"`
}

// ApplyPromoResponse — promo kod natijasi
type ApplyPromoResponse struct {
	Valid           bool    `json:"valid"`
	PromoCodeID     uint    `json:"promo_code_id,omitempty"`
	Code            string  `json:"code,omitempty"`
	DiscountType    string  `json:"discount_type,omitempty"`    // percent | fixed
	DiscountPercent float64 `json:"discount_percent,omitempty"` // foizli chegirma qiymati
	DiscountFixed   float64 `json:"discount_fixed,omitempty"`   // summali chegirma qiymati
	DiscountAmount  float64 `json:"discount_amount,omitempty"`  // hisoblangan chegirma summasi
	FinalAmount     float64 `json:"final_amount,omitempty"`     // yakuniy to'lov summasi
	Message         string  `json:"message"`
}

// ApplyPromo — promo kodni tekshiradi va chegirmani hisoblaydi
// Bu endpoint faqat tekshiradi, to'lovda ishlatish alohida
func (h *Handler) ApplyPromo(c *gin.Context) {
	uid, _ := c.Get("userID")
	userID := uid.(uint)

	var req ApplyPromoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, err)
		return
	}

	code := strings.ToUpper(strings.TrimSpace(req.Code))

	// 1. Promo kodni topish
	var promo models.PromoCode
	if err := h.db.Where("UPPER(code) = ?", code).First(&promo).Error; err != nil {
		response.Success(c, http.StatusOK, "Promo kod", ApplyPromoResponse{
			Valid:   false,
			Message: "Promo kod topilmadi",
		})
		return
	}

	// 2. Status tekshirish
	if promo.Status != models.PromoCodeStatusActive {
		response.Success(c, http.StatusOK, "Promo kod", ApplyPromoResponse{
			Valid:   false,
			Message: "Bu promo kod faol emas",
		})
		return
	}

	// 3. Muddat tekshirish
	now := time.Now()
	if promo.ValidFrom != nil && now.Before(*promo.ValidFrom) {
		response.Success(c, http.StatusOK, "Promo kod", ApplyPromoResponse{
			Valid:   false,
			Message: "Bu promo kod hali boshlanmagan",
		})
		return
	}
	if promo.ValidUntil != nil && now.After(*promo.ValidUntil) {
		response.Success(c, http.StatusOK, "Promo kod", ApplyPromoResponse{
			Valid:   false,
			Message: "Bu promo kod muddati tugagan",
		})
		return
	}

	// 4. Umumiy ishlatish limiti
	if promo.MaxUsageCount > 0 && promo.UsedCount >= promo.MaxUsageCount {
		response.Success(c, http.StatusOK, "Promo kod", ApplyPromoResponse{
			Valid:   false,
			Message: "Bu promo kod limiti tugagan",
		})
		return
	}

	// 5. Per-user limit tekshirish
	var userUsageCount int64
	h.db.Model(&models.PromoCodeUsage{}).
		Where("promo_code_id = ? AND user_id = ?", promo.ID, userID).
		Count(&userUsageCount)
	if promo.PerUserLimit > 0 && int(userUsageCount) >= promo.PerUserLimit {
		response.Success(c, http.StatusOK, "Promo kod", ApplyPromoResponse{
			Valid:   false,
			Message: "Siz bu promo kodni ishlatish limitiga yetdingiz",
		})
		return
	}

	// 6. Source type tekshirish
	if promo.SourceType != "" && promo.SourceType != "all" && req.SourceType != "" {
		if promo.SourceType != req.SourceType {
			response.Success(c, http.StatusOK, "Promo kod", ApplyPromoResponse{
				Valid:   false,
				Message: "Bu promo kod ushbu tur uchun ishlamaydi",
			})
			return
		}
	}

	// 7. Minimum summa tekshirish
	if promo.MinAmount > 0 && req.Amount < promo.MinAmount {
		response.Success(c, http.StatusOK, "Promo kod", ApplyPromoResponse{
			Valid:   false,
			Message: "To'lov summasi promo kod uchun yetarli emas",
		})
		return
	}

	// 8. Chegirmani hisoblash (discount_type ga qarab)
	var discountAmount float64
	discountType := promo.DiscountType
	if discountType == "" {
		discountType = "percent"
	}

	if discountType == "fixed" {
		// Summali chegirma
		discountAmount = promo.DiscountFixed
		if discountAmount > req.Amount {
			discountAmount = req.Amount
		}
	} else {
		// Foizli chegirma
		discountAmount = req.Amount * promo.DiscountPercent / 100
		if promo.MaxDiscount != nil && discountAmount > *promo.MaxDiscount {
			discountAmount = *promo.MaxDiscount
		}
	}

	discountAmount = math.Round(discountAmount*100) / 100
	finalAmount := math.Max(0, req.Amount-discountAmount)
	finalAmount = math.Round(finalAmount*100) / 100

	response.Success(c, http.StatusOK, "Promo kod muvaffaqiyatli", ApplyPromoResponse{
		Valid:           true,
		PromoCodeID:     promo.ID,
		Code:            promo.Code,
		DiscountType:    discountType,
		DiscountPercent: promo.DiscountPercent,
		DiscountFixed:   promo.DiscountFixed,
		DiscountAmount:  discountAmount,
		FinalAmount:     finalAmount,
		Message:         "Promo kod qo'llanildi",
	})
}
