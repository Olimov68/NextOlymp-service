package utils

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

// GoogleTokenInfo — Google ID token'dan olingan ma'lumotlar
type GoogleTokenInfo struct {
	Sub           string `json:"sub"`            // Google user ID
	Email         string `json:"email"`          // Email
	EmailVerified string `json:"email_verified"` // "true" or "false"
	Name          string `json:"name"`           // Full name
	Picture       string `json:"picture"`        // Avatar URL
	Aud           string `json:"aud"`            // Client ID — must match
	Iss           string `json:"iss"`            // Issuer
	Exp           string `json:"exp"`            // Expiry
}

// VerifyGoogleIDToken — Google ID tokenni tekshiradi va ma'lumotlarni qaytaradi
func VerifyGoogleIDToken(idToken string, expectedClientID string) (*GoogleTokenInfo, error) {
	if idToken == "" {
		return nil, fmt.Errorf("id_token bo'sh")
	}
	if expectedClientID == "" {
		return nil, fmt.Errorf("GOOGLE_CLIENT_ID sozlanmagan")
	}

	url := fmt.Sprintf("https://oauth2.googleapis.com/tokeninfo?id_token=%s", idToken)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Get(url)
	if err != nil {
		return nil, fmt.Errorf("Google tokenni tekshirishda xatolik: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("Google token noto'g'ri yoki muddati o'tgan (status: %d)", resp.StatusCode)
	}

	var info GoogleTokenInfo
	if err := json.NewDecoder(resp.Body).Decode(&info); err != nil {
		return nil, fmt.Errorf("Google javobini o'qishda xatolik: %w", err)
	}

	// aud tekshirish — client ID mos kelishi shart
	if info.Aud != expectedClientID {
		return nil, fmt.Errorf("Google token aud mos kelmaydi: kutilgan=%s, kelgan=%s", expectedClientID, info.Aud)
	}

	// email tasdiqlangan bo'lishi shart
	if info.EmailVerified != "true" {
		return nil, fmt.Errorf("Google email tasdiqlanmagan")
	}

	if info.Email == "" || info.Sub == "" {
		return nil, fmt.Errorf("Google tokendan email yoki sub olinmadi")
	}

	return &info, nil
}
