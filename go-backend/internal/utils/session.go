package utils

import (
	"crypto/sha256"
	"fmt"
	"log"
	"time"

	"github.com/nextolympservice/go-backend/internal/models"
	"gorm.io/gorm"
)

// SessionManager — sessiya boshqarish
type SessionManager struct {
	db *gorm.DB
}

func NewSessionManager(db *gorm.DB) *SessionManager {
	return &SessionManager{db: db}
}

// HashToken — token hashini yaratish
func HashToken(token string) string {
	h := sha256.Sum256([]byte(token))
	return fmt.Sprintf("%x", h)
}

// CreateSession — yangi sessiya yaratish
// SecuritySetting.OneDevicePerSession sozlamasiga qarab eskisini bekor qiladi
func (sm *SessionManager) CreateSession(userID uint, userType, refreshToken, ipAddress, userAgent string, expiresAt time.Time) (*models.Session, error) {
	// SecuritySetting dan one_device_per_session ni tekshirish
	var secSetting models.SecuritySetting
	oneDevicePerSession := true // default: faqat bitta sessiya
	if sm.db.First(&secSetting).Error == nil {
		oneDevicePerSession = secSetting.OneDevicePerSession
	}

	if oneDevicePerSession {
		// Oldingi barcha aktiv sessiyalarni bekor qilish — faqat 1 qurilma
		sm.db.Model(&models.Session{}).
			Where("user_id = ? AND user_type = ? AND is_active = true", userID, userType).
			Updates(map[string]interface{}{
				"is_active": false,
			})
	}

	// 2. Qurilma ma'lumotlarini aniqlash
	deviceInfo := ParseUserAgent(userAgent)

	// 3. Yangi sessiya yaratish
	session := &models.Session{
		UserID:       userID,
		UserType:     userType,
		TokenHash:    HashToken(refreshToken),
		IPAddress:    ipAddress,
		UserAgent:    userAgent,
		DeviceName:   deviceInfo.DeviceName,
		Browser:      deviceInfo.Browser,
		OS:           deviceInfo.OS,
		DeviceType:   deviceInfo.DeviceType,
		Location:     "",  // IP-based geolocation (kelajakda)
		IsActive:     true,
		LastActiveAt: time.Now(),
		ExpiresAt:    expiresAt,
	}

	if err := sm.db.Create(session).Error; err != nil {
		return nil, fmt.Errorf("sessiya yaratishda xatolik: %w", err)
	}

	return session, nil
}

// ValidateSession — sessiya haqiqiyligini tekshirish
// sessionID bo'yicha aniq sessiyani tekshiradi (JWT ichidan keladi)
func (sm *SessionManager) ValidateSession(userID uint, userType string, sessionID uint) (*models.Session, bool) {
	var session models.Session
	err := sm.db.Where(
		"id = ? AND user_id = ? AND user_type = ? AND is_active = true AND expires_at > ?",
		sessionID, userID, userType, time.Now(),
	).First(&session).Error

	if err != nil {
		return nil, false
	}

	// LastActiveAt yangilash (5 minutda bir)
	if time.Since(session.LastActiveAt) > 5*time.Minute {
		sm.db.Model(&session).Update("last_active_at", time.Now())
	}

	return &session, true
}

// InvalidateSession — sessiyani bekor qilish
func (sm *SessionManager) InvalidateSession(sessionID, userID uint) error {
	result := sm.db.Model(&models.Session{}).
		Where("id = ? AND user_id = ?", sessionID, userID).
		Update("is_active", false)
	if result.RowsAffected == 0 {
		return fmt.Errorf("sessiya topilmadi")
	}
	return nil
}

// InvalidateAllOtherSessions — hozirgi sessiyadan boshqa hammasini bekor qilish
func (sm *SessionManager) InvalidateAllOtherSessions(currentSessionID, userID uint) int64 {
	result := sm.db.Model(&models.Session{}).
		Where("user_id = ? AND id != ? AND is_active = true", userID, currentSessionID).
		Update("is_active", false)
	return result.RowsAffected
}

// InvalidateAllSessions — barcha sessiyalarni bekor qilish
func (sm *SessionManager) InvalidateAllSessions(userID uint) {
	sm.db.Model(&models.Session{}).
		Where("user_id = ? AND is_active = true", userID).
		Update("is_active", false)
}

// GetUserSessions — foydalanuvchi sessiyalari (hamma, shu jumladan nofaol)
func (sm *SessionManager) GetUserSessions(userID uint) []models.Session {
	var sessions []models.Session
	sm.db.Where("user_id = ?", userID).
		Order("is_active DESC, last_active_at DESC").
		Limit(20).
		Find(&sessions)
	return sessions
}

// GetActiveSessions — faqat aktiv sessiyalar
func (sm *SessionManager) GetActiveSessions(userID uint) []models.Session {
	var sessions []models.Session
	sm.db.Where("user_id = ? AND is_active = true AND expires_at > ?", userID, time.Now()).
		Order("last_active_at DESC").
		Find(&sessions)
	return sessions
}

// UpdateSessionTokenByID — session ID bo'yicha token hash ni yangilash (login/register da ishlatiladi)
func (sm *SessionManager) UpdateSessionTokenByID(sessionID uint, refreshToken string) {
	sm.db.Model(&models.Session{}).
		Where("id = ?", sessionID).
		Update("token_hash", HashToken(refreshToken))
}

// UpdateSessionToken — refresh token yangilanganda session hash ni yangilash
func (sm *SessionManager) UpdateSessionToken(userID uint, userType, oldTokenHash, newRefreshToken string, newExpiresAt time.Time) {
	sm.db.Model(&models.Session{}).
		Where("user_id = ? AND user_type = ? AND is_active = true", userID, userType).
		Updates(map[string]interface{}{
			"token_hash":     HashToken(newRefreshToken),
			"last_active_at": time.Now(),
			"expires_at":     newExpiresAt,
		})
}

// CleanupExpired — muddati tugagan sessiyalarni tozalash
func (sm *SessionManager) CleanupExpired() {
	result := sm.db.Model(&models.Session{}).
		Where("expires_at < ? AND is_active = true", time.Now()).
		Update("is_active", false)
	if result.RowsAffected > 0 {
		log.Printf("[SessionManager] %d expired session(s) cleaned up", result.RowsAffected)
	}
}
