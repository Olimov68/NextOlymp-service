package userdiscussion

import (
	"time"

	"github.com/nextolympservice/go-backend/internal/models"
	"gorm.io/gorm"
)

type Repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) List(params ListParams) ([]models.DiscussionMessage, int64, error) {
	var list []models.DiscussionMessage
	var total int64

	q := r.db.Model(&models.DiscussionMessage{}).
		Where("status IN ?", []string{string(models.DiscussionMessageActive), string(models.DiscussionMessageHidden)})

	q.Count(&total)

	offset := (params.Page - 1) * params.PageSize
	err := q.
		Preload("User.Profile").
		Preload("ReplyTo.User.Profile").
		Order("created_at DESC").
		Offset(offset).Limit(params.PageSize).
		Find(&list).Error

	return list, total, err
}

func (r *Repository) GetByID(id uint) (*models.DiscussionMessage, error) {
	var msg models.DiscussionMessage
	err := r.db.Preload("User.Profile").Preload("ReplyTo.User.Profile").
		Where("id = ?", id).First(&msg).Error
	return &msg, err
}

func (r *Repository) Create(msg *models.DiscussionMessage) error {
	return r.db.Create(msg).Error
}

func (r *Repository) Update(id uint, fields map[string]interface{}) error {
	return r.db.Model(&models.DiscussionMessage{}).Where("id = ?", id).Updates(fields).Error
}

func (r *Repository) SoftDelete(id uint) error {
	return r.db.Model(&models.DiscussionMessage{}).Where("id = ?", id).
		Updates(map[string]interface{}{
			"status":  models.DiscussionMessageDeleted,
			"message": "",
		}).Error
}

func (r *Repository) Exists(id uint) bool {
	var count int64
	r.db.Model(&models.DiscussionMessage{}).Where("id = ? AND status = ?", id, models.DiscussionMessageActive).Count(&count)
	return count > 0
}

func (r *Repository) GetUserState(userID uint) (*models.DiscussionUserState, error) {
	var state models.DiscussionUserState
	err := r.db.Where("user_id = ?", userID).First(&state).Error
	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	return &state, err
}

func (r *Repository) IsMuted(userID uint) bool {
	state, err := r.GetUserState(userID)
	if err != nil || state == nil {
		return false
	}
	if !state.IsMuted {
		return false
	}
	// Vaqtli mute — muddati o'tganmi tekshirish
	if state.MutedUntil != nil && state.MutedUntil.Before(time.Now()) {
		// Mute muddati o'tdi, unmute qilish
		r.db.Model(state).Updates(map[string]interface{}{"is_muted": false, "muted_until": nil})
		return false
	}
	return true
}

func (r *Repository) IsBlocked(userID uint) bool {
	state, err := r.GetUserState(userID)
	if err != nil || state == nil {
		return false
	}
	return state.IsBlocked
}
