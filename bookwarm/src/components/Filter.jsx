import React, { useState } from 'react';

const Filter = ({ setFilters }) => {
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);

  const handleTagClick = (tag) => {
    const updatedTags = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];
    setSelectedTags(updatedTags);
    setFilters({ tags: updatedTags, categories: selectedCategories });
  };

  const handleCategoryClick = (category) => {
    const updatedCategories = selectedCategories.includes(category)
      ? selectedCategories.filter((c) => c !== category)
      : [...selectedCategories, category];
    setSelectedCategories(updatedCategories);
    setFilters({ tags: selectedTags, categories: updatedCategories });
  };

  const resetFilters = () => {
    setSelectedTags([]);
    setSelectedCategories([]);
    setFilters({ tags: [], categories: [] }); // ต้องส่งค่าเริ่มต้นที่ถูกต้อง
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
        <h4>Category / Genre</h4>
        <ul className="categories">
          {['Fiction', 'Non-Fiction', 'Comic / Manga', 'Art / Design'].map((category) => (
            <li key={category}>
              <label>
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(category)}
                  onChange={() => handleCategoryClick(category)}
                />
                {category}
              </label>
            </li>
          ))}
        </ul>
      </div>
      <div className="filter-section">
        <h4>Tag</h4>
        <div className="tags">
          {['Mystery', 'Thriller', 'Fantasy', 'Romance', 'Adventure'].map((tag) => (
            <button
              key={tag}
              className={`tag-button ${selectedTags.includes(tag) ? 'active' : ''}`}
              onClick={() => handleTagClick(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Filter;