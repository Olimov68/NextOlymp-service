package chat

import (
	"log"
	"sync"
)

// Hub — WebSocket ulanishlar markazi
type Hub struct {
	// Ro'yxatdan o'tgan clientlar
	clients map[*Client]bool

	// Broadcast xabarlar kanali
	broadcast chan *BroadcastMessage

	// Client ro'yxatdan o'tish
	register chan *Client

	// Client chiqish
	unregister chan *Client

	// Online userlar
	onlineUsers map[uint]*Client

	mu sync.RWMutex
}

// BroadcastMessage — broadcast qilinadigan xabar
type BroadcastMessage struct {
	Type    string      `json:"type"`
	Payload interface{} `json:"payload"`
}

// NewHub — yangi hub yaratish
func NewHub() *Hub {
	return &Hub{
		broadcast:   make(chan *BroadcastMessage, 256),
		register:    make(chan *Client),
		unregister:  make(chan *Client),
		clients:     make(map[*Client]bool),
		onlineUsers: make(map[uint]*Client),
	}
}

// Run — hub ni ishga tushirish (goroutine sifatida)
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client] = true
			h.onlineUsers[client.userID] = client
			h.mu.Unlock()
			log.Printf("[Chat Hub] Client connected: user_%d (online: %d)", client.userID, len(h.clients))

			// Online count broadcast
			h.broadcastOnlineCount()

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				delete(h.onlineUsers, client.userID)
				close(client.send)
			}
			h.mu.Unlock()
			log.Printf("[Chat Hub] Client disconnected: user_%d (online: %d)", client.userID, len(h.clients))

			h.broadcastOnlineCount()

		case message := <-h.broadcast:
			h.mu.RLock()
			for client := range h.clients {
				select {
				case client.send <- message:
				default:
					close(client.send)
					delete(h.clients, client)
				}
			}
			h.mu.RUnlock()
		}
	}
}

// Broadcast — xabarni barcha clientlarga yuborish
func (h *Hub) Broadcast(msg *BroadcastMessage) {
	h.broadcast <- msg
}

// OnlineCount — online unique userlar soni
func (h *Hub) OnlineCount() int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.onlineUsers)
}

// IsUserOnline — user online mi?
func (h *Hub) IsUserOnline(userID uint) bool {
	h.mu.RLock()
	defer h.mu.RUnlock()
	_, ok := h.onlineUsers[userID]
	return ok
}

// broadcastOnlineCount — online son ni broadcast qilish
func (h *Hub) broadcastOnlineCount() {
	h.broadcast <- &BroadcastMessage{
		Type:    "online_count",
		Payload: map[string]int{"count": len(h.onlineUsers)},
	}
}
