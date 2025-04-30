import React, { useState } from 'react';

const Filter = ({ setFilters }) => {
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState([]);

  const categories = [
    {
      name: 'Fiction',
      subcategories: [
        'Romantic',
        'Drama',
        'Horror',
        'Fantasy',
        'Sci-Fi',
        'Mystery / Thriller',
        'Adventure',
        'Comedy',
        'Young-Adult',
        'Historical Fiction',
      ],
    },
    {
      name: 'Non-Fiction',
      subcategories: ['Biography', 'Self-Help', 'History', 'Science'],
    },
    { name: 'Cosmic / Manga' }, 
    { name: 'Art / Design' },   
  ];

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

  const toggleCategoryExpand = (category) => {
    setExpandedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const resetFilters = () => {
    setSelectedTags([]);
    setSelectedCategories([]);
    setFilters({ tags: [], categories: [] });
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
          {categories.map((category) => (
            <li key={category.name} className="mb-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={selectedCategories.includes(category.name)}
                    onChange={() => handleCategoryClick(category.name)}
                  />
                  <span className="font-bold">{category.name}</span>
                </label>
                {category.subcategories && category.subcategories.length > 0 && (
                  <button
                    className="text-sm text-gray-500 hover:text-gray-700"
                    onClick={() => toggleCategoryExpand(category.name)}
                  >
                    {expandedCategories.includes(category.name) ? '▲' : '▼'}
                  </button>
                )}
              </div>
              {expandedCategories.includes(category.name) && category.subcategories && (
                <ul className="ml-6 mt-2">
                  {category.subcategories.map((subcategory) => (
                    <li key={subcategory} className="mb-1">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          className="mr-2"
                          checked={selectedCategories.includes(subcategory)}
                          onChange={() => handleCategoryClick(subcategory)}
                        />
                        {subcategory}
                      </label>
                    </li>
                  ))}
                </ul>
              )}
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