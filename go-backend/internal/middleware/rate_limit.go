package middleware

import (
	"context"
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/nextolympservice/go-backend/internal/cache"
	"github.com/nextolympservice/go-backend/pkg/response"
)

// RateLimitByIP — IP asosida rate limiting
func RateLimitByIP(limiter *cache.RateLimiter, checkFunc func(*cache.RateLimiter, context.Context, string) *cache.RateLimitResult) gin.HandlerFunc {
	return func(c *gin.Context) {
		if limiter == nil {
			c.Next()
			return
		}

		ip := c.ClientIP()
		result := checkFunc(limiter, c.Request.Context(), ip)

		// Rate limit headerlarni o'rnatish
		c.Header("X-RateLimit-Limit", strconv.Itoa(result.Limit))
		c.Header("X-RateLimit-Remaining", strconv.Itoa(result.Remaining))

		if !result.Allowed {
			c.Header("Retry-After", strconv.Itoa(int(result.RetryAfter.Seconds())))
			response.Error(c, http.StatusTooManyRequests, "So'rovlar limiti oshdi. Biroz kuting.", nil)
			c.Abort()
			return
		}

		c.Next()
	}
}

// RateLimitLogin — login uchun rate limiting (IP bo'yicha)
func RateLimitLogin(limiter *cache.RateLimiter) gin.HandlerFunc {
	return RateLimitByIP(limiter, func(l *cache.RateLimiter, ctx context.Context, ip string) *cache.RateLimitResult {
		return l.CheckLogin(ctx, ip)
	})
}

// RateLimitRegister — register uchun rate limiting (IP bo'yicha)
func RateLimitRegister(limiter *cache.RateLimiter) gin.HandlerFunc {
	return RateLimitByIP(limiter, func(l *cache.RateLimiter, ctx context.Context, ip string) *cache.RateLimitResult {
		return l.CheckRegister(ctx, ip)
	})
}

// RateLimitAPI — umumiy API rate limiting (user ID + IP)
func RateLimitAPI(limiter *cache.RateLimiter) gin.HandlerFunc {
	return func(c *gin.Context) {
		if limiter == nil {
			c.Next()
			return
		}

		// User ID bo'lsa shu bo'yicha, aks holda IP
		identifier := c.ClientIP()
		if userID, exists := c.Get("user_id"); exists {
			identifier = fmt.Sprintf("user_%v", userID)
		}

		result := limiter.CheckAPI(c.Request.Context(), identifier)

		c.Header("X-RateLimit-Limit", strconv.Itoa(result.Limit))
		c.Header("X-RateLimit-Remaining", strconv.Itoa(result.Remaining))

		if !result.Allowed {
			c.Header("Retry-After", strconv.Itoa(int(result.RetryAfter.Seconds())))
			response.Error(c, http.StatusTooManyRequests, "So'rovlar limiti oshdi. Biroz kuting.", nil)
			c.Abort()
			return
		}

		c.Next()
	}
}

// RateLimitPublic — public endpoint rate limiting (IP bo'yicha)
func RateLimitPublic(limiter *cache.RateLimiter) gin.HandlerFunc {
	return RateLimitByIP(limiter, func(l *cache.RateLimiter, ctx context.Context, ip string) *cache.RateLimitResult {
		return l.CheckPublic(ctx, ip)
	})
}

// RateLimitChat — chat xabarlari uchun rate limiting
func RateLimitChat(limiter *cache.RateLimiter) gin.HandlerFunc {
	return func(c *gin.Context) {
		if limiter == nil {
			c.Next()
			return
		}

		identifier := c.ClientIP()
		if userID, exists := c.Get("user_id"); exists {
			identifier = fmt.Sprintf("chat_user_%v", userID)
		}

		result := limiter.CheckChat(c.Request.Context(), identifier)

		if !result.Allowed {
			response.Error(c, http.StatusTooManyRequests, "Xabarlar limiti oshdi. Biroz kuting.", nil)
			c.Abort()
			return
		}

		c.Next()
	}
}
