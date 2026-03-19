package sacertificates

import (
	"strconv"

	"github.com/nextolympservice/go-backend/internal/models"
	"gorm.io/gorm"
)

type Repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) List(params ListParams) ([]models.Certificate, int64, error) {
	var list []models.Certificate
	var total int64
	q := r.db.Model(&models.Certificate{})
	if params.CertificateType != "" {
		q = q.Where("certificate_type = ?", params.CertificateType)
	}
	if params.SourceType != "" {
		q = q.Where("source_type = ?", params.SourceType)
	}
	if params.Status != "" {
		q = q.Where("status = ?", params.Status)
	}
	if params.Grade != "" {
		q = q.Where("grade = ?", params.Grade)
	}
	if params.UserID != "" {
		uid, err := strconv.ParseUint(params.UserID, 10, 32)
		if err == nil {
			q = q.Where("user_id = ?", uid)
		}
	}
	if params.Search != "" {
		q = q.Where("title ILIKE ? OR certificate_number ILIKE ? OR full_name ILIKE ?",
			"%"+params.Search+"%", "%"+params.Search+"%", "%"+params.Search+"%")
	}
	q.Count(&total)
	offset := (params.Page - 1) * params.PageSize
	err := q.Preload("User").Preload("Template").Order("created_at DESC").Offset(offset).Limit(params.PageSize).Find(&list).Error
	return list, total, err
}

func (r *Repository) GetByID(id uint) (*models.Certificate, error) {
	var c models.Certificate
	err := r.db.Preload("User").Preload("Template").First(&c, id).Error
	return &c, err
}

func (r *Repository) Create(c *models.Certificate) error {
	return r.db.Create(c).Error
}

func (r *Repository) Update(id uint, fields map[string]interface{}) error {
	return r.db.Model(&models.Certificate{}).Where("id = ?", id).Updates(fields).Error
}
