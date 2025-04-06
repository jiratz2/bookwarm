import React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { IoMdEye, IoMdEyeOff } from "react-icons/io";

function RegisterForm() {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const validatePassword = (password) => {
    const hasLetters = /[a-zA-Z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const hasMinLength = password.length >= 8;

    let message = "";

    if (!hasMinLength ) {
      message = "Password must be at least 8 characters long.";
    } else if (!hasLetters) {
      message = "Password must contain at least one letter.";
    } else if (!hasNumbers) {
      message = "Password must contain at least one number.";
    } else if (!hasSpecialChars) {
      message = "Password must contain at least one special character.";
    }

    return {
      isValid: hasLetters && hasNumbers && hasSpecialChars && hasMinLength,
      message,
    };
  };

  const handlePasswordChange = (e) => {
    const passwordValue = e.target.value;
    setPassword(passwordValue);

    const {isValid, message} = validatePassword(passwordValue);

    if(!isValid){
      setErrorMessage(message);
    }else{
      setErrorMessage("");
    }
  };

  const handleregisterSubmit = async (e) => {
    e.preventDefault();

    const { isValid, message } = validatePassword(password);
    if (!isValid) {
      alert(message);
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    try{
      const res = await fetch("http://localhost:8080/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          displayName,
          password,
        }),
      });

      if (res.ok){
        console.log("User register successfully");
        setErrorMessage("");
        toast.success("User registered successfully!",{
          duration: 3000,
          position: "top-right",
        });
        setTimeout(() => {
          window.location.href = "/";
        }, 1000);
      }
    }catch (error) {
      console.log("Error: ", error);
    }
  };

  return (
    <motion.form
      onSubmit={handleregisterSubmit}
      className="text-res flex flex-col max-md:mt-5 max-md:max-w-full"
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
    >
      <label className="self-start ml-5 mt-10 text-xl text-black max-md:mt-5">
        E-mail
      </label>
      <input
        onChange={(e) => setEmail(e.target.value)}
        type="email"
        placeholder="Example@domain.com"
        className="inputbox max-md:max-w-full text-sm"
        required
      />

      <label className="self-start mt-3.5 ml-5 text-xl text-black ">
        Display Name
      </label>
      <input
        onChange={(e) => setDisplayName(e.target.value)}
        type="text"
        placeholder="You can change it later."
        className="inputbox max-md:max-w-full text-sm"
      />

      <label className="self-start mt-3.5 ml-5 text-xl text-black ">
        Password
      </label>
      <input
        onChange={handlePasswordChange}
        type={showPassword ? "text" : "password"}
        placeholder="Enter your password"
        className="inputbox max-md:max-w-full text-sm"
        required
      />

      {errorMessage && <p className="text-red-500 text-sm font-light mt-2">{errorMessage}</p>}

      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute inset-y-11 right-2 flex items-center text-gray-500 hover:text-gray-700"
      >
          {showPassword ? (
          <IoMdEyeOff className="h-5 w-5" />
          ) : (
          <IoMdEye className="h-5 w-5" />
          )}
      </button>
      

      <label className="self-start mt-3.5 ml-5 text-xl text-black ">
        Confirm Password
      </label>
      <input
        onChange={(e) => setConfirmPassword(e.target.value)}
        type="password"
        placeholder="Confirm your password"
        className="inputbox max-md:max-w-full text-sm"
        required
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute inset-y-20 right-2 flex items-center text-gray-500 hover:text-gray-700"
      >
          {showPassword ? (
          <IoMdEyeOff className="h-5 w-5" />
          ) : (
          <IoMdEye className="h-5 w-5" />
          )}
      </button>

      <motion.button
        type="submit"
        className="px-16 mx-5 py-3 mt-12 text-xl text-white bg-blue-800 rounded-xl max-md:px-5 
        max-md:mt-10 max-md:max-w-full hover:bg-pink-500 transition-colors cursor-pointer"
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.0 }}
      >
        Register
      </motion.button>
    </motion.form>
  );
}

export default RegisterForm;
