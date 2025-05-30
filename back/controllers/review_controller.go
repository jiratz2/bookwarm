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
	"go.mongodb.org/mongo-driver/mongo/options"
)

func CreateReview(c *gin.Context) {
	// Parse input จาก JSON
	var input struct {
		BookID  string `json:"book_id" binding:"required"`
		Rating  int    `json:"rating" binding:"required,min=1,max=5"`
		Comment string `json:"comment"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// แปลง bookID เป็น ObjectID
	bookID, err := primitive.ObjectIDFromHex(input.BookID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid book ID format"})
		return
	}

	// ดึง email จาก JWT ที่ middleware เซตไว้
	userRaw, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	email := userRaw.(string)

	// ดึงข้อมูล user จาก email
	var user models.User
	userCollection := config.DB.Database("bookwarm").Collection("users")
	err = userCollection.FindOne(context.TODO(), bson.M{"email": email}).Decode(&user)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	// เตรียม collection
	reviewCollection := config.DB.Database("bookwarm").Collection("reviews")

	// ตรวจสอบว่าผู้ใช้รีวิวหนังสือเล่มนี้ไปแล้วหรือยัง
	filter := bson.M{"book_id": bookID, "reviewer_name": user.DisplayName}
	count, err := reviewCollection.CountDocuments(context.TODO(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}
	if count > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "You have already reviewed this book"})
		return
	}

	// ตรวจสอบว่าหนังสือมีอยู่จริงหรือไม่
	bookCollection := config.DB.Database("bookwarm").Collection("books")
	bookCount, err := bookCollection.CountDocuments(context.TODO(), bson.M{"_id": bookID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}
	if bookCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Book not found"})
		return
	}

	// สร้าง Review object
	review := models.Review{
		ID:           primitive.NewObjectID(),
		BookID:       bookID,
		Rating:       input.Rating,
		Comment:      input.Comment,
		ReviewerName: user.DisplayName,
        ReviewProfilePic: user.ProfilePic,
		ReviewDate:   time.Now(),
	}

	// บันทึกลง MongoDB
	_, err = reviewCollection.InsertOne(context.TODO(), review)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save review"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Review submitted successfully", 
		"review": review,
	})
}


func GetAllReviews(c *gin.Context) {
	bookIDParam := c.Param("bookId")
	bookID, err := primitive.ObjectIDFromHex(bookIDParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid book ID format"})
		return
	}

	reviewCollection := config.DB.Database("bookwarm").Collection("reviews")
	filter := bson.M{"book_id": bookID}

	// เรียงลำดับจากใหม่ไปเก่า
	opts := options.Find().SetSort(bson.D{{"review_date", -1}})
	cursor, err := reviewCollection.Find(context.TODO(), filter, opts)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch reviews"})
		return
	}
	defer cursor.Close(context.TODO())

	var reviews []models.Review
	var totalRating int
	
	for cursor.Next(context.TODO()) {
		var review models.Review
		if err := cursor.Decode(&review); err != nil {
			continue // skip invalid reviews
		}
		reviews = append(reviews, review)
		totalRating += review.Rating
	}

	// คำนวณค่าเฉลี่ย rating
	var average float64
	if len(reviews) > 0 {
		average = float64(totalRating) / float64(len(reviews))
	}

	c.JSON(http.StatusOK, gin.H{
		"reviews":        reviews,
		"average_rating": average,
		"total_reviews":  len(reviews),
	})
}

func UpdateReview(c *gin.Context) {
	reviewID, err := primitive.ObjectIDFromHex(c.Param("reviewId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid review ID"})
		return
	}

	var input struct {
		Rating  int    `json:"rating" binding:"required,min=1,max=5"`
		Comment string `json:"comment"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	displayName, _ := c.Get("displayname")
	collection := config.DB.Database("bookwarm").Collection("reviews")

	// เช็คว่า user เป็นเจ้าของรีวิว
	var review models.Review
	if err := collection.FindOne(c, bson.M{"_id": reviewID}).Decode(&review); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Review not found"})
		return
	}
	if review.ReviewerName != displayName {
		c.JSON(http.StatusForbidden, gin.H{"error": "Unauthorized"})
		return
	}

	update := bson.M{
		"$set": bson.M{
			"rating":  input.Rating,
			"comment": input.Comment,
			"updated_at": time.Now(),
		},
	}
	opts := options.FindOneAndUpdate().SetReturnDocument(options.After)
	if err := collection.FindOneAndUpdate(c, bson.M{"_id": reviewID}, update, opts).Decode(&review); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Update failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"review": review})
}


func DeleteReview(c *gin.Context) {
	reviewID, err := primitive.ObjectIDFromHex(c.Param("reviewId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid review ID"})
		return
	}

	displayName, _ := c.Get("displayname")
	collection := config.DB.Database("bookwarm").Collection("reviews")

	// เช็คว่า user เป็นเจ้าของรีวิว
	var review models.Review
	if err := collection.FindOne(c, bson.M{"_id": reviewID}).Decode(&review); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Review not found"})
		return
	}
	if review.ReviewerName != displayName {
		c.JSON(http.StatusForbidden, gin.H{"error": "Unauthorized"})
		return
	}

	_, err = collection.DeleteOne(c, bson.M{"_id": reviewID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Delete failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Review deleted"})
}


// เพิ่มฟังก์ชันสำหรับดึงรีวิวของ user
func GetUserReviews(c *gin.Context) {
	userRaw, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	email := userRaw.(string)

	// หา display name
	var user models.User
	userCollection := config.DB.Database("bookwarm").Collection("users")
	if err := userCollection.FindOne(context.TODO(), bson.M{"email": email}).Decode(&user); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	reviewCollection := config.DB.Database("bookwarm").Collection("reviews")
	cursor, err := reviewCollection.Find(context.TODO(), bson.M{"reviewer_name": user.DisplayName})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch reviews"})
		return
	}
	defer cursor.Close(context.TODO())

	var reviews []models.Review
	if err := cursor.All(context.TODO(), &reviews); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode reviews"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"reviews": reviews})
}
