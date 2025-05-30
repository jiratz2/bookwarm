import { data } from "autoprefixer";
import Link from "next/link";
import React from "react";
import { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { jwtDecode } from "jwt-decode";
import BookCover from "@/components/BookCover";

export default function Profile() {
  const [displayName, setDisplayName] = React.useState("");
  const [bio, setBio] = React.useState("");
  const [profilePicture, setProfilePicture] = React.useState(null);
  const [coverPhoto, setCoverPhoto] = React.useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [markedBooks, setMarkedBooks] = useState([]);
  const [userClubs, setUserClubs] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setCurrentUserId(decoded.id || decoded._id);
      } catch (err) {
        console.error("Failed to decode token:", err);
        // Optionally, handle invalid token by clearing and redirecting
      }
    }
  }, []);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        // Handle case where token is not present (user not logged in)
        setIsLoading(false);
        return;
      }
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

        // Set profile picture preview if available in backend
        if (data.profile_img_url) {
          setProfilePicture(data.profile_img_url);
        } else {
          setProfilePicture(null);
        }

        // Set cover photo preview if available in backend
        if (data.bg_img_url) {
          setCoverPhoto(data.bg_img_url);
        } else {
          setCoverPhoto(null);
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

  const fetchMarkedBooks = async (userId) => {
    if (!userId) return;
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch(`http://localhost:8080/api/marks/user/${userId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        // Assuming the backend returns an array of mark objects, each with a 'book' field
        setMarkedBooks(data);
      } else {
        toast.error("Failed to fetch marked books.");
      }
    } catch (error) {
      toast.error("Error fetching marked books.");
      console.error("Fetch marked books error:", error);
    }
  };

  const fetchUserClubs = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch(`http://localhost:8080/api/club/user`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setUserClubs(data);
      } else {
        toast.error("Failed to fetch user's clubs.");
      }
    } catch (error) {
      toast.error("Error fetching user's clubs.");
      console.error("Fetch user's clubs error:", error);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchUserClubs();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      fetchMarkedBooks(currentUserId);
    }
  }, [currentUserId]);

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

  return (
    <div className="mt-[100px] max-w-screen mx-auto bg-white min-h-screen">
      <ToastContainer />
      <div className="relative">
        <div className="w-full h-40 md:h-60 lg:h-50 bg-gray-200 relative">
          {isLoading ? (
            <div className="w-full h-full bg-gray-300 animate-pulse" />
          ) : coverPhoto ? (
            <img
              src={coverPhoto}
              alt="Cover photo"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-gray-200 to-gray-300" />
          )}

          <div className="flex justify-evenly">
            <div className="absolute left-1/2 transform -translate-x-1/2 md:left-32 md:translate-x-0 -bottom-20">
              <div className="relative">
                <div className="w-40 h-40 rounded-full border-4 border-white overflow-hidden">
                  {isLoading ? (
                    <div className="w-full h-full bg-gray-300 animate-pulse" />
                  ) : profilePicture ? (
                    <img
                      src={profilePicture}
                      alt="Profile picture"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-gray-300 to-gray-400" />
                  )}
                </div>
              </div>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-4 px-32 flex justify-between w-full">
              <div className="mt-3 px-50">
                <h1 className="text-3xl font-bold uppercase">{displayName}</h1>
                <p className="text-gray-600 mt-1 text-lg max-w-5xl ">{bio}</p>
              </div>
              <div>
                <div className="bg-blue-600 hover:bg-blue-700 text-white 
                px-5 py-1.5 mt-5 rounded-md text-lg hover:cursor-pointer font-bold">
                  <Link href="/editprofile" >
                  Edit profile
                </Link>
                </div>
                
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-[140px] mt-30 font-bold text-xl">
        <h2>Reading stats</h2>
        <div className="flex justify-evenly py-15">
          <div className="reading-stats">
            <p>0</p>
            <h3>Books read</h3>
          </div>
          <div className="reading-stats">
            <p>0</p>
            <h3>Authors</h3>
          </div>
          <div className="reading-stats">
            <p>0</p>
            <h3>Club joined</h3>
          </div>
          <div className="reading-stats">
            <p>0</p>
            <h3>Archievements</h3>
          </div>
        </div>

        <div className="flex justify-between ">
          <h2>Book shelf</h2>
          <Link href="/bookshelf"><h2 className="text-blue-600 hover:underline">Show all</h2></Link>
        </div>
        <div className="flex overflow-x-auto space-x-4 py-5">
          {markedBooks.length > 0 ? (
            markedBooks.slice(0, 5).map((mark) => (
              <BookCover key={mark._id} book={mark.book} />
            ))
          ) : (
            <p className="text-gray-500 text-base">No books marked yet.</p>
          )}
        </div>

        <div className="flex justify-between mt-8">
          <h2>Clubs</h2>
          {/* Link to show all clubs will go here later */}
        </div>
        <div className="flex overflow-x-auto space-x-4 py-5">
          {userClubs.length > 0 ? (
            userClubs.slice(0, 5).map((club) => (
              <Link key={club._id} href={`/club/${club._id}`}>
                <div className="w-24 h-36 md:w-32 md:h-48 lg:w-40 lg:h-60 flex-shrink-0 rounded-md overflow-hidden shadow-lg cursor-pointer">
                   <img
                      src={getImageUrl(club.cover_image)}
                      alt={club.name || "Club Cover"}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/150x225/cccccc/666666?text=No+Cover";
                      }}
                    />
                </div>
              </Link>
            ))
          ) : (
            <p className="text-gray-500 text-base">No clubs joined yet.</p>
          )}
        </div>

        <div className="flex justify-between mt-8">
          <h2>Archievements</h2>
          <h2>Show all</h2>
        </div>
        <div className="bg-gray-600 w-[130px] h-[130px] my-5"></div>
      </div>
    </div>
  );
}
