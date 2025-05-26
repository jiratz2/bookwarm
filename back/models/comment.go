package models
import (
	"time"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Comment struct {
    ID        primitive.ObjectID `bson:"_id,omitempty"`
    PostID    primitive.ObjectID `bson:"post_id"`
    UserID    primitive.ObjectID `bson:"user_id"`
    Content   string             `bson:"content"`
	Likes     []primitive.ObjectID `bson:"likes"`
    CreatedAt time.Time          `bson:"created_at"`
    UpdatedAt time.Time          `bson:"updated_at"`
}
