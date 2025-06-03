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

// Define a struct for the achievement data sent in the response
type AchievementResponse struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	// Add other fields like icon, etc. if needed
}

// Helper function to count books marked as 'read' for a user
func CountReadBooksForUser(userID primitive.ObjectID) (int64, error) {
	collection := config.DB.Database("bookwarm").Collection("marks")
	filter := bson.M{
		"user_id": userID,
		"status":  "read",
	}
	count, err := collection.CountDocuments(context.TODO(), filter)
	if err != nil {
		return 0, err
	}
	return count, nil
}

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

	// If status is "read", count read books and check for achievements
	if newMark.Status == "read" {
		readCount, err := CountReadBooksForUser(userID)
		if err != nil {
			// Log the error, but don't necessarily fail the request
			println("Error counting read books for user", userID.Hex(), ":", err.Error())
		} else {
			// For now, print the count
			println("User", userID.Hex(), "has read", readCount, "books.")
		}

		// --- Achievement Logic --- //
		// Define achievement thresholds and placeholder ObjectIDs
		const read1BookThreshold = 1
		// Using fixed hex strings for dummy ObjectIDs to avoid re-generating
		read1BookAchievementObjectID, _ := primitive.ObjectIDFromHex("60d5f9d5b281f1b2c3d4e5f6") // Dummy ObjectID for First Read

		const read10BooksThreshold = 10
		read10BooksAchievementObjectID, _ := primitive.ObjectIDFromHex("60d5fa83b281f1b2c3d4e5f7") // Dummy ObjectID for Bookworm Beginner

		var unlockedAchievement *AchievementResponse = nil // Use pointer to AchievementResponse

		// --- Check and Unlock Achievements (Simulated) ---
		// In a real application, you would fetch the user's unlocked achievements
		// and only unlock if the condition is met AND the achievement is not already unlocked.

		// Simulate checking and unlocking "First Read"
		// Check if count is exactly 1 AND (simulated) achievement is not unlocked yet
		if readCount == read1BookThreshold /* && !isAchievementUnlocked(userID, read1BookAchievementObjectID) */ {
			// Simulate getting achievement details (from a list or DB) and marking as unlocked
			unlockedAchievement = &AchievementResponse{
				ID: read1BookAchievementObjectID.Hex(), // Convert ObjectID to string for frontend
				Name: "First Read",
				Description: "Read your first book",
			}
			println("User", userID.Hex(), "unlocked achievement:", unlockedAchievement.Name)
			// In a real app: Save this achievement (read1BookAchievementObjectID) as unlocked for the user in DB.

		// Simulate checking and unlocking "Bookworm Beginner" ONLY if "First Read" wasn't just unlocked in this call
		} else if unlockedAchievement == nil && readCount >= read10BooksThreshold /* && !isAchievementUnlocked(userID, read10BooksAchievementObjectID) */ {
            // Simulate getting achievement details and marking as unlocked
            unlockedAchievement = &AchievementResponse{
                ID: read10BooksAchievementObjectID.Hex(), // Convert ObjectID to string
                Name: "Bookworm Beginner",
                Description: "Read 10 books",
            }
             println("User", userID.Hex(), "unlocked achievement:", unlockedAchievement.Name)
             // In a real app: Save this achievement (read10BooksAchievementObjectID) as unlocked for the user in DB.
        }

		// --- End Achievement Logic --- //

		// Include achievement in the response if an achievement was unlocked in this request
		c.JSON(http.StatusCreated, gin.H{
			"message": "Mark created successfully",
			"mark_id": newMark.ID.Hex(), // Still include mark_id in Create response
			"achievement": unlockedAchievement, // This will be null if no achievement was unlocked in this call
		})
		return // Return after sending response
	}

	// If status is not "read", send standard response for Create
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

	// If status is updated to "read", count read books and check for achievements
	if input.Status == "read" {
		readCount, err := CountReadBooksForUser(userID)
		if err != nil {
			// Log the error, but don't necessarily fail the request
			println("Error counting read books for user", userID.Hex(), ":", err.Error())
		} else {
			// For now, print the count
			println("User", userID.Hex(), "has read", readCount, "books.")
		}

		// --- Achievement Logic --- //
		// Define achievement thresholds and placeholder ObjectIDs
		const read1BookThreshold = 1
		// Using fixed hex strings for dummy ObjectIDs to avoid re-generating
		read1BookAchievementObjectID, _ := primitive.ObjectIDFromHex("60d5f9d5b281f1b2c3d4e5f6") // Dummy ObjectID for First Read

		const read10BooksThreshold = 10
		read10BooksAchievementObjectID, _ := primitive.ObjectIDFromHex("60d5fa83b281f1b2c3d4e5f7") // Dummy ObjectID for Bookworm Beginner

		var unlockedAchievement *AchievementResponse = nil // Use pointer to AchievementResponse

		// --- Check and Unlock Achievements (Simulated) ---
		// In a real application, you would fetch the user's unlocked achievements
		// and only unlock if the condition is met AND the achievement is not already unlocked.

		// Simulate checking and unlocking "First Read"
		// Check if count is exactly 1 AND (simulated) achievement is not unlocked yet
		if readCount == read1BookThreshold /* && !isAchievementUnlocked(userID, read1BookAchievementObjectID) */ {
			// Simulate getting achievement details (from a list or DB) and marking as unlocked
			unlockedAchievement = &AchievementResponse{
				ID: read1BookAchievementObjectID.Hex(), // Convert ObjectID to string for frontend
				Name: "First Read",
				Description: "Read your first book",
			}
			println("User", userID.Hex(), "unlocked achievement:", unlockedAchievement.Name)
			// In a real app: Save this achievement (read1BookAchievementObjectID) as unlocked for the user in DB.

		// Simulate checking and unlocking "Bookworm Beginner" ONLY if "First Read" wasn't just unlocked in this call
		} else if unlockedAchievement == nil && readCount >= read10BooksThreshold /* && !isAchievementUnlocked(userID, read10BooksAchievementObjectID) */ {
            // Simulate getting achievement details and marking as unlocked
            unlockedAchievement = &AchievementResponse{
                ID: read10BooksAchievementObjectID.Hex(), // Convert ObjectID to string
                Name: "Bookworm Beginner",
                Description: "Read 10 books",
            }
             println("User", userID.Hex(), "unlocked achievement:", unlockedAchievement.Name)
             // In a real app: Save this achievement (read10BooksAchievementObjectID) as unlocked for the user in DB.
        }

		// --- End Achievement Logic --- //

		// Include achievement in the response if an achievement was unlocked in this request
		c.JSON(http.StatusOK, gin.H{
			"message": "Mark updated successfully",
			"achievement": unlockedAchievement, // This will be null if no achievement was unlocked in this call
		})
		return // Return after sending response
	}

	// If status is not "read", send standard response for Update
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

	// ลบ mark
	_, err = collection.DeleteOne(context.TODO(), bson.M{"_id": markID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete mark"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Mark deleted successfully",
	})
}
