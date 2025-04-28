package models

import (
	"go.mongodb.org/mongo-driver/bson/primitive"
	"time"
)

type Mark struct {
	ID        primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	BookID    primitive.ObjectID `json:"book_id" bson:"book_id"`
	UserID    primitive.ObjectID `json:"user_id" bson:"user_id"`
	Status    string             `json:"status" bson:"status"` // "want to read", "now reading", "read", "did not finish"
	CreatedAt time.Time          `json:"created_at" bson:"created_at"`
	UpdatedAt time.Time          `json:"updated_at" bson:"updated_at"`
}
