package user

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/nextolympservice/go-backend/config"
	"github.com/nextolympservice/go-backend/internal/models"
	"github.com/nextolympservice/go-backend/internal/services"
	"gorm.io/gorm"
)

type Service struct {
	repo      *Repository
	uploadCfg *config.UploadConfig
}

func NewService(repo *Repository, uploadCfg *config.UploadConfig) *Service {
	return &Service{repo: repo, uploadCfg: uploadCfg}
}

// CompleteProfile fills user profile for the first time
func (s *Service) CompleteProfile(userID uint, req *CompleteProfileRequest, photoFile *multipart.FileHeader) (*models.Profile, error) {
	// Profil allaqachon to'ldirilgan bo'lsa xato
	exists, err := s.repo.ProfileExists(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to check profile: %w", err)
	}
	if exists {
		return nil, errors.New("profile already completed, use update endpoint")
	}

	// BirthDate format tekshirish
	if err := validateBirthDate(req.BirthDate); err != nil {
		return nil, err
	}

	profile := &models.Profile{
		UserID:     userID,
		FirstName:  strings.TrimSpace(req.FirstName),
		LastName:   strings.TrimSpace(req.LastName),
		BirthDate:  req.BirthDate,
		Gender:     models.Gender(req.Gender),
		Region:     strings.TrimSpace(req.Region),
		District:   strings.TrimSpace(req.District),
		SchoolName: strings.TrimSpace(req.SchoolName),
		Grade:      req.Grade,
	}

	// Agar rasm yuklangan bo'lsa, saqlash
	if photoFile != nil {
		photoURL, err := s.savePhoto(userID, photoFile)
		if err != nil {
			return nil, fmt.Errorf("failed to save photo: %w", err)
		}
		profile.PhotoURL = photoURL

		// Face embedding olish va dublikat tekshirish
		if services.IsFaceServiceAvailable() {
			fullPath := filepath.Join(".", photoURL)
			embedResult, err := services.GetFaceEmbedding(fullPath)
			if err != nil {
				log.Printf("[FaceService] Embedding olishda xatolik (user %d): %v", userID, err)
			} else if embedResult != nil && embedResult.FaceFound {
				// Embeddingni JSON ga o'girish
				embJSON, _ := json.Marshal(embedResult.Embedding)
				profile.FaceEmbedding = string(embJSON)

				// Mavjud embeddinglarni olish va dublikat tekshirish
				var existingProfiles []models.Profile
				s.repo.db.Where("face_embedding != '' AND face_embedding IS NOT NULL AND user_id != ?", userID).
					Select("user_id, face_embedding").Find(&existingProfiles)

				if len(existingProfiles) > 0 {
					existingEmbs := make([]services.ExistingEmbedding, 0, len(existingProfiles))
					for _, ep := range existingProfiles {
						var emb []float64
						if err := json.Unmarshal([]byte(ep.FaceEmbedding), &emb); err == nil {
							// Username ni olish
							var u models.User
							s.repo.db.Select("username").First(&u, ep.UserID)
							existingEmbs = append(existingEmbs, services.ExistingEmbedding{
								UserID:    ep.UserID,
								Username:  u.Username,
								Embedding: emb,
							})
						}
					}

					if len(existingEmbs) > 0 {
						dupResult, err := services.CheckDuplicate(embedResult.Embedding, existingEmbs)
						if err != nil {
							log.Printf("[FaceService] Dublikat tekshirishda xatolik: %v", err)
						} else if dupResult != nil && dupResult.IsDuplicate {
							match := dupResult.Matches[0]
							return nil, fmt.Errorf(
								"Bu yuz allaqachon ro'yxatdan o'tgan (@%s). Agar bu sizning hisobingiz bo'lsa, tizimga kiring",
								match.Username,
							)
						}
					}
				}
			}
		}
	}

	if err := s.repo.CreateProfile(profile); err != nil {
		return nil, fmt.Errorf("failed to create profile: %w", err)
	}

	// User statusini yangilash
	user, err := s.repo.GetUserByID(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}
	user.IsProfileCompleted = true
	if err := s.repo.UpdateUser(user); err != nil {
		return nil, fmt.Errorf("failed to update user: %w", err)
	}

	// Auto-create a pending verification record
	verification := &models.UserVerification{
		UserID: userID,
		Method: "telegram",
		Status: "pending",
	}
	s.repo.db.Create(verification)

	return profile, nil
}

// UpdateProfile updates existing profile fields
func (s *Service) UpdateProfile(userID uint, req *UpdateProfileRequest) (*models.Profile, error) {
	profile, err := s.repo.GetProfileByUserID(userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("profile not found, complete profile first")
		}
		return nil, fmt.Errorf("failed to get profile: %w", err)
	}

	// Faqat yuborilgan fieldlarni yangilash
	if req.FirstName != "" {
		profile.FirstName = strings.TrimSpace(req.FirstName)
	}
	if req.LastName != "" {
		profile.LastName = strings.TrimSpace(req.LastName)
	}
	if req.BirthDate != "" {
		if err := validateBirthDate(req.BirthDate); err != nil {
			return nil, err
		}
		profile.BirthDate = req.BirthDate
	}
	if req.Gender != "" {
		profile.Gender = models.Gender(req.Gender)
	}
	if req.Region != "" {
		profile.Region = strings.TrimSpace(req.Region)
	}
	if req.District != "" {
		profile.District = strings.TrimSpace(req.District)
	}
	if req.SchoolName != "" {
		profile.SchoolName = strings.TrimSpace(req.SchoolName)
	}
	if req.Grade > 0 {
		profile.Grade = req.Grade
	}

	if err := s.repo.UpdateProfile(profile); err != nil {
		return nil, fmt.Errorf("failed to update profile: %w", err)
	}

	return profile, nil
}

// savePhoto validates and saves a photo file, returns the URL path
func (s *Service) savePhoto(userID uint, file *multipart.FileHeader) (string, error) {
	// File size tekshirish
	maxSize := int64(s.uploadCfg.MaxSizeMB) * 1024 * 1024
	if file.Size > maxSize {
		return "", fmt.Errorf("file size exceeds %dMB limit", s.uploadCfg.MaxSizeMB)
	}

	// Faqat rasm formatlarini qabul qilish
	ext := strings.ToLower(filepath.Ext(file.Filename))
	allowedExts := map[string]bool{".jpg": true, ".jpeg": true, ".png": true, ".webp": true}
	if !allowedExts[ext] {
		return "", errors.New("only jpg, jpeg, png, webp files are allowed")
	}

	// Upload papkasini yaratish
	uploadDir := filepath.Join(s.uploadCfg.Dir, "photos")
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		return "", fmt.Errorf("failed to create upload directory: %w", err)
	}

	// Unique filename
	filename := fmt.Sprintf("user_%d_%d%s", userID, time.Now().UnixNano(), ext)
	filePath := filepath.Join(uploadDir, filename)

	// Faylni saqlash
	src, err := file.Open()
	if err != nil {
		return "", fmt.Errorf("failed to open uploaded file: %w", err)
	}
	defer src.Close()

	dst, err := os.Create(filePath)
	if err != nil {
		return "", fmt.Errorf("failed to create file: %w", err)
	}
	defer dst.Close()

	if _, err := io.Copy(dst, src); err != nil {
		return "", fmt.Errorf("failed to save file: %w", err)
	}

	return fmt.Sprintf("/uploads/photos/%s", filename), nil
}

// UploadPhoto saves photo and updates profile
func (s *Service) UploadPhoto(userID uint, file *multipart.FileHeader) (string, error) {
	// Profil borligini tekshirish
	profile, err := s.repo.GetProfileByUserID(userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return "", errors.New("profile not found, complete profile first")
		}
		return "", fmt.Errorf("failed to get profile: %w", err)
	}

	// Eski photoni o'chirish
	if profile.PhotoURL != "" {
		oldPath := filepath.Join(".", profile.PhotoURL)
		_ = os.Remove(oldPath)
	}

	photoURL, err := s.savePhoto(userID, file)
	if err != nil {
		return "", err
	}

	// DB'da photo URL yangilash
	profile.PhotoURL = photoURL
	if err := s.repo.UpdateProfile(profile); err != nil {
		return "", fmt.Errorf("failed to update photo url: %w", err)
	}

	return photoURL, nil
}

// GetProfile returns user profile
func (s *Service) GetProfile(userID uint) (*models.Profile, error) {
	profile, err := s.repo.GetProfileByUserID(userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("profile not found")
		}
		return nil, err
	}
	return profile, nil
}

func validateBirthDate(date string) error {
	_, err := time.Parse("2006-01-02", date)
	if err != nil {
		return errors.New("birth_date must be in YYYY-MM-DD format")
	}
	return nil
}
