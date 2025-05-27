package models
import (
	"time"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Post struct {
	ID        primitive.ObjectID   `bson:"_id,omitempty" json:"id"`
	ClubID    primitive.ObjectID   `bson:"club_id" json:"club_id"`
	UserID    primitive.ObjectID   `bson:"user_id" json:"user_id"`
	Content   string               `bson:"content" json:"content"`
	BookID    *primitive.ObjectID  `bson:"book_id,omitempty" json:"book_id,omitempty"`
	Likes     []primitive.ObjectID `bson:"likes" json:"likes"`
	CreatedAt time.Time            `bson:"created_at" json:"created_at"`
	UpdatedAt time.Time            `bson:"updated_at" json:"updated_at"`
}

