import Link from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ClubProfile = () => {
  const router = useRouter();
  const { id } = router.query;

  const [clubName, setClubName] = useState("");
  const [description, setDescription] = useState("");
  const [coverPhoto, setCoverPhoto] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [ownerId, setOwnerId] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [members, setMembers] = useState([]);
  const [currentUserId, setCurrentUserId] = useState("");

  const fetchClubs = async () => {
    if (!id) return; // ต้องรอให้ id พร้อมก่อน
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
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
        setCoverPhoto(data.cover_image || null);
        setOwnerId(data.owner_id || "");
        setOwnerName(data.owner_display_name || "");
        setMembers(data.members || []);
        if (data.cover_image) {
          setCoverPhoto(data.cover_image);
        } else {
          setCoverPhoto(null);
        }
      } else {
        toast.error("Failed to fetch club data.");
      }
    } catch (error) {
      toast.error("Error connecting to server.");
      console.error("Error fetching club data:", error);
    } finally {
      setIsLoading(false);
    }
  };

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

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = jwtDecode(token);
      setCurrentUserId(decoded.id || decoded._id);
    }
  }, []);

  useEffect(() => {
    if (id) {
      fetchClubs();
    }
  }, [id]);

  const handleJoinClub = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("You need to be logged in to join a club.");
      setTimeout(() => {
        router.push("/login");
      }, 3000); // รอ 2 วินาที (2000 มิลลิวินาที)
      return;
    }

    try {
      const res = await fetch(`http://localhost:8080/api/club/${id}/join`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        toast.success("Joined club!");
        fetchClubs();
      } else {
        toast.error("Failed to join club.");
      }
    } catch (err) {
      toast.error("Error joining club.");
    }
  };

  const handleLeaveClub = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:8080/api/club/${id}/leave`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        toast.success("Left club.");
        fetchClubs();
      } else {
        toast.error("Failed to leave club.");
      }
    } catch (err) {
      toast.error("Error leaving club.");
    }
  };

  const renderActionButton = () => {
    if (!currentUserId || isLoading) return null;

    if (currentUserId === ownerId) {
      return (
        <Link href={`/editclub/${id}`}>
          <div className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-1.5 rounded-md text-lg font-bold">
            Edit Club
          </div>
        </Link>
      );
    }

    const isMember = members.includes(currentUserId);

    if (isMember) {
      return (
        <button
          onClick={handleLeaveClub}
          className="relative bg-gray-400 hover:bg-red-600 text-white px-5 py-1.5 rounded-md text-lg font-bold transition-colors duration-300 group"
        >
          <span className="group-hover:hidden">Already Joined</span>
          <span className="hidden group-hover:inline">Leave Club</span>
        </button>
      );
    }

    return (
      <button
        className="bg-green-600 hover:bg-green-700 text-white px-5 py-1.5 rounded-md text-lg font-bold"
        onClick={handleJoinClub}
      >
        Join Club
      </button>
    );
  };

  return (
    <div className="mt-[100px] max-w-screen mx-auto bg-white min-h-screen">
      <ToastContainer />
      <div className="relative">
        <div className="w-full h-40 md:h-60 lg:h-50 bg-gray-200 relative">
          {isLoading ? (
            <div className="w-full h-full bg-gray-300 animate-pulse" />
          ) : coverPhoto ? (
            <div className="relative w-full h-full">
              {/* ภาพจริง ไม่เบลอ */}
              <img
                src={getImageUrl(coverPhoto)}
                alt="Cover photo"
                className="w-full h-full object-cover"
              />

              {/* ชั้นเบลอซ้อนทับ */}
              <div className="absolute inset-0">
                <img
                  src={getImageUrl(coverPhoto)}
                  alt="Blurred cover"
                  className="w-full h-full object-cover filter blur-lg"
                  style={{
                    maskImage: "radial-gradient( transparent 50%, black 100%)",
                    WebkitMaskImage:
                      "radial-gradient( transparent 50%, black 100%)",
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-gray-200 to-gray-300" />
          )}

          <div className="flex justify-evenly">
            <div className="absolute left-1/2 transform -translate-x-1/2 md:left-32 md:translate-x-0 -bottom-20">
              <div className="relative"></div>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-4 px-32 flex justify-between w-full">
              <div className="mt-3 px-50">
                <h1 className="text-3xl text-black font-bold uppercase">
                  {clubName}
                </h1>
                <p className="text-gray-600 mt-1 text-lg max-w-5xl ">
                  {description}
                </p>
                <p className="text-gray-500 mt-2 text-sm">
                  Owned by <span className="font-semibold">{ownerName}</span>
                </p>
              </div>
              <div>
                <div className="mt-5">{renderActionButton()}</div>
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <div>club recommend</div>
            <div>post</div>
          </div>

        </div>
      </div>
    </div>
  );
};
export default ClubProfile;
