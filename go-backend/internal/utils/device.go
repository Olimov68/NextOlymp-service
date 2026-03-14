package utils

import (
	"strings"
)

// DeviceInfo — qurilma ma'lumotlari
type DeviceInfo struct {
	DeviceName string // "Chrome on Windows"
	Browser    string // "Chrome 120"
	OS         string // "Windows 11"
	DeviceType string // mobile | desktop | tablet
}

// ParseUserAgent — User-Agent stringdan qurilma ma'lumotlarini ajratadi
func ParseUserAgent(ua string) DeviceInfo {
	info := DeviceInfo{
		DeviceName: "Noma'lum qurilma",
		Browser:    "Noma'lum",
		OS:         "Noma'lum",
		DeviceType: "desktop",
	}

	if ua == "" {
		return info
	}

	uaLower := strings.ToLower(ua)

	// --- OS aniqlash ---
	switch {
	case strings.Contains(uaLower, "iphone"):
		info.OS = "iOS"
		info.DeviceType = "mobile"
	case strings.Contains(uaLower, "ipad"):
		info.OS = "iPadOS"
		info.DeviceType = "tablet"
	case strings.Contains(uaLower, "android"):
		info.OS = "Android"
		if strings.Contains(uaLower, "mobile") {
			info.DeviceType = "mobile"
		} else {
			info.DeviceType = "tablet"
		}
	case strings.Contains(uaLower, "windows nt 10"):
		info.OS = "Windows 10/11"
		info.DeviceType = "desktop"
	case strings.Contains(uaLower, "windows nt"):
		info.OS = "Windows"
		info.DeviceType = "desktop"
	case strings.Contains(uaLower, "mac os x"):
		info.OS = "macOS"
		info.DeviceType = "desktop"
	case strings.Contains(uaLower, "linux"):
		info.OS = "Linux"
		info.DeviceType = "desktop"
	case strings.Contains(uaLower, "cros"):
		info.OS = "Chrome OS"
		info.DeviceType = "desktop"
	}

	// --- Browser aniqlash ---
	switch {
	case strings.Contains(uaLower, "edg/") || strings.Contains(uaLower, "edga/"):
		info.Browser = "Microsoft Edge"
		ver := extractVersion(ua, "Edg/")
		if ver == "" {
			ver = extractVersion(ua, "EdgA/")
		}
		if ver != "" {
			info.Browser += " " + ver
		}
	case strings.Contains(uaLower, "opr/") || strings.Contains(uaLower, "opera"):
		info.Browser = "Opera"
		ver := extractVersion(ua, "OPR/")
		if ver != "" {
			info.Browser += " " + ver
		}
	case strings.Contains(uaLower, "yabrowser"):
		info.Browser = "Yandex Browser"
		ver := extractVersion(ua, "YaBrowser/")
		if ver != "" {
			info.Browser += " " + ver
		}
	case strings.Contains(uaLower, "samsungbrowser"):
		info.Browser = "Samsung Internet"
		ver := extractVersion(ua, "SamsungBrowser/")
		if ver != "" {
			info.Browser += " " + ver
		}
	case strings.Contains(uaLower, "ucbrowser"):
		info.Browser = "UC Browser"
	case strings.Contains(uaLower, "firefox/") && !strings.Contains(uaLower, "seamonkey"):
		info.Browser = "Firefox"
		ver := extractVersion(ua, "Firefox/")
		if ver != "" {
			info.Browser += " " + ver
		}
	case strings.Contains(uaLower, "safari/") && !strings.Contains(uaLower, "chrome") && !strings.Contains(uaLower, "chromium"):
		info.Browser = "Safari"
		ver := extractVersion(ua, "Version/")
		if ver != "" {
			info.Browser += " " + ver
		}
	case strings.Contains(uaLower, "chrome/") && !strings.Contains(uaLower, "chromium"):
		info.Browser = "Chrome"
		ver := extractVersion(ua, "Chrome/")
		if ver != "" {
			info.Browser += " " + ver
		}
	case strings.Contains(uaLower, "chromium"):
		info.Browser = "Chromium"
	}

	// DeviceName
	info.DeviceName = info.Browser + " on " + info.OS

	return info
}

// extractVersion — "Key/1.2.3 ..." dan versiyaning asosiy qismini oladi
func extractVersion(ua, key string) string {
	idx := strings.Index(ua, key)
	if idx == -1 {
		return ""
	}
	start := idx + len(key)
	if start >= len(ua) {
		return ""
	}

	end := start
	dotCount := 0
	for end < len(ua) {
		ch := ua[end]
		if ch == '.' {
			dotCount++
			if dotCount > 1 {
				break // faqat major.minor
			}
			end++
			continue
		}
		if ch >= '0' && ch <= '9' {
			end++
			continue
		}
		break
	}

	ver := ua[start:end]
	// Oxirgi nuqtani olib tashlash
	ver = strings.TrimRight(ver, ".")
	return ver
}

// GetClientIP — Gin context dan haqiqiy IP olish
func GetClientIP(forwardedFor, remoteAddr string) string {
	if forwardedFor != "" {
		// X-Forwarded-For: client, proxy1, proxy2
		parts := strings.Split(forwardedFor, ",")
		return strings.TrimSpace(parts[0])
	}
	// RemoteAddr dan port ni olib tashlash
	if idx := strings.LastIndex(remoteAddr, ":"); idx != -1 {
		return remoteAddr[:idx]
	}
	return remoteAddr
}
