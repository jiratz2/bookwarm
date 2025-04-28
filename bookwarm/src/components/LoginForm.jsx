"use client";
import React from "react";
import { motion } from "framer-motion";
import { IoMdEye, IoMdEyeOff } from "react-icons/io";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

import { set } from "mongoose";

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loginSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("token", data.token);
        toast.success("Login successfully!", {
          duration: 3000,
          position: "top-right",
        });
        setTimeout(() => {
          window.location.href = "/";
        }, 1000);
        console.log("User login success");
        setErrorMessage("");
      } else {
        setErrorMessage("Sign in failed. Invalid email or password.");
      }
    } catch (error) {
      console.error("Error during Login:", error);
      setErrorMessage("An error occurred. Please try again later.");
    }
  };

  return (
    <motion.form
      onSubmit={loginSubmit}
      className="text-res flex flex-col max-md:mt-5 max-md:max-w-full max-md:m-10"
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
    >
      <label className=" self-start ml-5 mt-10 text-black max-md:mt-5">
        E-mail
      </label>
      <input
        onChange={(e) => setEmail(e.target.value)}
        type="email"
        placeholder="Example@domain.com"
        className="inputbox max-md:max-w-full text-res-s"
        required
      />

      <label className="self-start mt-3.5 ml-5 text-black ">Password</label>
      <div className="relative">
        {" "}
        {/* ใช้ relative positioning สำหรับ container ของ input และปุ่ม */}
        <input
          onChange={(e) => setPassword(e.target.value)}
          type={showPassword ? "text" : "password"}
          placeholder="Enter your password"
          className="inputbox max-md:max-w-full pr-12 text-res-s" // เพิ่ม padding ขวาให้มีพื้นที่สำหรับปุ่ม
          required
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-10 flex items-center text-gray-500 hover:text-gray-700"
        >
          {showPassword ? (
            <IoMdEyeOff className="h-5 w-5" />
          ) : (
            <IoMdEye className="h-5 w-5" />
          )}
        </button>
      </div>

      {errorMessage && (
        <div className="text-red-500 text-sm">{errorMessage}</div>
      )}

      <motion.button
        type="submit"
        className="px-16 mx-5 py-3 mt-12 text-white bg-blue-800 rounded-xl max-md:px-5 
        max-md:mt-10 max-md:max-w-full hover:bg-pink-500 transition-colors cursor-pointer"
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.0 }}
      >
        Sign in
      </motion.button>
    </motion.form>
  );
};

export default LoginForm;
