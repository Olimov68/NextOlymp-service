package cache

import (
	"context"
	"fmt"
	"time"
)

// RateLimitConfig — rate limit sozlamalari
type RateLimitConfig struct {
	// Auth endpoints
	LoginMaxAttempts    int           // Login uchun max urinish (default: 5)
	LoginWindow         time.Duration // Login oyna (default: 1 minut)
	RegisterMaxAttempts int           // Register uchun max urinish (default: 3)
	RegisterWindow      time.Duration // Register oyna (default: 1 minut)

	// API endpoints
	APIMaxRequests int           // Umumiy API max so'rov (default: 100)
	APIWindow      time.Duration // API oyna (default: 1 minut)

	// Public endpoints
	PublicMaxRequests int           // Public max so'rov (default: 60)
	PublicWindow      time.Duration // Public oyna (default: 1 minut)

	// Chat
	ChatMaxMessages int           // Chat max xabar (default: 10)
	ChatWindow      time.Duration // Chat oyna (default: 1 minut)

	// Verification codes
	VerifyMaxAttempts int           // Verify max urinish (default: 5)
	VerifyWindow      time.Duration // Verify oyna (default: 5 minut)
}

// DefaultRateLimitConfig — standart sozlamalar
func DefaultRateLimitConfig() *RateLimitConfig {
	return &RateLimitConfig{
		LoginMaxAttempts:    5,
		LoginWindow:         1 * time.Minute,
		RegisterMaxAttempts: 3,
		RegisterWindow:      1 * time.Minute,
		APIMaxRequests:      100,
		APIWindow:           1 * time.Minute,
		PublicMaxRequests:    60,
		PublicWindow:         1 * time.Minute,
		ChatMaxMessages:     10,
		ChatWindow:          1 * time.Minute,
		VerifyMaxAttempts:   5,
		VerifyWindow:        5 * time.Minute,
	}
}

// RateLimiter — Redis-based rate limiter
type RateLimiter struct {
	redis  *RedisClient
	config *RateLimitConfig
}

// NewRateLimiter — yangi rate limiter yaratish
func NewRateLimiter(redis *RedisClient, cfg *RateLimitConfig) *RateLimiter {
	if cfg == nil {
		cfg = DefaultRateLimitConfig()
	}
	return &RateLimiter{
		redis:  redis,
		config: cfg,
	}
}

// RateLimitResult — tekshiruv natijasi
type RateLimitResult struct {
	Allowed    bool
	Remaining  int
	Limit      int
	RetryAfter time.Duration
}

// Check — umumiy rate limit tekshiruvi (sliding window counter)
func (rl *RateLimiter) Check(ctx context.Context, key string, maxAttempts int, window time.Duration) *RateLimitResult {
	if rl.redis == nil {
		return &RateLimitResult{Allowed: true, Remaining: maxAttempts, Limit: maxAttempts}
	}

	redisKey := fmt.Sprintf("ratelimit:%s", key)

	// Hisoblagichni oshirish
	count, err := rl.redis.Incr(ctx, redisKey)
	if err != nil {
		// Redis xatolik bo'lsa ruxsat berish (fail-open)
		return &RateLimitResult{Allowed: true, Remaining: maxAttempts, Limit: maxAttempts}
	}

	// Birinchi so'rov — TTL o'rnatish
	if count == 1 {
		rl.redis.Expire(ctx, redisKey, window)
	}

	remaining := maxAttempts - int(count)
	if remaining < 0 {
		remaining = 0
	}

	if int(count) > maxAttempts {
		// TTL qolgan vaqtini hisoblash
		ttl, _ := rl.redis.TTL(ctx, redisKey)
		return &RateLimitResult{
			Allowed:    false,
			Remaining:  0,
			Limit:      maxAttempts,
			RetryAfter: ttl,
		}
	}

	return &RateLimitResult{
		Allowed:   true,
		Remaining: remaining,
		Limit:     maxAttempts,
	}
}

// CheckLogin — login rate limit
func (rl *RateLimiter) CheckLogin(ctx context.Context, identifier string) *RateLimitResult {
	key := fmt.Sprintf("login:%s", identifier)
	return rl.Check(ctx, key, rl.config.LoginMaxAttempts, rl.config.LoginWindow)
}

// CheckRegister — register rate limit
func (rl *RateLimiter) CheckRegister(ctx context.Context, identifier string) *RateLimitResult {
	key := fmt.Sprintf("register:%s", identifier)
	return rl.Check(ctx, key, rl.config.RegisterMaxAttempts, rl.config.RegisterWindow)
}

// CheckAPI — umumiy API rate limit
func (rl *RateLimiter) CheckAPI(ctx context.Context, identifier string) *RateLimitResult {
	key := fmt.Sprintf("api:%s", identifier)
	return rl.Check(ctx, key, rl.config.APIMaxRequests, rl.config.APIWindow)
}

// CheckPublic — public endpoint rate limit
func (rl *RateLimiter) CheckPublic(ctx context.Context, identifier string) *RateLimitResult {
	key := fmt.Sprintf("public:%s", identifier)
	return rl.Check(ctx, key, rl.config.PublicMaxRequests, rl.config.PublicWindow)
}

// CheckChat — chat rate limit
func (rl *RateLimiter) CheckChat(ctx context.Context, identifier string) *RateLimitResult {
	key := fmt.Sprintf("chat:%s", identifier)
	return rl.Check(ctx, key, rl.config.ChatMaxMessages, rl.config.ChatWindow)
}

// CheckVerify — verification code rate limit
func (rl *RateLimiter) CheckVerify(ctx context.Context, identifier string) *RateLimitResult {
	key := fmt.Sprintf("verify:%s", identifier)
	return rl.Check(ctx, key, rl.config.VerifyMaxAttempts, rl.config.VerifyWindow)
}

// Reset — ma'lum kalit uchun hisoblagichni tiklash
func (rl *RateLimiter) Reset(ctx context.Context, key string) error {
	if rl.redis == nil {
		return nil
	}
	redisKey := fmt.Sprintf("ratelimit:%s", key)
	return rl.redis.Del(ctx, redisKey)
}

// GetConfig — joriy sozlamalar
func (rl *RateLimiter) GetConfig() *RateLimitConfig {
	return rl.config
}
