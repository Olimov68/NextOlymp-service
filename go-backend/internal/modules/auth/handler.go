package auth

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/nextolympservice/go-backend/internal/models"
	"github.com/nextolympservice/go-backend/internal/utils"
	"github.com/nextolympservice/go-backend/pkg/response"
	"gorm.io/gorm"
)

type Handler struct {
	service *Service
	db      *gorm.DB
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

// SetDB — audit logging uchun db ni o'rnatish
func (h *Handler) SetDB(db *gorm.DB) {
	h.db = db
}

// getSessionInfo — Gin context dan sessiya ma'lumotlarini olish
func getSessionInfo(c *gin.Context) *SessionInfo {
	ip := utils.GetClientIP(c.GetHeader("X-Forwarded-For"), c.Request.RemoteAddr)
	ua := c.GetHeader("User-Agent")
	return &SessionInfo{
		IPAddress: ip,
		UserAgent: ua,
	}
}

// Register godoc
// @Summary      Register a new user
// @Tags         auth
// @Accept       json
// @Produce      json
// @Param        body body RegisterRequest true "Register request"
// @Success      201 {object} response.Response{data=RegisterResponse}
// @Failure      422 {object} response.Response
// @Router       /auth/register [post]
func (h *Handler) Register(c *gin.Context) {
	// Ro'yxatdan o'tish yoqilganligini tekshirish
	if h.db != nil {
		var setting models.GlobalSetting
		if h.db.First(&setting).Error == nil && !setting.RegistrationEnabled {
			response.Error(c, http.StatusForbidden, "Ro'yxatdan o'tish vaqtincha to'xtatilgan", nil)
			return
		}
	}

	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, utils.FormatValidationErrors(err))
		return
	}

	result, err := h.service.Register(&req, getSessionInfo(c))
	if err != nil {
		// Biznes logika xatoliklari 400 qaytaradi
		response.Error(c, http.StatusBadRequest, err.Error(), nil)
		return
	}

	// Audit log — yangi foydalanuvchi ro'yxatdan o'tdi
	if h.db != nil && result != nil {
		utils.LogUserAudit(h.db, c, result.User.ID, "register", "auth", nil,
			fmt.Sprintf("Yangi foydalanuvchi ro'yxatdan o'tdi: %s", req.Username))
	}

	response.Success(c, http.StatusCreated, "Registration successful", result)
}

// Login godoc
// @Summary      Login user
// @Tags         auth
// @Accept       json
// @Produce      json
// @Param        body body LoginRequest true "Login request"
// @Success      200 {object} response.Response{data=LoginResponse}
// @Failure      401 {object} response.Response
// @Router       /auth/login [post]
func (h *Handler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, utils.FormatValidationErrors(err))
		return
	}

	result, err := h.service.Login(&req, getSessionInfo(c))
	if err != nil {
		// Muvaffaqiyatsiz login urinishi ham loglanadi
		if h.db != nil {
			utils.LogSystemAudit(h.db, c, "login_failed", "auth",
				fmt.Sprintf("Login urinishi muvaffaqiyatsiz: %s — %s", req.Username, err.Error()))
		}
		response.Unauthorized(c, err.Error())
		return
	}

	// Audit log — muvaffaqiyatli login
	if h.db != nil && result != nil {
		utils.LogUserAudit(h.db, c, result.User.ID, "login", "auth", nil,
			fmt.Sprintf("Foydalanuvchi tizimga kirdi: %s", req.Username))
	}

	response.Success(c, http.StatusOK, "Login successful", result)
}

// Logout godoc
// @Summary      Logout user — barcha sessiyalarni bekor qilish
// @Tags         auth
// @Produce      json
// @Security     BearerAuth
// @Success      200 {object} response.Response
// @Router       /auth/logout [post]
func (h *Handler) Logout(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		response.Unauthorized(c, "")
		return
	}
	sessionID := c.GetUint("sessionID")
	h.service.Logout(userID.(uint), sessionID)

	// Audit log — logout
	if h.db != nil {
		utils.LogUserAudit(h.db, c, userID.(uint), "logout", "auth", nil, "Foydalanuvchi tizimdan chiqdi")
	}

	response.Success(c, http.StatusOK, "Logged out successfully", nil)
}

// RefreshToken godoc
// @Summary      Refresh access token
// @Tags         auth
// @Accept       json
// @Produce      json
// @Param        body body RefreshRequest true "Refresh token"
// @Success      200 {object} response.Response{data=TokenPair}
// @Failure      401 {object} response.Response
// @Router       /auth/refresh [post]
func (h *Handler) RefreshToken(c *gin.Context) {
	var req RefreshRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, utils.FormatValidationErrors(err))
		return
	}

	tokens, err := h.service.RefreshTokens(req.RefreshToken)
	if err != nil {
		response.Unauthorized(c, err.Error())
		return
	}

	response.Success(c, http.StatusOK, "Token refreshed", tokens)
}

// ChangePassword godoc
// @Summary      Change user password
// @Tags         auth
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body body ChangePasswordRequest true "Change password"
// @Success      200 {object} response.Response
// @Failure      400 {object} response.Response
// @Router       /profile/password [put]
func (h *Handler) ChangePassword(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		response.Unauthorized(c, "")
		return
	}

	var req ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, utils.FormatValidationErrors(err))
		return
	}

	if err := h.service.ChangePassword(userID.(uint), &req); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error(), nil)
		return
	}

	response.Success(c, http.StatusOK, "Parol muvaffaqiyatli o'zgartirildi", nil)
}

// Me godoc
// @Summary      Get current user info
// @Tags         auth
// @Produce      json
// @Security     BearerAuth
// @Success      200 {object} response.Response{data=MeResponse}
// @Failure      401 {object} response.Response
// @Router       /auth/me [get]
func (h *Handler) Me(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		response.Unauthorized(c, "")
		return
	}

	result, err := h.service.GetMe(userID.(uint))
	if err != nil {
		response.NotFound(c, err.Error())
		return
	}

	response.Success(c, http.StatusOK, "User info", result)
}
