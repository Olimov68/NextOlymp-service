package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"time"
)

// SessionData — Redis da saqlanadigan sessiya ma'lumotlari
type SessionData struct {
	SessionID  uint   `json:"session_id"`
	UserID     uint   `json:"user_id"`
	UserType   string `json:"user_type"`
	IsActive   bool   `json:"is_active"`
	DeviceName string `json:"device_name"`
	Browser    string `json:"browser"`
	OS         string `json:"os"`
	IPAddress  string `json:"ip_address"`
	ExpiresAt  int64  `json:"expires_at"`
}

// SessionStore — Redis-based session cache
type SessionStore struct {
	redis *RedisClient
}

// NewSessionStore — yangi session store yaratish
func NewSessionStore(redis *RedisClient) *SessionStore {
	return &SessionStore{redis: redis}
}

// sessionKey — session kalitini generatsiya qilish
func sessionKey(userID uint, userType string, sessionID uint) string {
	return fmt.Sprintf("session:%s:%d:%d", userType, userID, sessionID)
}

// userSessionsKey — user ning barcha sessiyalari uchun kalit
func userSessionsKey(userID uint, userType string) string {
	return fmt.Sprintf("user_sessions:%s:%d", userType, userID)
}

// CacheSession — sessiyani Redis ga yozish
func (s *SessionStore) CacheSession(ctx context.Context, data *SessionData) error {
	if s.redis == nil {
		return nil // Redis yo'q bo'lsa skip
	}

	jsonData, err := json.Marshal(data)
	if err != nil {
		return fmt.Errorf("session marshal xatolik: %w", err)
	}

	ttl := time.Until(time.Unix(data.ExpiresAt, 0))
	if ttl <= 0 {
		ttl = 24 * time.Hour // minimum 24 soat
	}

	key := sessionKey(data.UserID, data.UserType, data.SessionID)
	if err := s.redis.Set(ctx, key, string(jsonData), ttl); err != nil {
		return fmt.Errorf("session cache yozishda xatolik: %w", err)
	}

	// User sessions set ga qo'shish
	userKey := userSessionsKey(data.UserID, data.UserType)
	s.redis.Client.SAdd(ctx, userKey, data.SessionID)
	s.redis.Client.Expire(ctx, userKey, ttl)

	return nil
}

// GetSession — Redis dan sessiya olish
func (s *SessionStore) GetSession(ctx context.Context, userID uint, userType string, sessionID uint) (*SessionData, error) {
	if s.redis == nil {
		return nil, fmt.Errorf("redis unavailable")
	}

	key := sessionKey(userID, userType, sessionID)
	val, err := s.redis.Get(ctx, key)
	if err != nil {
		return nil, err // cache miss — DB dan olish kerak
	}

	var data SessionData
	if err := json.Unmarshal([]byte(val), &data); err != nil {
		return nil, fmt.Errorf("session unmarshal xatolik: %w", err)
	}

	// Muddati tugaganini tekshirish
	if data.ExpiresAt < time.Now().Unix() {
		s.InvalidateSession(ctx, userID, userType, sessionID)
		return nil, fmt.Errorf("session expired")
	}

	if !data.IsActive {
		return nil, fmt.Errorf("session inactive")
	}

	return &data, nil
}

// InvalidateSession — sessiyani Redis dan o'chirish
func (s *SessionStore) InvalidateSession(ctx context.Context, userID uint, userType string, sessionID uint) error {
	if s.redis == nil {
		return nil
	}

	key := sessionKey(userID, userType, sessionID)
	if err := s.redis.Del(ctx, key); err != nil {
		return err
	}

	// User sessions set dan olib tashlash
	userKey := userSessionsKey(userID, userType)
	s.redis.Client.SRem(ctx, userKey, sessionID)

	return nil
}

// InvalidateAllUserSessions — user ning barcha sessiyalarini bekor qilish
func (s *SessionStore) InvalidateAllUserSessions(ctx context.Context, userID uint, userType string) error {
	if s.redis == nil {
		return nil
	}

	userKey := userSessionsKey(userID, userType)

	// Set dan barcha session ID larni olish
	sessionIDs, err := s.redis.Client.SMembers(ctx, userKey).Result()
	if err != nil {
		return err
	}

	// Har bir session kalitini o'chirish
	for _, sid := range sessionIDs {
		key := fmt.Sprintf("session:%s:%d:%s", userType, userID, sid)
		s.redis.Del(ctx, key)
	}

	// User sessions set ni ham o'chirish
	s.redis.Del(ctx, userKey)

	return nil
}

// InvalidateAllExcept — hozirgi sessiyadan boshqa hammasini bekor qilish
func (s *SessionStore) InvalidateAllExcept(ctx context.Context, userID uint, userType string, keepSessionID uint) error {
	if s.redis == nil {
		return nil
	}

	userKey := userSessionsKey(userID, userType)
	sessionIDs, err := s.redis.Client.SMembers(ctx, userKey).Result()
	if err != nil {
		return err
	}

	keepStr := fmt.Sprintf("%d", keepSessionID)
	for _, sid := range sessionIDs {
		if sid != keepStr {
			key := fmt.Sprintf("session:%s:%d:%s", userType, userID, sid)
			s.redis.Del(ctx, key)
			s.redis.Client.SRem(ctx, userKey, sid)
		}
	}

	return nil
}
