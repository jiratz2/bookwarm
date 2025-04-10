package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type User struct {
	ID          	primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	DisplayName 	string `json:"displayname" bson:"displayname"`
	Email       	string `json:"email" bson:"email"`
	Password    	string `json:"password" bson:"password"`
	ProfilePic 		string `json:"profile_img_url,omitempty" bson:"profile_img_url,omitempty"`
	BgImgURL       	string    `json:"bg_img_url,omitempty" bson:"bg_img_url,omitempty"`
	Bio            	string    `json:"bio,omitempty" bson:"bio,omitempty"`
	CreatedAt  		time.Time `json:"created_at" bson:"created_at"`
	UpdatedAt      	time.Time `json:"updated_at" bson:"updated_at"`
}