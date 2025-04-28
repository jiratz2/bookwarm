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

func CreateBook(c *gin.Context) {
	var input models.Book
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	input.ID = primitive.NewObjectID()
	input.CreatedAt = time.Now()
	input.UpdatedAt = time.Now()

	collection := config.DB.Database("bookwarm").Collection("books")
	_, err := collection.InsertOne(context.TODO(), input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create book"})
		return
	}

	c.JSON(http.StatusOK, input)
}

func GetAllBooks(c *gin.Context) {
	collection := config.DB.Database("bookwarm").Collection("books")

	// ใช้ pipeline เพื่อดึงข้อมูลทั้งหมด
	pipeline := []bson.M{
		{
			"$lookup": bson.M{
				"from":         "author",
				"localField":   "authorId",
				"foreignField": "_id",
				"as":           "author",
			},
		},
		{
			"$lookup": bson.M{
				"from":         "category",
				"localField":   "category_id",
				"foreignField": "_id",
				"as":           "category",
			},
		},
		{
			"$lookup": bson.M{
				"from":         "genre",
				"localField":   "genres",
				"foreignField": "_id",
				"as":           "genres",
			},
		},
		{
			"$lookup": bson.M{
				"from":         "tag",
				"localField":   "tagIds",
				"foreignField": "_id",
				"as":           "tags",
			},
		},
		{
			"$unset": []string{"authorId", "category_id", "tagIds"}, // ลบฟิลด์ที่ไม่ต้องการ
		},
	}

	cursor, err := collection.Aggregate(context.TODO(), pipeline)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch books: " + err.Error()})
		return
	}
	defer cursor.Close(context.TODO())

	var books []bson.M
	if err := cursor.All(context.TODO(), &books); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode books: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, books)
}

func GetBookByID(c *gin.Context) {
	idParam := c.Param("id")
	bookID, err := primitive.ObjectIDFromHex(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid book ID"})
		return
	}

	collection := config.DB.Database("bookwarm").Collection("books")

	// สร้าง pipeline สำหรับ Aggregation
	pipeline := []bson.M{
		{
			"$match": bson.M{
				"_id": bookID,
			},
		},
		{
			"$lookup": bson.M{
				"from":         "author",
				"localField":   "authorId",
				"foreignField": "_id",
				"as":           "author",
			},
		},
		{
			"$lookup": bson.M{
				"from":         "category",
				"localField":   "category_id",
				"foreignField": "_id",
				"as":           "category",
			},
		},
		{
			"$lookup": bson.M{
				"from":         "genre",
				"localField":   "genres",
				"foreignField": "_id",
				"as":           "genres",
			},
		},
		{
			"$lookup": bson.M{
				"from":         "tag",
				"localField":   "tagIds",
				"foreignField": "_id",
				"as":           "tags",
			},
		},
		{
			"$unset": []string{"authorId", "category_id", "tagIds"}, // ลบฟิลด์ที่ไม่ต้องการ
		},
	}

	cursor, err := collection.Aggregate(context.TODO(), pipeline)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch book: " + err.Error()})
		return
	}

	defer cursor.Close(context.TODO())

	var results []bson.M
	if err := cursor.All(context.TODO(), &results); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode book: " + err.Error()})
		return
	}

	if len(results) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Book not found"})
		return
	}

	c.JSON(http.StatusOK, results[0])
}

func UpdateBook(c *gin.Context) {
	idParam := c.Param("id")
	bookID, err := primitive.ObjectIDFromHex(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid book ID"})
		return
	}

	var input models.Book
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	input.UpdatedAt = time.Now()
	update := bson.M{
		"$set": bson.M{
			"title":       input.Title,
			"description": input.Description,
			"authorId":    input.AuthorID,
			"seriesId":    input.SeriesID,
			"categoryId":  input.CategoryID,
			"genres":      input.Genres,
			"tagIds":      input.TagIDs,
			"publishYear": input.PublishYear,
			"pageCount":   input.PageCount,
			"rating":      input.Rating,
			"coverImage":  input.CoverImage,
			"updatedAt":   input.UpdatedAt,
		},
	}

	collection := config.DB.Database("bookwarm").Collection("books")
	_, err = collection.UpdateOne(context.TODO(), bson.M{"_id": bookID}, update)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update book"})
		return
	}

	// ดึงข้อมูลหนังสือที่อัพเดทแล้วพร้อมข้อมูลที่เชื่อมโยง
	pipeline := []bson.M{
		{
			"$match": bson.M{
				"_id": bookID,
			},
		},
		{
			"$lookup": bson.M{
				"from":         "author",
				"localField":   "authorId",
				"foreignField": "_id",
				"as":           "author",
			},
		},
		{
			"$lookup": bson.M{
				"from":         "category",
				"localField":   "category_id",
				"foreignField": "_id",
				"as":           "category",
			},
		},
		{
			"$lookup": bson.M{
				"from":         "genre",
				"localField":   "genres",
				"foreignField": "_id",
				"as":           "genres",
			},
		},
		{
			"$lookup": bson.M{
				"from":         "tag",
				"localField":   "tagIds",
				"foreignField": "_id",
				"as":           "tags",
			},
		},
		{
			"$unset": []string{"authorId", "category_id", "tagIds"}, // ลบฟิลด์ที่ไม่ต้องการ
		},
	}

	cursor, err := collection.Aggregate(context.TODO(), pipeline)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"message": "Book updated successfully"})
		return
	}

	defer cursor.Close(context.TODO())

	var results []bson.M
	if err := cursor.All(context.TODO(), &results); err != nil {
		c.JSON(http.StatusOK, gin.H{"message": "Book updated successfully"})
		return
	}

	if len(results) == 0 {
		c.JSON(http.StatusOK, gin.H{"message": "Book updated successfully"})
		return
	}

	c.JSON(http.StatusOK, results[0])
}

func DeleteBook(c *gin.Context) {
	idParam := c.Param("id")
	bookID, err := primitive.ObjectIDFromHex(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid book ID"})
		return
	}

	collection := config.DB.Database("bookwarm").Collection("books")
	_, err = collection.DeleteOne(context.TODO(), bson.M{"_id": bookID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete book"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Book deleted successfully"})
}
