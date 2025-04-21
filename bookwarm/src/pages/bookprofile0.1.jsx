import React, { useState, useEffect } from 'react';

const BookProfile = () => {
  const [book, setBook] = useState(null); // ข้อมูลหนังสือ
  const [reviews, setReviews] = useState([]); // ข้อมูลรีวิวทั้งหมด
  const [rating, setRating] = useState(0); // ดาวที่เลือก
  const [reviewText, setReviewText] = useState(''); // ข้อความรีวิว
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const bookId = 1; // book id ที่ต้องการโหลด

  // โหลดข้อมูลหนังสือ
  useEffect(() => {
    fetch(`http://localhost:8080/api/book/${bookId}`)
      .then(res => res.json())
      .then(data => setBook(data));
  }, []);

  // โหลดรีวิว
  useEffect(() => {
    fetch(`http://localhost:8080/api/reviews?book_id=${bookId}`)
      .then(res => res.json())
      .then(data => setReviews(data));
  }, []);

  // ส่งรีวิวใหม่
  const handleSubmitReview = () => {
    if (reviewText.trim()) {
      fetch('http://localhost:8080/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          book_id: bookId,
          user_id: 1, // เปลี่ยนตามระบบ login ถ้ามี
          rating,
          text: reviewText
        })
      })
        .then(() => {
          // โหลดรีวิวใหม่
          setReviews([...reviews, { rating, text: reviewText }]);
          setRating(0);
          setReviewText('');
        });
    }
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  if (!book) return <div>Loading...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto mt-20">
      {/* ส่วนหนังสือ */}
      <div className="flex gap-6">
        <img
          src={book.cover_image}
          alt={book.title}
          className="w-48 h-72 object-cover rounded-md"
        />
        <div>
          <h1 className="text-2xl font-bold">{book.title}</h1>
          <p className="text-gray-600">By {book.author}</p>
          <p className="text-gray-600">First publish {book.published}</p>
          <p className="text-gray-600">{book.pages} pages</p>

          <div className="relative mt-4">
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 transition flex items-center"
              onClick={toggleDropdown}
            >
              Want to Read
              <span className="ml-2">▼</span>
            </button>
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-blue-600 text-white border border-blue-700 rounded-md shadow-lg z-10">
                <ul className="py-2">
                  <li className="px-4 py-2 font-bold">Mark as</li>
                  <li className="pl-6 pr-4 py-2 hover:bg-blue-700 cursor-pointer">Want to Read</li>
                  <li className="pl-6 pr-4 py-2 hover:bg-blue-700 cursor-pointer">Now Reading</li>
                  <li className="pl-6 pr-4 py-2 hover:bg-blue-700 cursor-pointer">Read</li>
                  <li className="pl-6 pr-4 py-2 hover:bg-blue-700 cursor-pointer">Did Not Finish</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* คำบรรยาย */}
      <div className="mt-6">
        <h2 className="text-lg font-bold">Book Info</h2>
        <p className="text-gray-600 mt-2">{book.description}</p>
      </div>

      {/* ฟอร์มรีวิว */}
      <div className="mt-6">
        <h2 className="text-lg font-bold">Review</h2>
        <div className="border p-4 rounded-md mt-4">
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Rating this book</span>
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={`cursor-pointer text-2xl ${star <= rating ? 'text-yellow-500' : 'text-gray-300'}`}
                onClick={() => setRating(star)}
              >
                ★
              </span>
            ))}
          </div>
          <div className="mt-4">
            <textarea
              className="w-full border rounded-md p-2"
              placeholder="Write something..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
            />
          </div>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 transition mt-4"
            onClick={handleSubmitReview}
          >
            Send
          </button>
        </div>
      </div>

      {/* แสดงรีวิวทั้งหมด */}
      <div className="mt-6">
        <h2 className="text-lg font-bold">All Reviews</h2>
        {reviews.map((r, index) => (
          <div key={index} className="border-b py-4">
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`text-xl ${star <= r.rating ? 'text-yellow-500' : 'text-gray-300'}`}
                >
                  ★
                </span>
              ))}
            </div>
            <p className="text-gray-600 mt-2">{r.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BookProfile;
