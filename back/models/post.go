package models
import (
	"time"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Post struct {
    ID        primitive.ObjectID   `bson:"_id,omitempty"`
    ClubID    primitive.ObjectID   `bson:"club_id"`
    UserID    primitive.ObjectID   `bson:"user_id"`
    Content   string               `bson:"content"`
    Likes     []primitive.ObjectID `bson:"likes"`
    CreatedAt time.Time            `bson:"created_at"`
    UpdatedAt time.Time            `bson:"updated_at"`
}
