package certgen

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"image/png"
	"math/big"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/go-pdf/fpdf"
	qrcode "github.com/skip2/go-qrcode"

	"github.com/nextolympservice/go-backend/internal/models"
	"gorm.io/gorm"
)

// FieldLayout — template ichidagi bitta field joylashuvi
type FieldLayout struct {
	X          float64 `json:"x"`
	Y          float64 `json:"y"`
	FontSize   float64 `json:"fontSize"`
	FontFamily string  `json:"fontFamily"`
	FontColor  string  `json:"fontColor"`
	TextAlign  string  `json:"textAlign"`
	FontWeight string  `json:"fontWeight"`
	Visible    bool    `json:"visible"`
	Width      float64 `json:"width"`
	Height     float64 `json:"height"`
	Uppercase  bool    `json:"uppercase"`
}

// CertGenerator — sertifikat PDF va QR generatsiya qiluvchi
type CertGenerator struct {
	uploadDir     string
	verifyBaseURL string
	fontDir       string
	db            *gorm.DB
}

// NewCertGenerator — yangi generator yaratish
func NewCertGenerator(uploadDir, verifyBaseURL, fontDir string, db *gorm.DB) *CertGenerator {
	// Sertifikatlar papkasini yaratish
	certDir := filepath.Join(uploadDir, "certificates")
	os.MkdirAll(certDir, 0755)
	qrDir := filepath.Join(uploadDir, "qrcodes")
	os.MkdirAll(qrDir, 0755)

	return &CertGenerator{
		uploadDir:     uploadDir,
		verifyBaseURL: verifyBaseURL,
		fontDir:       fontDir,
		db:            db,
	}
}

// Generate — sertifikat PDF yaratish
func (g *CertGenerator) Generate(cert *models.Certificate, tmpl *models.CertificateTemplate) (string, error) {
	// Orientation va page size
	orientation := "L" // landscape
	if tmpl.Orientation == "portrait" {
		orientation = "P"
	}
	pageSize := tmpl.PageSize
	if pageSize == "" {
		pageSize = "A4"
	}

	pdf := fpdf.New(orientation, "mm", pageSize, "")
	pdf.SetAutoPageBreak(false, 0)
	pdf.AddPage()

	// Font o'rnatish
	normalFont := filepath.Join(g.fontDir, "DejaVuSans.ttf")
	boldFont := filepath.Join(g.fontDir, "DejaVuSans-Bold.ttf")

	if _, err := os.Stat(normalFont); err == nil {
		pdf.AddUTF8Font("DejaVu", "", normalFont)
		pdf.AddUTF8Font("DejaVu", "B", boldFont)
	} else {
		// Fallback to built-in
		pdf.AddUTF8Font("DejaVu", "", "")
	}

	// Background rasm
	if tmpl.BackgroundImage != "" {
		bgPath := g.resolveFilePath(tmpl.BackgroundImage)
		if _, err := os.Stat(bgPath); err == nil {
			w, h := pdf.GetPageSize()
			pdf.Image(bgPath, 0, 0, w, h, false, "", 0, "")
		}
	}

	// LayoutJSON parse
	layout := make(map[string]FieldLayout)
	if tmpl.LayoutJSON != "" {
		json.Unmarshal([]byte(tmpl.LayoutJSON), &layout)
	}

	// Default layout agar bo'sh bo'lsa
	if len(layout) == 0 {
		if cert.CertificateType == "mock_rasch" {
			layout = g.defaultMockRaschLayout(orientation)
		} else {
			layout = g.defaultLayout(orientation)
		}
	}

	// Dinamik ma'lumotlarni tayyorlash
	data := map[string]string{
		"full_name":          cert.FullName,
		"subject":            cert.SubjectName,
		"class_name":         cert.ClassName,
		"score":              formatFloat(cert.Score),
		"scaled_score":       formatFloat(cert.ScaledScore),
		"max_score":          formatFloat(cert.MaxScore),
		"percentage":         formatFloat(cert.Percentage) + "%",
		"grade":              cert.Grade,
		"issued_at":          cert.IssuedAt.Format("02.01.2006"),
		"certificate_number": cert.CertificateNumber,
		"verification_code":  cert.VerificationCode,
		"title":              cert.Title,
	}
	if cert.ValidUntil != nil {
		data["valid_until"] = cert.ValidUntil.Format("02.01.2006")
	}
	if cert.Rank != nil {
		data["rank"] = fmt.Sprintf("%d", *cert.Rank)
	}

	// Har bir fieldni joylash
	for fieldName, fl := range layout {
		if !fl.Visible {
			continue
		}

		if fieldName == "qr_code" {
			// QR code
			qrPath, err := g.generateQRCode(cert.VerificationCode)
			if err == nil {
				w := fl.Width
				if w == 0 {
					w = 30
				}
				h := fl.Height
				if h == 0 {
					h = 30
				}
				pdf.Image(qrPath, fl.X, fl.Y, w, h, false, "", 0, "")
				defer os.Remove(qrPath) // temp fayl
			}
			continue
		}

		text, ok := data[fieldName]
		if !ok {
			continue
		}

		if fl.Uppercase {
			text = strings.ToUpper(text)
		}

		// Font sozlash
		fontSize := fl.FontSize
		if fontSize == 0 {
			fontSize = float64(tmpl.FontSize)
		}
		if fontSize == 0 {
			fontSize = 16
		}

		fontStyle := ""
		if fl.FontWeight == "bold" {
			fontStyle = "B"
		}
		pdf.SetFont("DejaVu", fontStyle, fontSize)

		// Rang
		r, gg, b := parseHexColor(fl.FontColor)
		if fl.FontColor == "" {
			r, gg, b = parseHexColor(tmpl.FontColor)
		}
		pdf.SetTextColor(r, gg, b)

		// Text alignment
		align := fl.TextAlign
		if align == "" {
			align = "center"
		}

		// Text joylash
		textWidth := pdf.GetStringWidth(text)
		x := fl.X
		switch align {
		case "center":
			x = fl.X - textWidth/2
		case "right":
			x = fl.X - textWidth
		}

		pdf.Text(x, fl.Y, text)
	}

	// Logo rasm
	if tmpl.LogoImage != "" {
		logoPath := g.resolveFilePath(tmpl.LogoImage)
		if _, err := os.Stat(logoPath); err == nil {
			pdf.Image(logoPath, 10, 5, 25, 25, false, "", 0, "")
		}
	}

	// PDF saqlash
	filename := fmt.Sprintf("cert_%d_%d.pdf", cert.ID, time.Now().Unix())
	pdfPath := filepath.Join(g.uploadDir, "certificates", filename)
	if err := pdf.OutputFileAndClose(pdfPath); err != nil {
		return "", fmt.Errorf("PDF yaratishda xato: %w", err)
	}

	return "/uploads/certificates/" + filename, nil
}

// generateQRCode — QR code PNG yaratish
func (g *CertGenerator) generateQRCode(verificationCode string) (string, error) {
	url := g.verifyBaseURL + "/" + verificationCode
	qr, err := qrcode.New(url, qrcode.Medium)
	if err != nil {
		return "", err
	}

	tmpFile := filepath.Join(g.uploadDir, "qrcodes", fmt.Sprintf("qr_%s.png", verificationCode))
	f, err := os.Create(tmpFile)
	if err != nil {
		return "", err
	}
	defer f.Close()

	return tmpFile, png.Encode(f, qr.Image(256))
}

// GenerateCertificateNumber — professional sertifikat raqami
func (g *CertGenerator) GenerateCertificateNumber(subjectName string) string {
	year := time.Now().Year()
	code := subjectCode(subjectName)

	// Sequence raqamni bazadan olish
	var count int64
	prefix := fmt.Sprintf("NO-%d-%s-", year, code)
	g.db.Model(&models.Certificate{}).
		Where("certificate_number LIKE ?", prefix+"%").
		Count(&count)

	seq := count + 1
	return fmt.Sprintf("NO-%d-%s-%06d", year, code, seq)
}

// GenerateVerificationCode — 8 ta alfanumerik belgi
func (g *CertGenerator) GenerateVerificationCode() string {
	const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
	code := make([]byte, 8)
	for i := range code {
		n, _ := rand.Int(rand.Reader, big.NewInt(int64(len(chars))))
		code[i] = chars[n.Int64()]
	}
	return string(code)
}

// resolveFilePath — URL'dan fayl yo'liga o'tkazish
func (g *CertGenerator) resolveFilePath(url string) string {
	// /uploads/panel/xxx.jpg -> uploadDir/panel/xxx.jpg
	if strings.HasPrefix(url, "/uploads/") {
		return filepath.Join(g.uploadDir, strings.TrimPrefix(url, "/uploads/"))
	}
	return filepath.Join(g.uploadDir, url)
}

// defaultLayout — standart layout
func (g *CertGenerator) defaultLayout(orientation string) map[string]FieldLayout {
	// A4 landscape: 297 x 210 mm
	centerX := 148.5
	if orientation == "P" {
		centerX = 105.0
	}

	return map[string]FieldLayout{
		"title":              {X: centerX, Y: 60, FontSize: 24, FontColor: "#1a1a2e", TextAlign: "center", FontWeight: "bold", Visible: true},
		"full_name":          {X: centerX, Y: 90, FontSize: 28, FontColor: "#0f3460", TextAlign: "center", FontWeight: "bold", Visible: true},
		"subject":            {X: centerX, Y: 110, FontSize: 18, FontColor: "#333333", TextAlign: "center", Visible: true},
		"class_name":         {X: centerX, Y: 122, FontSize: 14, FontColor: "#555555", TextAlign: "center", Visible: true},
		"score":              {X: centerX - 30, Y: 140, FontSize: 16, FontColor: "#e94560", TextAlign: "center", FontWeight: "bold", Visible: true},
		"max_score":          {X: centerX + 30, Y: 140, FontSize: 16, FontColor: "#333333", TextAlign: "center", Visible: true},
		"percentage":         {X: centerX, Y: 155, FontSize: 20, FontColor: "#0f3460", TextAlign: "center", FontWeight: "bold", Visible: true},
		"issued_at":          {X: centerX, Y: 175, FontSize: 12, FontColor: "#777777", TextAlign: "center", Visible: true},
		"certificate_number": {X: 30, Y: 195, FontSize: 9, FontColor: "#999999", TextAlign: "left", Visible: true},
		"verification_code":  {X: 30, Y: 200, FontSize: 9, FontColor: "#999999", TextAlign: "left", Visible: true},
		"qr_code":            {X: 250, Y: 170, Width: 30, Height: 30, Visible: true},
	}
}

// defaultMockRaschLayout — milliy sertifikat uslubidagi layout (portrait)
func (g *CertGenerator) defaultMockRaschLayout(orientation string) map[string]FieldLayout {
	// A4 portrait: 210 x 297 mm
	centerX := 105.0
	if orientation == "L" {
		centerX = 148.5
	}

	return map[string]FieldLayout{
		"title":              {X: centerX, Y: 45, FontSize: 16, FontColor: "#1a1a2e", TextAlign: "center", FontWeight: "bold", Visible: true, Uppercase: true},
		"certificate_number": {X: 170, Y: 65, FontSize: 10, FontColor: "#333333", TextAlign: "right", Visible: true},
		"full_name":          {X: centerX, Y: 95, FontSize: 22, FontColor: "#000000", TextAlign: "center", FontWeight: "bold", Visible: true},
		"subject":            {X: 130, Y: 115, FontSize: 14, FontColor: "#333333", TextAlign: "left", Visible: true},
		"class_name":         {X: 130, Y: 125, FontSize: 12, FontColor: "#555555", TextAlign: "left", Visible: true},
		"scaled_score":       {X: 130, Y: 140, FontSize: 16, FontColor: "#d4380d", TextAlign: "left", FontWeight: "bold", Visible: true},
		"percentage":         {X: 130, Y: 152, FontSize: 14, FontColor: "#333333", TextAlign: "left", Visible: true},
		"grade":              {X: 130, Y: 166, FontSize: 20, FontColor: "#0050b3", TextAlign: "left", FontWeight: "bold", Visible: true},
		"issued_at":          {X: 40, Y: 260, FontSize: 10, FontColor: "#333333", TextAlign: "left", Visible: true},
		"valid_until":        {X: 130, Y: 260, FontSize: 10, FontColor: "#333333", TextAlign: "left", Visible: true},
		"verification_code":  {X: 40, Y: 270, FontSize: 8, FontColor: "#999999", TextAlign: "left", Visible: true},
		"qr_code":            {X: 85, Y: 272, Width: 25, Height: 25, Visible: true},
	}
}

// subjectCode — fan nomidan qisqa kod
func subjectCode(subject string) string {
	s := strings.ToUpper(strings.TrimSpace(subject))
	codes := map[string]string{
		"MATEMATIKA": "MATH", "MATHEMATICS": "MATH", "MATH": "MATH",
		"FIZIKA": "FIZ", "PHYSICS": "FIZ",
		"KIMYO": "KIM", "CHEMISTRY": "KIM",
		"BIOLOGIYA": "BIO", "BIOLOGY": "BIO",
		"INFORMATIKA": "INF", "INFORMATICS": "INF",
		"ONA TILI": "OTIL", "INGLIZ TILI": "ENG", "ENGLISH": "ENG",
		"TARIX": "TAR", "HISTORY": "TAR",
		"GEOGRAFIYA": "GEO", "GEOGRAPHY": "GEO",
	}
	if c, ok := codes[s]; ok {
		return c
	}
	if len(s) >= 4 {
		return s[:4]
	}
	if len(s) > 0 {
		return s
	}
	return "GEN"
}

// parseHexColor — hex rangni RGB ga o'tkazish
func parseHexColor(hex string) (int, int, int) {
	hex = strings.TrimPrefix(hex, "#")
	if len(hex) != 6 {
		return 0, 0, 0
	}
	r, _ := strconv.ParseInt(hex[0:2], 16, 64)
	g, _ := strconv.ParseInt(hex[2:4], 16, 64)
	b, _ := strconv.ParseInt(hex[4:6], 16, 64)
	return int(r), int(g), int(b)
}

// formatFloat — float ni chiroyli string ga
func formatFloat(f float64) string {
	if f == float64(int(f)) {
		return fmt.Sprintf("%d", int(f))
	}
	return fmt.Sprintf("%.1f", f)
}

// Unused import fix
var _ = hex.EncodeToString
