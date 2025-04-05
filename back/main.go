package main

import (
	"github.com/gin-gonic/gin"
	"back/config"
	"back/routes"
)

func main() {

	
	router := gin.Default()
	config.ConnectDB()
	routes.AuthRoutes(router)
	

	router.Run(":8080")
}