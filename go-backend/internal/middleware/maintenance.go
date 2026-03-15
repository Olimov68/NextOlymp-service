package middleware

import (
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/nextolympservice/go-backend/internal/models"
	"github.com/nextolympservice/go-backend/pkg/response"
	"gorm.io/gorm"
)

// MaintenanceMode — texnik xizmat rejimini tekshiradi
// Admin/superadmin panel va public endpointlar ishlaydi, foydalanuvchi API'lari bloklanadi
func MaintenanceMode(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		path := c.Request.URL.Path

		// Panel va superadmin routelarni o'tkazib yuborish
		if strings.Contains(path, "/panel/") || strings.Contains(path, "/superadmin/") || strings.Contains(path, "/admin/") {
			c.Next()
			return
		}

		// Public endpointlarni o'tkazib yuborish (stats, settings, health)
		if strings.HasSuffix(path, "/stats") || strings.HasSuffix(path, "/settings/public") || path == "/health" {
			c.Next()
			return
		}

		// Auth login/register/refresh ham o'tkazib yuboriladi (lekin register bloklanishi mumkin)
		if strings.Contains(path, "/auth/login") || strings.Contains(path, "/auth/refresh") || strings.Contains(path, "/auth/recovery") {
			c.Next()
			return
		}

		// Bazadan maintenance_mode ni tekshirish
		var setting models.GlobalSetting
		if db.First(&setting).Error == nil && setting.MaintenanceMode {
			response.Error(c, 503, "Platforma texnik xizmat rejimida. Iltimos, keyinroq urinib ko'ring.", nil)
			c.Abort()
			return
		}

		c.Next()
	}
}
