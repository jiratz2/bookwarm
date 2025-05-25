import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, Camera } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { set } from "mongoose";

export default function CreateClub() {
  const [clubName, setClubName] = useState("");
  const [description, setDescription] = useState("");
  const [coverPhoto, setCoverPhoto] = useState(null);
  const [coverPhotoPreview, setCoverPhotoPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [clubId, setClubId] = useState(null);
  const fileInputRef = useRef(null);
  const coverPhotoInputRef = useRef(null);

  const createclub = async () => {
    if (!clubName.trim()) {
      toast.error("Club name is required");
      return;
    }
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("name", clubName);
      formData.append("description", description);
      if (coverPhoto) {
        formData.append("cover_image", coverPhoto);
      }

      const res = await fetch("http://localhost:8080/api/club", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Club created successfully!");
        setTimeout(() => {
          window.location.href = `/club/${data.id}`;
        }, 2000);
      } else {
        toast.error(data.error || "Failed to create club.");
      }
    } catch (error) {
      toast.error("Error connecting to server.");
      console.error("Create club error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClub = async (id) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("You must be logged in to edit a club.");
        window.location.href = "/login";
        return;
      }

      const res = await fetch(`http://localhost:8080/api/club/${id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (res.ok) {
        setClubName(data.name || "");
        setDescription(data.description || "");

        // Set profile picture preview if available in backend
        if (data.cover_image) {
          setCoverPhotoPreview(data.cover_image);
        } else {
          setCoverPhotoPreview(null);
        }
      } else {
        toast.error("Failed to fetch club data.");
      }
    } catch (error) {
      toast.error("Error connecting to server.");
      console.error("Fetch club error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateClub = async () => {
    if (!clubName.trim()) {
      toast.error("Club name is required");
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("name", clubName);
      formData.append("description", description);

      if (coverPhoto) {
        formData.append("cover_image", coverPhoto);
      }
      const res = await fetch(`http://localhost:8080/api/club/${clubId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Club updated successfully!");
        setTimeout(() => {
          window.location.href = `/club/${data.id}`;
        }, 2000);
      } else {
        toast.error(data.error || "Failed to update club.");
      }
    } catch (error) {
      toast.error("Error connecting to server.");
      console.error("Update club error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const editClubId = urlParams.get("edit");
  if (editClubId) {
    setIsEditMode(true);
    setClubId(editClubId);
    // fetchClub(editClubId);
  } else {
    // ถ้าไม่ได้แก้ไข ให้หยุด loading
    setIsLoading(false);
  }
}, []);


  const handleSave = async () => {
    if (isEditMode) {
      await updateClub();
    } else {
      await createclub();
    }
  };

  const handleCancel = () => {
    const message = isEditMode 
      ? "Are you sure you want to cancel editing this club?"
      : "Are you sure you want to cancel creating this club?";
    
    const confirmCancel = window.confirm(message);
    if (confirmCancel) {
      if (isEditMode && clubId) {
        window.location.href = `/club/${clubId}`;
      } else {
        window.history.back();
      }
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(file);
      setProfilePicturePreview(URL.createObjectURL(file));
    }
  };

  const handleCameraClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
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
          <h1 className="text-xl font-bold">
            {isEditMode ? "Edit Club" : "Create New Club"}
          </h1>
        </div>
      </div>

      <div className="flex justify-center items-start m-10">
        <div className="relative">
          {/* Cover Photo */}
          <div className="w-50 h-50 md:h-60 lg:h-50 flex justify-center bg-gray-200 relative"> 
            {isLoading ? (
              <div className="w-50 h-50 bg-gray-300 animate-pulse" />
            ) : coverPhotoPreview ? (
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
          <p className="font-bold flex justify-center mt-2 text-md">Club Cover Image</p>
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
                onClick={handleSave}
                disabled={isLoading}
                className="px-6 py-2.5 bg-blue-600 text-white text-md font-bold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Saving..." : (isEditMode ? "Update Club" : "Create Club")}
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