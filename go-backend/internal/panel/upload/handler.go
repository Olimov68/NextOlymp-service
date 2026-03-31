package upload

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/nextolympservice/go-backend/config"
	"github.com/nextolympservice/go-backend/pkg/response"
)

type Handler struct {
	cfg *config.Config
}

func NewHandler(cfg *config.Config) *Handler {
	return &Handler{cfg: cfg}
}

// UploadImage handles image upload for panel (admin/superadmin)
// POST /api/v1/admin/upload/image
func (h *Handler) UploadImage(c *gin.Context) {
	file, err := c.FormFile("image")
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Rasm yuklanmadi", err)
		return
	}

	// Validate file type
	ext := strings.ToLower(filepath.Ext(file.Filename))
	allowed := map[string]bool{".jpg": true, ".jpeg": true, ".png": true, ".webp": true, ".gif": true}
	if !allowed[ext] {
		response.Error(c, http.StatusBadRequest, "Faqat rasm fayllari qabul qilinadi (jpg, jpeg, png, webp, gif)")
		return
	}

	// Validate file size (max 5MB)
	if file.Size > 5*1024*1024 {
		response.Error(c, http.StatusBadRequest, "Rasm hajmi 5MB dan oshmasligi kerak")
		return
	}

	// Create upload directory
	uploadDir := filepath.Join(h.cfg.Upload.Dir, "panel")
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		response.Error(c, http.StatusInternalServerError, "Fayl saqlash xatosi", err)
		return
	}

	// Generate unique filename using crypto/rand
	randBytes := make([]byte, 8)
	if _, err := rand.Read(randBytes); err != nil {
		response.Error(c, http.StatusInternalServerError, "Server xatosi", err)
		return
	}
	filename := fmt.Sprintf("%d_%s%s", time.Now().UnixNano(), hex.EncodeToString(randBytes), ext)
	fullPath := filepath.Join(uploadDir, filename)

	if err := c.SaveUploadedFile(file, fullPath); err != nil {
		response.Error(c, http.StatusInternalServerError, "Fayl saqlash xatosi", err)
		return
	}

	// Return full URL (Android/iOS ilovalar uchun to'liq URL kerak)
	baseURL := strings.TrimRight(h.cfg.App.BaseURL, "/")
	imageURL := fmt.Sprintf("%s/uploads/panel/%s", baseURL, filename)
	response.Success(c, http.StatusOK, "Rasm yuklandi", gin.H{
		"url":      imageURL,
		"filename": filename,
		"size":     file.Size,
	})
}
