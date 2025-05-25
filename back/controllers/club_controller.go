package controllers

import (
	"back/config"
	"back/models"
	"context"
	"net/http"
	"time"
	"fmt"
	"os"
	"io"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// CreateClub สร้าง Club ใหม่
func CreateClub(c *gin.Context) {
	// Parse form
	if err := c.Request.ParseMultipartForm(10 << 20); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse form"})
		return
	}

	name := c.PostForm("name")
	description := c.PostForm("description")

	// ดึงผู้ใช้
	userRaw, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	email := userRaw.(string)

	// หา user
	var user models.User
	userCollection := config.DB.Database("bookwarm").Collection("users")
	err := userCollection.FindOne(context.TODO(), bson.M{"email": email}).Decode(&user)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	// รับไฟล์ภาพ
	file, header, err := c.Request.FormFile("cover_image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Image file is required"})
		return
	}
	defer file.Close()

	// สร้าง path
	filename := fmt.Sprintf("%d_%s", time.Now().Unix(), header.Filename)
	savePath := "uploads/" + filename

	// สร้างโฟลเดอร์ถ้ายังไม่มี
	os.MkdirAll("uploads", os.ModePerm)

	// บันทึกไฟล์
	out, err := os.Create(savePath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save image"})
		return
	}
	defer out.Close()
	io.Copy(out, file)

	// บันทึกข้อมูลคลับ
	club := models.Club{
		ID:          primitive.NewObjectID(),
		Name:        name,
		Description: description,
		CoverImage:  "/uploads/" + filename, // path สำหรับ front ใช้
		OwnerID:     user.ID,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	clubCollection := config.DB.Database("bookwarm").Collection("clubs")
	_, err = clubCollection.InsertOne(context.TODO(), club)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create club"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Club created successfully", "id": club.ID})
}


// GetAllClubs ดึงรายการ Club ทั้งหมด
func GetAllClubs(c *gin.Context) {
	collection := config.DB.Database("bookwarm").Collection("clubs")

	cursor, err := collection.Find(context.TODO(), bson.M{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch clubs"})
		return
	}
	defer cursor.Close(context.TODO())

	var clubs []models.Club
	if err := cursor.All(context.TODO(), &clubs); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode clubs"})
		return
	}

	c.JSON(http.StatusOK, clubs)
}

// GetClubByID ดึง Club ตาม ID
func GetClubByID(c *gin.Context) {
	id := c.Param("id")
	clubID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid club ID"})
		return
	}

	collection := config.DB.Database("bookwarm").Collection("clubs")

	var club models.Club
	err = collection.FindOne(context.TODO(), bson.M{"_id": clubID}).Decode(&club)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Club not found"})
		return
	}

	c.JSON(http.StatusOK, club)
}

// UpdateClub แก้ไขข้อมูล Club
func UpdateClub(c *gin.Context) {
	id := c.Param("id")
	clubID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid club ID"})
		return
	}

	if err := c.Request.ParseMultipartForm(10 << 20); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse form"})
		return
	}

	name := c.PostForm("name")
	description := c.PostForm("description")

	update := bson.M{
		"name":        name,
		"description": description,
		"updated_at":  time.Now(),
	}

	// เช็คว่ามีภาพไหม
	file, header, err := c.Request.FormFile("cover_image")
	if err == nil {
		defer file.Close()

		// สร้าง path
		filename := fmt.Sprintf("%d_%s", time.Now().Unix(), header.Filename)
		savePath := "uploads/" + filename
		os.MkdirAll("uploads", os.ModePerm)

		out, err := os.Create(savePath)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save image"})
			return
		}
		defer out.Close()
		io.Copy(out, file)

		update["cover_image"] = "/uploads/" + filename
	}

	collection := config.DB.Database("bookwarm").Collection("clubs")
	result, err := collection.UpdateOne(context.TODO(), bson.M{"_id": clubID}, bson.M{"$set": update})
	if err != nil || result.MatchedCount == 0 {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update club"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Club updated successfully", "id": clubID})
}


// DeleteClub ลบ Club
func DeleteClub(c *gin.Context) {
	id := c.Param("id")
	clubID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid club ID"})
		return
	}

	collection := config.DB.Database("bookwarm").Collection("clubs")

	result, err := collection.DeleteOne(context.TODO(), bson.M{"_id": clubID})
	if err != nil || result.DeletedCount == 0 {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete club"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Club deleted successfully"})
}
