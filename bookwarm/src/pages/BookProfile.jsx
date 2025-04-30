import React, { useState } from 'react';

const BookProfile = () => {
  const [rating, setRating] = useState(0); // สำหรับเก็บคะแนนดาว
  const [review, setReview] = useState(''); // สำหรับเก็บข้อความรีวิว
  const [reviews, setReviews] = useState([]); // สำหรับเก็บรายการรีวิวทั้งหมด
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // สำหรับจัดการ Dropdown

  const handleRating = (value) => {
    setRating(value); // ตั้งค่าคะแนนดาว
  };

  const handleSubmitReview = () => {
    if (review.trim()) {
      setReviews([...reviews, { text: review, rating }]); // เพิ่มรีวิวใหม่ในรายการ
      setReview(''); // ล้างข้อความรีวิว
      setRating(0); // รีเซ็ตคะแนนดาว
    }
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen); // เปิด/ปิด Dropdown
  };

  return (
    <div className="p-6 max-w-4xl mx-auto mt-20"> =
      {/* ส่วนหัว */}
      <div className="flex gap-6">
        <div className="bg-gray-600 w-[150px] h-[200px] my-5"></div>
        <div>
          <h1 className="text-2xl font-bold">A Curse for True Love</h1>
          <p className="text-gray-600">By Stephanie Garber</p>
          <p className="text-gray-600">First publish 2023</p>
          <p className="text-gray-600">383 pages</p>
          <p className="text-gray-600">rating</p>

          {/* ปุ่ม Want to Read */}
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
                  <li className="pl-6 pr-4 py-2 hover:bg-blue-700 cursor-pointer">
                    Want to Read
                  </li>
                  <li className="pl-6 pr-4 py-2 hover:bg-blue-700 cursor-pointer">
                    Now Reading
                  </li>
                  <li className="pl-6 pr-4 py-2 hover:bg-blue-700 cursor-pointer">
                    Read
                  </li>
                  <li className="pl-6 pr-4 py-2 hover:bg-blue-700 cursor-pointer">
                    Did Not Finish
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* แท็ก */}
          <div className="flex flex-wrap gap-2 mt-4">
            {['Tag1', 'Tag2', 'Tag3'].map((tag, index) => (
              <span
                key={index}
                className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ข้อมูลหนังสือ */}
      <div className="mt-6">
        <h2 className="text-lg font-bold">Book Info</h2>
        <p className="text-gray-600 mt-2">
          Evangeline Fox ventured to the Magnificent North in search of her happy ending...
        </p>
      </div>

      {/* รีวิว */}
      <div className="mt-6">
        <h2 className="text-lg font-bold">Review</h2>
        <div className="border p-4 rounded-md mt-4">
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Rating this book</span>
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={`cursor-pointer text-2xl ${
                  star <= rating ? 'text-yellow-500' : 'text-gray-300'
                }`}
                onClick={() => handleRating(star)}
              >
                ★
              </span>
            ))}
          </div>
          <div className="mt-4">
            <textarea
              className="w-full border rounded-md p-2"
              placeholder="Write something..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
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

      {/* รีวิวทั้งหมด */}
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