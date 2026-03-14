package utils

import (
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/nextolympservice/go-backend/config"
)

type TokenType string

const (
	AccessToken  TokenType = "access"
	RefreshToken TokenType = "refresh"
)

type JWTClaims struct {
	UserID    uint      `json:"user_id"`
	Username  string    `json:"username"`
	SessionID uint      `json:"session_id"`
	Type      TokenType `json:"type"`
	jwt.RegisteredClaims
}

type JWTManager struct {
	cfg *config.JWTConfig
}

func NewJWTManager(cfg *config.JWTConfig) *JWTManager {
	return &JWTManager{cfg: cfg}
}

func (j *JWTManager) GenerateTokenPair(userID uint, username string, sessionID uint) (accessToken, refreshToken string, err error) {
	accessToken, err = j.generateToken(userID, username, sessionID, AccessToken, j.cfg.AccessSecret, j.cfg.AccessExpiryHours)
	if err != nil {
		return "", "", fmt.Errorf("failed to generate access token: %w", err)
	}

	refreshToken, err = j.generateToken(userID, username, sessionID, RefreshToken, j.cfg.RefreshSecret, j.cfg.RefreshExpiryHours)
	if err != nil {
		return "", "", fmt.Errorf("failed to generate refresh token: %w", err)
	}

	return accessToken, refreshToken, nil
}

func (j *JWTManager) ValidateAccessToken(tokenString string) (*JWTClaims, error) {
	return j.validateToken(tokenString, j.cfg.AccessSecret, AccessToken)
}

func (j *JWTManager) ValidateRefreshToken(tokenString string) (*JWTClaims, error) {
	return j.validateToken(tokenString, j.cfg.RefreshSecret, RefreshToken)
}

func (j *JWTManager) generateToken(userID uint, username string, sessionID uint, tokenType TokenType, secret string, expiryHours int) (string, error) {
	claims := JWTClaims{
		UserID:    userID,
		Username:  username,
		SessionID: sessionID,
		Type:      tokenType,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Duration(expiryHours) * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "nextolympservice",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

func (j *JWTManager) validateToken(tokenString, secret string, expectedType TokenType) (*JWTClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(secret), nil
	})
	if err != nil {
		return nil, errors.New("invalid or expired token")
	}

	claims, ok := token.Claims.(*JWTClaims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token claims")
	}

	if claims.Type != expectedType {
		return nil, fmt.Errorf("invalid token type: expected %s", expectedType)
	}

	return claims, nil
}
