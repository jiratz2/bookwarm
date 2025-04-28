package routes

import (
	"back/controllers"
	"github.com/gin-gonic/gin"
)
func TagRoutes(router *gin.Engine){
	tags := router.Group("/api/tags")
	{
		tags.GET("/", controllers.GetAllTag)
		tags.POST("/",controllers.CreateTag)
		tags.PUT("/:id", controllers.UpdateTag)
		tags.DELETE("/:id", controllers.DeleteTag)
	}
}