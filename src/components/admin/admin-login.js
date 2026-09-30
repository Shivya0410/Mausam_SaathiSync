"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { loginAdmin } from "../../services/api";
import { useAuth } from "../../store/auth";
import styles from "../auth/AuthForm.module.css";

const Adminlogin = () => {
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const router = useRouter();
  const { storetokenInLS } = useAuth();

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res_data = await loginAdmin(credentials, router, storetokenInLS);
    setMessage(res_data.message || "An error occurred");
    if (res_data.error) {
      setMessage(res_data.message || "An error occurred");
    } else {
      setMessage("Login successful!");
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Login</h2>
      <form className={styles.form} onSubmit={handleSubmit}>
        <input
          className={styles.input}
          type="email"
          name="email"
          placeholder="Email"
          onChange={handleChange}
          required
        />
        <input
          className={styles.input}
          type="password"
          name="password"
          placeholder="Password"
          onChange={handleChange}
          required
        />
        <button className={styles.button} type="submit">Login</button>
      </form>
      {message && <p className={styles.message}>{message}</p>}
    </div>
  );
};

export default Adminlogin;
