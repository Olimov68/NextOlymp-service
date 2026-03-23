package auth

import (
	"errors"
	"fmt"
	"math/rand"
	"strings"
	"time"

	"github.com/nextolympservice/go-backend/internal/models"
	"github.com/nextolympservice/go-backend/internal/shared/notifier"
	"github.com/nextolympservice/go-backend/internal/utils"
	"gorm.io/gorm"
)

type Service struct {
	repo           *Repository
	jwt            *utils.JWTManager
	sessionMgr     *utils.SessionManager
	notifier       *notifier.Notifier
	telegramSender TelegramSender
	botURL         string
	botName        string
	googleClientID string
}

// TelegramSender — Telegram orqali xabar yuborish interfeysi
type TelegramSender interface {
	SendMessage(chatID int64, text string) error
}

func NewService(repo *Repository, jwt *utils.JWTManager) *Service {
	return &Service{repo: repo, jwt: jwt}
}

// isTelegramEnabled — admin paneldan Telegram verification yoqilganmi tekshirish
func (s *Service) isTelegramEnabled() bool {
	var setting models.GlobalSetting
	if err := s.repo.db.First(&setting).Error; err != nil {
		return false // xatolik bo'lsa o'chirilgan deb hisoblash
	}
	return setting.TelegramVerificationEnabled
}

// SetSessionManager — session manager ni sozlash (router.go da chaqiriladi)
func (s *Service) SetSessionManager(sm *utils.SessionManager) {
	s.sessionMgr = sm
}

// SetNotifier — notifier ni sozlash (router.go da chaqiriladi)
func (s *Service) SetNotifier(n *notifier.Notifier) {
	s.notifier = n
}

// SetTelegramSender — telegram xabar yuboruvchini sozlash
func (s *Service) SetTelegramSender(sender TelegramSender, botURL, botName string) {
	s.telegramSender = sender
	s.botURL = botURL
	s.botName = botName
}

// SetGoogleClientID — Google OAuth client ID ni sozlash
func (s *Service) SetGoogleClientID(clientID string) {
	s.googleClientID = clientID
}

// SessionInfo — login/register da sessiya yaratish uchun kerakli ma'lumotlar
type SessionInfo struct {
	IPAddress string
	UserAgent string
}

// Register creates a new user account
func (s *Service) Register(req *RegisterRequest, sessionInfo *SessionInfo) (*RegisterResponse, error) {
	// Username validation
	if err := utils.ValidateUsername(req.Username); err != nil {
		return nil, fmt.Errorf("username: %w", err)
	}

	// Password validation
	if err := utils.ValidatePassword(req.Password); err != nil {
		return nil, fmt.Errorf("password: %w", err)
	}

	// Confirm password
	if req.Password != req.ConfirmPassword {
		return nil, errors.New("passwords do not match")
	}

	// Check username uniqueness
	exists, err := s.repo.UsernameExists(req.Username)
	if err != nil {
		return nil, fmt.Errorf("failed to check username: %w", err)
	}
	if exists {
		return nil, errors.New("username already taken")
	}

	// Hash password
	hash, err := utils.HashPassword(req.Password)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	user := &models.User{
		Username:           req.Username,
		PasswordHash:       hash,
		Status:             models.UserStatusActive,
		IsProfileCompleted: false,
		IsTelegramLinked:   false,
	}

	if err := s.repo.CreateUser(user); err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	// Sessiya yaratish (avval session, keyin token — session_id JWT ichiga kiritiladi)
	var sessionID uint
	if s.sessionMgr != nil && sessionInfo != nil {
		expiresAt := time.Now().Add(168 * time.Hour) // 7 kun
		session, err := s.sessionMgr.CreateSession(user.ID, "user", "", sessionInfo.IPAddress, sessionInfo.UserAgent, expiresAt)
		if err != nil {
			return nil, fmt.Errorf("failed to create session: %w", err)
		}
		sessionID = session.ID
	}

	// Generate tokens (session_id bilan)
	accessToken, refreshToken, err := s.jwt.GenerateTokenPair(user.ID, user.Username, sessionID)
	if err != nil {
		return nil, fmt.Errorf("failed to generate tokens: %w", err)
	}

	// Sessiya token hash ni yangilash
	if s.sessionMgr != nil && sessionID > 0 {
		s.sessionMgr.UpdateSessionTokenByID(sessionID, refreshToken)
	}

	return &RegisterResponse{
		User: ToUserResponse(user),
		Tokens: TokenPair{
			AccessToken:  accessToken,
			RefreshToken: refreshToken,
			TokenType:    "Bearer",
		},
		NextStep: DetermineNextStep(user, s.isTelegramEnabled()),
	}, nil
}

// Login authenticates a user and returns tokens
func (s *Service) Login(req *LoginRequest, sessionInfo *SessionInfo) (*LoginResponse, error) {
	user, err := s.repo.GetByUsername(req.Username)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("Invalid credentials")
		}
		return nil, fmt.Errorf("failed to find user: %w", err)
	}

	if user.Status == models.UserStatusBlocked {
		return nil, errors.New("Your account has been blocked")
	}
	if user.Status == models.UserStatusDeleted {
		return nil, errors.New("Invalid credentials")
	}

	if !utils.CheckPassword(req.Password, user.PasswordHash) {
		return nil, errors.New("Invalid credentials")
	}

	// Sessiya yaratish (avval session — eski sessiyalar avtomatik bekor bo'ladi)
	var sessionID uint
	if s.sessionMgr != nil && sessionInfo != nil {
		expiresAt := time.Now().Add(168 * time.Hour)
		session, err := s.sessionMgr.CreateSession(user.ID, "user", "", sessionInfo.IPAddress, sessionInfo.UserAgent, expiresAt)
		if err != nil {
			return nil, fmt.Errorf("failed to create session: %w", err)
		}
		sessionID = session.ID

		// Yangi qurilmadan kirish bildirishnomasi
		if s.notifier != nil {
			s.notifier.NewLogin(user.ID, session.DeviceName, session.IPAddress)
		}
	}

	// Generate tokens (session_id bilan)
	accessToken, refreshToken, err := s.jwt.GenerateTokenPair(user.ID, user.Username, sessionID)
	if err != nil {
		return nil, fmt.Errorf("failed to generate tokens: %w", err)
	}

	// Sessiya token hash ni yangilash
	if s.sessionMgr != nil && sessionID > 0 {
		s.sessionMgr.UpdateSessionTokenByID(sessionID, refreshToken)
	}

	return &LoginResponse{
		User: ToUserResponse(user),
		Tokens: TokenPair{
			AccessToken:  accessToken,
			RefreshToken: refreshToken,
			TokenType:    "Bearer",
		},
		NextStep: DetermineNextStep(user, s.isTelegramEnabled()),
	}, nil
}

// RefreshTokens generates a new token pair from a valid refresh token
func (s *Service) RefreshTokens(refreshTokenStr string) (*TokenPair, error) {
	claims, err := s.jwt.ValidateRefreshToken(refreshTokenStr)
	if err != nil {
		return nil, errors.New("invalid or expired refresh token")
	}

	user, err := s.repo.GetByID(claims.UserID)
	if err != nil {
		return nil, errors.New("user not found")
	}

	if user.Status == models.UserStatusBlocked || user.Status == models.UserStatusDeleted {
		return nil, errors.New("account is not active")
	}

	// Sessiya haqiqiyligini tekshirish (aniq session_id bo'yicha)
	if s.sessionMgr != nil {
		_, valid := s.sessionMgr.ValidateSession(user.ID, "user", claims.SessionID)
		if !valid {
			return nil, errors.New("session expired or invalidated")
		}
	}

	accessToken, refreshToken, err := s.jwt.GenerateTokenPair(user.ID, user.Username, claims.SessionID)
	if err != nil {
		return nil, fmt.Errorf("failed to generate tokens: %w", err)
	}

	// Sessiya token hash ni yangilash
	if s.sessionMgr != nil {
		expiresAt := time.Now().Add(168 * time.Hour)
		s.sessionMgr.UpdateSessionToken(user.ID, "user", utils.HashToken(refreshTokenStr), refreshToken, expiresAt)
	}

	return &TokenPair{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		TokenType:    "Bearer",
	}, nil
}

// GetMe returns current user data with profile
func (s *Service) GetMe(userID uint) (*MeResponse, error) {
	user, err := s.repo.GetByIDWithProfile(userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("user not found")
		}
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	return &MeResponse{
		User:     ToUserResponse(user),
		Profile:  ToProfileResponse(user.Profile),
		NextStep: DetermineNextStep(user, s.isTelegramEnabled()),
	}, nil
}

// ChangePassword — parolni o'zgartirish
func (s *Service) ChangePassword(userID uint, req *ChangePasswordRequest) error {
	user, err := s.repo.GetByID(userID)
	if err != nil {
		return errors.New("user not found")
	}

	if !utils.CheckPassword(req.CurrentPassword, user.PasswordHash) {
		return errors.New("Joriy parol noto'g'ri")
	}

	if err := utils.ValidatePassword(req.NewPassword); err != nil {
		return fmt.Errorf("Yangi parol: %w", err)
	}

	hash, err := utils.HashPassword(req.NewPassword)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	user.PasswordHash = hash
	if err := s.repo.UpdateUser(user); err != nil {
		return fmt.Errorf("failed to update password: %w", err)
	}

	return nil
}

// RecoveryIdentify — foydalanuvchini topib, Telegram botga kod yuborish
func (s *Service) RecoveryIdentify(identifier string) (*RecoveryIdentifyResponse, error) {
	// Foydalanuvchini username bo'yicha topish
	user, err := s.repo.GetByUsername(identifier)
	if err != nil {
		return nil, errors.New("Foydalanuvchi topilmadi")
	}

	if user.Status == models.UserStatusBlocked {
		return nil, errors.New("Hisobingiz bloklangan")
	}
	if user.Status == models.UserStatusDeleted {
		return nil, errors.New("Foydalanuvchi topilmadi")
	}

	// Telegram ulangan bo'lishi kerak
	if !user.IsTelegramLinked {
		return nil, errors.New("Telegram bog'lanmagan. Parolni tiklash uchun Telegram ulangan bo'lishi kerak")
	}

	// Telegram link ni olish
	link, err := s.repo.GetTelegramLinkByUserID(user.ID)
	if err != nil {
		return nil, errors.New("Telegram ma'lumotlari topilmadi")
	}

	// Eski kodlarni o'chirish
	_ = s.repo.DeleteUnusedPasswordResetCodes(user.ID)

	// Yangi 6 xonali kod yaratish
	code := fmt.Sprintf("%06d", time.Now().UnixNano()%1000000)

	resetCode := &models.PasswordResetCode{
		UserID:    user.ID,
		Code:      code,
		ExpiresAt: time.Now().Add(10 * time.Minute),
	}

	if err := s.repo.CreatePasswordResetCode(resetCode); err != nil {
		return nil, fmt.Errorf("kod yaratishda xatolik: %w", err)
	}

	// Telegram orqali kod yuborish
	if s.telegramSender != nil {
		msg := fmt.Sprintf(
			"🔑 <b>Parolni tiklash kodi:</b>\n\n"+
				"<code>%s</code>\n\n"+
				"Bu kodni saytdagi parolni tiklash sahifasiga kiriting.\n"+
				"⏱ Kod 10 daqiqa amal qiladi.\n\n"+
				"❗️ Agar siz bu so'rovni yubormagan bo'lsangiz, ushbu xabarni e'tiborsiz qoldiring.",
			code,
		)
		if err := s.telegramSender.SendMessage(link.TelegramID, msg); err != nil {
			return nil, errors.New("Telegram orqali xabar yuborishda xatolik")
		}
	}

	return &RecoveryIdentifyResponse{
		Message: "Bir martalik kod Telegram botga yuborildi",
		BotURL:  s.botURL,
		BotName: s.botName,
	}, nil
}

// RecoveryVerify — kodni tasdiqlash
func (s *Service) RecoveryVerify(identifier, code string) error {
	user, err := s.repo.GetByUsername(identifier)
	if err != nil {
		return errors.New("Foydalanuvchi topilmadi")
	}

	resetCode, err := s.repo.GetValidPasswordResetCode(user.ID, code)
	if err != nil {
		return errors.New("Kod noto'g'ri yoki muddati tugagan")
	}

	// Kodni verified deb belgilash
	resetCode.Verified = true
	if err := s.repo.UpdatePasswordResetCode(resetCode); err != nil {
		return errors.New("Kodni tasdiqlashda xatolik")
	}

	return nil
}

// RecoveryReset — parolni o'zgartirish
func (s *Service) RecoveryReset(identifier, code, newPassword string) error {
	if err := utils.ValidatePassword(newPassword); err != nil {
		return fmt.Errorf("Yangi parol: %w", err)
	}

	user, err := s.repo.GetByUsername(identifier)
	if err != nil {
		return errors.New("Foydalanuvchi topilmadi")
	}

	// Tasdiqlangan kodni tekshirish
	resetCode, err := s.repo.GetVerifiedPasswordResetCode(user.ID, code)
	if err != nil {
		return errors.New("Kod noto'g'ri yoki tasdiqlanmagan")
	}

	// Parolni yangilash
	hash, err := utils.HashPassword(newPassword)
	if err != nil {
		return errors.New("Parolni xeshlashda xatolik")
	}

	user.PasswordHash = hash
	if err := s.repo.UpdateUser(user); err != nil {
		return errors.New("Parolni yangilashda xatolik")
	}

	// Kodni ishlatilgan deb belgilash
	resetCode.Used = true
	_ = s.repo.UpdatePasswordResetCode(resetCode)

	// Barcha sessiyalarni bekor qilish (xavfsizlik uchun)
	if s.sessionMgr != nil {
		s.sessionMgr.InvalidateAllSessions(user.ID)
	}

	return nil
}

// Logout — joriy sessiyani bekor qilish
func (s *Service) Logout(userID uint, sessionID uint) {
	if s.sessionMgr != nil {
		if sessionID > 0 {
			s.sessionMgr.InvalidateSession(sessionID, userID)
		} else {
			s.sessionMgr.InvalidateAllSessions(userID)
		}
	}
}

// GoogleAuth — Google ID token orqali login/register
func (s *Service) GoogleAuth(req *GoogleAuthRequest, sessionInfo *SessionInfo) (*GoogleAuthResponse, error) {
	// 1. Google tokenni tekshirish
	tokenInfo, err := utils.VerifyGoogleIDToken(req.IDToken, s.googleClientID)
	if err != nil {
		return nil, fmt.Errorf("Google autentifikatsiya xatoligi: %w", err)
	}

	var user *models.User
	isNew := false

	// 2. GoogleID bo'yicha qidirish
	user, err = s.repo.GetByGoogleID(tokenInfo.Sub)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, fmt.Errorf("foydalanuvchini qidirishda xatolik: %w", err)
	}

	// 3. Google ID topilmasa, email bo'yicha qidirish
	if user == nil {
		user, err = s.repo.GetByEmail(tokenInfo.Email)
		if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("foydalanuvchini qidirishda xatolik: %w", err)
		}

		// 4. Email topildi, lekin GoogleID yo'q — bog'lash
		if user != nil {
			user.GoogleID = &tokenInfo.Sub
			user.AvatarURL = tokenInfo.Picture
			if user.FullName == "" {
				user.FullName = tokenInfo.Name
			}
			if err := s.repo.UpdateUser(user); err != nil {
				return nil, fmt.Errorf("foydalanuvchini yangilashda xatolik: %w", err)
			}
		}
	}

	// 5. Umuman topilmasa — yangi foydalanuvchi yaratish
	if user == nil {
		isNew = true

		// Email prefixidan username yaratish
		username := strings.Split(tokenInfo.Email, "@")[0]
		// Username validatsiya va unikallik tekshiruvi
		baseUsername := username
		exists, _ := s.repo.UsernameExists(username)
		for exists {
			username = fmt.Sprintf("%s%d", baseUsername, rand.Intn(9000)+1000)
			exists, _ = s.repo.UsernameExists(username)
		}

		now := time.Now()
		user = &models.User{
			Username:           username,
			PasswordHash:       "",
			GoogleID:           &tokenInfo.Sub,
			Email:              &tokenInfo.Email,
			FullName:           tokenInfo.Name,
			AvatarURL:          tokenInfo.Picture,
			Status:             models.UserStatusActive,
			IsProfileCompleted: false,
			IsTelegramLinked:   false,
			IsVerified:         true,
			VerificationMethod: "google",
			VerifiedAt:         &now,
		}

		if err := s.repo.CreateUser(user); err != nil {
			return nil, fmt.Errorf("foydalanuvchi yaratishda xatolik: %w", err)
		}
	}

	// 6. Status tekshirish
	if user.Status == models.UserStatusBlocked {
		return nil, errors.New("Hisobingiz bloklangan")
	}
	if user.Status == models.UserStatusDeleted {
		return nil, errors.New("Hisob o'chirilgan")
	}

	// 7. Sessiya yaratish
	var sessionID uint
	if s.sessionMgr != nil && sessionInfo != nil {
		expiresAt := time.Now().Add(168 * time.Hour)
		session, err := s.sessionMgr.CreateSession(user.ID, "user", "", sessionInfo.IPAddress, sessionInfo.UserAgent, expiresAt)
		if err != nil {
			return nil, fmt.Errorf("sessiya yaratishda xatolik: %w", err)
		}
		sessionID = session.ID

		// Yangi qurilmadan kirish bildirishnomasi
		if s.notifier != nil && !isNew {
			s.notifier.NewLogin(user.ID, session.DeviceName, session.IPAddress)
		}
	}

	// 8. JWT tokenlarni yaratish
	accessToken, refreshToken, err := s.jwt.GenerateTokenPair(user.ID, user.Username, sessionID)
	if err != nil {
		return nil, fmt.Errorf("token yaratishda xatolik: %w", err)
	}

	// Sessiya token hash ni yangilash
	if s.sessionMgr != nil && sessionID > 0 {
		s.sessionMgr.UpdateSessionTokenByID(sessionID, refreshToken)
	}

	// 9. Next step aniqlash
	nextStep := DetermineNextStep(user, s.isTelegramEnabled())

	return &GoogleAuthResponse{
		User: ToUserResponse(user),
		Tokens: TokenPair{
			AccessToken:  accessToken,
			RefreshToken: refreshToken,
			TokenType:    "Bearer",
		},
		NextStep: nextStep,
		IsNew:    isNew,
	}, nil
}
