import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";

const MarkButton = ({ bookId, user }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(null);
  const [currentMarkId, setCurrentMarkId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

  const validStatuses = [
    { label: "Want to Read", value: "want to read" },
    { label: "Currently Reading", value: "now reading" },
    { label: "Read", value: "read" },
    { label: "Did Not Finish", value: "did not finish" },
  ];

  // ✅ ดึง token จาก localStorage
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    if (token && bookId) {
      const fetchMark = async () => {
        try {
          const res = await fetch(
            `http://localhost:8080/api/marks/${bookId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (res.ok) {
            const data = await res.json();
            setCurrentStatus(data.status);
            setCurrentMarkId(data._id);
          }
        } catch (err) {
          console.error("Failed to fetch mark status:", err);
        } finally {
          setIsLoading(false);
        }
      };

      fetchMark();
    }
  }, [bookId, token]);

  const handleSelectStatus = async (status) => {
    try {
      let method = "POST";
      let url = `http://localhost:8080/api/marks/`;
      const body = { user_id: user, book_id: bookId, status };

      if (currentMarkId) {
        url = `http://localhost:8080/api/marks/${currentMarkId}`;
        method = "PUT";
      }

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setCurrentStatus(status);
        toast.success("Mark updated successfully");
        setIsDropdownOpen(false);
      } else {
        toast.error("Failed to update mark");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while updating mark");
    }
  };

  const handleDeleteMark = async () => {
    if (!currentMarkId) return;

    try {
      const res = await fetch(
        `http://localhost:8080/api/marks/${currentMarkId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.ok) {
        setCurrentStatus(null);
        setCurrentMarkId(null);
        toast.success("Mark removed successfully");
        setIsDropdownOpen(false);
      } else {
        toast.error("Failed to remove mark");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while removing mark");
    }
  };

  return (
    <div className="relative mt-6 dropdown-container">
      <button
        className="bg-blue-600 text-white px-6 py-3 rounded-md text-sm hover:bg-blue-700 transition flex items-center gap-2"
        onClick={toggleDropdown}
      >
        {currentStatus || "Mark as"}
        <span
          className={`transform transition-transform ${
            isDropdownOpen ? "rotate-180" : ""
          }`}
        >
          ▼
        </span>
      </button>

      {isDropdownOpen && (
        <div className="absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
          <ul className="py-2">
            <li className="px-4 py-2 font-bold text-gray-700 border-b">
              Mark as
            </li>
            {validStatuses.map(({ label, value }) => (
              <li
                key={value}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-700"
                onClick={() => handleSelectStatus(value)}
              >
                {label}
              </li>
            ))}
            {currentStatus && (
              <li
                className="px-4 py-2 text-red-600 hover:bg-gray-100 cursor-pointer border-t font-medium"
                onClick={handleDeleteMark}
              >
                Remove from all marks
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MarkButton;
