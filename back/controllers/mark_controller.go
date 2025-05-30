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
	var input struct {
		BookID primitive.ObjectID `json:"book_id" bson:"book_id"`
		Status string            `json:"status" bson:"status"`
	}
	
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 🔐 ดึง user ID จาก context ที่ middleware ใส่ไว้
	userIDRaw, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found in context"})
		return
	}

	userID, err := primitive.ObjectIDFromHex(userIDRaw.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid User ID format in context"})
		return
	}

	// ตรวจสอบสถานะว่าเป็นค่าที่ถูกต้องหรือไม่
	if input.Status != "want to read" && input.Status != "now reading" && input.Status != "read" && input.Status != "did not finish" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid status"})
		return
	}

	// ตรวจสอบว่ามี mark อยู่แล้วหรือไม่
	collection := config.DB.Database("bookwarm").Collection("marks")
	var existingMark models.Mark
	err = collection.FindOne(context.TODO(), bson.M{
		"user_id": userID,
		"book_id": input.BookID,
	}).Decode(&existingMark)

	if err == nil {
		// ถ้ามี mark อยู่แล้ว ให้อัพเดทแทน
		_, err = collection.UpdateOne(
			context.TODO(),
			bson.M{"_id": existingMark.ID},
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
			"mark_id": existingMark.ID.Hex(),
		})
		return
	}

	// ถ้าไม่มี mark อยู่ ให้สร้างใหม่
	newMark := models.Mark{
		ID:        primitive.NewObjectID(),
		UserID:    userID,
		BookID:    input.BookID,
		Status:    input.Status,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	_, err = collection.InsertOne(context.TODO(), newMark)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create mark"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Mark created successfully",
		"mark_id": newMark.ID.Hex(),
	})
}

func GetMarksByUser(c *gin.Context) {
	// 🔐 ดึง user ID จาก context ที่ middleware ใส่ไว้
	userIDRaw, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found in context"})
		return
	}

	userID, err := primitive.ObjectIDFromHex(userIDRaw.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid User ID format in context"})
		return
	}

	// 🔍 หา marks ของ user พร้อมข้อมูลหนังสือ
	collection := config.DB.Database("bookwarm").Collection("marks")
	pipeline := []bson.M{
		{
			"$match": bson.M{
				"user_id": userID,
			},
		},
		{
			"$lookup": bson.M{
				"from":         "books",
				"localField":   "book_id",
				"foreignField": "_id",
				"as":           "book",
			},
		},
		{
			"$unwind": "$book",
		},
	}

	cursor, err := collection.Aggregate(context.TODO(), pipeline)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch marks"})
		return
	}
	defer cursor.Close(context.TODO())

	var marks []bson.M
	if err := cursor.All(context.TODO(), &marks); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode marks"})
		return
	}

	c.JSON(http.StatusOK, marks)
}

func GetMarkByUserAndBook(c *gin.Context) {
	bookIDParam := c.Param("book_id")
	bookID, err := primitive.ObjectIDFromHex(bookIDParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid BookID"})
		return
	}

	// 🔐 ดึง user ID จาก context ที่ middleware ใส่ไว้
	userIDRaw, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found in context"})
		return
	}

	userID, err := primitive.ObjectIDFromHex(userIDRaw.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid User ID format in context"})
		return
	}

	collection := config.DB.Database("bookwarm").Collection("marks")
	var mark models.Mark
	err = collection.FindOne(context.TODO(), bson.M{
		"user_id": userID,
		"book_id": bookID,
	}).Decode(&mark)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Mark not found for this user and book"})
		return
	}

	c.JSON(http.StatusOK, mark)
}

func UpdateMark(c *gin.Context) {
	var input struct {
		Status string `json:"status" bson:"status"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

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

	// 🔐 ดึง user ID จาก context ที่ middleware ใส่ไว้
	userIDRaw, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found in context"})
		return
	}

	userID, err := primitive.ObjectIDFromHex(userIDRaw.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid User ID format in context"})
		return
	}

	// ตรวจสอบว่า mark นี้เป็นของ user หรือไม่
	collection := config.DB.Database("bookwarm").Collection("marks")
	var existingMark models.Mark
	err = collection.FindOne(context.TODO(), bson.M{"_id": markID, "user_id": userID}).Decode(&existingMark)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Mark not found or does not belong to user"})
		return
	}

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

	// 🔐 ดึง user ID จาก context ที่ middleware ใส่ไว้
	userIDRaw, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found in context"})
		return
	}

	userID, err := primitive.ObjectIDFromHex(userIDRaw.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid User ID format in context"})
		return
	}

	// ตรวจสอบว่า mark นี้เป็นของ user หรือไม่
	collection := config.DB.Database("bookwarm").Collection("marks")
	var existingMark models.Mark
	err = collection.FindOne(context.TODO(), bson.M{"_id": markID, "user_id": userID}).Decode(&existingMark)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Mark not found or does not belong to user"})
		return
	}

	_, err = collection.DeleteOne(context.TODO(), bson.M{"_id": markID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete mark"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Mark deleted successfully",
	})
}
