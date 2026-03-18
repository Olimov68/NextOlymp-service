package chat

import (
	"encoding/json"
	"log"
	"time"

	"github.com/gorilla/websocket"
)

const (
	// Xabar yozish uchun max vaqt
	writeWait = 10 * time.Second

	// Pong kutish vaqti
	pongWait = 60 * time.Second

	// Ping yuborish intervali
	pingPeriod = (pongWait * 9) / 10

	// Max xabar hajmi (bytes)
	maxMessageSize = 4096
)

// Client — WebSocket client
type Client struct {
	hub      *Hub
	conn     *websocket.Conn
	send     chan *BroadcastMessage
	userID   uint
	username string
	photoURL string
	role     string // user, admin, superadmin
}

// NewClient — yangi client yaratish
func NewClient(hub *Hub, conn *websocket.Conn, userID uint, username, photoURL, role string) *Client {
	return &Client{
		hub:      hub,
		conn:     conn,
		send:     make(chan *BroadcastMessage, 256),
		userID:   userID,
		username: username,
		photoURL: photoURL,
		role:     role,
	}
}

// IncomingMessage — clientdan kelgan xabar
type IncomingMessage struct {
	Type    string `json:"type"`
	Content string `json:"content"`
}

// ReadPump — client dan xabarlar o'qish
func (c *Client) ReadPump(onMessage func(client *Client, msg *IncomingMessage)) {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()

	c.conn.SetReadLimit(maxMessageSize)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("[Chat] WebSocket error user_%d: %v", c.userID, err)
			}
			break
		}

		var msg IncomingMessage
		if err := json.Unmarshal(message, &msg); err != nil {
			continue
		}

		if onMessage != nil {
			onMessage(c, &msg)
		}
	}
}

// WritePump — client ga xabar yozish
func (c *Client) WritePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			data, err := json.Marshal(message)
			if err != nil {
				continue
			}

			if err := c.conn.WriteMessage(websocket.TextMessage, data); err != nil {
				return
			}

		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}
