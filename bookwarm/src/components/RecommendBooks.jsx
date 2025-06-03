import React, { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";

const RecommendBooks = () => {
  const [recommendedBooks, setRecommendedBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendedBooks = async () => {
      try {
        const token = localStorage.getItem("token");
        console.log("Fetching recommended books...");
        const res = await fetch("http://localhost:8080/api/books/recommended", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          console.log("Recommended books data:", data);
          setRecommendedBooks(data.books || []);
        } else {
          const errorData = await res.json();
          console.error("Failed to fetch recommended books:", errorData);
          toast.error("Failed to fetch recommended books");
        }
      } catch (error) {
        console.error("Error fetching recommended books:", error);
        toast.error("Error connecting to server");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendedBooks();
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-gray-100 rounded-lg p-4 animate-pulse">
            <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (recommendedBooks.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No recommended books available at the moment.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-4">
      {recommendedBooks.map((book) => (
        <Link
          key={book._id}
          href={`/bookProfile/${book._id}`}
          className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200"
        >
          <div className="relative h-48 mb-4">
            {book.coverImage ? (
              <img
                src={book.coverImage.startsWith("http") ? book.coverImage : `http://localhost:8080${book.coverImage}`}
                alt={book.title}
                className="w-full h-full object-cover rounded-t-lg"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-gray-200 to-gray-300 rounded-t-lg" />
            )}
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-lg mb-1 line-clamp-1">{book.title}</h3>
            <p className="text-gray-600 text-sm mb-2 line-clamp-2">{book.author}</p>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center">
                <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-gray-700">{book.avg_rating}</span>
              </div>
              <span className="text-gray-500">{book.review_count} reviews</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default RecommendBooks; 