import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, Camera } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function EditProfile() {
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [email, setEmail] = useState("");
  const [profilePicture, setProfilePicture] = useState(null);
  const [coverPhoto, setCoverPhoto] = useState(null);
  const [coverPhotoPreview, setCoverPhotoPreview] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const fileInputRef = useRef(null);
  const coverPhotoInputRef = useRef(null);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8080/api/auth/profile", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (res.ok) {
        setDisplayName(data.displayname || "");
        setBio(data.bio || "");
        setEmail(data.email || "");

        // Set profile picture preview if available in backend
        if (data.profile_img_url) {
          setProfilePicturePreview(data.profile_img_url);
        } else {
          setProfilePicturePreview(null);
        }

        // Set cover photo preview if available in backend
        if (data.bg_img_url) {
          setCoverPhotoPreview(data.bg_img_url);
        } else {
          setCoverPhotoPreview(null);
        }
      } else {
        toast.error("Failed to fetch profile data.");
      }
    } catch (error) {
      toast.error("Error connecting to server.");
      console.error("Fetch profile error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");

      const formData = new FormData();
      formData.append("displayname", displayName);
      formData.append("bio", bio);
      if (profilePicture) {
        formData.append("profile_picture", profilePicture);
      }
      if (coverPhoto) {
        formData.append("cover_photo", coverPhoto);
      }

      const res = await fetch("http://localhost:8080/api/auth/profile", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Profile updated successfully!");
        await fetchProfile();
        setTimeout(() => {
          window.location.href = "/profile";
        }, 2000);
      } else {
        toast.error(data.error || "Failed to update profile.");
      }
    } catch (error) {
      toast.error("Error connecting to server.");
      console.error("Update profile error:", error);
    }
  };

  const handleCancel = () => {
    const confirmCancel = window.confirm(
      "Are you sure you want to cancel editing your profile?"
    );
    if (confirmCancel) {
      window.history.back();
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
          <h1 className="text-xl font-bold">Edit your profile</h1>
        </div>
      </div>

      <div className="relative">
        {/* Cover Photo */}
        <div className="w-full h-40 md:h-60 lg:h-50 flex justify-center bg-gray-200 relative">
          {isLoading ? (
            <div className="w-full h-full bg-gray-300 animate-pulse" />
          ) : coverPhotoPreview ? (
            <img
              src={coverPhotoPreview}
              alt="Cover photo"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-gray-200 to-gray-300" />
          )}
          <button
            onClick={handleCoverPhotoClick}
            className="absolute bottom-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors text-white"
            aria-label="Change cover photo"
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

        {/* Profile Picture */}
        <div className="absolute left-1/2 transform -translate-x-1/2 md:left-1/2 md:transform md:-translate-x-1/2 -bottom-16 flex justify-center">
          <div className="relative">
            <div className="w-32 h-32 rounded-full border-4 border-white overflow-hidden flex items-center justify-center">
              {isLoading ? (
                <div className="w-full h-full bg-gray-300 animate-pulse" />
              ) : profilePicturePreview ? (
                <img
                  src={profilePicturePreview}
                  alt="Profile picture"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-gray-300 to-gray-400" />
              )}
            </div>
            <button
              onClick={handleCameraClick}
              className="absolute bottom-1 right-1 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors text-white"
              aria-label="Change profile picture"
            >
              <Camera size={16} />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
          </div>
        </div>
      </div>

      <div className="pt-20 px-4 mx-auto max-w-3xl md:px-6">
        <div className="space-y-6">
          {/* Display Name */}
          <div className="space-y-2">
            <label htmlFor="displayname" className="block text-md font-bold">
              Display Name
            </label>
            <input
              type="text"
              id="displayname"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <label htmlFor="bio" className="block text-md font-bold">
              Bio
            </label>
            <textarea
              id="bio"
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* E-mail */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-md font-bold">
                E-mail
              </label>
              <input
                type="text"
                id="email"
                className="w-full p-3 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                value={email}
                disabled
              />
            </div>
          </div>

          <div className="pt-6 flex flex-col space-y-3 sm:flex-row-reverse sm:space-y-0 sm:space-x-3 sm:space-x-reverse">
            <button
              onClick={handleSave}
              className="px-4 py-2.5 bg-blue-600 text-white text-lg font-bold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2.5 bg-gray-200 text-gray-800 text-lg font-bold rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}