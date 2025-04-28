import React, { useEffect } from "react";

export default function EditProfile() {
  const [displayName, setDisplayName] = React.useState("");
  const [bio, setBio] = React.useState("");
  const [gender, setGender] = React.useState("");
  const [dateOfBirth, setDateOfBirth] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phoneNumber, setPhoneNumber] = React.useState("");

  const fetchProfile = async () => {
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
      setGender(data.gender || "");
      setDateOfBirth(data.date_of_birth || "");
      setEmail(data.email || ""); // ตรวจสอบว่ามีการตั้งค่า email ใน State
      setPhoneNumber(data.phone_number || "");
    } else {
      alert("Failed to fetch profile data.");
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:8080/api/auth/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        displayname: displayName,
        bio: bio,
        gender: gender,
        date_of_birth: dateOfBirth,
        phone_number: phoneNumber,
      }),
    });

    const data = await res.json();
    if (res.ok) {
      alert("Profile updated successfully!");
    } else {
      alert(data.error || "Failed to update profile. Please try again.");
    }
  };

  return (
    <div className="mt-[100px]">
      <h1>Edit your profile</h1>

      <div className="w-full h-[200px] bg-gray-200"></div>
      <div className="w-[150px] h-[150px] rounded-full bg-gray-300"></div>

      <div className="flex flex-col m-10 w-2xl">
        <label htmlFor="">Display Name</label>
        <input
          type="text"
          className="inputboxprimary"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />

        <label htmlFor="">Bio</label>
        <input
          type="text"
          className="inputboxprimary"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />

        <label htmlFor="">Gender</label>
        <input
          type="text"
          className="inputboxprimary"
          value={gender}
          onChange={(e) => setGender(e.target.value)}
        />

        <label htmlFor="">Date of Birth</label>
        <input
          type="date"
          className="inputboxprimary"
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
        />

        <label htmlFor="">E-mail</label>
        <input
          type="text"
          className="inputboxprimary"
          value={email}
          disabled // ป้องกันการแก้ไข
        />

        <label htmlFor="">Phone Number</label>
        <input
          type="text"
          className="inputboxprimary"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
        />

        <button className="cancelbutton my-2">Cancel</button>
        <button className="button" onClick={handleSave}>
          Save
        </button>
      </div>
    </div>
  );
}
