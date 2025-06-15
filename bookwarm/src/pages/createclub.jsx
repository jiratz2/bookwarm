import React, { useRef, useState } from "react";
import { ArrowLeft, Camera } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function CreateClub() {
  const [clubName, setClubName] = useState("");
  const [description, setDescription] = useState("");
  const [coverPhoto, setCoverPhoto] = useState(null);
  const [coverPhotoPreview, setCoverPhotoPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const coverPhotoInputRef = useRef(null);

  const createclub = async () => {
    if (!clubName.trim()) {
      toast.error("Club name is required");
      return;
    }

    if (!description.trim()) {
      toast.error("Description is required");
      return;
    }

    if (!coverPhoto) {
      toast.error("Cover image is required");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("You must be logged in to create a club.");
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", clubName.trim());
      formData.append("description", description.trim());
      formData.append("cover_image", coverPhoto); 

      const res = await fetch("http://localhost:8080/api/club/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res
          .json()
          .catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(
          errorData.error || `Request failed with status ${res.status}`
        );
      }

      const data = await res.json();
      toast.success("Club created successfully!");
      setTimeout(() => {
        window.location.href = `/club/${data.id}`;
      }, 2000);
    } catch (error) {
      console.error("Create club error:", error);

      if (error.name === "TypeError" && error.message.includes("fetch")) {
        toast.error(
          "Cannot connect to server. Please check if the server is running."
        );
      } else {
        toast.error(error.message || "Failed to create club");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    const confirmCancel = window.confirm(
      "Are you sure you want to cancel creating this club?"
    );
    if (confirmCancel) {
      window.history.back();
    }
  };

  const handleCoverPhotoClick = () => {
    if (coverPhotoInputRef.current) {
      coverPhotoInputRef.current.click();
    }
  };

  const handleCoverPhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverPhoto(file);
      setCoverPhotoPreview(URL.createObjectURL(file));
    }
  };

  return (
    <div className="mt-[100px] max-w-screen mx-auto bg-white min-h-screen">
      <ToastContainer />
      <div className="top-0 z-10 bg-white border-b">
        <div className="px-4 py-3 flex items-center">
          <button
            onClick={handleCancel}
            className="mr-4 p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold">Create New Club</h1>
        </div>
      </div>

      <div className="flex justify-center items-start m-10">
        <div className="relative">
          {/* Cover Photo */}
          <div className="w-50 h-50 md:h-60 lg:h-50 flex justify-center bg-gray-200 relative">
            {coverPhotoPreview ? (
              <img
                src={coverPhotoPreview}
                alt="Cover photo"
                className="w-50 h-50 object-cover"
              />
            ) : (
              <div className="w-50 h-50 bg-gradient-to-r from-gray-200 to-gray-300" />
            )}
            <button
              onClick={handleCoverPhotoClick}
              className="absolute bottom-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors text-white"
              aria-label="Change cover photo"
              disabled={isLoading}
            >
              <Camera size={20} />
            </button>
            <input
              type="file"
              ref={coverPhotoInputRef}
              accept="image/*"
              onChange={handleCoverPhotoChange}
              style={{ display: "none" }}
            />
          </div>
          <p className="font-bold flex justify-center mt-2 text-md">
            Club Cover Image
          </p>
        </div>

        <div className="px-4 w-full max-w-3xl md:px-6">
          <div className="space-y-6">
            {/* Club Name */}
            <div className="space-y-2">
              <label htmlFor="clubname" className="block text-md font-bold">
                Club Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="clubname"
                value={clubName}
                onChange={(e) => setClubName(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter club name"
                disabled={isLoading}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label htmlFor="description" className="block text-md font-bold">
                Description
              </label>
              <textarea
                id="description"
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your club..."
                disabled={isLoading}
              />
            </div>

            <div className="pt-6 flex flex-col space-y-3 sm:flex-row-reverse sm:space-y-0 sm:space-x-3 sm:space-x-reverse">
              <button
                onClick={createclub}
                disabled={isLoading}
                className="px-6 py-2.5 bg-blue-600 text-white text-md font-bold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Saving..." : "Create Club"}
              </button>
              <button
                onClick={handleCancel}
                disabled={isLoading}
                className="px-6 py-2.5 bg-gray-200 text-gray-800 text-md font-bold rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
