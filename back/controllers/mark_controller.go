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


type AchievementResponse struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	// Add other fields like icon, etc. if needed
}

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

	if input.Status != "want to read" && input.Status != "now reading" && input.Status != "read" && input.Status != "did not finish" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid status"})
		return
	}

	collection := config.DB.Database("bookwarm").Collection("marks")
	var existingMark models.Mark
	err = collection.FindOne(context.TODO(), bson.M{
		"user_id": userID,
		"book_id": input.BookID,
	}).Decode(&existingMark)

	if err == nil {
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


	if newMark.Status == "read" {
		readCount, err := CountReadBooksForUser(userID)
		if err != nil {

			println("Error counting read books for user", userID.Hex(), ":", err.Error())
		} else {

			println("User", userID.Hex(), "has read", readCount, "books.")
		}

		const read1BookThreshold = 1

		read1BookAchievementObjectID, _ := primitive.ObjectIDFromHex("60d5f9d5b281f1b2c3d4e5f6") 
		const read10BooksThreshold = 10
		read10BooksAchievementObjectID, _ := primitive.ObjectIDFromHex("60d5fa83b281f1b2c3d4e5f7") 

		var unlockedAchievement *AchievementResponse = nil 
		
		if readCount == read1BookThreshold  {
			
			unlockedAchievement = &AchievementResponse{
				ID: read1BookAchievementObjectID.Hex(), 
				Name: "First Read",
				Description: "Read your first book",
			}
			println("User", userID.Hex(), "unlocked achievement:", unlockedAchievement.Name)
			
		} else if unlockedAchievement == nil && readCount >= read10BooksThreshold {
            unlockedAchievement = &AchievementResponse{
                ID: read10BooksAchievementObjectID.Hex(), 
                Name: "Bookworm Beginner",
                Description: "Read 10 books",
            }
             println("User", userID.Hex(), "unlocked achievement:", unlockedAchievement.Name)
             
        }

		c.JSON(http.StatusCreated, gin.H{
			"message": "Mark created successfully",
			"mark_id": newMark.ID.Hex(), 
			"achievement": unlockedAchievement, 
		})
		return 
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Mark created successfully",
		"mark_id": newMark.ID.Hex(),
	})
}

func GetMarksByUser(c *gin.Context) {

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

	if input.Status == "read" {
		readCount, err := CountReadBooksForUser(userID)
		if err != nil {
			println("Error counting read books for user", userID.Hex(), ":", err.Error())
		} else {
			println("User", userID.Hex(), "has read", readCount, "books.")
		}

		const read1BookThreshold = 1
		read1BookAchievementObjectID, _ := primitive.ObjectIDFromHex("60d5f9d5b281f1b2c3d4e5f6") 

		const read10BooksThreshold = 10
		read10BooksAchievementObjectID, _ := primitive.ObjectIDFromHex("60d5fa83b281f1b2c3d4e5f7") 

		var unlockedAchievement *AchievementResponse = nil
		if readCount == read1BookThreshold {
			unlockedAchievement = &AchievementResponse{
				ID: read1BookAchievementObjectID.Hex(), 
				Name: "First Read",
				Description: "Read your first book",
			}
			println("User", userID.Hex(), "unlocked achievement:", unlockedAchievement.Name)
			
		} else if unlockedAchievement == nil && readCount >= read10BooksThreshold  {
            
            unlockedAchievement = &AchievementResponse{
                ID: read10BooksAchievementObjectID.Hex(), 
                Name: "Bookworm Beginner",
                Description: "Read 10 books",
            }
             println("User", userID.Hex(), "unlocked achievement:", unlockedAchievement.Name)
            
        }
		c.JSON(http.StatusOK, gin.H{
			"message": "Mark updated successfully",
			"achievement": unlockedAchievement, 
		})
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

func GetMarksByUserID(c *gin.Context) {
	userId := c.Param("user_id")
	userID, err := primitive.ObjectIDFromHex(userId)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID format"})
		return
	}

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
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch marks with book details"})
		return
	}
	defer cursor.Close(context.TODO())

	var marks []bson.M 
	if err := cursor.All(context.TODO(), &marks); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode marks with book details"})
		return
	}

	c.JSON(http.StatusOK, marks) 
}
