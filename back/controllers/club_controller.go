package controllers

import (
	"back/config"
	"back/models"
	"context"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"

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

	// ตรวจสอบ required fields
	if name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Club name is required"})
		return
	}

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

	// สร้าง club object
	club := models.Club{
		ID:          primitive.NewObjectID(),
		Name:        name,
		Description: description,
		OwnerID:     user.ID,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
		Members:     []primitive.ObjectID{user.ID}, // เพิ่มตรงนี้
	}

	// รับไฟล์ภาพ (optional)
	file, header, err := c.Request.FormFile("cover_image")
	if err == nil {
		// มีรูปภาพ
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

		club.CoverImage = "/uploads/" + filename

	} else {
		// ไม่มีรูปภาพ ใช้รูป default หรือเว้นว่าง
		club.CoverImage = "" // หรือ "/uploads/default.jpg"
	}

	// บันทึกข้อมูลคลับ
	clubCollection := config.DB.Database("bookwarm").Collection("clubs")
	_, err = clubCollection.InsertOne(context.TODO(), club)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create club"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Club created successfully", "id": club.ID})
}

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

	// Debug: Print club data
	for i, club := range clubs {
		fmt.Printf("Club %d: Name=%s, CoverImage=%s\n", i, club.Name, club.CoverImage)
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

	clubCollection := config.DB.Database("bookwarm").Collection("clubs")
	userCollection := config.DB.Database("bookwarm").Collection("users")

	var club models.Club
	err = clubCollection.FindOne(context.TODO(), bson.M{"_id": clubID}).Decode(&club)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Club not found"})
		return
	}

	// ดึงชื่อเจ้าของจาก owner_id
	var owner models.User
	err = userCollection.FindOne(context.TODO(), bson.M{"_id": club.OwnerID}).Decode(&owner)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get club owner"})
		return
	}

	// ส่งข้อมูล club + owner_display_name
	c.JSON(http.StatusOK, gin.H{
		"id":                 club.ID,
		"name":               club.Name,
		"description":        club.Description,
		"cover_image":        club.CoverImage,
		"owner_id":           club.OwnerID,
		"owner_display_name": owner.DisplayName,
		"members":            club.Members,
		"created_at":         club.CreatedAt,
		"updated_at":         club.UpdatedAt,
	})
}


func JoinClub(c *gin.Context) {
	clubIDHex := c.Param("id")
	clubID, err := primitive.ObjectIDFromHex(clubIDHex)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid club ID"})
		return
	}

	// ดึง email จาก JWT
	userRaw, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	email := userRaw.(string)

	// หา user
	var user models.User
	userCollection := config.DB.Database("bookwarm").Collection("users")
	err = userCollection.FindOne(context.TODO(), bson.M{"email": email}).Decode(&user)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	// อัปเดต club: เพิ่ม user.ID เข้า members ถ้ายังไม่มี
	clubCollection := config.DB.Database("bookwarm").Collection("clubs")
	update := bson.M{
		"$addToSet": bson.M{"members": user.ID}, // ป้องกันซ้ำ
	}

	result, err := clubCollection.UpdateOne(context.TODO(), bson.M{"_id": clubID}, update)
	if err != nil || result.MatchedCount == 0 {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to join club"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Joined club successfully"})
}

func LeaveClub(c *gin.Context) {
	clubIDHex := c.Param("id")
	clubID, err := primitive.ObjectIDFromHex(clubIDHex)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid club ID"})
		return
	}

	// ดึง email จาก JWT
	userRaw, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	email := userRaw.(string)

	// หา user
	var user models.User
	userCollection := config.DB.Database("bookwarm").Collection("users")
	err = userCollection.FindOne(context.TODO(), bson.M{"email": email}).Decode(&user)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	// ดึงข้อมูลคลับมาก่อน
	clubCollection := config.DB.Database("bookwarm").Collection("clubs")
	var club models.Club
	err = clubCollection.FindOne(context.TODO(), bson.M{"_id": clubID}).Decode(&club)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Club not found"})
		return
	}

	// 🔐 เช็คว่า user เป็นเจ้าของคลับหรือไม่
	if club.OwnerID == user.ID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Owner cannot leave their own club"})
		return
	}

	// ถ้าไม่ใช่เจ้าของ ก็ออกได้
	update := bson.M{
		"$pull": bson.M{"members": user.ID},
	}
	result, err := clubCollection.UpdateOne(context.TODO(), bson.M{"_id": clubID}, update)
	if err != nil || result.MatchedCount == 0 {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to leave club"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Left club successfully"})
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
