package usernews

import (
	"time"

	"github.com/nextolympservice/go-backend/internal/models"
)

type ListParams struct {
	Type     string `form:"type"` // news | announcement
	Page     int    `form:"page,default=1"`
	PageSize int    `form:"page_size,default=20"`
}

type ContentResponse struct {
	ID          uint       `json:"id"`
	Title       string     `json:"title"`
	Slug        string     `json:"slug"`
	Excerpt     string     `json:"excerpt"`
	CoverImage  string     `json:"cover_image"`
	Type        string     `json:"type"`
	PublishedAt *time.Time `json:"published_at,omitempty"`
	ViewCount   int        `json:"view_count"`
	CreatedAt   time.Time  `json:"created_at"`
}

type ContentDetailResponse struct {
	ContentResponse
	Body string `json:"body"`
}

type PaginatedContents struct {
	Data       []ContentResponse `json:"data"`
	Total      int64             `json:"total"`
	Page       int               `json:"page"`
	PageSize   int               `json:"page_size"`
	TotalPages int               `json:"total_pages"`
}

func ToContentResponse(c *models.Content) ContentResponse {
	return ContentResponse{
		ID:          c.ID,
		Title:       c.Title,
		Slug:        c.Slug,
		Excerpt:     c.Excerpt,
		CoverImage:  c.CoverImage,
		Type:        string(c.Type),
		PublishedAt: c.PublishedAt,
		ViewCount:   c.ViewCount,
		CreatedAt:   c.CreatedAt,
	}
}

func ToContentDetailResponse(c *models.Content) ContentDetailResponse {
	return ContentDetailResponse{
		ContentResponse: ToContentResponse(c),
		Body:            c.Body,
	}
}
