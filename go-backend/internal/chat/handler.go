package chat

import (
	"fmt"
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
	// Auth tekshirish — middleware orqali
	userID, _ := c.Get("userID")
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

	// Yomon so'zlar filtri
	if ContainsProfanity(content) {
		// Moderation logga yozish — kim, nima yozmoqchi bo'lgani
		h.db.Create(&models.ChatModerationLog{
			StaffID:  0, // avtomatik tizim tomonidan
			Action:   "profanity_blocked",
			TargetID: client.userID,
			Reason:   "Taqiqlangan so'z ishlatildi",
			Details:  fmt.Sprintf("User: %s (ID:%d) | Xabar: %s", client.username, client.userID, content),
		})

		client.send <- &BroadcastMessage{
			Type: "error",
			Payload: map[string]interface{}{
				"code":    "profanity",
				"message": "Xabaringizda taqiqlangan so'zlar mavjud. Iltimos, hurmatli munosabatda bo'ling.",
			},
		}
		return
	}

	// DB ga saqlash
	chatMsg := models.ChatMessage{
		UserID:    client.userID,
		Content:   content,
		Type:      "text",
		ReplyToID: msg.ReplyToID,
	}

	if err := h.db.Create(&chatMsg).Error; err != nil {
		log.Printf("[Chat] Message save error: %v", err)
		return
	}

	// Reply ma'lumotlarini olish
	var replyData map[string]interface{}
	if msg.ReplyToID != nil && *msg.ReplyToID > 0 {
		var replyMsg models.ChatMessage
		if h.db.Preload("User").First(&replyMsg, *msg.ReplyToID).Error == nil {
			var replyProfile models.Profile
			h.db.Where("user_id = ?", replyMsg.UserID).First(&replyProfile)
			replyUsername := replyMsg.User.Username
			if replyProfile.FirstName != "" {
				replyUsername = replyProfile.FirstName
			}
			replyContent := replyMsg.Content
			if len(replyContent) > 100 {
				replyContent = replyContent[:100] + "..."
			}
			replyData = map[string]interface{}{
				"id":       replyMsg.ID,
				"username": replyUsername,
				"content":  replyContent,
			}
		}
	}

	// Broadcast
	payload := map[string]interface{}{
		"id":         chatMsg.ID,
		"user_id":    client.userID,
		"username":   client.username,
		"photo_url":  client.photoURL,
		"content":    content,
		"type":       "text",
		"role":       client.role,
		"created_at": chatMsg.CreatedAt.Format(time.RFC3339),
	}
	if replyData != nil {
		payload["reply_to"] = replyData
	}
	h.hub.Broadcast(&BroadcastMessage{
		Type:    "new_message",
		Payload: payload,
	})
}

// GetMessages — chat tarixini olish (REST)
func (h *Handler) GetMessages(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	beforeID, _ := strconv.Atoi(c.DefaultQuery("before_id", "0"))

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 50
	}

	var messages []models.ChatMessage
	var total int64

	h.db.Model(&models.ChatMessage{}).Where("is_deleted = false").Count(&total)

	query := h.db.Where("is_deleted = false").
		Preload("User", func(db *gorm.DB) *gorm.DB {
			return db.Select("id, username, status")
		}).
		Order("created_at DESC").
		Limit(limit)

	if beforeID > 0 {
		query = query.Where("id < ?", beforeID)
	} else {
		offset := (page - 1) * limit
		query = query.Offset(offset)
	}

	query.Find(&messages)

	// Profile ma'lumotlarini qo'shish
	type ReplyInfo struct {
		ID       uint   `json:"id"`
		Username string `json:"username"`
		Content  string `json:"content"`
	}

	type MessageResponse struct {
		ID        uint       `json:"id"`
		UserID    uint       `json:"user_id"`
		Username  string     `json:"username"`
		PhotoURL  string     `json:"photo_url"`
		Content   string     `json:"content"`
		Type      string     `json:"type"`
		ReplyTo   *ReplyInfo `json:"reply_to,omitempty"`
		CreatedAt string     `json:"created_at"`
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

		var replyInfo *ReplyInfo
		if msg.ReplyToID != nil && *msg.ReplyToID > 0 {
			var replyMsg models.ChatMessage
			if h.db.Preload("User").First(&replyMsg, *msg.ReplyToID).Error == nil {
				var replyProfile models.Profile
				h.db.Where("user_id = ?", replyMsg.UserID).First(&replyProfile)
				rUsername := replyMsg.User.Username
				if replyProfile.FirstName != "" {
					rUsername = replyProfile.FirstName
				}
				rContent := replyMsg.Content
				if len(rContent) > 100 {
					rContent = rContent[:100] + "..."
				}
				replyInfo = &ReplyInfo{
					ID:       replyMsg.ID,
					Username: rUsername,
					Content:  rContent,
				}
			}
		}

		result = append(result, MessageResponse{
			ID:        msg.ID,
			UserID:    msg.UserID,
			Username:  username,
			PhotoURL:  profile.PhotoURL,
			Content:   msg.Content,
			Type:      msg.Type,
			ReplyTo:   replyInfo,
			CreatedAt: msg.CreatedAt.Format(time.RFC3339),
		})
	}

	hasMore := len(messages) == limit

	response.Success(c, http.StatusOK, "Chat xabarlari", gin.H{
		"messages": result,
		"meta": gin.H{
			"total":    total,
			"page":     page,
			"limit":    limit,
			"pages":    (total + int64(limit) - 1) / int64(limit),
			"online":   h.hub.OnlineCount(),
			"has_more": hasMore,
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

	staffID, _ := c.Get("staffID")

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

	h.db.Create(&models.ChatModerationLog{
		StaffID:  sid,
		Action:   "delete_message",
		TargetID: uint(id),
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

	staffID, _ := c.Get("staffID")
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

	h.db.Create(&models.ChatModerationLog{
		StaffID:  sid,
		Action:   "ban",
		TargetID: uint(userID),
		Reason:   body.Reason,
	})

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

	staffID, _ := c.Get("staffID")
	sid, _ := staffID.(uint)

	h.db.Model(&models.ChatBan{}).
		Where("user_id = ? AND is_active = true", userID).
		Update("is_active", false)

	h.db.Create(&models.ChatModerationLog{
		StaffID:  sid,
		Action:   "unban",
		TargetID: uint(userID),
	})

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

	staffID, _ := c.Get("staffID")
	sid, _ := staffID.(uint)

	h.db.Create(&models.ChatModerationLog{
		StaffID: sid,
		Action:  "toggle_chat",
		Details: strconv.FormatBool(body.IsOpen),
	})

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

// GetChatStatus — user endpoint to check ban status and chat settings
func (h *Handler) GetChatStatus(c *gin.Context) {
	userID, _ := c.Get("userID")
	uid, _ := userID.(uint)

	var ban models.ChatBan
	isBanned := h.db.Where("user_id = ? AND is_active = true AND (expires_at IS NULL OR expires_at > ?)", uid, time.Now()).First(&ban).Error == nil

	var setting models.ChatSetting
	if h.db.First(&setting).Error != nil {
		setting = models.ChatSetting{IsChatOpen: true, MaxMessageLen: 500, SlowMode: 0}
	}

	response.Success(c, http.StatusOK, "Chat status", gin.H{
		"is_banned":       isBanned,
		"ban_reason":      ban.Reason,
		"ban_type":        ban.Type,
		"ban_expires_at":  ban.ExpiresAt,
		"is_chat_open":    setting.IsChatOpen,
		"max_message_len": setting.MaxMessageLen,
		"slow_mode":       setting.SlowMode,
		"online_count":    h.hub.OnlineCount(),
	})
}

// AdminGetSettings — get chat settings
func (h *Handler) AdminGetSettings(c *gin.Context) {
	var setting models.ChatSetting
	if h.db.First(&setting).Error != nil {
		setting = models.ChatSetting{IsChatOpen: true, MaxMessageLen: 500}
	}
	response.Success(c, http.StatusOK, "Chat settings", setting)
}

// AdminUpdateSettings — update chat settings
func (h *Handler) AdminUpdateSettings(c *gin.Context) {
	var body struct {
		MaxMessageLen int    `json:"max_message_len"`
		SlowMode      int    `json:"slow_mode"`
		MinAccountAge int    `json:"min_account_age"`
		PinnedMessage string `json:"pinned_message"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		response.Error(c, http.StatusBadRequest, "Noto'g'ri ma'lumot", nil)
		return
	}

	var setting models.ChatSetting
	if h.db.First(&setting).Error != nil {
		setting = models.ChatSetting{
			IsChatOpen:    true,
			MaxMessageLen: body.MaxMessageLen,
			SlowMode:      body.SlowMode,
			MinAccountAge: body.MinAccountAge,
			PinnedMessage: body.PinnedMessage,
		}
		h.db.Create(&setting)
	} else {
		h.db.Model(&setting).Updates(map[string]interface{}{
			"max_message_len": body.MaxMessageLen,
			"slow_mode":       body.SlowMode,
			"min_account_age": body.MinAccountAge,
			"pinned_message":  body.PinnedMessage,
		})
	}

	response.Success(c, http.StatusOK, "Chat sozlamalari yangilandi", setting)
}

// AdminGetModerationLogs — get moderation logs
func (h *Handler) AdminGetModerationLogs(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 50
	}

	var logs []models.ChatModerationLog
	var total int64
	h.db.Model(&models.ChatModerationLog{}).Count(&total)
	h.db.Order("created_at DESC").Offset((page - 1) * limit).Limit(limit).Find(&logs)

	// Staff username va target username qo'shish
	type LogResponse struct {
		ID             uint   `json:"id"`
		StaffID        uint   `json:"staff_id"`
		StaffUsername   string `json:"staff_username"`
		Action         string `json:"action"`
		TargetID       uint   `json:"target_id"`
		TargetUsername string `json:"target_username"`
		Reason         string `json:"reason"`
		Details        string `json:"details"`
		CreatedAt      string `json:"created_at"`
	}

	var result []LogResponse
	for _, l := range logs {
		var staff models.StaffUser
		h.db.Select("id, username, full_name").First(&staff, l.StaffID)
		staffName := staff.FullName
		if staffName == "" {
			staffName = staff.Username
		}

		var targetUser models.User
		h.db.Select("id, username").First(&targetUser, l.TargetID)
		targetName := targetUser.Username

		result = append(result, LogResponse{
			ID:             l.ID,
			StaffID:        l.StaffID,
			StaffUsername:   staffName,
			Action:         l.Action,
			TargetID:       l.TargetID,
			TargetUsername: targetName,
			Reason:         l.Reason,
			Details:        l.Details,
			CreatedAt:      l.CreatedAt.Format(time.RFC3339),
		})
	}

	response.Success(c, http.StatusOK, "Moderation logs", gin.H{
		"logs":  result,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

// AdminSendMessage — admin/superadmin chatga xabar yuborishi
func (h *Handler) AdminSendMessage(c *gin.Context) {
	staffID, _ := c.Get("staffID")
	sid, _ := staffID.(uint)
	if sid == 0 {
		response.Error(c, http.StatusUnauthorized, "Avtorizatsiya talab qilinadi", nil)
		return
	}

	var body struct {
		Content   string `json:"content" binding:"required"`
		ReplyToID *uint  `json:"reply_to_id,omitempty"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		response.Error(c, http.StatusBadRequest, "Xabar matni talab qilinadi", nil)
		return
	}

	content := strings.TrimSpace(body.Content)
	if content == "" {
		response.Error(c, http.StatusBadRequest, "Bo'sh xabar yuborib bo'lmaydi", nil)
		return
	}
	if len(content) > 1000 {
		content = content[:1000]
	}
	content = sanitizeMessage(content)

	// Staff ma'lumotlarini olish
	var staff models.StaffUser
	if h.db.First(&staff, sid).Error != nil {
		response.Error(c, http.StatusNotFound, "Staff topilmadi", nil)
		return
	}

	// DB ga saqlash
	chatMsg := models.ChatMessage{
		UserID:    sid,
		Content:   content,
		Type:      "admin",
		ReplyToID: body.ReplyToID,
	}
	if err := h.db.Create(&chatMsg).Error; err != nil {
		response.Error(c, http.StatusInternalServerError, "Xabar saqlanmadi", nil)
		return
	}

	username := staff.FullName
	if username == "" {
		username = staff.Username
	}

	role := string(staff.Role)

	// Reply ma'lumotlarini olish
	var replyData map[string]interface{}
	if body.ReplyToID != nil && *body.ReplyToID > 0 {
		var replyMsg models.ChatMessage
		if h.db.Preload("User").First(&replyMsg, *body.ReplyToID).Error == nil {
			var replyProfile models.Profile
			h.db.Where("user_id = ?", replyMsg.UserID).First(&replyProfile)
			replyUsername := replyMsg.User.Username
			if replyProfile.FirstName != "" {
				replyUsername = replyProfile.FirstName
			}
			replyContent := replyMsg.Content
			if len(replyContent) > 100 {
				replyContent = replyContent[:100] + "..."
			}
			replyData = map[string]interface{}{
				"id":       replyMsg.ID,
				"username": replyUsername,
				"content":  replyContent,
			}
		}
	}

	// Broadcast
	payload := map[string]interface{}{
		"id":         chatMsg.ID,
		"user_id":    sid,
		"username":   username,
		"photo_url":  "",
		"content":    content,
		"type":       "admin",
		"role":       role,
		"created_at": chatMsg.CreatedAt.Format(time.RFC3339),
	}
	if replyData != nil {
		payload["reply_to"] = replyData
	}
	h.hub.Broadcast(&BroadcastMessage{
		Type:    "new_message",
		Payload: payload,
	})

	response.Success(c, http.StatusOK, "Xabar yuborildi", gin.H{
		"id":         chatMsg.ID,
		"content":    content,
		"created_at": chatMsg.CreatedAt.Format(time.RFC3339),
	})
}

// sanitizeMessage — basic HTML sanitization
func sanitizeMessage(s string) string {
	s = strings.ReplaceAll(s, "<", "&lt;")
	s = strings.ReplaceAll(s, ">", "&gt;")
	s = strings.ReplaceAll(s, "\"", "&quot;")
	return s
}
