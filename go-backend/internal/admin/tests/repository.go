package admintests

import (
	"fmt"
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

// --- Olympiad ---

func (r *Repository) ListOlympiads(params TestListParams) ([]models.Olympiad, int64, error) {
	var list []models.Olympiad
	var total int64
	q := r.db.Model(&models.Olympiad{})
	if params.Status != "" {
		q = q.Where("status = ?", params.Status)
	}
	if params.Subject != "" {
		q = q.Where("subject = ?", params.Subject)
	}
	if params.Grade > 0 {
		q = q.Where("grade = ?", params.Grade)
	}
	if params.Language != "" {
		q = q.Where("language = ?", params.Language)
	}
	if params.IsPaid != nil {
		q = q.Where("is_paid = ?", *params.IsPaid)
	}
	q.Count(&total)
	offset := (params.Page - 1) * params.PageSize
	err := q.Order("created_at DESC").Offset(offset).Limit(params.PageSize).Find(&list).Error
	return list, total, err
}

func (r *Repository) GetOlympiadByID(id uint) (*models.Olympiad, error) {
	var o models.Olympiad
	err := r.db.First(&o, id).Error
	return &o, err
}

func (r *Repository) CreateOlympiad(o *models.Olympiad) error {
	return r.db.Create(o).Error
}

func (r *Repository) UpdateOlympiad(id uint, fields map[string]interface{}) error {
	return r.db.Model(&models.Olympiad{}).Where("id = ?", id).Updates(fields).Error
}

func (r *Repository) DeleteOlympiad(id uint) error {
	return r.db.Delete(&models.Olympiad{}, id).Error
}

func (r *Repository) SlugExists(table, slug string, excludeID uint) bool {
	var count int64
	q := r.db.Table(table).Where("slug = ?", slug)
	if excludeID > 0 {
		q = q.Where("id != ?", excludeID)
	}
	q.Count(&count)
	return count > 0
}

// --- MockTest ---

func (r *Repository) ListMockTests(params TestListParams) ([]models.MockTest, int64, error) {
	var list []models.MockTest
	var total int64
	q := r.db.Model(&models.MockTest{})
	if params.Status != "" {
		q = q.Where("status = ?", params.Status)
	}
	if params.Subject != "" {
		q = q.Where("subject = ?", params.Subject)
	}
	if params.Grade > 0 {
		q = q.Where("grade = ?", params.Grade)
	}
	if params.Language != "" {
		q = q.Where("language = ?", params.Language)
	}
	if params.IsPaid != nil {
		q = q.Where("is_paid = ?", *params.IsPaid)
	}
	q.Count(&total)
	offset := (params.Page - 1) * params.PageSize
	err := q.Order("created_at DESC").Offset(offset).Limit(params.PageSize).Find(&list).Error
	return list, total, err
}

func (r *Repository) GetMockTestByID(id uint) (*models.MockTest, error) {
	var m models.MockTest
	err := r.db.First(&m, id).Error
	return &m, err
}

func (r *Repository) CreateMockTest(m *models.MockTest) error {
	return r.db.Create(m).Error
}

func (r *Repository) UpdateMockTest(id uint, fields map[string]interface{}) error {
	return r.db.Model(&models.MockTest{}).Where("id = ?", id).Updates(fields).Error
}

func (r *Repository) DeleteMockTest(id uint) error {
	return r.db.Delete(&models.MockTest{}, id).Error
}

// generateSlug — oddiy slug generatsiya
func generateSlug(title string, id uint) string {
	slug := strings.ToLower(title)
	slug = strings.ReplaceAll(slug, " ", "-")
	return fmt.Sprintf("%s-%d", slug, id)
}
