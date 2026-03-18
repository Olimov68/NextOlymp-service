package models

import "time"

type ContentType   string
type ContentStatus string

const (
	ContentTypeNews         ContentType = "news"
	ContentTypeAnnouncement ContentType = "announcement"
)

const (
	ContentStatusDraft     ContentStatus = "draft"
	ContentStatusPublished ContentStatus = "published"
	ContentStatusArchived  ContentStatus = "archived"
)

type Content struct {
	ID          uint          `gorm:"primaryKey" json:"id"`
	Title       string        `gorm:"size:500;not null" json:"title"`
	Slug        string        `gorm:"uniqueIndex;size:500;not null" json:"slug"`
	Body        string        `gorm:"type:text" json:"body"`
	Excerpt     string        `gorm:"type:text" json:"excerpt"`
	CoverImage  string        `gorm:"size:500" json:"cover_image"`
	Type        ContentType   `gorm:"size:30;not null" json:"type"`
	Status      ContentStatus `gorm:"size:20;default:draft;not null" json:"status"`
	ViewCount   int           `gorm:"default:0;not null" json:"view_count"`
	PublishedAt *time.Time    `json:"published_at,omitempty"`
	CreatedByID *uint         `gorm:"index" json:"created_by_id,omitempty"`
	CreatedAt   time.Time     `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt   time.Time     `gorm:"autoUpdateTime" json:"updated_at"`
}

func (Content) TableName() string { return "content" }
