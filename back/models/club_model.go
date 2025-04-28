package models

import (
	"go.mongodb.org/mongo-driver/bson/primitive"
	"time"
)

type Club struct {
	ID 		primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	Name 	string             `json:"name" bson:"name"`
	Description string             `json:"description" bson:"description"`
	CoverImage string             `json:"cover_image" bson:"cover_image"` // URL ของรูปหน้าปกหนังสือ
	OwnerID	primitive.ObjectID `json:"owner_id" bson:"owner_id"`
	CreatedAt time.Time          `json:"created_at" bson:"created_at"`
	UpdatedAt time.Time          `json:"updated_at" bson:"updated_at"`
}