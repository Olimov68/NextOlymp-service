package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"time"
)

var FaceServiceURL = "http://localhost:9000"

func init() {
	if url := os.Getenv("FACE_SERVICE_URL"); url != "" {
		FaceServiceURL = url
	}
}

type EmbedResponse struct {
	Embedding  []float64 `json:"embedding"`
	Confidence float64   `json:"confidence"`
	FaceFound  bool      `json:"face_found"`
	Dimensions int       `json:"dimensions"`
	Error      string    `json:"error"`
}

type DuplicateCheckRequest struct {
	NewEmbedding       []float64            `json:"new_embedding"`
	ExistingEmbeddings []ExistingEmbedding  `json:"existing_embeddings"`
}

type ExistingEmbedding struct {
	UserID    uint      `json:"user_id"`
	Username  string    `json:"username"`
	Embedding []float64 `json:"embedding"`
}

type DuplicateMatch struct {
	UserID     uint    `json:"user_id"`
	Username   string  `json:"username"`
	Similarity float64 `json:"similarity"`
}

type DuplicateCheckResponse struct {
	IsDuplicate bool             `json:"is_duplicate"`
	Matches     []DuplicateMatch `json:"matches"`
	Threshold   float64          `json:"threshold"`
	Error       string           `json:"error"`
}

// GetFaceEmbedding — rasmdan yuz embeddingni olish
func GetFaceEmbedding(photoPath string) (*EmbedResponse, error) {
	file, err := os.Open(photoPath)
	if err != nil {
		return nil, fmt.Errorf("rasmni ochib bo'lmadi: %w", err)
	}
	defer file.Close()

	var buf bytes.Buffer
	writer := multipart.NewWriter(&buf)
	part, err := writer.CreateFormFile("photo", "photo.jpg")
	if err != nil {
		return nil, err
	}
	if _, err = io.Copy(part, file); err != nil {
		return nil, err
	}
	writer.Close()

	client := &http.Client{Timeout: 30 * time.Second}
	req, err := http.NewRequest("POST", FaceServiceURL+"/embed", &buf)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())

	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("face service ga ulanib bo'lmadi: %w", err)
	}
	defer resp.Body.Close()

	var result EmbedResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("javobni o'qib bo'lmadi: %w", err)
	}

	if result.Error != "" {
		return &result, fmt.Errorf(result.Error)
	}

	return &result, nil
}

// CheckDuplicate — yangi yuzni mavjud yuzlar bilan solishtirish
func CheckDuplicate(newEmbedding []float64, existing []ExistingEmbedding) (*DuplicateCheckResponse, error) {
	payload := DuplicateCheckRequest{
		NewEmbedding:       newEmbedding,
		ExistingEmbeddings: existing,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Post(FaceServiceURL+"/check-duplicate", "application/json", bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("face service ga ulanib bo'lmadi: %w", err)
	}
	defer resp.Body.Close()

	var result DuplicateCheckResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	return &result, nil
}

// IsFaceServiceAvailable — face service ishlayaptimi tekshirish
func IsFaceServiceAvailable() bool {
	client := &http.Client{Timeout: 3 * time.Second}
	resp, err := client.Get(FaceServiceURL + "/health")
	if err != nil {
		return false
	}
	defer resp.Body.Close()
	return resp.StatusCode == 200
}
