package samocktests

import (
	"github.com/nextolympservice/go-backend/internal/models"
	"gorm.io/gorm"
)

type Repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) List(params ListParams) ([]models.MockTest, int64, error) {
	var list []models.MockTest
	var total int64
	q := r.db.Model(&models.MockTest{})
	if params.Status != "" {
		q = q.Where("status = ?", params.Status)
	}
	if params.Subject != "" {
		q = q.Where("subject ILIKE ?", "%"+params.Subject+"%")
	}
	if params.Grade != 0 {
		q = q.Where("grade = ?", params.Grade)
	}
	if params.Language != "" {
		q = q.Where("language = ?", params.Language)
	}
	if params.IsPaid != nil {
		q = q.Where("is_paid = ?", *params.IsPaid)
	}
	if params.Search != "" {
		q = q.Where("title ILIKE ? OR description ILIKE ?", "%"+params.Search+"%", "%"+params.Search+"%")
	}
	q.Count(&total)
	offset := (params.Page - 1) * params.PageSize
	err := q.Order("created_at DESC").Offset(offset).Limit(params.PageSize).Find(&list).Error
	return list, total, err
}

func (r *Repository) GetByID(id uint) (*models.MockTest, error) {
	var m models.MockTest
	err := r.db.First(&m, id).Error
	return &m, err
}

func (r *Repository) SlugExists(slug string) bool {
	var count int64
	r.db.Model(&models.MockTest{}).Where("slug = ?", slug).Count(&count)
	return count > 0
}

func (r *Repository) Create(m *models.MockTest) error {
	return r.db.Create(m).Error
}

func (r *Repository) Update(id uint, fields map[string]interface{}) error {
	return r.db.Model(&models.MockTest{}).Where("id = ?", id).Updates(fields).Error
}

func (r *Repository) Delete(id uint) error {
	return r.db.Delete(&models.MockTest{}, id).Error
}
