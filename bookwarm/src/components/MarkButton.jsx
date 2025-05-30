import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";

const MarkButton = ({ bookId }) => {
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

  useEffect(() => {
    if (bookId) {
      const fetchMark = async () => {
        try {
          const token = localStorage.getItem("token");
          if (!token) return;

          const res = await fetch(
            `http://localhost:8080/api/marks/${bookId}`,
            {
              headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
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
  }, [bookId]);

  const handleSelectStatus = async (status) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please login to mark books");
        return;
      }

      let method = "POST";
      let url = `http://localhost:8080/api/marks/`;
      const body = { 
        book_id: bookId,
        status: status 
      };

      if (currentMarkId) {
        url = `http://localhost:8080/api/marks/${currentMarkId}`;
        method = "PUT";
      }

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentStatus(status);
        if (!currentMarkId) {
          setCurrentMarkId(data.mark_id);
        }
        toast.success(currentMarkId ? "Status updated successfully" : "Book marked successfully");
        setIsDropdownOpen(false);
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Failed to update status");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while updating status");
    }
  };

  const handleDeleteMark = async () => {
    if (!currentMarkId) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please login to mark books");
        return;
      }

      const res = await fetch(
        `http://localhost:8080/api/marks/${currentMarkId}`,
        {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
        }
      );

      if (res.ok) {
        setCurrentStatus(null);
        setCurrentMarkId(null);
        toast.success("Status removed successfully");
        setIsDropdownOpen(false);
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Failed to remove status");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while removing status");
    }
  };

  const buttonClass = currentStatus 
    ? "bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-md text-sm transition flex items-center gap-2"
    : "bg-blue-800 hover:bg-blue-700 text-white px-6 py-3 rounded-md text-sm hover:bg-blue-700 transition flex items-center gap-2";

  return (
    <div className="relative mt-6 dropdown-container">
      <button
        className={buttonClass}
        onClick={toggleDropdown}
      >
        {currentStatus || "Mark as"}
        <span
          className={`transform transition-transform duration-200 ${
            isDropdownOpen ? "rotate-180" : ""
          }`}
        >
          ▼
        </span>
      </button>

      {isDropdownOpen && (
        <div className="absolute left-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-xl z-10 transform transition-all duration-200 ease-in-out">
          <ul className="py-2">
            <li className="px-4 py-3 font-semibold text-gray-700 border-b border-gray-100 bg-gray-50 rounded-t-lg">
              {currentStatus ? "Change status to" : "Mark as"}
            </li>
            {validStatuses.map(({ label, value }) => (
              <li
                key={value}
                className={`px-4 py-2.5 hover:bg-blue-50 cursor-pointer transition-colors duration-150 ${
                  currentStatus === value 
                    ? "text-blue-600 font-medium bg-blue-50" 
                    : "text-gray-700 hover:text-blue-600"
                }`}
                onClick={() => handleSelectStatus(value)}
              >
                {label}
              </li>
            ))}
            {currentStatus && (
              <li
                className="px-4 py-2.5 text-red-600 hover:bg-red-50 cursor-pointer border-t border-gray-100 font-medium transition-colors duration-150 rounded-b-lg"
                onClick={handleDeleteMark}
              >
                Remove status
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MarkButton;
