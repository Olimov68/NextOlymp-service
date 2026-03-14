package middleware

import (
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/nextolympservice/go-backend/internal/models"
	"github.com/nextolympservice/go-backend/internal/utils"
	"github.com/nextolympservice/go-backend/pkg/response"
	"gorm.io/gorm"
)

// AuthRequired — JWT tokenni tekshiradi, sessiyani tekshiradi va userID ni context'ga qo'yadi
func AuthRequired(jwt *utils.JWTManager, db *gorm.DB) gin.HandlerFunc {
	sessionMgr := utils.NewSessionManager(db)

	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			response.Unauthorized(c, "Authorization header is required")
			c.Abort()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			response.Unauthorized(c, "Authorization header must be: Bearer {token}")
			c.Abort()
			return
		}

		claims, err := jwt.ValidateAccessToken(parts[1])
		if err != nil {
			response.Unauthorized(c, "Invalid or expired token")
			c.Abort()
			return
		}

		// User hali mavjudligini va blocked emasligini tekshirish
		var user models.User
		if err := db.First(&user, claims.UserID).Error; err != nil {
			response.Unauthorized(c, "User not found")
			c.Abort()
			return
		}

		if user.Status == models.UserStatusBlocked {
			response.Forbidden(c, "Your account has been blocked")
			c.Abort()
			return
		}

		if user.Status == models.UserStatusDeleted {
			response.Unauthorized(c, "Account not found")
			c.Abort()
			return
		}

		// Sessiya haqiqiyligini tekshirish — JWT ichidagi session_id bo'yicha
		session, valid := sessionMgr.ValidateSession(user.ID, "user", claims.SessionID)
		if !valid {
			response.Unauthorized(c, "Session expired or invalidated. Please login again")
			c.Abort()
			return
		}

		// Context'ga user ma'lumotlarini qo'yish
		c.Set("userID", user.ID)
		c.Set("username", user.Username)
		c.Set("userStatus", user.Status)
		c.Set("isProfileCompleted", user.IsProfileCompleted)
		c.Set("isTelegramLinked", user.IsTelegramLinked)
		c.Set("sessionID", session.ID)

		c.Next()
	}
}

// ProfileRequired — profil to'ldirilganligini tekshiradi
func ProfileRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		isCompleted, exists := c.Get("isProfileCompleted")
		if !exists || !isCompleted.(bool) {
			response.Forbidden(c, "Profile must be completed before accessing this resource")
			c.Abort()
			return
		}
		c.Next()
	}
}

// TelegramRequired — telegram ulanganligini tekshiradi
func TelegramRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		isLinked, exists := c.Get("isTelegramLinked")
		if !exists || !isLinked.(bool) {
			response.Forbidden(c, "Telegram account must be linked before accessing this resource")
			c.Abort()
			return
		}
		c.Next()
	}
}

// FullAccessRequired — hammasi tugallangan user uchun
// auth + profile + telegram
func FullAccessRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		isProfileCompleted, _ := c.Get("isProfileCompleted")
		isTelegramLinked, _ := c.Get("isTelegramLinked")

		if !isProfileCompleted.(bool) {
			response.Forbidden(c, "Profile must be completed")
			c.Abort()
			return
		}
		if !isTelegramLinked.(bool) {
			response.Forbidden(c, "Telegram account must be linked")
			c.Abort()
			return
		}

		c.Next()
	}
}
