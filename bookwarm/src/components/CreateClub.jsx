'use client';

import { useState } from 'react';

export default function CreateClubPage() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('cover_image', coverImage);

    try {
      const res = await fetch('http://localhost:8080/api/club', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer <token>'
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create club');
      }

      setMessage('✅ Club created successfully!');
      setName('');
      setDescription('');
      setCoverImage('');
    } catch (err) {
      setError(`❌ ${err.message}`);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Create a Club</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium mb-1">Club Name</label>
          <input
            type="text"
            className="w-full border rounded-lg px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Description</label>
          <textarea
            className="w-full border rounded-lg px-3 py-2"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          ></textarea>
        </div>
        <div>
          <label className="block font-medium mb-1">Cover Image URL</label>
          <input
            type="file"
            className="w-full border rounded-lg px-3 py-2"
            onChange={(e) => setCoverImage(e.target.value[0])}
            accept='image/*'
            required
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Create Club
        </button>
        {message && <p className="text-green-600 mt-2">{message}</p>}
        {error && <p className="text-red-600 mt-2">{error}</p>}
      </form>
    </div>
  );
}
