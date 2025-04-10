package main

import (
	"github.com/gin-gonic/gin"
	"github.com/gin-contrib/cors"
	"back/config"
	"back/routes"
)

func main() {

	
	router := gin.Default()
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE","OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept","Authorization"},
		AllowCredentials: true,
	}))
	
	
	config.ConnectDB()
	routes.AuthRoutes(router)
	

	router.Run(":8080")
}