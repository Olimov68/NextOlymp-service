package adminusers

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

type ListParams struct {
	Status   string `form:"status"`
	Search   string `form:"search"`
	Region   string `form:"region"`
	Page     int    `form:"page,default=1"`
	PageSize int    `form:"page_size,default=20"`
}

func (r *Repository) List(params ListParams) ([]models.User, int64, error) {
	var list []models.User
	var total int64

	q := r.db.Model(&models.User{}).Where("\"user\".status != ?", models.UserStatusDeleted)
	if params.Status != "" {
		q = q.Where("\"user\".status = ?", params.Status)
	}
	if params.Search != "" {
		q = q.Where("\"user\".username ILIKE ?", "%"+params.Search+"%")
	}
	if params.Region != "" {
		q = q.Joins("JOIN profile ON profile.user_id = \"user\".id").
			Where("profile.region = ?", params.Region)
	}

	q.Count(&total)
	offset := (params.Page - 1) * params.PageSize
	err := q.Preload("Profile").Order("\"user\".created_at DESC").Offset(offset).Limit(params.PageSize).Find(&list).Error
	return list, total, err
}

func (r *Repository) GetByID(id uint) (*models.User, error) {
	var u models.User
	err := r.db.Preload("Profile").First(&u, id).Error
	return &u, err
}

func (r *Repository) UpdateStatus(id uint, status models.UserStatus) error {
	return r.db.Model(&models.User{}).Where("id = ?", id).Update("status", status).Error
}
