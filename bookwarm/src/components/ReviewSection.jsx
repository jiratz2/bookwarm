// components/ReviewSection.jsx
import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import toast from "react-hot-toast";

const ReviewSection = ({ bookId }) => {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [reviews, setReviews] = useState([]);
  const [userReview, setUserReview] = useState(null);
  const [otherReviews, setOtherReviews] = useState([]);
  const [average, setAverage] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        console.log("Decoded token (initial effect):", decoded);
        const userIdentifier = decoded.displayname;
        setCurrentUser(userIdentifier);
        console.log("Current user set to (initial effect):", userIdentifier);
      } catch (err) {
        console.error("Token decode error (initial effect):", err);
        toast.error("Invalid token");
        localStorage.removeItem("token");
      }
    }
  }, []);

  useEffect(() => {
    if (!bookId) return;

    const fetchReviews = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`http://localhost:8080/api/reviews/${bookId}`);
        const data = await res.json();

        if (!res.ok) {
          console.error("❌ Failed to fetch reviews:", data);
          throw new Error(data.error || `HTTP error! status: ${res.status}`);
        }

        console.log("📚 Reviews data:", data);

        const fetchedReviews = data.reviews || [];
        
        // ✅ กรองข้อมูลซ้ำโดยใช้ _id
        const uniqueReviews = fetchedReviews.filter((review, index, self) => 
          index === self.findIndex(r => r._id === review._id)
        );
        
        setReviews(uniqueReviews);
        setAverage(data.average_rating || 0);

        // แยกรีวิวของผู้ใช้และรีวิวของคนอื่น
        const token = localStorage.getItem("token");
        if (token) {
          try {
            const decoded = jwtDecode(token);
            console.log("🔑 Decoded token:", decoded);

            const userIdentifier = decoded.displayname;
            console.log("👤 User displayname from token:", userIdentifier);
            console.log("📝 All unique reviews:", uniqueReviews);

            // แยกรีวิวของผู้ใช้และคนอื่น
            const userReviewFound = uniqueReviews.find(r => r.reviewer_name === userIdentifier);
            const othersReviews = uniqueReviews.filter(r => r.reviewer_name !== userIdentifier);

            if (userReviewFound) {
              setUserReview(userReviewFound);
              setHasReviewed(true);
              console.log("✅ User review found:", userReviewFound);
            } else {
              setUserReview(null);
              setHasReviewed(false);
              console.log("❌ No user review found");
            }

            setOtherReviews(othersReviews);
            console.log("👥 Other reviews:", othersReviews);
          } catch (err) {
            console.error("❌ Token decode error:", err);
            setHasReviewed(false);
            setUserReview(null);
            setOtherReviews(uniqueReviews);
          }
        } else {
          setHasReviewed(false);
          setUserReview(null);
          setOtherReviews(uniqueReviews);
        }
      } catch (err) {
        console.error("❌ Failed to load reviews:", err);
        setError(err.message || "Failed to load reviews");
        toast.error(err.message || "Failed to load reviews");
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [bookId]);

  // เพิ่ม useEffect เพื่อ reset hasReviewed เมื่อ bookId เปลี่ยน
  useEffect(() => {
    setHasReviewed(false);
    setUserReview(null);
  }, [bookId]);

  const handleRating = (value) => setRating(value);

  const handleSubmitReview = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      toast.error("Please login to submit a review");
      return;
    }

    if (hasReviewed) {
      toast.error("You have already reviewed this book");
      return;
    }

    if (review.trim() === "" || rating === 0) {
      toast.error("Please provide both rating and comment");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:8080/api/reviews/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          book_id: bookId,
          rating,
          comment: review,
        }),
      });

      console.log("Submitting review:", {
        book_id: bookId,
        rating,
        comment: review,
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem("token");
          setCurrentUser(null);
          toast.error("Session expired. Please login again.");
          return;
        }

        toast.error(data.error || "Submit failed");
        return;
      }

      if (data.review) {
        // ตั้ง user review และอัปเดต reviews ทั้งหมด
        setUserReview(data.review);
        const newReviews = [data.review, ...reviews];
        setReviews(newReviews);

        const newAverage =
          newReviews.reduce((sum, r) => sum + r.rating, 0) / newReviews.length;
        setAverage(newAverage);
      }

      setRating(0);
      setReview("");
      toast.success("Review submitted successfully");
      setHasReviewed(true);
    } catch (err) {
      console.error("Submit error:", err);
      toast.error(err.message || "Error submitting review");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!confirm("Are you sure you want to delete this review?")) return;

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login to delete review");
      return;
    }

    try {
      const res = await fetch(`http://localhost:8080/api/reviews/${reviewId}`, {
        method: "DELETE",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem("token");
          setCurrentUser(null);
          toast.error("Session expired. Please login again.");
          return;
        }
        if (res.status === 403) {
          toast.error("You are not authorized to delete this review");
          return;
        }
        throw new Error(data.error || "Delete failed");
      }

      // อัปเดตรายการรีวิวและค่าเฉลี่ยโดยใช้ _id
      const updatedReviews = reviews.filter((r) => r._id !== reviewId);
      setReviews(updatedReviews);
      
      // ลบ user review ถ้าเป็นรีวิวของ user
      if (userReview && userReview._id === reviewId) {
        setUserReview(null);
        setHasReviewed(false);
      }

      // อัปเดต other reviews
      setOtherReviews(prev => prev.filter(r => r._id !== reviewId));

      if (updatedReviews.length > 0) {
        const newAverage =
          updatedReviews.reduce((sum, r) => sum + r.rating, 0) / updatedReviews.length;
        setAverage(newAverage);
      } else {
        setAverage(0);
      }

      toast.success("Review deleted successfully");
    } catch (err) {
      console.error("Delete error:", err);
      toast.error(err.message || "Delete failed");
    }
  };

  // ตรวจสอบว่า user ล็อกอินหรือไม่
  const isLoggedIn = Boolean(localStorage.getItem("token") && currentUser);

  // State สำหรับแก้ไขรีวิว
  const [editMode, setEditMode] = useState(false);
  const [editRating, setEditRating] = useState(0);
  const [editComment, setEditComment] = useState("");
  const [editReviewId, setEditReviewId] = useState(null);

  // ฟังก์ชันเริ่มแก้ไข
  const startEditReview = (review) => {
    setEditMode(true);
    setEditRating(review.rating);
    setEditComment(review.comment);
    setEditReviewId(review._id);
  };

  // ฟังก์ชันยกเลิกแก้ไข
  const cancelEdit = () => {
    setEditMode(false);
    setEditRating(0);
    setEditComment("");
    setEditReviewId(null);
  };

  // ฟังก์ชัน submit แก้ไขรีวิว
  const handleUpdateReview = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login to update review");
      return;
    }
    if (editComment.trim() === "" || editRating === 0) {
      toast.error("Please provide both rating and comment");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8080/api/reviews/${editReviewId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rating: editRating, comment: editComment }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Update failed");
        return;
      }
      
      // อัปเดต user review
      if (userReview && userReview._id === editReviewId) {
        const updatedUserReview = { ...userReview, rating: editRating, comment: editComment, updated_at: new Date() };
        setUserReview(updatedUserReview);
      }
      
      // อัปเดตรีวิวใน state โดยใช้ _id ในการค้นหา
      setReviews(reviews => reviews.map(r => r._id === editReviewId ? { ...r, rating: editRating, comment: editComment, updated_at: new Date() } : r));
      
      // Recalculate average
      setAverage(
        (() => {
          const newReviews = reviews.map(r => r._id === editReviewId ? { ...r, rating: editRating } : r);
          const totalRating = newReviews.reduce((sum, r) => sum + (r.rating || 0), 0);
          return newReviews.length > 0 ? totalRating / newReviews.length : 0;
        })()
      );
      cancelEdit();
      toast.success("Review updated successfully");
    } catch (err) {
      console.error("Update error:", err);
      toast.error(err.message || "Error updating review");
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันจัดการ URL รูปภาพ
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return null;

    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }

    if (imageUrl.startsWith('/')) {
      return `http://localhost:8080${imageUrl}`;
    }

    return `http://localhost:8080/${imageUrl}`;
  };

  // ฟังก์ชันแสดงรูปโปรไฟล์หรือ initial
  const renderUserAvatar = (review) => {
    if (review?.user_profile_pic) {
      return (
        <img
          src={getImageUrl(review.user_profile_pic)}
          alt={review.user_display_name || review.reviewer_name || "User"}
          className="w-10 h-10 rounded-full object-cover border-2 border-blue-200"
          onError={(e) => {
            e.target.style.display = 'none';
            const nextDiv = e.target.nextElementSibling;
            if (nextDiv && nextDiv.classList.contains('rounded-full') && !nextDiv.classList.contains('object-cover')) {
               nextDiv.style.display = 'flex';
            }
          }}
        />
      );
    }
    
    return (
      <div className="w-10 h-10 bg-blue-300 rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-md">
        {review?.user_display_name 
          ? review.user_display_name.charAt(0).toUpperCase()
          : review?.reviewer_name?.charAt(0).toUpperCase() || "U"
        }
      </div>
    );
  };

  return (
    <div className="mt-6">
      <h2 className="text-lg font-bold">
        Rating: {average > 0 ? average.toFixed(1) : "No ratings yet"} ★
      </h2>

      {/* Review Form - แสดงเมื่อยังไม่เคยรีวิว */}
      {isLoggedIn && !hasReviewed && !editMode && (
        <div className="border p-4 rounded-md mt-4">
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Rate this book:</span>
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={`cursor-pointer text-2xl ${
                  star <= rating ? "text-yellow-500" : "text-gray-300"
                } hover:text-yellow-400 transition-colors`}
                onClick={() => handleRating(star)}
              >
                ★
              </span>
            ))}
            {rating > 0 && (
              <span className="text-sm text-gray-500">
                ({rating} star{rating > 1 ? "s" : ""})
              </span>
            )}
          </div>
          <div className="mt-4">
            <textarea
              className="w-full border rounded-md p-2 resize-none"
              placeholder="Write your review..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={4}
              disabled={loading}
            />
          </div>
          <button
            className={`${
              loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
            } text-white px-4 py-2 rounded-md text-sm transition mt-4 disabled:cursor-not-allowed`}
            onClick={handleSubmitReview}
            disabled={loading || rating === 0 || !review.trim()}
          >
            {loading ? "Submitting..." : "Submit Review"}
          </button>
        </div>
      )}

      {/* Your Review Section - แสดงเมื่อเคยรีวิวแล้ว */}
      {isLoggedIn && hasReviewed && userReview && (
        <div className="mt-6">
          <h3 className="text-lg font-bold mb-4">Your Review</h3>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 text-sm mb-3">
              คุณเคยรีวิวหนังสือเล่มนี้ไปแล้ว หากต้องการรีวิวอีกครั้งให้แก้ไขหรือลบรีวิวของคุณ
            </p>
            
            {!editMode ? (
              <div>
                {/* Rating Stars */}
                <div className="flex items-center gap-2 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`text-xl ${star <= userReview.rating ? "text-yellow-500" : "text-gray-300"}`}
                    >
                      ★
                    </span>
                  ))}
                  <span className="text-sm text-gray-500 ml-2">
                    ({userReview.rating} star{userReview.rating > 1 ? "s" : ""})
                  </span>
                </div>

                {/* User Info */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {renderUserAvatar(userReview)}
                    <div>
                      <p className="font-semibold text-gray-800">
                        {userReview.user_display_name || userReview.reviewer_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(userReview.review_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="text-blue-600 text-sm hover:text-blue-800 font-medium transition-colors"
                      onClick={() => startEditReview(userReview)}
                    >
                      edit
                    </button>
                    <button
                      className="text-red-600 text-sm hover:text-red-800 font-medium transition-colors"
                      onClick={() => handleDeleteReview(userReview._id)}
                    >
                      delete
                    </button>
                  </div>
                </div>

                {/* Comment */}
                <p className="text-gray-700">{userReview.comment}</p>
              </div>
            ) : (
              /* Edit Form */
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-gray-600">Edit your rating:</span>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`cursor-pointer text-2xl ${star <= editRating ? "text-yellow-500" : "text-gray-300"} hover:text-yellow-400 transition-colors`}
                      onClick={() => setEditRating(star)}
                    >
                      ★
                    </span>
                  ))}
                  {editRating > 0 && (
                    <span className="text-sm text-gray-500">({editRating} star{editRating > 1 ? "s" : ""})</span>
                  )}
                </div>
                <div className="mb-4">
                  <textarea
                    className="w-full border rounded-md p-2 resize-none"
                    placeholder="Edit your review..."
                    value={editComment}
                    onChange={e => setEditComment(e.target.value)}
                    rows={4}
                    disabled={loading}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    className={`${loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"} text-white px-4 py-2 rounded-md text-sm transition disabled:cursor-not-allowed`}
                    onClick={handleUpdateReview}
                    disabled={loading || editRating === 0 || !editComment.trim()}
                  >
                    {loading ? "Updating..." : "Update Review"}
                  </button>
                  <button
                    className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm transition"
                    onClick={cancelEdit}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Other Reviews Section */}
      <div className="mt-6">
        <h3 className="text-lg font-bold">Other Reviews ({otherReviews.length})</h3>

        {otherReviews.length === 0 ? (
          <p className="text-gray-500 mt-4">
            No other reviews yet.
          </p>
        ) : (
          <div className="space-y-4 mt-4">
            {otherReviews.map((r, index) => (
              <div key={`${r._id}-${index}`} className="border-b pb-4 last:border-b-0">
                <div className="flex items-center gap-2 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`text-xl ${star <= r.rating ? "text-yellow-500" : "text-gray-300"}`}
                    >
                      ★
                    </span>
                  ))}
                  <span className="text-sm text-gray-500">
                    ({r.rating} star{r.rating > 1 ? "s" : ""})
                  </span>
                </div>

                <div className="flex items-center gap-3 mb-2">
                  {renderUserAvatar(r)}
                  <div>
                    <p className="font-semibold text-gray-800">
                      {r.user_display_name || r.reviewer_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(r.review_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <p className="text-gray-700">{r.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewSection;