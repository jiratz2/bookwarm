package routes

import (
	"back/controllers"
	"back/middleware"
	"github.com/gin-gonic/gin"
)

func ReviewRoutes(router *gin.Engine) {
	review := router.Group("/api/reviews")
	{
		// สร้างรีวิวใหม่ (ต้อง login)
		review.POST("/", middleware.JWTAuthMiddleware(), controllers.CreateReview)
		
		// ดึงรีวิวทั้งหมดของหนังสือ (ไม่ต้อง login)
		review.GET("/:bookId", controllers.GetAllReviews)
		review.PUT("/:reviewId", middleware.JWTAuthMiddleware(), controllers.UpdateReview)

		
		// ลบรีวิว (ต้อง login และเป็นเจ้าของรีวิว)
		review.DELETE("/:reviewId", middleware.JWTAuthMiddleware(), controllers.DeleteReview)
		
		// ดึงรีวิวของ user ปัจจุบัน (ต้อง login)
		review.GET("/user/me", middleware.JWTAuthMiddleware(), controllers.GetUserReviews)
	}
}