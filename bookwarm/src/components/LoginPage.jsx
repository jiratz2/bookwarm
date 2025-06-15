"use client";
import React from "react";
import AuthForm from "./AuthForm";
import { motion } from "framer-motion";

const LoginPage = () => {
  return (
    <main className="mt-40">
      <section className="relative flex justify-evenly items-center w-full">
      <motion.div
          className="max-md:absolute left-0 top-0 transition-transform duration-500 ease-in-out 
                     max-lg:-translate-x-40 max-md:-translate-x-full"
        >
          <motion.img
            src="https://cdn.builder.io/api/v1/image/assets/b635d51ad8de4cca8d40bf6f9a8f07c8/b5269073adbeef98fe93d93570fc1893a669320f?placeholderIfAbsent=true"
            alt="Login illustration"
            className="max-w-[1000px] aspect-[1.33]"
          />
        </motion.div>

        <div className="relative ">
          <AuthForm />
        </div>
      </section>
    </main>
  );
};

export default LoginPage;
