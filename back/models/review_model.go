package models
import (
	"time"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Review struct {
    ID           primitive.ObjectID `bson:"_id,omitempty" json:"id"`
    BookID       primitive.ObjectID `bson:"book_id" json:"book_id"`
    Rating       int                `bson:"rating" json:"rating"`
    Comment      string             `bson:"comment" json:"comment"`
    ReviewerName string             `bson:"reviewer_name" json:"reviewer_name"`
    ReviewProfilePic string             `bson:"review_profile_pic" json:"review_profile_pic"`
    ReviewDate   time.Time          `bson:"review_date" json:"review_date"`
    UpdatedAt time.Time `bson:"updated_at,omitempty" json:"updated_at,omitempty"`

}
