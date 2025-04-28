import React, { useState, useEffect } from 'react';

const Filter = ({ setFilters }) => {
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [tags, setTags] = useState([]);
  const [categories, setCategories] = useState([]);
  const [genres, setGenres] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tagsResponse, categoriesResponse, genresResponse] = await Promise.all([
          fetch('http://localhost:8080/api/tags/'),
          fetch('http://localhost:8080/api/categories/'),
          fetch('http://localhost:8080/api/genres/'),
        ]);

        if (!tagsResponse.ok || !categoriesResponse.ok || !genresResponse.ok) {
          throw new Error('Failed to fetch data');
        }

        const tagsData = await tagsResponse.json();
        const categoriesData = await categoriesResponse.json();
        const genresData = await genresResponse.json();

        setTags(tagsData);
        setCategories(categoriesData);
        setGenres(genresData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    fetchData();
  }, []);

  const handleTagClick = (tagId) => {
    const updatedTags = selectedTags.includes(tagId)
      ? selectedTags.filter((t) => t !== tagId)
      : [...selectedTags, tagId];
    setSelectedTags(updatedTags);
    setFilters({ tags: updatedTags, categories: selectedCategories, genres: selectedGenres });
  };

  const handleCategoryClick = (categoryId) => {
    const updatedCategories = selectedCategories.includes(categoryId)
      ? selectedCategories.filter((c) => c !== categoryId)
      : [...selectedCategories, categoryId];
    setSelectedCategories(updatedCategories);
    setFilters({ tags: selectedTags, categories: updatedCategories, genres: selectedGenres });
  };

  const handleGenreClick = (genreId) => {
    const updatedGenres = selectedGenres.includes(genreId)
      ? selectedGenres.filter((g) => g !== genreId)
      : [...selectedGenres, genreId];
    setSelectedGenres(updatedGenres);
    setFilters({ tags: selectedTags, categories: selectedCategories, genres: updatedGenres });
  };

  const resetFilters = () => {
    setSelectedTags([]);
    setSelectedCategories([]);
    setSelectedGenres([]);
    setFilters({ tags: [], categories: [], genres: [] });
  };

  return (
    <div className="filter">
      <div className="filter-header">
        <h3>Filter</h3>
        <button className="reset-button" onClick={resetFilters}>
          Reset
        </button>
      </div>
      <div className="filter-section">
        <h4>Category</h4>
        <ul className="categories">
          {categories.map((category) => (
            <li key={category._id}>
              <label>
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(category._id)}
                  onChange={() => handleCategoryClick(category._id)}
                />
                {category.name}
              </label>
            </li>
          ))}
        </ul>
      </div>
      <div className="filter-section">
        <h4>Genre</h4>
        <ul className="genres">
          {genres.map((genre) => (
            <li key={genre._id}>
              <label>
                <input
                  type="checkbox"
                  checked={selectedGenres.includes(genre._id)}
                  onChange={() => handleGenreClick(genre._id)}
                />
                {genre.name}
              </label>
            </li>
          ))}
        </ul>
      </div>
      <div className="filter-section">
        <h4>Tag</h4>
        <div className="tags">
          {tags.map((tag) => (
            <button
              key={tag._id}
              className={`tag-button ${selectedTags.includes(tag._id) ? 'active' : ''}`}
              onClick={() => handleTagClick(tag._id)}
            >
              {tag.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const BookList = ({ loading, filteredBooks }) => {
  return (
    <div className="book-list">
      {loading ? (
        <p>Loading...</p>
      ) : filteredBooks.length === 0 ? (
        <p>No books found.</p>
      ) : (
        filteredBooks.map((book) => (
          <Book
            key={book._id}
            title={book.title}
            author={book.author[0]?.name || "Unknown Author"}
            tags={book.tags || []}
            image={book.coverImage || "https://via.placeholder.com/150"}
          />
        ))
      )}
    </div>
  );
};

export default Filter;
