package promocodes

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/nextolympservice/go-backend/internal/models"
	"github.com/nextolympservice/go-backend/pkg/response"
	"gorm.io/gorm"
)

type Handler struct {
	repo *Repository
	db   *gorm.DB
}

func NewHandler(db *gorm.DB) *Handler {
	return &Handler{
		repo: NewRepository(db),
		db:   db,
	}
}

// List — promo kodlar ro'yxati
func (h *Handler) List(c *gin.Context) {
	var params ListPromoCodesParams
	if err := c.ShouldBindQuery(&params); err != nil {
		response.ValidationError(c, err)
		return
	}
	if params.Page < 1 {
		params.Page = 1
	}
	if params.Limit < 1 || params.Limit > 100 {
		params.Limit = 20
	}

	list, total, err := h.repo.List(params)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Promo kodlarni olishda xatolik")
		return
	}

	items := make([]PromoCodeResponse, len(list))
	for i, p := range list {
		items[i] = ToPromoCodeResponse(&p)
	}

	response.SuccessWithPagination(c, http.StatusOK, "Promo kodlar", items, params.Page, params.Limit, total)
}

// GetByID — bitta promo kod
func (h *Handler) GetByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Noto'g'ri ID")
		return
	}

	promo, err := h.repo.GetByID(uint(id))
	if err != nil {
		response.Error(c, http.StatusNotFound, "Promo kod topilmadi")
		return
	}

	response.Success(c, http.StatusOK, "Promo kod", ToPromoCodeResponse(promo))
}

// Create — yangi promo kod yaratish
func (h *Handler) Create(c *gin.Context) {
	var req CreatePromoCodeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, err)
		return
	}

	// Kodni tekshirish: unique bo'lishi kerak
	code := strings.ToUpper(strings.TrimSpace(req.Code))
	existing, _ := h.repo.GetByCode(code)
	if existing != nil {
		response.Error(c, http.StatusConflict, "Bu promo kod allaqachon mavjud")
		return
	}

	// Discount type va validatsiya
	discountType := "percent"
	if req.DiscountType != "" {
		if req.DiscountType != "percent" && req.DiscountType != "fixed" {
			response.Error(c, http.StatusBadRequest, "Chegirma turi faqat 'percent' yoki 'fixed' bo'lishi mumkin")
			return
		}
		discountType = req.DiscountType
	}

	if discountType == "percent" {
		if req.DiscountPercent < 0 || req.DiscountPercent > 100 {
			response.Error(c, http.StatusBadRequest, "Chegirma foizi 0-100 orasida bo'lishi kerak")
			return
		}
		if req.DiscountPercent == 0 {
			response.Error(c, http.StatusBadRequest, "Foizli chegirma uchun discount_percent kiritilishi kerak")
			return
		}
	} else {
		if req.DiscountFixed <= 0 {
			response.Error(c, http.StatusBadRequest, "Summali chegirma uchun discount_fixed kiritilishi kerak")
			return
		}
	}

	status := models.PromoCodeStatusActive
	if req.Status != "" {
		status = models.PromoCodeStatus(req.Status)
	}

	perUserLimit := 1
	if req.PerUserLimit > 0 {
		perUserLimit = req.PerUserLimit
	}

	sourceType := "all"
	if req.SourceType != "" {
		sourceType = req.SourceType
	}

	promo := &models.PromoCode{
		Code:            code,
		Description:     req.Description,
		DiscountType:    discountType,
		DiscountPercent: req.DiscountPercent,
		DiscountFixed:   req.DiscountFixed,
		MaxUsageCount:   req.MaxUsageCount,
		PerUserLimit:    perUserLimit,
		MinAmount:       req.MinAmount,
		MaxDiscount:     req.MaxDiscount,
		SourceType:      sourceType,
		Status:          status,
	}

	// Parse dates
	if req.ValidFrom != nil {
		t, err := time.Parse(time.RFC3339, *req.ValidFrom)
		if err == nil {
			promo.ValidFrom = &t
		}
	}
	if req.ValidUntil != nil {
		t, err := time.Parse(time.RFC3339, *req.ValidUntil)
		if err == nil {
			promo.ValidUntil = &t
		}
	}

	// CreatedBy
	staffID, exists := c.Get("staff_id")
	if exists {
		sid := staffID.(uint)
		promo.CreatedByID = &sid
	}

	if err := h.repo.Create(promo); err != nil {
		response.Error(c, http.StatusInternalServerError, "Promo kod yaratishda xatolik")
		return
	}

	response.Success(c, http.StatusCreated, "Promo kod yaratildi", ToPromoCodeResponse(promo))
}

// Update — promo kodni yangilash
func (h *Handler) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Noto'g'ri ID")
		return
	}

	promo, err := h.repo.GetByID(uint(id))
	if err != nil {
		response.Error(c, http.StatusNotFound, "Promo kod topilmadi")
		return
	}

	var req UpdatePromoCodeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, err)
		return
	}

	fields := map[string]interface{}{}

	if req.Code != nil {
		code := strings.ToUpper(strings.TrimSpace(*req.Code))
		// Uniqueness check (boshqa promo kodda shu nom bo'lmasin)
		existing, _ := h.repo.GetByCode(code)
		if existing != nil && existing.ID != promo.ID {
			response.Error(c, http.StatusConflict, "Bu promo kod allaqachon mavjud")
			return
		}
		fields["code"] = code
	}
	if req.Description != nil {
		fields["description"] = *req.Description
	}
	if req.DiscountType != nil {
		if *req.DiscountType != "percent" && *req.DiscountType != "fixed" {
			response.Error(c, http.StatusBadRequest, "Chegirma turi faqat 'percent' yoki 'fixed' bo'lishi mumkin")
			return
		}
		fields["discount_type"] = *req.DiscountType
	}
	if req.DiscountPercent != nil {
		if *req.DiscountPercent < 0 || *req.DiscountPercent > 100 {
			response.Error(c, http.StatusBadRequest, "Chegirma foizi 0-100 orasida bo'lishi kerak")
			return
		}
		fields["discount_percent"] = *req.DiscountPercent
	}
	if req.DiscountFixed != nil {
		if *req.DiscountFixed < 0 {
			response.Error(c, http.StatusBadRequest, "Summali chegirma 0 dan katta bo'lishi kerak")
			return
		}
		fields["discount_fixed"] = *req.DiscountFixed
	}
	if req.MaxUsageCount != nil {
		fields["max_usage_count"] = *req.MaxUsageCount
	}
	if req.PerUserLimit != nil {
		fields["per_user_limit"] = *req.PerUserLimit
	}
	if req.MinAmount != nil {
		fields["min_amount"] = *req.MinAmount
	}
	if req.MaxDiscount != nil {
		fields["max_discount"] = *req.MaxDiscount
	}
	if req.ValidFrom != nil {
		t, err := time.Parse(time.RFC3339, *req.ValidFrom)
		if err == nil {
			fields["valid_from"] = t
		}
	}
	if req.ValidUntil != nil {
		t, err := time.Parse(time.RFC3339, *req.ValidUntil)
		if err == nil {
			fields["valid_until"] = t
		}
	}
	if req.SourceType != nil {
		fields["source_type"] = *req.SourceType
	}
	if req.Status != nil {
		fields["status"] = *req.Status
	}

	if len(fields) > 0 {
		if err := h.repo.UpdateFields(uint(id), fields); err != nil {
			response.Error(c, http.StatusInternalServerError, "Promo kodni yangilashda xatolik")
			return
		}
	}

	updated, _ := h.repo.GetByID(uint(id))
	response.Success(c, http.StatusOK, "Promo kod yangilandi", ToPromoCodeResponse(updated))
}

// Delete — promo kodni o'chirish
func (h *Handler) Delete(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Noto'g'ri ID")
		return
	}

	_, err = h.repo.GetByID(uint(id))
	if err != nil {
		response.Error(c, http.StatusNotFound, "Promo kod topilmadi")
		return
	}

	// Ishlatilgan promo kodni o'chirish mumkin emas (deactivate qilish kerak)
	var usageCount int64
	h.db.Model(&models.PromoCodeUsage{}).Where("promo_code_id = ?", id).Count(&usageCount)
	if usageCount > 0 {
		response.Error(c, http.StatusBadRequest, fmt.Sprintf("Bu promo kod %d marta ishlatilgan. O'chirish o'rniga statusni 'inactive' ga o'zgartiring", usageCount))
		return
	}

	if err := h.repo.Delete(uint(id)); err != nil {
		response.Error(c, http.StatusInternalServerError, "Promo kodni o'chirishda xatolik")
		return
	}

	response.Success(c, http.StatusOK, "Promo kod o'chirildi", nil)
}

// GetUsages — promo kod ishlatilish tarixi
func (h *Handler) GetUsages(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Noto'g'ri ID")
		return
	}

	_, err = h.repo.GetByID(uint(id))
	if err != nil {
		response.Error(c, http.StatusNotFound, "Promo kod topilmadi")
		return
	}

	page := 1
	limit := 20
	if p := c.Query("page"); p != "" {
		fmt.Sscanf(p, "%d", &page)
	}
	if l := c.Query("limit"); l != "" {
		fmt.Sscanf(l, "%d", &limit)
	}

	usages, total, err := h.repo.GetUsages(uint(id), page, limit)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Ishlatilish tarixini olishda xatolik")
		return
	}

	items := make([]PromoCodeUsageResponse, len(usages))
	for i, u := range usages {
		item := PromoCodeUsageResponse{
			ID:              u.ID,
			PromoCodeID:     u.PromoCodeID,
			UserID:          u.UserID,
			PaymentID:       u.PaymentID,
			OriginalAmount:  u.OriginalAmount,
			DiscountPercent: u.DiscountPercent,
			DiscountAmount:  u.DiscountAmount,
			FinalAmount:     u.FinalAmount,
			CreatedAt:       u.CreatedAt,
		}
		if u.User != nil {
			item.UserFullName = u.User.Username
		}
		items[i] = item
	}

	response.SuccessWithPagination(c, http.StatusOK, "Ishlatilish tarixi", items, page, limit, total)
}

// Stats — promo kod statistikasi
func (h *Handler) Stats(c *gin.Context) {
	stats, err := h.repo.GetStats()
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Statistikani olishda xatolik")
		return
	}

	response.Success(c, http.StatusOK, "Promo kod statistikasi", stats)
}

// ToggleStatus — promo kodni activate/deactivate qilish
func (h *Handler) ToggleStatus(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Noto'g'ri ID")
		return
	}

	promo, err := h.repo.GetByID(uint(id))
	if err != nil {
		response.Error(c, http.StatusNotFound, "Promo kod topilmadi")
		return
	}

	newStatus := models.PromoCodeStatusActive
	if promo.Status == models.PromoCodeStatusActive {
		newStatus = models.PromoCodeStatusInactive
	}

	h.repo.UpdateFields(uint(id), map[string]interface{}{"status": newStatus})

	promo.Status = newStatus
	response.Success(c, http.StatusOK, "Status yangilandi", ToPromoCodeResponse(promo))
}
