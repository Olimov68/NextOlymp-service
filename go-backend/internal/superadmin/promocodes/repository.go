package promocodes

import (
	"strings"

	"github.com/nextolympservice/go-backend/internal/models"
	"gorm.io/gorm"
)

type Repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) List(params ListPromoCodesParams) ([]models.PromoCode, int64, error) {
	query := r.db.Model(&models.PromoCode{})

	if params.Status != "" {
		query = query.Where("status = ?", params.Status)
	}
	if params.Search != "" {
		search := "%" + strings.ToLower(params.Search) + "%"
		query = query.Where("LOWER(code) LIKE ? OR LOWER(description) LIKE ?", search, search)
	}

	var total int64
	query.Count(&total)

	sortBy := "created_at"
	sortOrder := "desc"
	if params.SortBy != "" {
		sortBy = params.SortBy
	}
	if params.SortOrder == "asc" {
		sortOrder = "asc"
	}

	var list []models.PromoCode
	err := query.Order(sortBy + " " + sortOrder).
		Offset((params.Page - 1) * params.Limit).
		Limit(params.Limit).
		Find(&list).Error

	return list, total, err
}

func (r *Repository) GetByID(id uint) (*models.PromoCode, error) {
	var promo models.PromoCode
	err := r.db.First(&promo, id).Error
	return &promo, err
}

func (r *Repository) GetByCode(code string) (*models.PromoCode, error) {
	var promo models.PromoCode
	err := r.db.Where("UPPER(code) = UPPER(?)", code).First(&promo).Error
	if err != nil {
		return nil, err
	}
	return &promo, nil
}

func (r *Repository) Create(promo *models.PromoCode) error {
	return r.db.Create(promo).Error
}

func (r *Repository) Update(promo *models.PromoCode) error {
	return r.db.Save(promo).Error
}

func (r *Repository) UpdateFields(id uint, fields map[string]interface{}) error {
	return r.db.Model(&models.PromoCode{}).Where("id = ?", id).Updates(fields).Error
}

func (r *Repository) Delete(id uint) error {
	return r.db.Delete(&models.PromoCode{}, id).Error
}

// GetUsages — promo kod ishlatilgan tarix
func (r *Repository) GetUsages(promoCodeID uint, page, limit int) ([]models.PromoCodeUsage, int64, error) {
	var total int64
	r.db.Model(&models.PromoCodeUsage{}).Where("promo_code_id = ?", promoCodeID).Count(&total)

	var usages []models.PromoCodeUsage
	err := r.db.Where("promo_code_id = ?", promoCodeID).
		Preload("User").
		Order("created_at DESC").
		Offset((page - 1) * limit).
		Limit(limit).
		Find(&usages).Error

	return usages, total, err
}

// GetUserUsageCount — user bu promo kodni necha marta ishlatgan
func (r *Repository) GetUserUsageCount(promoCodeID, userID uint) int64 {
	var count int64
	r.db.Model(&models.PromoCodeUsage{}).
		Where("promo_code_id = ? AND user_id = ?", promoCodeID, userID).
		Count(&count)
	return count
}

// GetStats — promo kod statistikasi
func (r *Repository) GetStats() (*PromoCodeStatsResponse, error) {
	var stats PromoCodeStatsResponse

	r.db.Model(&models.PromoCode{}).Count(&stats.TotalCodes)
	r.db.Model(&models.PromoCode{}).Where("status = ?", "active").Count(&stats.ActiveCodes)
	r.db.Model(&models.PromoCodeUsage{}).Count(&stats.TotalUsages)

	var totalDiscount *float64
	r.db.Model(&models.PromoCodeUsage{}).Select("COALESCE(SUM(discount_amount), 0)").Scan(&totalDiscount)
	if totalDiscount != nil {
		stats.TotalDiscounted = *totalDiscount
	}

	return &stats, nil
}

// IncrementUsedCount — promo kod ishlatilganda countni oshirish
func (r *Repository) IncrementUsedCount(promoCodeID uint) error {
	return r.db.Model(&models.PromoCode{}).
		Where("id = ?", promoCodeID).
		UpdateColumn("used_count", gorm.Expr("used_count + 1")).Error
}
