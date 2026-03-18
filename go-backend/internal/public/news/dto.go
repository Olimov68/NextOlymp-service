package publicnews

import (
	"time"

	"github.com/nextolympservice/go-backend/internal/models"
)

type ListParams struct {
	Type     string `form:"type"`                // news | announcement
	Search   string `form:"search"`              // title bo'yicha qidirish
	Page     int    `form:"page,default=1"`
	PageSize int    `form:"page_size,default=20"`
}

type NewsListItem struct {
	ID          uint       `json:"id"`
	Title       string     `json:"title"`
	Slug        string     `json:"slug"`
	Excerpt     string     `json:"excerpt"`
	CoverImage  string     `json:"cover_image"`
	Type        string     `json:"type"`
	PublishedAt *time.Time `json:"published_at,omitempty"`
	ViewCount   int        `json:"view_count"`
}

type NewsDetail struct {
	ID          uint       `json:"id"`
	Title       string     `json:"title"`
	Slug        string     `json:"slug"`
	Body        string     `json:"body"`
	Excerpt     string     `json:"excerpt"`
	CoverImage  string     `json:"cover_image"`
	Type        string     `json:"type"`
	PublishedAt *time.Time `json:"published_at,omitempty"`
	ViewCount   int        `json:"view_count"`
}

func toListItem(c *models.Content) NewsListItem {
	return NewsListItem{
		ID:          c.ID,
		Title:       c.Title,
		Slug:        c.Slug,
		Excerpt:     c.Excerpt,
		CoverImage:  c.CoverImage,
		Type:        string(c.Type),
		PublishedAt: c.PublishedAt,
		ViewCount:   c.ViewCount,
	}
}

func toDetail(c *models.Content) NewsDetail {
	return NewsDetail{
		ID:          c.ID,
		Title:       c.Title,
		Slug:        c.Slug,
		Body:        c.Body,
		Excerpt:     c.Excerpt,
		CoverImage:  c.CoverImage,
		Type:        string(c.Type),
		PublishedAt: c.PublishedAt,
		ViewCount:   c.ViewCount,
	}
}
