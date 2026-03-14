package utils

import (
	"github.com/gin-gonic/gin"
	"github.com/nextolympservice/go-backend/internal/models"
	"gorm.io/gorm"
)

// LogAudit — staff (admin/superadmin) harakatlari uchun
func LogAudit(db *gorm.DB, c *gin.Context, action, resource string, resourceID *uint, details string) {
	staffID, _ := c.Get("staffID")
	role, _ := c.Get("staffRole")

	sid, _ := staffID.(uint)
	roleStr, _ := role.(string)

	log := &models.AuditLog{
		ActorID:    sid,
		ActorType:  roleStr,
		Action:     action,
		Resource:   resource,
		ResourceID: resourceID,
		IPAddress:  GetClientIP(c.GetHeader("X-Forwarded-For"), c.Request.RemoteAddr),
		UserAgent:  c.GetHeader("User-Agent"),
		Details:    details,
	}
	go db.Create(log) // Background da yozish — response ni sekinlashtirmaslik uchun
}

// LogUserAudit — foydalanuvchi harakatlari uchun (login, logout, register)
func LogUserAudit(db *gorm.DB, c *gin.Context, userID uint, action, resource string, resourceID *uint, details string) {
	log := &models.AuditLog{
		ActorID:    userID,
		ActorType:  "user",
		Action:     action,
		Resource:   resource,
		ResourceID: resourceID,
		IPAddress:  GetClientIP(c.GetHeader("X-Forwarded-For"), c.Request.RemoteAddr),
		UserAgent:  c.GetHeader("User-Agent"),
		Details:    details,
	}
	go db.Create(log)
}

// LogSystemAudit — tizim harakatlari uchun (aktorsiz)
func LogSystemAudit(db *gorm.DB, c *gin.Context, action, resource string, details string) {
	log := &models.AuditLog{
		ActorID:   0,
		ActorType: "system",
		Action:    action,
		Resource:  resource,
		IPAddress: GetClientIP(c.GetHeader("X-Forwarded-For"), c.Request.RemoteAddr),
		UserAgent: c.GetHeader("User-Agent"),
		Details:   details,
	}
	go db.Create(log)
}
