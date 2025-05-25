package controllers

import(
	"back/config"
	"back/models"
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func CreateReview(c *gin.Context) {
	var review models.Review

	if err := c.ShouldBindJSON(&review); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// ต้องเช็กเองนิดนึงว่า book_id กับ user_id ที่รับมาต้องเป็น valid ObjectID
	if review.BookID.IsZero() || review.UserID.IsZero() {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid BookID or UserID"})
		return
	}

	review.ID = primitive.NewObjectID()
	review.CreatedAt = time.Now()

	collection := config.DB.Database("bookwarm").Collection("reviews")
	res, err := collection.InsertOne(context.TODO(), review)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create review"})
		return
	}

	// --- เพิ่มตรงนี้ --- อัปเดต Rating หนังสือหลังรีวิวใหม่
	if err := updateBookRating(review.BookID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update book rating"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":   "Review created successfully",
		"review_id": res.InsertedID,
	})
}

func updateBookRating(bookID primitive.ObjectID) error {
	reviewCollection := config.DB.Database("bookwarm").Collection("reviews")
	bookCollection := config.DB.Database("bookwarm").Collection("books")

	// ดึงรีวิวทั้งหมดของหนังสือเล่มนั้น
	cursor, err := reviewCollection.Find(context.TODO(), bson.M{"book_id": bookID})
	if err != nil {
		return err
	}
	defer cursor.Close(context.TODO())

	var reviews []models.Review
	if err := cursor.All(context.TODO(), &reviews); err != nil {
		return err
	}

	if len(reviews) == 0 {
		// ไม่มีรีวิวเลย ไม่ต้องอัปเดต
		return nil
	}

	// คำนวณค่าเฉลี่ย
	var total float64
	for _, r := range reviews {
		total += r.Rating
	}
	average := total / float64(len(reviews))

	// อัปเดตฟิลด์ rating ของหนังสือ
	_, err = bookCollection.UpdateOne(
		context.TODO(),
		bson.M{"_id": bookID},
		bson.M{"$set": bson.M{"rating": average}},
	)

	return err
}

func GetAllReviews(c *gin.Context) {
	bookIDParam := c.Query("book_id")
	bookID, err := primitive.ObjectIDFromHex(bookIDParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid BookID"})
		return
	}

	collection := config.DB.Database("bookwarm").Collection("reviews")
	cursor, err := collection.Find(context.TODO(), bson.M{"book_id": bookID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch reviews"})
		return
	}

	defer cursor.Close(context.TODO())

	var reviews []models.Review
	for cursor.Next(context.TODO()) {
		var review models.Review
		if err := cursor.Decode(&review); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode review"})
			return
		}
		reviews = append(reviews, review)
	}
	c.JSON(http.StatusOK, reviews)
}

func DeleteReview(c *gin.Context) {
	idParam := c.Param("id")
	reviewID, err := primitive.ObjectIDFromHex(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid review ID"})
		return
	}

	reviewCollection := config.DB.Database("bookwarm").Collection("reviews")

	// ดึงรีวิวที่กำลังจะลบมาก่อน เพื่อจะได้รู้ book_id
	var review models.Review
	err = reviewCollection.FindOne(context.TODO(), bson.M{"_id": reviewID}).Decode(&review)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Review not found"})
		return
	}

	// ลบรีวิว
	res, err := reviewCollection.DeleteOne(context.TODO(), bson.M{"_id": reviewID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete review"})
		return
	}

	if res.DeletedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Review not found"})
		return
	}

	// อัปเดต Rating ของหนังสือหลังจากลบรีวิว
	if err := updateBookRating(review.BookID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update book rating"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Review deleted successfully"})
}
