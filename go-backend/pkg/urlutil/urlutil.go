package urlutil

import "strings"

var baseURL string

// Init — dastur ishga tushganda baseURL ni o'rnatadi
func Init(url string) {
	baseURL = strings.TrimRight(url, "/")
}

// ToFullURL — nisbiy URL ni to'liq URL ga o'giradi
// Agar URL allaqachon to'liq bo'lsa (http:// yoki https://), o'zgartirmaydi
func ToFullURL(url string) string {
	if url == "" {
		return ""
	}
	if strings.HasPrefix(url, "http://") || strings.HasPrefix(url, "https://") {
		return url
	}
	return baseURL + url
}
