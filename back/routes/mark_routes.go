package routes

import (
	"back/controllers"
	"github.com/gin-gonic/gin"
)

func MarkRoutes(router *gin.Engine) {
	mark := router.Group("/api/marks")
	{
		mark.POST("/", controllers.CreateMark)          // สร้าง mark
		mark.GET("/user/:user_id", controllers.GetMarksByUser) // ดึงสถานะทั้งหมดของผู้ใช้
		mark.PUT("/:mark_id", controllers.UpdateMark)         // แก้ไขสถานะ mark
		mark.DELETE("/:mark_id", controllers.DeleteMark)      // ลบ mark
	}
}
