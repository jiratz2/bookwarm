import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const MarkButton = ({ bookId, onAchievementUnlock, bookTitle }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(null);
  const [currentMarkId, setCurrentMarkId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

  const validStatuses = [
    { label: "Want to Read", value: "want to read" },
    { label: "Now Reading", value: "now reading" },
    { label: "Finished Reading", value: "read" },
    { label: "Did Not Finish", value: "did not finish" },
  ];

  useEffect(() => {
    if (bookId) {
      const fetchMark = async () => {
        setIsLoading(true);
        console.log("Fetching mark for bookId:", bookId);
        try {
          const token = localStorage.getItem("token");
          if (!token) {
            console.log("No token found for fetching mark");
            setIsLoading(false);
            return;
          }

          const res = await fetch(
            `http://localhost:8080/api/marks/${bookId}`,
            {
              headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
              },
            }
          );

          console.log("Fetch mark response status:", res.status);

          if (res.ok) {
            const data = await res.json();
            console.log("Fetch mark successful, data:", data);
            setCurrentStatus(data.status);
            setCurrentMarkId(data._id);
            console.log("Set currentStatus to:", data.status);
            console.log("Set currentMarkId to:", data._id);
          } else {
            const errorData = await res.json();
            console.error("Failed to fetch mark status, response not ok:", errorData.error);
            setCurrentStatus(null);
            setCurrentMarkId(null);
          }
        } catch (err) {
          console.error("Failed to fetch mark status (catch block):", err);
          setCurrentStatus(null);
          setCurrentMarkId(null);
        } finally {
          setIsLoading(false);
          console.log("Fetch mark finished.");
        }
      };

      fetchMark();
    }
  }, [bookId]);

  const handleSelectStatus = async (status) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("You must be logged in to mark books");
        setIsDropdownOpen(false);
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
        if (data.achievement && onAchievementUnlock) {
          onAchievementUnlock(data.achievement, bookTitle);
        }
        setIsDropdownOpen(false);
        toast.success("Book status updated successfully!");
      } else {
        const errorData = await res.json();
        console.error("Failed to update status:", errorData.error);
        toast.error(errorData.error || "Failed to update book status");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error. Please check your connection.");
    }
  };

  const handleDeleteMark = async () => {
    console.log("handleDeleteMark called");
    console.log("currentMarkId:", currentMarkId);
    
    if (!currentMarkId) {
      console.log("No mark ID found");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("You must be logged in to remove book status");
        return;
      }

      console.log("Sending DELETE request to:", `http://localhost:8080/api/marks/${currentMarkId}`);

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

      console.log("Response status:", res.status);

      if (res.ok) {
        setCurrentStatus(null);
        setCurrentMarkId(null);
        setIsDropdownOpen(false);
        console.log("Mark deleted successfully");
        toast.success("Book status removed successfully!");
      } else {
        const errorData = await res.json();
        console.error("Failed to remove status:", errorData.error);
        toast.error(errorData.error || "Failed to remove book status");
      }
    } catch (err) {
      console.error("Error deleting mark:", err);
      toast.error("Network error. Please check your connection.");
    }
  };

  const getStatusLabel = (statusValue) => {
    const status = validStatuses.find(s => s.value === statusValue);
    return status ? status.label : "Mark as";
  };

  const getButtonColor = (status) => {
    switch (status) {
      case "want to read":
        return "bg-blue-500 hover:bg-blue-700";
      case "now reading":
        return "bg-pink-600 hover:bg-pink-700";
      case "read":
        return "bg-green-500 hover:bg-green-600";
      case "did not finish":
        return "bg-red-600 hover:bg-red-700";
      default:
        return "bg-blue-800 hover:bg-blue-700";
    }
  };

  const buttonClass = `text-white px-6 py-3 rounded-md text-sm transition flex items-center gap-2 ${getButtonColor(currentStatus)}`;

  if (isLoading) {
    return <div className="mt-6">Loading...</div>;
  }

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      <div className="relative mt-6 dropdown-container">
        <button
          className={buttonClass}
          onClick={toggleDropdown}
        >
          {getStatusLabel(currentStatus)}
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
                  onClick={() => {
                    console.log("Delete button clicked");
                    handleDeleteMark();
                  }}
                >
                  Remove status
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </>
  );
};

export default MarkButton;