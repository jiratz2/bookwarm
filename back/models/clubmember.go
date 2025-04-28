package models

import (
	"go.mongodb.org/mongo-driver/bson/primitive"
	"time"
)

type ClubMember struct {
	ID        primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	ClubID    primitive.ObjectID `json:"club_id" bson:"club_id"`
	UserID    primitive.ObjectID `json:"user_id" bson:"user_id"`
	Role      string             `json:"role" bson:"role"` // เช่น "member", "admin", "moderator"
	JoinedAt  time.Time          `json:"joined_at" bson:"joined_at"`
}
