package ai

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/nextolympservice/go-backend/internal/models"
	"github.com/nextolympservice/go-backend/pkg/response"
	"gorm.io/gorm"
)

type Handler struct {
	db     *gorm.DB
	apiKey string
}

func NewHandler(db *gorm.DB, apiKey string) *Handler {
	return &Handler{db: db, apiKey: apiKey}
}

// Claude API types
type claudeRequest struct {
	Model     string          `json:"model"`
	MaxTokens int             `json:"max_tokens"`
	Messages  []claudeMessage `json:"messages"`
}

type claudeMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type claudeResponse struct {
	Content []struct {
		Text string `json:"text"`
	} `json:"content"`
	Error *struct {
		Message string `json:"message"`
	} `json:"error"`
}

type AnalysisResult struct {
	OverallGrade     string           `json:"overall_grade"`
	Summary          string           `json:"summary"`
	Strengths        []string         `json:"strengths"`
	Weaknesses       []string         `json:"weaknesses"`
	QuestionAnalysis []QuestionReview `json:"question_analysis"`
	Recommendations  []string         `json:"recommendations"`
	Motivation       string           `json:"motivation"`
}

type QuestionReview struct {
	QuestionNum   int    `json:"question_num"`
	QuestionText  string `json:"question_text"`
	YourAnswer    string `json:"your_answer"`
	CorrectAnswer string `json:"correct_answer"`
	Explanation   string `json:"explanation"`
}

// GetAIAnalysis — mock test natijasi uchun AI tahlil
func (h *Handler) GetAIAnalysis(c *gin.Context) {
	userID := c.GetUint("user_id")
	attemptID, err := strconv.ParseUint(c.Param("attempt_id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Noto'g'ri attempt ID")
		return
	}

	// Check if analysis already exists (cache)
	var existing models.AIAnalysis
	if err := h.db.Where("attempt_id = ? AND user_id = ? AND attempt_type = ?", attemptID, userID, "mock_test").First(&existing).Error; err == nil {
		// Parse cached JSON fields back
		result := h.parseStoredAnalysis(&existing)
		response.Success(c, http.StatusOK, "AI tahlil (cache)", result)
		return
	}

	// Load attempt with full data
	var attempt models.MockAttempt
	if err := h.db.Preload("MockTest").Preload("Answers.Question.Options").Preload("Answers.SelectedOption").
		Where("id = ? AND user_id = ?", attemptID, userID).First(&attempt).Error; err != nil {
		response.Error(c, http.StatusNotFound, "Urinish topilmadi")
		return
	}

	if attempt.Status == "in_progress" {
		response.Error(c, http.StatusBadRequest, "Test hali yakunlanmagan")
		return
	}

	if h.apiKey == "" {
		response.Error(c, http.StatusServiceUnavailable, "AI tahlil vaqtinchalik mavjud emas")
		return
	}

	// Build prompt
	prompt := h.buildPrompt(&attempt)

	// Call Claude API
	analysis, err := h.callClaude(prompt)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "AI tahlil xatosi: "+err.Error())
		return
	}

	// Save to DB (cache)
	strengthsJSON, _ := json.Marshal(analysis.Strengths)
	weaknessesJSON, _ := json.Marshal(analysis.Weaknesses)
	qaJSON, _ := json.Marshal(analysis.QuestionAnalysis)
	recsJSON, _ := json.Marshal(analysis.Recommendations)

	dbRecord := models.AIAnalysis{
		AttemptID:        uint(attemptID),
		AttemptType:      "mock_test",
		UserID:           userID,
		OverallGrade:     analysis.OverallGrade,
		Summary:          analysis.Summary,
		Strengths:        string(strengthsJSON),
		Weaknesses:       string(weaknessesJSON),
		QuestionAnalysis: string(qaJSON),
		Recommendations:  string(recsJSON),
		Motivation:       analysis.Motivation,
	}
	h.db.Create(&dbRecord)

	response.Success(c, http.StatusOK, "AI tahlil", analysis)
}

func (h *Handler) buildPrompt(attempt *models.MockAttempt) string {
	testTitle := "Nomalum test"
	testSubject := ""
	if attempt.MockTest != nil {
		testTitle = attempt.MockTest.Title
		testSubject = attempt.MockTest.Subject
	}

	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("Siz o'zbek tilidagi ta'lim platformasining AI tahlilchisisiz. O'quvchining test natijasini tahlil qiling.\n\n"))
	sb.WriteString(fmt.Sprintf("TEST: %s\n", testTitle))
	if testSubject != "" {
		sb.WriteString(fmt.Sprintf("FAN: %s\n", testSubject))
	}
	sb.WriteString(fmt.Sprintf("NATIJA: %d/%d to'g'ri (%.1f%%)\n", attempt.Correct, attempt.Correct+attempt.Wrong+attempt.Unanswered, attempt.Percentage))
	sb.WriteString(fmt.Sprintf("TO'G'RI: %d | NOTO'G'RI: %d | JAVOBSIZ: %d\n", attempt.Correct, attempt.Wrong, attempt.Unanswered))

	duration := time.Duration(attempt.TimeTaken) * time.Second
	sb.WriteString(fmt.Sprintf("VAQT: %d daqiqa %d soniya\n\n", int(duration.Minutes()), int(duration.Seconds())%60))

	// Add wrong/unanswered questions detail
	sb.WriteString("NOTO'G'RI VA JAVOBSIZ SAVOLLAR:\n\n")
	questionNum := 0
	for _, ans := range attempt.Answers {
		questionNum++
		if ans.IsCorrect {
			continue
		}
		if ans.Question == nil {
			continue
		}

		sb.WriteString(fmt.Sprintf("Savol #%d: %s\n", questionNum, ans.Question.Text))

		// Find correct option and selected option
		correctAnswer := ""
		selectedAnswer := ""
		for _, opt := range ans.Question.Options {
			if opt.IsCorrect {
				correctAnswer = fmt.Sprintf("%s) %s", opt.Label, opt.Text)
			}
			if ans.SelectedOptionID != nil && opt.ID == *ans.SelectedOptionID {
				selectedAnswer = fmt.Sprintf("%s) %s", opt.Label, opt.Text)
			}
		}

		if selectedAnswer == "" {
			sb.WriteString("O'quvchi javobi: (javob berilmagan)\n")
		} else {
			sb.WriteString(fmt.Sprintf("O'quvchi javobi: %s\n", selectedAnswer))
		}
		sb.WriteString(fmt.Sprintf("To'g'ri javob: %s\n\n", correctAnswer))
	}

	sb.WriteString(`
Quyidagi JSON formatida javob bering (faqat JSON, boshqa hech narsa emas):
{
    "overall_grade": "A+ dan D gacha baho",
    "summary": "2-3 gaplik umumiy baho (o'zbek tilida)",
    "strengths": ["kuchli tomon 1", "kuchli tomon 2"],
    "weaknesses": ["zaif tomon 1", "zaif tomon 2"],
    "question_analysis": [
        {
            "question_num": 1,
            "question_text": "savol matni (qisqartirilgan)",
            "your_answer": "tanlangan javob",
            "correct_answer": "to'g'ri javob",
            "explanation": "nima uchun bu javob to'g'ri ekanligini tushuntiring (o'zbek tilida, 1-2 gap)"
        }
    ],
    "recommendations": ["tavsiya 1 (o'zbek tilida)", "tavsiya 2"],
    "motivation": "motivatsion xabar (o'zbek tilida, ilhomlantiruvchi)"
}

MUHIM:
- Hamma narsa O'ZBEK TILIDA bo'lsin
- question_analysis da FAQAT noto'g'ri va javobsiz savollarni tahlil qiling
- Agar barcha javoblar to'g'ri bo'lsa, question_analysis bo'sh array bo'lsin
- strengths va weaknesses har biri 2-4 ta element bo'lsin
- recommendations 3-5 ta bo'lsin
- Javobni FAQAT JSON formatida bering, boshqa text yozmang
`)

	return sb.String()
}

func (h *Handler) callClaude(prompt string) (*AnalysisResult, error) {
	reqBody := claudeRequest{
		Model:     "claude-sonnet-4-20250514",
		MaxTokens: 2000,
		Messages: []claudeMessage{
			{Role: "user", Content: prompt},
		},
	}

	body, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("JSON marshal xatosi: %w", err)
	}

	req, err := http.NewRequest("POST", "https://api.anthropic.com/v1/messages", bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("Request yaratish xatosi: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-api-key", h.apiKey)
	req.Header.Set("anthropic-version", "2023-06-01")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("API so'rov xatosi: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("Javob o'qish xatosi: %w", err)
	}

	var claudeResp claudeResponse
	if err := json.Unmarshal(respBody, &claudeResp); err != nil {
		return nil, fmt.Errorf("JSON parse xatosi: %w", err)
	}

	if claudeResp.Error != nil {
		return nil, fmt.Errorf("Claude API xatosi: %s", claudeResp.Error.Message)
	}

	if len(claudeResp.Content) == 0 {
		return nil, fmt.Errorf("Claude API bo'sh javob qaytardi")
	}

	// Parse the JSON response from Claude
	text := claudeResp.Content[0].Text
	// Clean up - remove markdown code blocks if present
	text = strings.TrimSpace(text)
	text = strings.TrimPrefix(text, "```json")
	text = strings.TrimPrefix(text, "```")
	text = strings.TrimSuffix(text, "```")
	text = strings.TrimSpace(text)

	var analysis AnalysisResult
	if err := json.Unmarshal([]byte(text), &analysis); err != nil {
		return nil, fmt.Errorf("AI javobini parse qilishda xato: %w", err)
	}

	return &analysis, nil
}

func (h *Handler) parseStoredAnalysis(record *models.AIAnalysis) *AnalysisResult {
	result := &AnalysisResult{
		OverallGrade: record.OverallGrade,
		Summary:      record.Summary,
		Motivation:   record.Motivation,
	}

	json.Unmarshal([]byte(record.Strengths), &result.Strengths)
	json.Unmarshal([]byte(record.Weaknesses), &result.Weaknesses)
	json.Unmarshal([]byte(record.QuestionAnalysis), &result.QuestionAnalysis)
	json.Unmarshal([]byte(record.Recommendations), &result.Recommendations)

	return result
}
