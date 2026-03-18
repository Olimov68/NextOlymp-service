package chat

import (
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/nextolympservice/go-backend/internal/models"
	"github.com/nextolympservice/go-backend/pkg/response"
	"gorm.io/gorm"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // Production da aniq origin tekshirish kerak
	},
}

// Handler — chat handler
type Handler struct {
	db  *gorm.DB
	hub *Hub
}

// NewHandler — yangi chat handler yaratish
func NewHandler(db *gorm.DB, hub *Hub) *Handler {
	return &Handler{db: db, hub: hub}
}

// GetHub — hub ni olish
func (h *Handler) GetHub() *Hub {
	return h.hub
}

// HandleWebSocket — WebSocket upgrade va client yaratish
func (h *Handler) HandleWebSocket(c *gin.Context) {
	// Auth tekshirish — query param orqali token
	userID, _ := c.Get("user_id")
	uid, ok := userID.(uint)
	if !ok || uid == 0 {
		response.Error(c, http.StatusUnauthorized, "Avtorizatsiya talab qilinadi", nil)
		return
	}

	// User ban tekshirish
	var ban models.ChatBan
	if h.db.Where("user_id = ? AND is_active = true AND (expires_at IS NULL OR expires_at > ?)", uid, time.Now()).First(&ban).Error == nil {
		response.Error(c, http.StatusForbidden, "Siz chatdan bloklangansiz", nil)
		return
	}

	// Chat ochiqligini tekshirish
	var chatSetting models.ChatSetting
	if h.db.First(&chatSetting).Error == nil && !chatSetting.IsChatOpen {
		response.Error(c, http.StatusForbidden, "Chat vaqtincha yopilgan", nil)
		return
	}

	// User ma'lumotlarini olish
	var user models.User
	if h.db.First(&user, uid).Error != nil {
		response.Error(c, http.StatusNotFound, "Foydalanuvchi topilmadi", nil)
		return
	}

	var profile models.Profile
	h.db.Where("user_id = ?", uid).First(&profile)

	username := user.Username
	if profile.FirstName != "" {
		username = profile.FirstName
		if profile.LastName != "" {
			username += " " + profile.LastName
		}
	}

	photoURL := ""
	if profile.PhotoURL != "" {
		photoURL = profile.PhotoURL
	}

	// WebSocket upgrade
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("[Chat] WebSocket upgrade error: %v", err)
		return
	}

	client := NewClient(h.hub, conn, uid, username, photoURL, "user")
	h.hub.register <- client

	go client.WritePump()
	go client.ReadPump(h.onMessage)
}

// onMessage — client dan kelgan xabarni qayta ishlash
func (h *Handler) onMessage(client *Client, msg *IncomingMessage) {
	if msg.Type != "message" || strings.TrimSpace(msg.Content) == "" {
		return
	}

	// Content uzunligini cheklash
	content := strings.TrimSpace(msg.Content)
	if len(content) > 500 {
		content = content[:500]
	}

	// Basic sanitize — HTML taglarni olib tashlash
	content = sanitizeMessage(content)

	// DB ga saqlash
	chatMsg := models.ChatMessage{
		UserID:  client.userID,
		Content: content,
		Type:    "text",
	}

	if err := h.db.Create(&chatMsg).Error; err != nil {
		log.Printf("[Chat] Message save error: %v", err)
		return
	}

	// Broadcast
	h.hub.Broadcast(&BroadcastMessage{
		Type: "new_message",
		Payload: map[string]interface{}{
			"id":         chatMsg.ID,
			"user_id":    client.userID,
			"username":   client.username,
			"photo_url":  client.photoURL,
			"content":    content,
			"type":       "text",
			"role":       client.role,
			"created_at": chatMsg.CreatedAt.Format(time.RFC3339),
		},
	})
}

// GetMessages — chat tarixini olish (REST)
func (h *Handler) GetMessages(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 50
	}

	offset := (page - 1) * limit

	var messages []models.ChatMessage
	var total int64

	h.db.Model(&models.ChatMessage{}).Where("is_deleted = false").Count(&total)

	h.db.Where("is_deleted = false").
		Preload("User", func(db *gorm.DB) *gorm.DB {
			return db.Select("id, username, status")
		}).
		Order("created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&messages)

	// Profile ma'lumotlarini qo'shish
	type MessageResponse struct {
		ID        uint   `json:"id"`
		UserID    uint   `json:"user_id"`
		Username  string `json:"username"`
		PhotoURL  string `json:"photo_url"`
		Content   string `json:"content"`
		Type      string `json:"type"`
		CreatedAt string `json:"created_at"`
	}

	var result []MessageResponse
	for _, msg := range messages {
		var profile models.Profile
		h.db.Where("user_id = ?", msg.UserID).First(&profile)

		username := msg.User.Username
		if profile.FirstName != "" {
			username = profile.FirstName
			if profile.LastName != "" {
				username += " " + profile.LastName
			}
		}

		result = append(result, MessageResponse{
			ID:        msg.ID,
			UserID:    msg.UserID,
			Username:  username,
			PhotoURL:  profile.PhotoURL,
			Content:   msg.Content,
			Type:      msg.Type,
			CreatedAt: msg.CreatedAt.Format(time.RFC3339),
		})
	}

	response.Success(c, http.StatusOK, "Chat xabarlari", gin.H{
		"messages": result,
		"meta": gin.H{
			"total":   total,
			"page":    page,
			"limit":   limit,
			"pages":   (total + int64(limit) - 1) / int64(limit),
			"online":  h.hub.OnlineCount(),
		},
	})
}

// GetOnlineCount — online userlar soni
func (h *Handler) GetOnlineCount(c *gin.Context) {
	response.Success(c, http.StatusOK, "Online count", gin.H{
		"count": h.hub.OnlineCount(),
	})
}

// ─── ADMIN MODERATION ────────────────────────────────────────

// AdminDeleteMessage — xabarni o'chirish
func (h *Handler) AdminDeleteMessage(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Noto'g'ri ID", nil)
		return
	}

	staffID, _ := c.Get("staff_id")

	var msg models.ChatMessage
	if h.db.First(&msg, id).Error != nil {
		response.Error(c, http.StatusNotFound, "Xabar topilmadi", nil)
		return
	}

	sid, _ := staffID.(uint)
	h.db.Model(&msg).Updates(map[string]interface{}{
		"is_deleted": true,
		"deleted_by": sid,
	})

	// Broadcast delete event
	h.hub.Broadcast(&BroadcastMessage{
		Type: "message_deleted",
		Payload: map[string]interface{}{
			"id": msg.ID,
		},
	})

	response.Success(c, http.StatusOK, "Xabar o'chirildi", nil)
}

// AdminBanUser — foydalanuvchini chatdan bloklash
func (h *Handler) AdminBanUser(c *gin.Context) {
	userID, err := strconv.ParseUint(c.Param("user_id"), 10, 64)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Noto'g'ri user ID", nil)
		return
	}

	var body struct {
		Reason    string `json:"reason"`
		Type      string `json:"type"`       // mute, ban
		Duration  int    `json:"duration"`   // soatlarda, 0 = doimiy
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		response.Error(c, http.StatusBadRequest, "Noto'g'ri ma'lumot", nil)
		return
	}

	if body.Type == "" {
		body.Type = "ban"
	}

	staffID, _ := c.Get("staff_id")
	sid, _ := staffID.(uint)

	ban := models.ChatBan{
		UserID:   uint(userID),
		BannedBy: sid,
		Reason:   body.Reason,
		Type:     body.Type,
		IsActive: true,
	}

	if body.Duration > 0 {
		expires := time.Now().Add(time.Duration(body.Duration) * time.Hour)
		ban.ExpiresAt = &expires
	}

	h.db.Create(&ban)

	// Broadcast ban event
	h.hub.Broadcast(&BroadcastMessage{
		Type: "user_banned",
		Payload: map[string]interface{}{
			"user_id": userID,
			"type":    body.Type,
		},
	})

	response.Success(c, http.StatusOK, "Foydalanuvchi bloklandi", nil)
}

// AdminUnbanUser — ban bekor qilish
func (h *Handler) AdminUnbanUser(c *gin.Context) {
	userID, err := strconv.ParseUint(c.Param("user_id"), 10, 64)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Noto'g'ri user ID", nil)
		return
	}

	h.db.Model(&models.ChatBan{}).
		Where("user_id = ? AND is_active = true", userID).
		Update("is_active", false)

	response.Success(c, http.StatusOK, "Ban bekor qilindi", nil)
}

// AdminToggleChat — chatni yoqish/o'chirish
func (h *Handler) AdminToggleChat(c *gin.Context) {
	var body struct {
		IsOpen bool `json:"is_open"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		response.Error(c, http.StatusBadRequest, "Noto'g'ri ma'lumot", nil)
		return
	}

	var setting models.ChatSetting
	if h.db.First(&setting).Error != nil {
		setting = models.ChatSetting{IsChatOpen: body.IsOpen}
		h.db.Create(&setting)
	} else {
		h.db.Model(&setting).Update("is_chat_open", body.IsOpen)
	}

	// Broadcast chat status
	h.hub.Broadcast(&BroadcastMessage{
		Type: "chat_status",
		Payload: map[string]interface{}{
			"is_open": body.IsOpen,
		},
	})

	status := "yopildi"
	if body.IsOpen {
		status = "ochildi"
	}
	response.Success(c, http.StatusOK, "Chat "+status, nil)
}

// AdminGetBannedUsers — bloklangan userlar ro'yxati
func (h *Handler) AdminGetBannedUsers(c *gin.Context) {
	var bans []models.ChatBan
	h.db.Where("is_active = true").Preload("User").Order("created_at DESC").Find(&bans)
	response.Success(c, http.StatusOK, "Bloklangan foydalanuvchilar", gin.H{"bans": bans})
}

// sanitizeMessage — basic HTML sanitization
func sanitizeMessage(s string) string {
	s = strings.ReplaceAll(s, "<", "&lt;")
	s = strings.ReplaceAll(s, ">", "&gt;")
	s = strings.ReplaceAll(s, "\"", "&quot;")
	return s
}
