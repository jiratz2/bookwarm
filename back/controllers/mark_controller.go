package controllers

import (
	"back/config"
	"back/models"
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func CreateMark(c *gin.Context) {
	var input models.Mark
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// ตรวจสอบสถานะว่าเป็นค่าที่ถูกต้องหรือไม่
	if input.Status != "want to read" && input.Status != "now reading" && input.Status != "read" && input.Status != "did not finish" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid status"})
		return
	}

	input.ID = primitive.NewObjectID()
	input.CreatedAt = time.Now()
	input.UpdatedAt = time.Now()

	collection := config.DB.Database("bookwarm").Collection("marks")
	_, err := collection.InsertOne(context.TODO(), input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create mark"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Mark created successfully",
		"mark_id": input.ID.Hex(),
	})
}

func GetMarksByUser(c *gin.Context) {
	userIDParam := c.Param("user_id")
	userID, err := primitive.ObjectIDFromHex(userIDParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid UserID"})
		return
	}

	collection := config.DB.Database("bookwarm").Collection("marks")
	cursor, err := collection.Find(context.TODO(), bson.M{"user_id": userID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch marks"})
		return
	}

	defer cursor.Close(context.TODO())

	var marks []models.Mark
	for cursor.Next(context.TODO()) {
		var mark models.Mark
		if err := cursor.Decode(&mark); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode mark"})
			return
		}
		marks = append(marks, mark)
	}

	c.JSON(http.StatusOK, marks)
}

func UpdateMark(c *gin.Context) {
	var input models.Mark
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// ตรวจสอบสถานะว่าเป็นค่าที่ถูกต้องหรือไม่
	if input.Status != "want to read" && input.Status != "now reading" && input.Status != "read" && input.Status != "did not finish" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid status"})
		return
	}

	markIDParam := c.Param("mark_id")
	markID, err := primitive.ObjectIDFromHex(markIDParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid MarkID"})
		return
	}

	collection := config.DB.Database("bookwarm").Collection("marks")
	_, err = collection.UpdateOne(
		context.TODO(),
		bson.M{"_id": markID},
		bson.D{
			{"$set", bson.D{
				{"status", input.Status},
				{"updated_at", time.Now()},
			}},
		},
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update mark"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Mark updated successfully",
	})
}


func DeleteMark(c *gin.Context) {
	markIDParam := c.Param("mark_id")
	markID, err := primitive.ObjectIDFromHex(markIDParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid MarkID"})
		return
	}

	collection := config.DB.Database("bookwarm").Collection("marks")
	_, err = collection.DeleteOne(context.TODO(), bson.M{"_id": markID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete mark"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Mark deleted successfully",
	})
}
