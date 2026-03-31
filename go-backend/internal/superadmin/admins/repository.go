package superadminadmins

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

func (r *Repository) List(params ListParams) ([]models.StaffUser, int64, error) {
	var list []models.StaffUser
	var total int64
	q := r.db.Model(&models.StaffUser{})
	if params.Role != "" {
		q = q.Where("role = ?", params.Role)
	}
	if params.Status != "" {
		q = q.Where("status = ?", params.Status)
	}
	if params.Search != "" {
		q = q.Where("username ILIKE ? OR full_name ILIKE ? OR email ILIKE ?", "%"+params.Search+"%", "%"+params.Search+"%", "%"+params.Search+"%")
	}
	q.Count(&total)
	offset := (params.Page - 1) * params.PageSize
	err := q.Order("created_at DESC").Offset(offset).Limit(params.PageSize).Find(&list).Error
	return list, total, err
}

func (r *Repository) GetByID(id uint) (*models.StaffUser, error) {
	var s models.StaffUser
	err := r.db.First(&s, id).Error
	return &s, err
}

func (r *Repository) UsernameExists(username string) (bool, error) {
	var count int64
	err := r.db.Model(&models.StaffUser{}).Where("username = ?", username).Count(&count).Error
	return count > 0, err
}

func (r *Repository) EmailExists(email string, excludeID uint) (bool, error) {
	var count int64
	q := r.db.Model(&models.StaffUser{}).Where("email = ? AND email != ''", email)
	if excludeID > 0 {
		q = q.Where("id != ?", excludeID)
	}
	err := q.Count(&count).Error
	return count > 0, err
}

func (r *Repository) Create(s *models.StaffUser) error {
	return r.db.Create(s).Error
}

func (r *Repository) Update(id uint, fields map[string]interface{}) error {
	return r.db.Model(&models.StaffUser{}).Where("id = ?", id).Updates(fields).Error
}

func (r *Repository) Delete(id uint) error {
	return r.db.Delete(&models.StaffUser{}, id).Error
}

func (r *Repository) AssignPermissions(staffID uint, permIDs []uint, grantedBy uint) error {
	// Eski ruxsatlarni o'chirish
	if err := r.db.Where("staff_user_id = ?", staffID).Delete(&models.StaffPermission{}).Error; err != nil {
		return err
	}

	// Yangilarini qo'shish
	for _, permID := range permIDs {
		grantedByID := grantedBy
		sp := models.StaffPermission{
			StaffUserID:  staffID,
			PermissionID: permID,
			GrantedByID:  &grantedByID,
		}
		if err := r.db.Create(&sp).Error; err != nil {
			return err
		}
	}
	return nil
}

func (r *Repository) GetPermissionCodes(staffID uint) []string {
	var codes []string
	r.db.Model(&models.StaffPermission{}).
		Select("permission.code").
		Joins("JOIN permission ON permission.id = staff_permission.permission_id").
		Where("staff_permission.staff_user_id = ?", staffID).
		Pluck("permission.code", &codes)
	return codes
}
