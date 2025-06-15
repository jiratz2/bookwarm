package routes

import (
	"back/controllers"
	"back/middleware"
	"github.com/gin-gonic/gin"
)

func ReviewRoutes(router *gin.Engine) {
	review := router.Group("/api/reviews")
	{
		
		review.POST("/", middleware.JWTAuthMiddleware(), controllers.CreateReview)
		review.GET("/:bookId", controllers.GetAllReviews)
		review.PUT("/:reviewId", middleware.JWTAuthMiddleware(), controllers.UpdateReview)
		review.DELETE("/:reviewId", middleware.JWTAuthMiddleware(), controllers.DeleteReview)
		review.GET("/user/me", middleware.JWTAuthMiddleware(), controllers.GetUserReviews)
	}
}