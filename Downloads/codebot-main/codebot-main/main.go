package main

import (
	"crypto/rand"
	"fmt"
	"log"
	"math/big"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"

	tgbotapi "github.com/go-telegram-bot-api/telegram-bot-api/v5"
	"github.com/joho/godotenv"
)

const (
	defaultTTLMinutes = 10
	codeKeyPrefix     = "tg:code:"
)

// TelegramCodePayload memory ichida saqlanadigan ma'lumot strukturasidir.
type TelegramCodePayload struct {
	TelegramID       int64  `json:"telegram_id"`
	TelegramUsername string `json:"telegram_username"`
	TelegramName     string `json:"telegram_name"`
	ExpiresAt        int64  `json:"expires_at"`
}

// CodeStore in-memory kod saqlash uchun
type CodeStore struct {
	codes map[string]TelegramCodePayload
	mu    sync.RWMutex
}

// UserStateStore foydalanuvchi holati saqlash uchun
type UserStateStore struct {
	states map[int64]string // userID -> state ("waiting_phone", "verified")
	mu     sync.RWMutex
}

func NewUserStateStore() *UserStateStore {
	return &UserStateStore{
		states: make(map[int64]string),
	}
}

func (us *UserStateStore) SetState(userID int64, state string) {
	us.mu.Lock()
	defer us.mu.Unlock()
	us.states[userID] = state
}

func (us *UserStateStore) GetState(userID int64) string {
	us.mu.RLock()
	defer us.mu.RUnlock()
	return us.states[userID]
}

func (us *UserStateStore) ClearState(userID int64) {
	us.mu.Lock()
	defer us.mu.Unlock()
	delete(us.states, userID)
}

func NewCodeStore() *CodeStore {
	cs := &CodeStore{
		codes: make(map[string]TelegramCodePayload),
	}
	// Fonda muddati o'tgan kodlarni tozalash
	go cs.cleanupExpiredCodes()
	return cs
}

func (cs *CodeStore) Set(code string, payload TelegramCodePayload) error {
	cs.mu.Lock()
	defer cs.mu.Unlock()
	cs.codes[code] = payload
	return nil
}

func (cs *CodeStore) Get(code string) (TelegramCodePayload, bool) {
	cs.mu.RLock()
	defer cs.mu.RUnlock()
	payload, exists := cs.codes[code]
	if !exists {
		return TelegramCodePayload{}, false
	}
	if time.Now().Unix() > payload.ExpiresAt {
		return TelegramCodePayload{}, false
	}
	return payload, true
}

func (cs *CodeStore) Exists(code string) bool {
	_, exists := cs.Get(code)
	return exists
}

func (cs *CodeStore) cleanupExpiredCodes() {
	ticker := time.NewTicker(1 * time.Minute)
	defer ticker.Stop()
	for range ticker.C {
		cs.mu.Lock()
		now := time.Now().Unix()
		for code, payload := range cs.codes {
			if now > payload.ExpiresAt {
				delete(cs.codes, code)
			}
		}
		cs.mu.Unlock()
	}
}

func main() {
	// .env fayli bo'lmasa ham dasturni to'xtatmaymiz, chunki productionda env tashqaridan beriladi.
	_ = godotenv.Load()

	botToken := strings.TrimSpace(os.Getenv("BOT_TOKEN"))
	if botToken == "" {
		log.Fatal("BOT_TOKEN is required")
	}

	ttlMinutes, err := parseTTLMinutes(os.Getenv("CODE_TTL_MINUTES"))
	if err != nil {
		log.Fatalf("invalid CODE_TTL_MINUTES: %v", err)
	}
	codeTTL := time.Duration(ttlMinutes) * time.Minute

	// In-memory store
	codeStore := NewCodeStore()
	userStateStore := NewUserStateStore()

	bot, err := tgbotapi.NewBotAPI(botToken)
	if err != nil {
		log.Fatalf("telegram bot init failed: %v", err)
	}

	log.Printf("Bot started as @%s", bot.Self.UserName)

	u := tgbotapi.NewUpdate(0)
	u.Timeout = 30
	updates := bot.GetUpdatesChan(u)

	for update := range updates {
		if update.Message == nil {
			continue
		}

		if update.Message.IsCommand() && update.Message.Command() == "start" {
			handleStartCommand(bot, userStateStore, update.Message)
			continue
		}

		// Kontakt (nomer) ulardi?
		if update.Message.Contact != nil {
			handleContactMessage(bot, codeStore, userStateStore, update.Message, codeTTL)
			continue
		}

		if update.Message.Text != "" {
			handleTextMessage(bot, userStateStore, update.Message)
		}
	}
}

func handleStartCommand(bot *tgbotapi.BotAPI, us *UserStateStore, msg *tgbotapi.Message) {
	us.SetState(msg.From.ID, "waiting_phone")

	// Nomer so'rash tugmasi
	requestContactKeyboard := tgbotapi.NewReplyKeyboard(
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButtonContact("📱 Nomerni Ulashing"),
		),
	)
	requestContactKeyboard.OneTimeKeyboard = true
	requestContactKeyboard.ResizeKeyboard = true

	msgRequest := tgbotapi.NewMessage(msg.Chat.ID, "Assalomu alaykum! Saytga kirishingiz uchun iltimos nomerni ulashing.")
	msgRequest.ReplyMarkup = requestContactKeyboard

	if _, err := bot.Send(msgRequest); err != nil {
		log.Printf("failed to send phone request to chat_id=%d: %v", msg.Chat.ID, err)
	}
}

func handleTextMessage(bot *tgbotapi.BotAPI, us *UserStateStore, msg *tgbotapi.Message) {
	state := us.GetState(msg.From.ID)
	if state == "waiting_phone" {
		// Nomer o'rniga tekst yo'ndarganda
		msgReply := tgbotapi.NewMessage(msg.Chat.ID, "Iltimos, 📱 Nomerni Ulashing tugmasini bosing.")
		msgReply.ReplyMarkup = tgbotapi.NewRemoveKeyboard(true)
		bot.Send(msgReply)
	}
}

func handleContactMessage(bot *tgbotapi.BotAPI, cs *CodeStore, us *UserStateStore, msg *tgbotapi.Message, ttl time.Duration) {
	state := us.GetState(msg.From.ID)
	if state != "waiting_phone" {
		return
	}

	// Kodni yaratish
	payload := TelegramCodePayload{
		TelegramID:       msg.From.ID,
		TelegramUsername: msg.From.UserName,
		TelegramName:     buildTelegramName(msg.From.FirstName, msg.From.LastName),
		ExpiresAt:        time.Now().Add(ttl).Unix(),
	}

	code, err := generateUniqueCode(cs)
	if err != nil {
		log.Printf("failed to generate unique code for user_id=%d: %v", msg.From.ID, err)
		sendSoftError(bot, msg.Chat.ID)
		return
	}

	if err := cs.Set(code, payload); err != nil {
		log.Printf("failed to save code=%s user_id=%d: %v", code, msg.From.ID, err)
		sendSoftError(bot, msg.Chat.ID)
		return
	}

	// Holati o'zgartirish
	us.SetState(msg.From.ID, "verified")

	// Kodni jo'natish
	text := fmt.Sprintf(
		"✅ Sizning bir martalik kod:\n\n<code>%s</code>\n\nKod %d daqiqa amal qiladi.",
		code,
		int(ttl.Minutes()),
	)

	msgReply := tgbotapi.NewMessage(msg.Chat.ID, text)
	msgReply.ParseMode = "HTML"
	msgReply.ReplyMarkup = tgbotapi.NewRemoveKeyboard(true)

	if _, err := bot.Send(msgReply); err != nil {
		log.Printf("failed to send code message to chat_id=%d: %v", msg.Chat.ID, err)
	}
}

func sendSoftError(bot *tgbotapi.BotAPI, chatID int64) {
	msg := tgbotapi.NewMessage(chatID, "Kechirasiz, hozircha ichki xatolik yuz berdi. Iltimos, birozdan so'ng qayta urinib ko'ring.")
	if _, err := bot.Send(msg); err != nil {
		log.Printf("failed to send error message to chat_id=%d: %v", chatID, err)
	}
}

func parseTTLMinutes(raw string) (int, error) {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return defaultTTLMinutes, nil
	}

	v, err := strconv.Atoi(raw)
	if err != nil {
		return 0, err
	}
	if v <= 0 {
		return 0, fmt.Errorf("must be greater than 0")
	}
	return v, nil
}

// generate6DigitCode faqat raqamlardan iborat 6 xonali kod qaytaradi.
func generate6DigitCode() (string, error) {
	max := big.NewInt(900000) // 0..899999
	n, err := rand.Int(rand.Reader, max)
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%06d", n.Int64()+100000), nil
}

func generateUniqueCode(cs *CodeStore) (string, error) {
	const maxAttempts = 5

	for i := 0; i < maxAttempts; i++ {
		code, err := generate6DigitCode()
		if err != nil {
			return "", err
		}

		if !cs.Exists(code) {
			return code, nil
		}
	}

	return "", fmt.Errorf("could not generate unique code after retries")
}

// buildTelegramName first_name + last_name dan toza fullname yasaydi.
func buildTelegramName(firstName, lastName string) string {
	return strings.TrimSpace(strings.TrimSpace(firstName) + " " + strings.TrimSpace(lastName))
}
