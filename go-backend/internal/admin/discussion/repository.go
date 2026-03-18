package admindiscussion

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

func (r *Repository) ListMessages(params ListMessagesParams) ([]models.DiscussionMessage, int64, error) {
	var list []models.DiscussionMessage
	var total int64

	q := r.db.Model(&models.DiscussionMessage{})

	if params.Status != "" {
		q = q.Where("status = ?", params.Status)
	}

	if params.Search != "" {
		q = q.Where("message ILIKE ?", "%"+params.Search+"%")
	}

	q.Count(&total)

	offset := (params.Page - 1) * params.PageSize
	err := q.Preload("User.Profile").
		Order("created_at DESC").
		Offset(offset).Limit(params.PageSize).
		Find(&list).Error

	return list, total, err
}

func (r *Repository) GetMessage(id uint) (*models.DiscussionMessage, error) {
	var msg models.DiscussionMessage
	err := r.db.Preload("User.Profile").Where("id = ?", id).First(&msg).Error
	return &msg, err
}

func (r *Repository) UpdateMessageStatus(id uint, status models.DiscussionMessageStatus) error {
	return r.db.Model(&models.DiscussionMessage{}).Where("id = ?", id).
		Update("status", status).Error
}

func (r *Repository) DeleteMessage(id uint) error {
	return r.db.Model(&models.DiscussionMessage{}).Where("id = ?", id).
		Updates(map[string]interface{}{
			"status":  models.DiscussionMessageDeleted,
			"message": "",
		}).Error
}

// User state management

func (r *Repository) ListUserStates(params ListUsersParams) ([]models.DiscussionUserState, int64, error) {
	var list []models.DiscussionUserState
	var total int64

	q := r.db.Model(&models.DiscussionUserState{}).
		Where("is_muted = ? OR is_blocked = ?", true, true)

	if params.Search != "" {
		q = q.Joins("JOIN \"user\" ON \"user\".id = discussion_user_state.user_id").
			Where("\"user\".username ILIKE ?", "%"+params.Search+"%")
	}

	q.Count(&total)

	offset := (params.Page - 1) * params.PageSize
	err := q.Preload("User.Profile").
		Order("updated_at DESC").
		Offset(offset).Limit(params.PageSize).
		Find(&list).Error

	return list, total, err
}

func (r *Repository) GetOrCreateUserState(userID uint) (*models.DiscussionUserState, error) {
	var state models.DiscussionUserState
	err := r.db.Where("user_id = ?", userID).First(&state).Error
	if err == gorm.ErrRecordNotFound {
		state = models.DiscussionUserState{UserID: userID}
		if err := r.db.Create(&state).Error; err != nil {
			return nil, err
		}
		return &state, nil
	}
	return &state, err
}

func (r *Repository) MuteUser(userID uint, reason string, hours int) error {
	state, err := r.GetOrCreateUserState(userID)
	if err != nil {
		return err
	}

	updates := map[string]interface{}{
		"is_muted": true,
		"reason":   reason,
	}

	if hours > 0 {
		until := time.Now().Add(time.Duration(hours) * time.Hour)
		updates["muted_until"] = &until
	} else {
		updates["muted_until"] = nil
	}

	return r.db.Model(state).Updates(updates).Error
}

func (r *Repository) UnmuteUser(userID uint) error {
	return r.db.Model(&models.DiscussionUserState{}).Where("user_id = ?", userID).
		Updates(map[string]interface{}{
			"is_muted":    false,
			"muted_until": nil,
		}).Error
}

func (r *Repository) BlockUser(userID uint, reason string) error {
	state, err := r.GetOrCreateUserState(userID)
	if err != nil {
		return err
	}

	return r.db.Model(state).Updates(map[string]interface{}{
		"is_blocked": true,
		"reason":     reason,
	}).Error
}

func (r *Repository) UnblockUser(userID uint) error {
	return r.db.Model(&models.DiscussionUserState{}).Where("user_id = ?", userID).
		Updates(map[string]interface{}{
			"is_blocked": false,
			"reason":     "",
		}).Error
}
