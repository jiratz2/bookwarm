package routes

import (
	"back/controllers"
	"github.com/gin-gonic/gin"
)
func TagRoutes(router *gin.Engine){
	category := router.Group("/api/tags")
	{
		category.GET("/", controllers.GetAllTag)
		category.POST("/",controllers.CreateTag)
		category.PUT("/:id", controllers.UpdateTag)
		category.DELETE("/:id", controllers.DeleteTag)
	}
}