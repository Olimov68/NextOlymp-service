package telegram

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"math/rand"
	"net/http"
	"time"

	"github.com/nextolympservice/go-backend/config"
	"github.com/nextolympservice/go-backend/internal/models"
	"gorm.io/gorm"
)

type Service struct {
	repo *Repository
	cfg  *config.TelegramConfig
}

func NewService(repo *Repository, cfg *config.TelegramConfig) *Service {
	return &Service{repo: repo, cfg: cfg}
}

// HandleBotMessage - bot xabar olganida chaqiriladi, kod yaratib yuboradi
func (s *Service) HandleBotMessage(telegramID int64, telegramUsername, telegramName string) error {
	// Eski kodlarni o'chirish
	_ = s.repo.DeleteTelegramCodes(telegramID)

	// Yangi 6 xonali kod yaratish
	code := fmt.Sprintf("%06d", rand.Intn(1000000))

	tc := &models.TelegramCode{
		TelegramID:       telegramID,
		TelegramUsername: telegramUsername,
		TelegramName:     telegramName,
		Code:             code,
		ExpiresAt:        time.Now().Add(5 * time.Minute),
	}

	if err := s.repo.CreateCode(tc); err != nil {
		return fmt.Errorf("failed to create code: %w", err)
	}

	// Kodni Telegram orqali yuborish
	msg := fmt.Sprintf(
		"🔐 <b>Sizning bir martalik kodingiz:</b>\n\n"+
			"<code>%s</code>\n\n"+
			"Bu kodni NextOlymp saytiga kiriting.\n"+
			"⏱ Kod 5 daqiqa amal qiladi.",
		code,
	)
	return s.SendMessage(telegramID, msg)
}

// VerifyCode - user saytda kodni kiritganida chaqiriladi
func (s *Service) VerifyCode(userID uint, code string) error {
	// Kodni topish
	tc, err := s.repo.GetValidCode(code)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("kod noto'g'ri yoki muddati tugagan")
		}
		return fmt.Errorf("failed to get code: %w", err)
	}

	// Bu telegram allaqachon boshqa userga ulangan bo'lmasin
	_, err = s.repo.GetTelegramLinkByTelegramID(tc.TelegramID)
	if err == nil {
		return errors.New("bu Telegram akkaunt allaqachon boshqa foydalanuvchiga ulangan")
	}

	// Bu user allaqachon telegram ulagan bo'lmasin
	_, err = s.repo.GetTelegramLinkByUserID(userID)
	if err == nil {
		return errors.New("siz allaqachon Telegram ulagansiz")
	}

	// Telegram linkni yaratish
	link := &models.TelegramLink{
		UserID:           userID,
		TelegramID:       tc.TelegramID,
		TelegramUsername: tc.TelegramUsername,
		LinkedAt:         time.Now(),
	}

	if err := s.repo.CreateTelegramLink(link); err != nil {
		return fmt.Errorf("failed to create telegram link: %w", err)
	}

	// Kodni ishlatilgan deb belgilash
	_ = s.repo.MarkCodeUsed(tc.ID)

	// User flagini yangilash
	user, err := s.repo.GetUserByID(userID)
	if err != nil {
		return fmt.Errorf("failed to get user: %w", err)
	}
	user.IsTelegramLinked = true
	// Telegram orqali verification — agar hali verified bo'lmasa
	if user.VerificationStatus == models.VerificationPending {
		user.VerificationStatus = models.VerificationTelegramVerified
		now := time.Now()
		user.VerifiedAt = &now
	}
	if err := s.repo.UpdateUser(user); err != nil {
		return fmt.Errorf("failed to update user: %w", err)
	}

	// Telegram orqali tasdiqlash xabari yuborish
	_ = s.SendMessage(tc.TelegramID,
		"✅ <b>Muvaffaqiyatli ulandi!</b>\n\n"+
			"Telegram akkauntingiz NextOlymp hisobingizga ulandi.\n"+
			"Endi saytda davom etishingiz mumkin.")

	return nil
}

// CheckStatus - userning telegram ulangan-ulanmaganini tekshiradi
func (s *Service) CheckStatus(userID uint) (bool, string) {
	link, err := s.repo.GetTelegramLinkByUserID(userID)
	if err != nil {
		return false, ""
	}
	return true, link.TelegramUsername
}

// SendMessage - Telegram orqali xabar yuboradi
func (s *Service) SendMessage(chatID int64, text string) error {
	url := fmt.Sprintf("https://api.telegram.org/bot%s/sendMessage", s.cfg.BotToken)
	body, _ := json.Marshal(map[string]interface{}{
		"chat_id":    chatID,
		"text":       text,
		"parse_mode": "HTML",
	})

	resp, err := http.Post(url, "application/json", bytes.NewBuffer(body))
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	return nil
}

// BotURL returns the telegram bot URL
func (s *Service) BotURL() string {
	return fmt.Sprintf("https://t.me/%s", s.cfg.BotUsername)
}
