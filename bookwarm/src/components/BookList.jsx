import React from 'react';

const books = [
  {
    title: "A Good Girl's Guide To Murder",
    author: "Holly Jackson",
    description: "rating",
    tags: ["Mystery", "Thriller"],
    image: "https://example.com/image1.jpg",
  },
  {
    title: "Fourth Wing",
    author: "Rebecca Yarros",
    description: "rating",
    tags: ["Fantasy", "Adventure"],
    image: "https://example.com/image2.jpg",
  },
  {
    title: "A Curse for True Love",
    author: "Stephanie Garber",
    description: "rating",
    tags: ["Romance", "Fantasy"],
    image: "https://example.com/image3.jpg",
  },
];

const Book = ({ title, author, description, tags, image }) => {
  return (
    <div className="book">
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
    </div>
  );
};

const BookList = ({ filters }) => {
  const filteredBooks = books.filter((book) => {
    const matchesTags =
      filters.tags.length === 0 || filters.tags.some((tag) => book.tags.includes(tag));
    const matchesCategories =
      filters.categories.length === 0 || filters.categories.includes(book.category);
    return matchesTags && matchesCategories;
  });

  return (
    <div className="book-list">
      {filteredBooks.map((book, index) => (
        <Book
          key={index}
          title={book.title}
          author={book.author}
          description={book.description}
          tags={book.tags}
          image={book.image}
        />
      ))}
    </div>
  );
};

export default BookList;