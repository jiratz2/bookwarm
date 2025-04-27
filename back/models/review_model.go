package models

import (
	"time"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Review struct {
	ID		primitive.ObjectID `json:"id,omitempty" bson:"_id,omitempty"`
	BookID	primitive.ObjectID `json:"book_id" bson:"book_id"`
	UserID	primitive.ObjectID `json:"user_id" bson:"user_id"`
	Rating	float64				`json:"rating" bson:"rating"`
	TextReview	string			`json:"text_review" bson:"text_review"`
	CreatedAt	time.Time		`json:"created_at,omitempty" bson:"created_at,omitempty"`
}