package adminfeedback

type ReplyRequest struct {
	Reply  string `json:"reply" binding:"required,min=1"`
	Status string `json:"status"`
}

type ListParams struct {
	Status   string `form:"status"`
	Page     int    `form:"page,default=1"`
	PageSize int    `form:"page_size,default=20"`
}
