package middleware

import (
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/nextolympservice/go-backend/internal/models"
	"github.com/nextolympservice/go-backend/pkg/response"
	"gorm.io/gorm"
)

// PermissionRequired — granular permission tekshiradi
// superadmin → always pass
// admin → DB dan StaffPermission tekshiradi (exact code YOKI module.manage)
func PermissionRequired(db *gorm.DB, requiredCode string) gin.HandlerFunc {
	// modulni koddan olish: "olympiads.create" → "olympiads"
	module := requiredCode
	if idx := strings.Index(requiredCode, "."); idx > 0 {
		module = requiredCode[:idx]
	}
	manageCode := module + ".manage"

	return func(c *gin.Context) {
		role, _ := c.Get("staffRole")
		roleStr, _ := role.(string)

		// Superadmin barcha ruxsatlarga ega
		if roleStr == string(models.StaffRoleSuperAdmin) {
			c.Next()
			return
		}

		staffID, exists := c.Get("staffID")
		if !exists {
			response.Forbidden(c, "Permission denied")
			c.Abort()
			return
		}

		// StaffPermission jadvaldan tekshirish
		var count int64
		db.Model(&models.StaffPermission{}).
			Joins("JOIN permission ON permission.id = staff_permission.permission_id").
			Where("staff_permission.staff_user_id = ? AND (permission.code = ? OR permission.code = ?)",
				staffID.(uint), requiredCode, manageCode).
			Count(&count)

		if count == 0 {
			response.Forbidden(c, "You do not have permission: "+requiredCode)
			c.Abort()
			return
		}

		c.Next()
	}
}

// GetStaffPermissionCodes — admin ruxsat kodlarini oladi
// superadmin uchun barcha kodlar qaytadi
func GetStaffPermissionCodes(db *gorm.DB, staffID uint, role string) []string {
	if role == string(models.StaffRoleSuperAdmin) {
		return GetAllPermissionCodes(db)
	}

	var codes []string
	db.Model(&models.StaffPermission{}).
		Select("permission.code").
		Joins("JOIN permission ON permission.id = staff_permission.permission_id").
		Where("staff_permission.staff_user_id = ?", staffID).
		Pluck("permission.code", &codes)

	// manage permission bo'lsa, shu moduldagi barcha actionlarni qo'shish
	expanded := make(map[string]bool)
	for _, code := range codes {
		expanded[code] = true
	}

	for _, code := range codes {
		if strings.HasSuffix(code, ".manage") {
			module := strings.TrimSuffix(code, ".manage")
			// Shu modulning barcha permissionlarini qo'shish
			var moduleCodes []string
			db.Model(&models.Permission{}).
				Where("module = ?", module).
				Pluck("code", &moduleCodes)
			for _, mc := range moduleCodes {
				expanded[mc] = true
			}
		}
	}

	result := make([]string, 0, len(expanded))
	for code := range expanded {
		result = append(result, code)
	}
	return result
}

// GetAllPermissionCodes — barcha permission kodlarini qaytaradi
func GetAllPermissionCodes(db *gorm.DB) []string {
	var codes []string
	db.Model(&models.Permission{}).Pluck("code", &codes)
	return codes
}
