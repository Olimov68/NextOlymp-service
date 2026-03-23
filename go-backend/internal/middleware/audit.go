package middleware

import (
	"fmt"
	"log"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/nextolympservice/go-backend/internal/models"
	"github.com/nextolympservice/go-backend/internal/utils"
	"gorm.io/gorm"
)

// AuditLogger — barcha yozish operatsiyalarini avtomatik loglaydi
// POST, PUT, PATCH, DELETE so'rovlarini audit_logs jadvaliga yozadi
func AuditLogger(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		method := c.Request.Method

		// Faqat yozish operatsiyalarini loglaymiz
		if method != "POST" && method != "PUT" && method != "PATCH" && method != "DELETE" {
			c.Next()
			return
		}

		// Avval handlerni bajaramiz
		c.Next()

		// Handler bajarilgandan keyin loglaymiz
		status := c.Writer.Status()
		// Faqat muvaffaqiyatli operatsiyalar (2xx)
		if status < 200 || status >= 300 {
			return
		}

		path := c.Request.URL.Path
		action := mapMethodToAction(method)
		resource := extractResource(path)

		// Actor ma'lumotlari
		var actorID uint
		var actorType string

		if staffID, exists := c.Get("staffID"); exists {
			actorID, _ = staffID.(uint)
			if role, exists := c.Get("staffRole"); exists {
				actorType, _ = role.(string)
			} else {
				actorType = "admin"
			}
		} else if userID, exists := c.Get("userID"); exists {
			actorID, _ = userID.(uint)
			actorType = "user"
		}

		details := fmt.Sprintf("%s %s -> %d", method, path, status)

		auditEntry := &models.AuditLog{
			ActorID:   actorID,
			ActorType: actorType,
			Action:    action,
			Resource:  resource,
			IPAddress: utils.GetClientIP(c.GetHeader("X-Forwarded-For"), c.Request.RemoteAddr),
			UserAgent: c.GetHeader("User-Agent"),
			Details:   details,
		}

		go func(entry *models.AuditLog) {
			if err := db.Create(entry).Error; err != nil {
				log.Printf("ERROR: failed to write audit log: %v (action=%s resource=%s actor=%d)",
					err, entry.Action, entry.Resource, entry.ActorID)
			}
		}(auditEntry)
	}
}

// mapMethodToAction — HTTP method dan action nomiga o'girish
func mapMethodToAction(method string) string {
	switch method {
	case "POST":
		return "create"
	case "PUT":
		return "update"
	case "PATCH":
		return "update"
	case "DELETE":
		return "delete"
	default:
		return strings.ToLower(method)
	}
}

// extractResource — URL path dan resource nomini olish
// /api/v1/superadmin/olympiads/5 -> "olympiads"
// /api/v1/auth/login -> "auth"
// /api/v1/panel/auth/login -> "panel_auth"
func extractResource(path string) string {
	// /api/v1/ prefiksini olib tashlash
	path = strings.TrimPrefix(path, "/api/v1/")

	parts := strings.Split(path, "/")
	if len(parts) == 0 {
		return "unknown"
	}

	// superadmin/olympiads/5 -> "olympiads"
	if parts[0] == "superadmin" && len(parts) > 1 {
		return parts[1]
	}

	// panel/auth/login -> "panel_auth"
	if parts[0] == "panel" && len(parts) > 1 {
		return "panel_" + parts[1]
	}

	// auth/login -> "auth"
	return parts[0]
}
