package main

import (
	"back/config"
	"back/routes"
	"back/firebase"
	"fmt"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	firebase.InitFirebase()
	router := gin.Default()
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		AllowCredentials: true,
	}))
	
	// สร้างโฟลเดอร์ uploads ถ้ายังไม่มี
	if err := os.MkdirAll("uploads", 0755); err != nil {
		fmt.Printf("Error creating uploads directory: %v\n", err)
	}

	// ตั้งค่า Static File Server สำหรับโฟลเดอร์ uploads
	router.Static("/uploads", "./uploads")
	
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

	router.Run(":8080")
}