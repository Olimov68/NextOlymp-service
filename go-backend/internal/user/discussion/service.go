package userdiscussion

import (
	"errors"
	"time"

	"github.com/nextolympservice/go-backend/internal/models"
	"gorm.io/gorm"
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) List(params ListParams) (map[string]interface{}, error) {
	if params.Page < 1 {
		params.Page = 1
	}
	if params.PageSize < 1 || params.PageSize > 100 {
		params.PageSize = 50
	}

	list, total, err := s.repo.List(params)
	if err != nil {
		return nil, err
	}

	items := make([]MessageResponse, len(list))
	for i := range list {
		items[i] = toMessageResponse(&list[i])
	}

	totalPages := int(total) / params.PageSize
	if int(total)%params.PageSize != 0 {
		totalPages++
	}

	return map[string]interface{}{
		"items": items,
		"pagination": map[string]interface{}{
			"page":        params.Page,
			"page_size":   params.PageSize,
			"total":       total,
			"total_pages": totalPages,
		},
	}, nil
}

func (s *Service) GetMyState(userID uint) (*UserStateResponse, error) {
	settings := s.repo.GetSettings()
	state, err := s.repo.GetUserState(userID)
	if err != nil {
		return nil, err
	}
	resp := &UserStateResponse{
		IsChatEnabled: settings.IsChatEnabled,
		ReadOnlyMode:  settings.ReadOnlyMode,
	}
	if state != nil {
		resp.IsMuted = state.IsMuted
		resp.MutedUntil = state.MutedUntil
		resp.IsBlocked = state.IsBlocked
	}
	return resp, nil
}

func (s *Service) Create(userID uint, req CreateMessageRequest) (*MessageResponse, error) {
	// Chat settings tekshirish
	settings := s.repo.GetSettings()
	if !settings.IsChatEnabled {
		return nil, errors.New("chat vaqtincha yopilgan")
	}
	if settings.ReadOnlyMode {
		return nil, errors.New("chat faqat o'qish rejimida")
	}

	// Blocked tekshirish
	if s.repo.IsBlocked(userID) {
		return nil, errors.New("siz muhokamada bloklangansiz")
	}

	// Muted tekshirish
	if s.repo.IsMuted(userID) {
		return nil, errors.New("siz vaqtincha xabar yoza olmaysiz")
	}

	// Reply mavjudligini tekshirish
	if req.ReplyToID != nil && !s.repo.Exists(*req.ReplyToID) {
		return nil, errors.New("javob beriladigan xabar topilmadi")
	}

	msg := &models.DiscussionMessage{
		UserID:    userID,
		Message:   req.Message,
		ReplyToID: req.ReplyToID,
		Status:    models.DiscussionMessageActive,
	}

	if err := s.repo.Create(msg); err != nil {
		return nil, err
	}

	// Reload with relations
	loaded, err := s.repo.GetByID(msg.ID)
	if err != nil {
		return nil, err
	}

	resp := toMessageResponse(loaded)
	return &resp, nil
}

func (s *Service) Update(userID, msgID uint, req UpdateMessageRequest) (*MessageResponse, error) {
	msg, err := s.repo.GetByID(msgID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("xabar topilmadi")
		}
		return nil, err
	}

	if msg.UserID != userID {
		return nil, errors.New("faqat o'z xabaringizni tahrirlashingiz mumkin")
	}

	if msg.Status != models.DiscussionMessageActive {
		return nil, errors.New("bu xabarni tahrirlash mumkin emas")
	}

	now := time.Now()
	if err := s.repo.Update(msgID, map[string]interface{}{
		"message":   req.Message,
		"is_edited": true,
		"edited_at": &now,
	}); err != nil {
		return nil, err
	}

	loaded, err := s.repo.GetByID(msgID)
	if err != nil {
		return nil, err
	}

	resp := toMessageResponse(loaded)
	return &resp, nil
}

func (s *Service) Delete(userID, msgID uint) error {
	msg, err := s.repo.GetByID(msgID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("xabar topilmadi")
		}
		return err
	}

	if msg.UserID != userID {
		return errors.New("faqat o'z xabaringizni o'chirishingiz mumkin")
	}

	if msg.Status != models.DiscussionMessageActive {
		return errors.New("bu xabarni o'chirish mumkin emas")
	}

	return s.repo.SoftDelete(msgID)
}
