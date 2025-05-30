package main

import (
	"back/config"
	"back/routes"
	"fmt"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	router := gin.Default()
	
	// ตั้งค่า Static File Server สำหรับโฟลเดอร์ uploads
	router.Static("/uploads", "./uploads")
	
	corsConfig := cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "http://127.0.0.1:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}
	
	router.Use(cors.New(corsConfig))

	// สร้างโฟลเดอร์ uploads ถ้ายังไม่มี
	if err := os.MkdirAll("uploads", 0755); err != nil {
		fmt.Printf("Error creating uploads directory: %v\n", err)
	}

	
	
	config.ConnectDB()
	routes.AuthRoutes(router)
	routes.CategoryRoutes(router)
	routes.GenreRoutes(router)
	routes.TagRoutes(router)
	routes.AuthorRoutes(router)
	routes.BooksRoutes(router)
	routes.ReviewRoutes(router)
	routes.MarkRoutes(router)
	routes.ClubRoutes(router)
	routes.PostRoutes(router)
	routes.CommentRoutes(router)
	routes.ReplyRoutes(router)

	router.Run(":8080")
}