package middleware

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

// CORS — Cross-Origin Resource Sharing middleware (default: AllowAllOrigins)
func CORS() gin.HandlerFunc {
	return cors.New(cors.Config{
		AllowAllOrigins:  true,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Requested-With"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: false,
		MaxAge:           86400,
	})
}

// CORSWithOrigins — aniq origin lar bilan CORS (production uchun)
func CORSWithOrigins(origins []string) gin.HandlerFunc {
	return cors.New(cors.Config{
		AllowOrigins:     origins,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Requested-With"},
		ExposeHeaders:    []string{"Content-Length", "X-RateLimit-Limit", "X-RateLimit-Remaining", "Retry-After"},
		AllowCredentials: true,
		MaxAge:           86400,
	})
}
