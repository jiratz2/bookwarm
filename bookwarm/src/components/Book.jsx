import Link from 'next/link';
import React from 'react';

const Book = ({ title, author, description, tags, image, bookId }) => {
  return (
    <Link href={`/bookProfile/${bookId}`} className="book">
      <img src={image} alt={title} className="book-image" />
      <div className="book-details">
        <h3>{title}</h3>
        <p>{author}</p>
        <p>{description}</p>
        <div className="tags">
          {tags.map((tag, index) => (
            <span key={index} className="tag">
              {tag}
            </span>
          ))}
        </div>
      </div>
      <button className="action-button">Want to Read</button>
    </Link>
  );
};

export default Book;