package userolympiads

import (
	"errors"
	"fmt"
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

func (s *Service) List(params ListParams) (*PaginatedOlympiads, error) {
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

	items := make([]OlympiadResponse, len(list))
	for i, o := range list {
		items[i] = ToOlympiadResponse(&o)
	}

	totalPages := int(total) / params.PageSize
	if int(total)%params.PageSize != 0 {
		totalPages++
	}

	return &PaginatedOlympiads{
		Data:       items,
		Total:      total,
		Page:       params.Page,
		PageSize:   params.PageSize,
		TotalPages: totalPages,
	}, nil
}

func (s *Service) GetByID(id uint) (*OlympiadResponse, error) {
	o, err := s.repo.GetByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("olympiad not found")
		}
		return nil, err
	}
	res := ToOlympiadResponse(o)
	return &res, nil
}

func (s *Service) GetMyOlympiads(userID uint) ([]map[string]interface{}, error) {
	regs, err := s.repo.GetMyOlympiads(userID)
	if err != nil {
		return nil, err
	}

	result := make([]map[string]interface{}, len(regs))
	for i, reg := range regs {
		item := map[string]interface{}{
			"id":          reg.ID,
			"olympiad_id": reg.OlympiadID,
			"status":      string(reg.Status),
			"joined_at":   reg.JoinedAt,
		}
		if reg.Olympiad != nil {
			item["olympiad"] = ToOlympiadResponse(reg.Olympiad)
		}
		result[i] = item
	}
	return result, nil
}

func (s *Service) GetUserOlympiadStatus(userID, olympiadID uint) map[string]interface{} {
	result := map[string]interface{}{
		"is_joined":      false,
		"has_attempted":  false,
		"attempt_status": "",
		"attempt_id":     uint(0),
		"allow_retake":   false,
	}

	// Olimpiada AllowRetake sozlamasini olish
	olympiad, err := s.repo.GetByID(olympiadID)
	if err == nil {
		result["allow_retake"] = olympiad.AllowRetake
	}

	// Ro'yxatdan o'tganmi
	_, err = s.repo.GetRegistration(userID, olympiadID)
	if err == nil {
		result["is_joined"] = true
	}

	// Attemptlar
	attempt, err := s.repo.GetLatestAttempt(userID, olympiadID)
	if err == nil {
		result["has_attempted"] = true
		result["attempt_status"] = attempt.Status
		result["attempt_id"] = attempt.ID
	}

	return result
}

func (s *Service) Join(userID, olympiadID uint) (*RegistrationResponse, error) {
	olympiad, err := s.repo.GetByID(olympiadID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("Olimpiada topilmadi")
		}
		return nil, err
	}

	if olympiad.Status != models.OlympiadStatusPublished && olympiad.Status != models.OlympiadStatusActive {
		return nil, errors.New("Bu olimpiada hozirda ro'yxatga olish uchun ochiq emas")
	}

	// Admin ro'yxatdan o'tishni yopgan bo'lishi mumkin
	if !olympiad.RegistrationOpen {
		return nil, errors.New("Bu olimpiadaga ro'yxatdan o'tish yopilgan")
	}

	// Sinf bo'yicha cheklov — foydalanuvchining sinfi olimpiada sinfiga mos bo'lishi kerak
	if olympiad.Grade > 0 {
		profile, err := s.repo.GetUserProfile(userID)
		if err != nil {
			return nil, errors.New("Profilingiz topilmadi. Avval profilni to'ldiring")
		}
		if profile.Grade != olympiad.Grade {
			return nil, fmt.Errorf("Bu olimpiada faqat %d-sinf o'quvchilari uchun. Siz %d-sinfda o'qiysiz", olympiad.Grade, profile.Grade)
		}
	}

	// Ro'yxatdan o'tish vaqtini tekshirish
	now := time.Now()
	if olympiad.RegistrationStartTime != nil && now.Before(*olympiad.RegistrationStartTime) {
		return nil, errors.New("Ro'yxatdan o'tish hali boshlanmagan")
	}
	if olympiad.RegistrationEndTime != nil && now.After(*olympiad.RegistrationEndTime) {
		return nil, errors.New("Ro'yxatdan o'tish tugagan")
	}

	// Joylar sonini tekshirish
	if olympiad.MaxSeats > 0 {
		count, err := s.repo.CountRegistrations(olympiadID)
		if err != nil {
			return nil, err
		}
		if count >= int64(olympiad.MaxSeats) {
			return nil, errors.New("Joylar tugagan")
		}
	}

	// Oldin qo'shilgan-qo'shilmaganligini tekshirish
	_, err = s.repo.GetRegistration(userID, olympiadID)
	if err == nil {
		return nil, errors.New("Siz bu olimpiadaga allaqachon ro'yxatdan o'tgansiz")
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	reg := &models.OlympiadRegistration{
		UserID:     userID,
		OlympiadID: olympiadID,
		Status:     models.OlympiadRegStatusRegistered,
	}

	if err := s.repo.CreateRegistration(reg); err != nil {
		return nil, errors.New("Olimpiadaga qo'shilishda xatolik yuz berdi")
	}

	return &RegistrationResponse{
		ID:         reg.ID,
		OlympiadID: reg.OlympiadID,
		Status:     string(reg.Status),
		JoinedAt:   reg.JoinedAt,
	}, nil
}
