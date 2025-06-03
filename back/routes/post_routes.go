package routes

import (
	"back/controllers"
	"back/middleware"

	"github.com/gin-gonic/gin"
)

func PostRoutes(router *gin.Engine) {
	post := router.Group("/api/post")
	{
		// 🌍 Public routes - ทุกคนเข้าได้ (ไม่ต้อง auth)
		post.GET("/", controllers.GetPostsByClub) // ดูโพสต์
		post.GET("/random", controllers.GetRandomPosts)
		
		// 🔒 Protected routes - ต้อง login และเป็นสมาชิก
		post.POST("/", middleware.JWTAuthMiddleware(), controllers.CreatePost)
		post.DELETE("/:id", middleware.JWTAuthMiddleware(), controllers.DeletePost)
		post.PUT("/:id/like", middleware.JWTAuthMiddleware(), controllers.ToggleLikePost)
	}
}