package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type User struct {
	ID          primitive.ObjectID `bson:"_id,omitempty"`
	Email       string             `bson:"email"`
	DisplayName string             `bson:"displayname"`
	Password    string             `bson:"password"`
	ProfilePic  string             `bson:"profile_img_url"`
	BgImgURL    string             `bson:"bg_img_url"`
	Bio         string             `bson:"bio"`
	CreatedAt   time.Time          `bson:"created_at"`
	UpdatedAt   time.Time          `bson:"updated_at"`
}
