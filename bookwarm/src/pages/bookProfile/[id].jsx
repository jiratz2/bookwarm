import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { jwtDecode } from "jwt-decode";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ReviewSection from "@/components/ReviewSection";
import MarkButton from "@/components/MarkButton";

const BookProfilePage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [book, setBook] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ตรวจสอบ token
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setCurrentUser(decoded.username || decoded.name || decoded.displayName);
      } catch (err) {
        console.error("Failed to decode token:", err);
        toast.error("Invalid token format. Please log in again.");
      }
    }
  }, []);

  // โหลดข้อมูลหนังสือ
  useEffect(() => {
    if (!id) return;

    const fetchBook = async () => {
      try {
        setLoading(true);
        const res = await fetch(`http://localhost:8080/api/books/${id}`);
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        setBook(data);
      } catch (err) {
        console.error("Failed to fetch book data:", err);
        toast.error("ไม่สามารถโหลดข้อมูลหนังสือได้");
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [id]);

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

  // ปิด dropdown เมื่อคลิกที่อื่น
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDropdownOpen && !event.target.closest('.dropdown-container')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  if (!router.isReady) {
    return (
      <div className="p-6 max-w-4xl mx-auto mt-20">
        <div className="animate-pulse">Loading router...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto mt-20">
        <div className="animate-pulse">
          <div className="flex gap-6">
            <div className="w-48 h-72 bg-gray-300 rounded-md"></div>
            <div className="flex-1">
              <div className="h-8 bg-gray-300 rounded mb-4"></div>
              <div className="h-4 bg-gray-300 rounded mb-2"></div>
              <div className="h-4 bg-gray-300 rounded mb-2"></div>
              <div className="h-4 bg-gray-300 rounded mb-4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="p-6 max-w-4xl mx-auto mt-20">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-600">Book not found</h2>
          <p className="text-gray-500 mt-2">The book you're looking for doesn't exist.</p>
          <button 
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto mt-20">
      <ToastContainer/>
      {/* ส่วนหัว */}
      <div className="flex gap-6 mb-8">
        <img
          src={book.coverImage || "https://via.placeholder.com/150x225/cccccc/666666?text=No+Cover"}
          alt={book.title}
          className="w-48 h-72 object-cover rounded-md shadow-lg"
          onError={(e) => {
            e.target.src = "https://via.placeholder.com/150x225/cccccc/666666?text=No+Cover";
          }}
        />

        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-2">{book.title}</h1>
          <p className="text-xl text-gray-600 mb-1">
            By {book.author?.[0]?.name || "Unknown Author"}
          </p>
          
          <div className="text-gray-600 space-y-1 mb-4">
            <p>First published: {book.publishYear || "Unknown"}</p>
            <p>Pages: {book.pages || "Unknown"}</p>
          </div>

          <div className="mt-2 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={`text-lg ${star <= book.rating ? 'text-yellow-500' : 'text-gray-300'}`}
              >
                ★
              </span>
            ))}
            <span className="text-sm text-gray-600 ml-2">({book.rating.toFixed(1)})</span>
          </div>

          <MarkButton bookId={id} user={currentUser}/>

          {/* แท็ก */}
          <div className="flex flex-wrap gap-2 mt-4">
            {(book.category || []).map((category, index) => (
              <span
                key={index}
                className="bg-blue-200 text-gray-700 px-2 py-1 rounded-full text-xs"
              >
                {category.name}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            {(book.genres || []).map((genre, index) => (
              <span
                key={index}
                className="bg-red-200 text-gray-700 px-2 py-1 rounded-full text-xs"
              >
                {genre.name}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            {(book.tags || []).map((tag, index) => (
              <span
                key={index}
                className="bg-green-200 text-gray-700 px-2 py-1 rounded-full text-xs"
              >
                {tag.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ข้อมูลหนังสือ */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-3">About this book</h2>
        <div className="prose max-w-none">
          <p className="text-gray-700 leading-relaxed">
            {book.description || "No description available for this book."}
          </p>
        </div>
      </div>

      {/* รีวิวส่วน */}
      <div className="border-t pt-8">
        <ReviewSection bookId={id} user={currentUser}/>
      </div>
    </div>
  );
};

export default BookProfilePage;