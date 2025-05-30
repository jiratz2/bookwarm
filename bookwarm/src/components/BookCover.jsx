import React from "react";
import Link from "next/link";

const BookCover = ({ book }) => {
  const coverImageUrl = book.coverImage || "https://via.placeholder.com/150x225/cccccc/666666?text=No+Cover";

  return (
    <Link href={`/bookProfile/${book._id}`}>
      <div className="w-24 h-36 md:w-32 md:h-48 lg:w-40 lg:h-60 flex-shrink-0 rounded-md overflow-hidden shadow-lg cursor-pointer">
        <img
          src={coverImageUrl}
          alt={book.title || "Book Cover"}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = "https://via.placeholder.com/150x225/cccccc/666666?text=No+Cover";
          }}
        />
      </div>
    </Link>
  );
};

export default BookCover; 