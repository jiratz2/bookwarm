// components/ReviewSection.jsx
import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import toast from "react-hot-toast";

const ReviewSection = ({ bookId }) => {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [reviews, setReviews] = useState([]);
  const [average, setAverage] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        console.log("Decoded token:", decoded); // Debug log
        // ลองหาค่าที่เป็นไปได้ทั้งหมด
        const userIdentifier =
          decoded.displayName ||
          decoded.username ||
          decoded.name ||
          decoded.email;
        setCurrentUser(userIdentifier);
        console.log("Current user set to:", userIdentifier); // Debug log
      } catch (err) {
        console.error("Token decode error:", err);
        toast.error("Invalid token");
        // ถ้า token ไม่ถูกต้อง ให้ลบออก
        localStorage.removeItem("token");
      }
    }
  }, []);

  useEffect(() => {
    if (!bookId) return;

    const fetchReviews = async () => {
      try {
        const res = await fetch(`http://localhost:8080/api/reviews/${bookId}`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();

        const fetchedReviews = data.reviews || [];
        setReviews(fetchedReviews);
        setAverage(data.average || data.average_rating || 0);

        // ตรวจสอบว่าผู้ใช้เคยรีวิวไหม
        const token = localStorage.getItem("token");
        if (token) {
          const decoded = jwtDecode(token);
          const userIdentifier =
            decoded.displayName ||
            decoded.username ||
            decoded.name ||
            decoded.email;

          const found = fetchedReviews.some(
            (r) => r.reviewer_name === userIdentifier
          );

          setHasReviewed(found);
        }
      } catch (err) {
        console.error("Failed to load reviews:", err);
        toast.error("Failed to load reviews");
      }
    };

    fetchReviews();
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
  comment: review,});

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem("token");
          setCurrentUser(null);
          toast.error("Session expired. Please login again.");
          return;
        }

        // ❗ไม่โยน Error ให้แอปล่ม
        toast.error(data.error || "Submit failed");
        return;
      }

      if (data.review) {
        const newReviews = [data.review, ...reviews];
        setReviews(newReviews);

        const newAverage =
          newReviews.reduce((sum, r) => sum + r.rating, 0) / newReviews.length;
        setAverage(newAverage);
      }

      setRating(0);
      setReview("");
      toast.success("Review submitted successfully");
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
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json();
        if (res.status === 401) {
          localStorage.removeItem("token");
          setCurrentUser(null);
          toast.error("Session expired. Please login again.");
          return;
        }
        throw new Error(data.error || "Delete failed");
      }

      // อัปเดตรายการรีวิวและค่าเฉลี่ย
      const updatedReviews = reviews.filter((r) => r.id !== reviewId);
      setReviews(updatedReviews);

      if (updatedReviews.length > 0) {
        const newAverage =
          updatedReviews.reduce((sum, r) => sum + r.rating, 0) /
          updatedReviews.length;
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

  return (
    <div className="mt-6">
      <h2 className="text-lg font-bold">
        Rating: {average > 0 ? average.toFixed(1) : "No ratings yet"} ★
      </h2>

      {/* Review Form */}
      {isLoggedIn ? (
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
      ) : (
        <div className="border p-4 rounded-md mt-4 text-center text-gray-500">
          <p>Please login to submit a review</p>
        </div>
      )}

      {/* Reviews */}
      <div className="mt-6">
        <h2 className="text-lg font-bold">All Reviews ({reviews.length})</h2>

        {reviews.length === 0 ? (
          <p className="text-gray-500 mt-4">
            No reviews yet. Be the first to review!
          </p>
        ) : (
          <div className="space-y-4 mt-4">
            {reviews.map((r) => (
              <div key={r.id} className="border-b pb-4 last:border-b-0">
                <div className="flex items-center gap-2 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`text-xl ${
                        star <= r.rating ? "text-yellow-500" : "text-gray-300"
                      }`}
                    >
                      ★
                    </span>
                  ))}
                  <span className="text-sm text-gray-500">
                    ({r.rating} star{r.rating > 1 ? "s" : ""})
                  </span>
                </div>

                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {/* เพิ่มรูปโปรไฟล์ */}
                    {r.review_profile_pic && (
                      <img
                        src={r.review_profile_pic}
                        alt="profile"
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    )}
                    <p className="text-gray-600">
                      <strong>{r.reviewer_name}</strong> —{" "}
                      {new Date(r.review_date).toLocaleDateString()}
                    </p>
                  </div>

                  {currentUser === r.reviewer_name && (
                    <button
                      className="text-red-500 text-sm hover:text-red-700 transition-colors"
                      onClick={() => handleDeleteReview(r.id)}
                    >
                      Delete
                    </button>
                  )}
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
