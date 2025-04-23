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

func CreateCategory(c *gin.Context) {
	var input models.Category
	if err:= c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	input.ID = primitive.NewObjectID()
	collection := config.DB.Database("bookwarm").Collection("category")

	_, err := collection.InsertOne(context.TODO(), input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create category"})
		return
	}

	c.JSON(http.StatusOK,gin.H{"message": "Category created successfully","id": input.ID})
}

func GetAllCategory(c *gin.Context) {
	collection := config.DB.Database("bookwarm").Collection("category")
	cursor, err := collection.Find(context.TODO(),bson.D{})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch category"})
		return
	}

	defer cursor.Close(context.TODO())

	var categories []models.Category
	for cursor.Next(context.TODO()) {
		var category models.Category
		if err := cursor.Decode(&category); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode category"})
			return
		}
		categories = append(categories,category)
	}
	c.JSON(http.StatusOK, categories)
}

func UpdateCategory(c *gin.Context) {
	categoryID := c.Param("id")

	var input models.Category
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	objectID, err := primitive.ObjectIDFromHex(categoryID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid category ID"})
		return
	}

	collection := config.DB.Database("bookwarm").Collection("category")
	update := bson.M{"$set":bson.M{"name": input.Name, "update_at": time.Now()}}
	_, err = collection.UpdateOne(context.TODO(), bson.M{"_id": objectID},update)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update category"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Category updated successfully"})
}

func DeleteCategory(c *gin.Context) {
	categoryID := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(categoryID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid category ID"})
		return
	}

	collection := config.DB.Database("bookwarm").Collection("category")
	_, err = collection.DeleteOne(context.TODO(),bson.M{"_id": objectID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete category"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Category deleted successfully"})
}