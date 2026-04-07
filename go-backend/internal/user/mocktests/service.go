package usermocktests

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

func (s *Service) List(params ListParams) (*PaginatedMockTests, error) {
	if params.Page < 1 {
		params.Page = 1
	}
	if params.PageSize < 1 || params.PageSize > 100 {
		params.PageSize = 20
	}

	list, total, err := s.repo.List(params)
	if err != nil {
		return nil, err
	}

	items := make([]MockTestResponse, len(list))
	for i, m := range list {
		items[i] = ToMockTestResponse(&m)
	}

	totalPages := int(total) / params.PageSize
	if int(total)%params.PageSize != 0 {
		totalPages++
	}

	return &PaginatedMockTests{
		Data:       items,
		Total:      total,
		Page:       params.Page,
		PageSize:   params.PageSize,
		TotalPages: totalPages,
	}, nil
}

func (s *Service) GetByID(id uint) (*MockTestResponse, error) {
	m, err := s.repo.GetByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("mock test not found")
		}
		return nil, err
	}
	res := ToMockTestResponse(m)
	return &res, nil
}

func (s *Service) GetMyMockTests(userID uint) ([]map[string]interface{}, error) {
	regs, err := s.repo.GetMyMockTests(userID)
	if err != nil {
		return nil, err
	}

	result := make([]map[string]interface{}, len(regs))
	for i, reg := range regs {
		item := map[string]interface{}{
			"id":           reg.ID,
			"mock_test_id": reg.MockTestID,
			"status":       string(reg.Status),
			"joined_at":    reg.JoinedAt,
		}
		if reg.MockTest != nil {
			item["mock_test"] = ToMockTestResponse(reg.MockTest)
		}
		result[i] = item
	}
	return result, nil
}

func (s *Service) Join(userID, mockTestID uint) (*RegistrationResponse, error) {
	mt, err := s.repo.GetByID(mockTestID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("mock test not found")
		}
		return nil, err
	}

	if mt.Status != models.MockTestStatusPublished && mt.Status != models.MockTestStatusActive {
		return nil, errors.New("this mock test is not accepting registrations")
	}

	// Ro'yxatdan o'tish vaqtini tekshirish
	now := time.Now()
	if mt.RegistrationStartTime != nil && now.Before(*mt.RegistrationStartTime) {
		return nil, errors.New("Ro'yxatdan o'tish hali boshlanmagan")
	}
	if mt.RegistrationEndTime != nil && now.After(*mt.RegistrationEndTime) {
		return nil, errors.New("Ro'yxatdan o'tish tugagan")
	}

	// Joylar sonini tekshirish
	if mt.MaxSeats > 0 {
		count, err := s.repo.CountRegistrations(mockTestID)
		if err != nil {
			return nil, err
		}
		if count >= int64(mt.MaxSeats) {
			return nil, errors.New("Joylar tugagan")
		}
	}

	_, err = s.repo.GetRegistration(userID, mockTestID)
	if err == nil {
		return nil, errors.New("you have already joined this mock test")
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	// Agar admin tasdig'i kerak bo'lsa, status pending_approval bo'ladi
	initialStatus := models.MockTestRegStatusRegistered
	if mt.AdminApproval {
		initialStatus = models.MockTestRegStatusPending
	}

	reg := &models.MockTestRegistration{
		UserID:     userID,
		MockTestID: mockTestID,
		Status:     initialStatus,
	}

	if err := s.repo.CreateRegistration(reg); err != nil {
		return nil, errors.New("failed to join mock test")
	}

	return &RegistrationResponse{
		ID:         reg.ID,
		MockTestID: reg.MockTestID,
		Status:     string(reg.Status),
		JoinedAt:   reg.JoinedAt,
	}, nil
}
