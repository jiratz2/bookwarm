package controllers

import (
	"back/config"
	"back/models"
	"context"
	"math"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"log"
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

// GET /api/books/search?query=harry
func SearchBooks(c *gin.Context) {
    query := c.Query("query")
    if query == "" {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Query is required"})
        return
    }

    collection := config.DB.Database("bookwarm").Collection("books")

    filter := bson.M{
        "title": bson.M{
            "$regex":   query,
            "$options": "i", // case-insensitive
        },
    }

    cursor, err := collection.Find(context.TODO(), filter)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Error finding books"})
        return
    }

    var books []bson.M
    if err := cursor.All(context.TODO(), &books); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Error decoding books"})
        return
    }

    c.JSON(http.StatusOK, books)
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

// GetRecommendedBooks returns books with high ratings
func GetRecommendedBooks(c *gin.Context) {
	log.Println("Getting recommended books...")
	
	pipeline := mongo.Pipeline{
		{{Key: "$lookup", Value: bson.D{
			{Key: "from", Value: "reviews"},
			{Key: "localField", Value: "_id"},
			{Key: "foreignField", Value: "book_id"},
			{Key: "as", Value: "reviews"},
		}}},
		{{Key: "$addFields", Value: bson.D{
			{Key: "avg_rating", Value: bson.D{
				{Key: "$avg", Value: "$reviews.rating"},
			}},
			{Key: "review_count", Value: bson.D{
				{Key: "$size", Value: "$reviews"},
			}},
		}}},
		{{Key: "$match", Value: bson.D{
			{Key: "review_count", Value: bson.D{
				{Key: "$gt", Value: 0},
			}},
		}}},
		{{Key: "$sort", Value: bson.D{
			{Key: "avg_rating", Value: -1},
			{Key: "review_count", Value: -1},
		}}},
		{{Key: "$limit", Value: 6}},
		{{Key: "$project", Value: bson.D{
			{Key: "_id", Value: 1},
			{Key: "title", Value: 1},
			{Key: "author", Value: 1},
			{Key: "coverImage", Value: 1},
			{Key: "description", Value: 1},
			{Key: "avg_rating", Value: 1},
			{Key: "review_count", Value: 1},
		}}},
	}

	log.Println("Executing aggregation pipeline...")
	collection := config.DB.Database("bookwarm").Collection("books")
	if collection == nil {
		log.Println("Error: Collection is nil")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database collection not found"})
		return
	}

	cursor, err := collection.Aggregate(context.Background(), pipeline)
	if err != nil {
		log.Printf("Error in aggregation: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch recommended books"})
		return
	}
	defer cursor.Close(context.Background())

	var recommendedBooks []bson.M
	if err = cursor.All(context.TODO(), &recommendedBooks); err != nil {
		log.Printf("Error decoding recommended books: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error decoding recommended books", "details": err.Error()})
		return
	}

	log.Printf("Found %d recommended books", len(recommendedBooks))

	// Convert ObjectIDs to strings and round average rating
	for _, book := range recommendedBooks {
		if id, ok := book["_id"]; ok {
			if oid, isOID := id.(primitive.ObjectID); isOID {
				book["_id"] = oid.Hex()
			}
		}

		// Log the cover_image value
		if coverImage, ok := book["coverImage"]; ok {
			log.Printf("Book %s cover_image: %v", book["_id"], coverImage)
		} else {
			log.Printf("Book %s cover_image: nil or not found", book["_id"])
		}

		if avgRating, ok := book["avg_rating"].(float64); ok {
			book["avg_rating"] = math.Round(avgRating*10) / 10
		} else if avgRating, ok := book["avg_rating"].(int32); ok {
			book["avg_rating"] = float64(avgRating)
		} else {
			book["avg_rating"] = 0.0
		}
	}

	c.JSON(http.StatusOK, gin.H{"books": recommendedBooks})
}
