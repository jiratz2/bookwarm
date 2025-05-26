import React, { useRef, useState, useEffect } from "react";
import { ArrowLeft, Camera } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useRouter } from "next/router";

function Editclub() {
  const router = useRouter();
  const { id: clubId } = router.query;
  const [clubName, setClubName] = useState("");
  const [description, setDescription] = useState("");
  const [coverPhoto, setCoverPhoto] = useState(null);
  const [coverPhotoPreview, setCoverPhotoPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [originalCoverUrl, setOriginalCoverUrl] = useState(null); // เก็บ URL ดิบจาก API
  const coverPhotoInputRef = useRef(null);

  // แก้ไขใน useEffect - เปลี่ยนจาก cover_image_url เป็น cover_image
useEffect(() => {
  if (!clubId) return;

  const fetchClub = async () => {
    try {
      const token = localStorage.getItem("token");
      console.log("Fetching club with ID:", clubId);
      
      const res = await fetch(`http://localhost:8080/api/club/${clubId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch club data.");
      }

      const data = await res.json();
      console.log("Complete Club data:", data);
      console.log("Cover image from API:", data.cover_image); // เปลี่ยนเป็น cover_image

      setClubName(data.name);
      setDescription(data.description);

      // เก็บ URL ดิบ - เปลี่ยนเป็น cover_image
      setOriginalCoverUrl(data.cover_image);

      // แปลง URL สำหรับแสดงผล - เปลี่ยนเป็น cover_image
      const displayUrl = getImageUrl(data.cover_image);
      console.log("Final Preview URL:", displayUrl);
      setCoverPhotoPreview(displayUrl);
      
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error(error.message || "Failed to load club.");
    } finally {
      setInitialLoading(false);
    }
  };

  fetchClub();
}, [clubId]);

  const getImageUrl = (coverImage) => {
    if (!coverImage) return null;

    // ถ้าเป็น URL เต็ม (https://...) ใช้เลย
    if (coverImage.startsWith("http")) {
      return coverImage;
    }

    // ถ้าเป็น path ภายใน ให้เติม host
    if (coverImage.startsWith("/uploads/")) {
      return `http://localhost:8080${coverImage}`;
    }

    return null;
  };

  const updateClub = async () => {
    if (!clubName.trim() || !description.trim()) {
      toast.error("Please fill out all required fields.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login first.");
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", clubName.trim());
      formData.append("description", description.trim());
      if (coverPhoto) formData.append("cover_image", coverPhoto);

      const res = await fetch(`http://localhost:8080/api/club/${clubId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res
          .json()
          .catch(() => ({ error: "Update failed" }));
        throw new Error(errorData.error || "Error updating club.");
      }

      toast.success("Club updated!");
      setTimeout(() => {
        router.push(`/club/${clubId}`);
      }, 1500);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCoverPhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverPhoto(file);
      setCoverPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleCancel = () => {
    if (confirm("Cancel editing?")) {
      router.back();
    }
  };

  if (initialLoading) return <div className="mt-[100px] p-4">Loading...</div>;

  return (
    <div className="mt-[100px] max-w-screen mx-auto bg-white min-h-screen">
      <ToastContainer />
      <div className="top-0 z-10 bg-white border-b">
        <div className="px-4 py-3 flex items-center">
          <button
            onClick={handleCancel}
            className="mr-4 p-1 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold">Edit Club</h1>
        </div>
      </div>

      <div className="flex justify-center items-start m-10">
        {/* Cover Photo */}
        <div className="relative">
          <div className="w-50 h-50 md:h-60 lg:h-50 flex justify-center bg-gray-200 relative">
            {coverPhotoPreview ? (
              <img
                src={coverPhotoPreview} // ใช้ URL ที่แปลงแล้ว
                alt="Cover"
                className="w-64 h-64 object-cover"
              />
            ) : (
              <div className="w-50 h-50 bg-gradient-to-r from-gray-200 to-gray-300" />
            )}
            <button
              onClick={() => coverPhotoInputRef.current?.click()}
              className="absolute bottom-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70"
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
            <div>
              <label className="block text-md font-bold">
                Club Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={clubName}
                onChange={(e) => setClubName(e.target.value)}
                className="w-full p-3 border rounded-md"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-md font-bold">Description</label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 border rounded-md"
                disabled={isLoading}
              />
            </div>

            <div className="pt-6 flex flex-col space-y-3 sm:flex-row-reverse sm:space-y-0 sm:space-x-3 sm:space-x-reverse">
              <button
                onClick={updateClub}
                disabled={isLoading}
                className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700"
              >
                {isLoading ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={handleCancel}
                disabled={isLoading}
                className="px-6 py-2.5 bg-gray-200 text-gray-800 font-bold rounded-md hover:bg-gray-300"
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

export default Editclub;
