package utils

import (
	"fmt"
	"regexp"
	"strings"
	"unicode"

	"github.com/gin-gonic/gin/binding"
	"github.com/go-playground/validator/v10"
)

// SetupValidator registers custom validators
func SetupValidator() {
	if v, ok := binding.Validator.Engine().(*validator.Validate); ok {
		v.RegisterValidation("username", validateUsername)
		v.RegisterValidation("strongpassword", validateStrongPassword)
	}
}

// validateUsername checks: only letters, digits, underscore, dot; min 4 chars
func validateUsername(fl validator.FieldLevel) bool {
	username := fl.Field().String()
	if len(username) < 4 {
		return false
	}
	matched, _ := regexp.MatchString(`^[a-zA-Z0-9_.]+$`, username)
	return matched
}

// validateStrongPassword checks: min 8, at least 1 upper, 1 lower, 1 digit
func validateStrongPassword(fl validator.FieldLevel) bool {
	password := fl.Field().String()
	if len(password) < 8 {
		return false
	}
	var hasUpper, hasLower, hasDigit bool
	for _, ch := range password {
		switch {
		case unicode.IsUpper(ch):
			hasUpper = true
		case unicode.IsLower(ch):
			hasLower = true
		case unicode.IsDigit(ch):
			hasDigit = true
		}
	}
	return hasUpper && hasLower && hasDigit
}

// ValidateUsername validates username manually and returns error message
func ValidateUsername(username string) error {
	if len(username) < 4 {
		return fmt.Errorf("username must be at least 4 characters")
	}
	matched, _ := regexp.MatchString(`^[a-zA-Z0-9_.]+$`, username)
	if !matched {
		return fmt.Errorf("username can only contain letters, digits, underscores and dots")
	}
	return nil
}

// ValidatePassword validates password strength and returns error message
func ValidatePassword(password string) error {
	if len(password) < 8 {
		return fmt.Errorf("password must be at least 8 characters")
	}
	var hasUpper, hasLower, hasDigit bool
	for _, ch := range password {
		switch {
		case unicode.IsUpper(ch):
			hasUpper = true
		case unicode.IsLower(ch):
			hasLower = true
		case unicode.IsDigit(ch):
			hasDigit = true
		}
	}
	if !hasUpper {
		return fmt.Errorf("password must contain at least one uppercase letter")
	}
	if !hasLower {
		return fmt.Errorf("password must contain at least one lowercase letter")
	}
	if !hasDigit {
		return fmt.Errorf("password must contain at least one digit")
	}
	return nil
}

// fieldLabels — maydon nomlarini o'zbekcha ko'rsatish
var fieldLabels = map[string]string{
	"username":         "Foydalanuvchi nomi",
	"password":         "Parol",
	"confirm_password": "Parol tasdig'i",
	"first_name":       "Ism",
	"last_name":        "Familiya",
	"birth_date":       "Tug'ilgan sana",
	"gender":           "Jins",
	"region":           "Viloyat",
	"district":         "Tuman",
	"school_name":      "Maktab nomi",
	"grade":            "Sinf",
	"current_password": "Joriy parol",
	"new_password":     "Yangi parol",
	"identifier":       "Foydalanuvchi nomi",
	"code":             "Tasdiqlash kodi",
	"id_token":         "Google token",
	"refresh_token":    "Refresh token",
	"amount":           "Summa",
	"title":            "Sarlavha",
	"description":      "Tavsif",
	"subject":          "Fan",
}

// getFieldLabel returns the Uzbek label for a field, or the field name itself
func getFieldLabel(field string) string {
	if label, ok := fieldLabels[field]; ok {
		return label
	}
	return field
}

// FormatValidationErrors converts validator errors to readable map (O'zbekcha)
func FormatValidationErrors(err error) map[string]string {
	errors := make(map[string]string)

	if validationErrs, ok := err.(validator.ValidationErrors); ok {
		for _, e := range validationErrs {
			field := toSnakeCase(e.Field())
			label := getFieldLabel(field)
			switch e.Tag() {
			case "required":
				errors[field] = fmt.Sprintf("%s kiritilishi shart", label)
			case "min":
				if e.Kind().String() == "string" || e.Type().Kind().String() == "string" {
					errors[field] = fmt.Sprintf("%s kamida %s ta belgi bo'lishi kerak", label, e.Param())
				} else {
					errors[field] = fmt.Sprintf("%s kamida %s bo'lishi kerak", label, e.Param())
				}
			case "max":
				if e.Kind().String() == "string" || e.Type().Kind().String() == "string" {
					errors[field] = fmt.Sprintf("%s ko'pi bilan %s ta belgi bo'lishi kerak", label, e.Param())
				} else {
					errors[field] = fmt.Sprintf("%s ko'pi bilan %s bo'lishi kerak", label, e.Param())
				}
			case "oneof":
				vals := strings.ReplaceAll(e.Param(), " ", ", ")
				errors[field] = fmt.Sprintf("%s quyidagilardan biri bo'lishi kerak: %s", label, vals)
			case "len":
				errors[field] = fmt.Sprintf("%s aniq %s ta belgi bo'lishi kerak", label, e.Param())
			case "email":
				errors[field] = fmt.Sprintf("%s to'g'ri email manzil bo'lishi kerak", label)
			case "username":
				errors[field] = fmt.Sprintf("%s kamida 4 ta belgi, faqat harf, raqam, _ va . bo'lishi kerak", label)
			case "strongpassword":
				errors[field] = fmt.Sprintf("%s kamida 8 ta belgi, katta harf, kichik harf va raqam bo'lishi kerak", label)
			default:
				errors[field] = fmt.Sprintf("%s noto'g'ri formatda", label)
			}
		}
	}

	return errors
}

func toSnakeCase(s string) string {
	var result strings.Builder
	for i, r := range s {
		if unicode.IsUpper(r) && i > 0 {
			result.WriteRune('_')
		}
		result.WriteRune(unicode.ToLower(r))
	}
	return result.String()
}
