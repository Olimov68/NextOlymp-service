package auth

import (
	"errors"
	"fmt"
	"time"

	"github.com/nextolympservice/go-backend/internal/models"
	"github.com/nextolympservice/go-backend/internal/shared/notifier"
	"github.com/nextolympservice/go-backend/internal/utils"
	"gorm.io/gorm"
)

type Service struct {
	repo       *Repository
	jwt        *utils.JWTManager
	sessionMgr *utils.SessionManager
	notifier   *notifier.Notifier
}

func NewService(repo *Repository, jwt *utils.JWTManager) *Service {
	return &Service{repo: repo, jwt: jwt}
}

// SetSessionManager — session manager ni sozlash (router.go da chaqiriladi)
func (s *Service) SetSessionManager(sm *utils.SessionManager) {
	s.sessionMgr = sm
}

// SetNotifier — notifier ni sozlash (router.go da chaqiriladi)
func (s *Service) SetNotifier(n *notifier.Notifier) {
	s.notifier = n
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
		NextStep: DetermineNextStep(user),
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
		NextStep: DetermineNextStep(user),
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
		NextStep: DetermineNextStep(user),
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
