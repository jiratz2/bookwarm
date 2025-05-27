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
    <div className="filter p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold">Filter</h3>
        <button
          className="px-4 py-1 text-sm font-medium text-white bg-blue-500 rounded hover:bg-blue-600 transition"
          onClick={resetFilters}
        >
          Reset
        </button>
      </div>

      <div className="filter-section">
        <h4 className="font-semibold mb-2">Category</h4>
        <ul className="space-y-1">
          {categories.map((category) => (
            <li key={category.ID}>
              <label className="inline-flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(category.ID)}
                  onChange={() => handleCategoryClick(category.ID)}
                  className="accent-blue-600"
                />
                <span>{category.Name}</span>
              </label>
            </li>
          ))}
        </ul>
      </div>

      <div className="filter-section">
        <h4 className="font-semibold mb-2">Genre</h4>
        <ul className="space-y-1">
          {genres.map((genre) => (
            <li key={genre.id}>
              <label className="inline-flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedGenres.includes(genre.id)}
                  onChange={() => handleGenreClick(genre.id)} 
                  className="accent-blue-600"
                />
                <span>{genre.name}</span>
              </label>
            </li>
          ))}
        </ul>
      </div>

      <div className="filter-section">
        <h4 className="font-semibold mb-2">Tag</h4>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <button
              key={tag.id}
              className={`px-3 py-1 text-sm rounded-full border ${
                selectedTags.includes(tag.id)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-blue-100'
              }`}
              onClick={() => handleTagClick(tag.id)}
            >
              {tag.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Filter;
