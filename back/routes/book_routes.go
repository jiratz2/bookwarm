package routes

import (
	"back/controllers"
	"back/middleware"

	"github.com/gin-gonic/gin"
)

func BookRoutes(router *gin.Engine) {
	book := router.Group("/api/books")
	{
		// 🌍 Public routes - ทุกคนเข้าได้ (ไม่ต้อง auth)
		book.GET("/", controllers.GetAllBooks) // ดูหนังสือทั้งหมด
		book.GET("/:id", controllers.GetBookByID) // ดูหนังสือตาม ID
		book.GET("/recommended", controllers.GetRecommendedBooks) // ดูหนังสือแนะนำ
		book.GET("/search", controllers.SearchBooks) // ค้นหาหนังสือ
		
		// 🔒 Protected routes - ต้อง login
		book.Use(middleware.JWTAuthMiddleware()).POST("/", controllers.CreateBook)
		book.Use(middleware.JWTAuthMiddleware()).PUT("/:id", controllers.UpdateBook)
		book.Use(middleware.JWTAuthMiddleware()).DELETE("/:id", controllers.DeleteBook)
	}
}