package middleware

import (
	"github.com/gin-gonic/gin"
)

// SecurityHeaders — xavfsizlik headerlarini o'rnatish
func SecurityHeaders() gin.HandlerFunc {
	return func(c *gin.Context) {
		// XSS himoya
		c.Header("X-Content-Type-Options", "nosniff")
		c.Header("X-Frame-Options", "DENY")
		c.Header("X-XSS-Protection", "1; mode=block")

		// Referrer policy
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")

		// Content Security Policy
		// Next.js requires 'unsafe-inline' for styles; 'unsafe-eval' is removed from scripts for security
		c.Header("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https: wss:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'")

		// HSTS (production uchun)
		c.Header("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload")

		// Permissions policy
		c.Header("Permissions-Policy", "camera=(), microphone=(), geolocation=()")

		c.Next()
	}
}
