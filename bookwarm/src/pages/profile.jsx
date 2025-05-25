import { data } from "autoprefixer";
import Link from "next/link";
import React from "react";
import { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Profile() {
  const [displayName, setDisplayName] = React.useState("");
  const [bio, setBio] = React.useState("");
  const [profilePicture, setProfilePicture] = React.useState(null);
  const [coverPhoto, setCoverPhoto] = React.useState(null);
  const [isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
    fetchProfile();
  }, []);

  return (
    <div className="mt-[100px] max-w-screen mx-auto bg-white min-h-screen">
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
          <h2>Show all</h2>
        </div>
        <div className="bg-gray-600 w-[83px] h-[113px] my-5"></div>

        <div className="flex justify-between ">
          <h2>Clubs</h2>
          <h2>Show all</h2>
        </div>
        <div className="bg-gray-600 w-[140px] h-[170px] my-5"></div>

        <div className="flex justify-between ">
          <h2>Archievements</h2>
          <h2>Show all</h2>
        </div>
        <div className="bg-gray-600 w-[130px] h-[130px] my-5"></div>
      </div>
    </div>
  );
}
