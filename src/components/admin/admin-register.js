"use client";

import React, { useState } from "react";
import { registerAdmin } from "../../services/api";
import { useRouter } from "next/navigation";
import { useAuth } from "../../store/auth";
import styles from "../auth/AuthForm.module.css";

const AdminRegister = () => {
  const [adminData, setAdminData] = useState({
    name: "",
    email: "",
    password: "",
    number: "",
    fitnessCenterName: "",
    fitnessCenterAddress: "",
  });
  const router = useRouter();
  const { storetokenInLS } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAdminData({ ...adminData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const response = await registerAdmin(adminData, router, storetokenInLS);
    if (response.error) alert(response.message);
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Admin Registration</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <input type="text" name="name" placeholder="Name" value={adminData.name} onChange={handleChange} required className={styles.input} />
        <input type="email" name="email" placeholder="Email" value={adminData.email} onChange={handleChange} required className={styles.input} />
        <input type="password" name="password" placeholder="Password" value={adminData.password} onChange={handleChange} required className={styles.input} />
        <input type="text" name="number" placeholder="Number" value={adminData.number} onChange={handleChange} required className={styles.input} />
        <input type="text" name="fitnessCenterName" placeholder="Fitness Center Name" value={adminData.fitnessCenterName} onChange={handleChange} required className={styles.input} />
        <input type="text" name="fitnessCenterAddress" placeholder="Fitness Center Address" value={adminData.fitnessCenterAddress} onChange={handleChange} required className={styles.input} />
        <button type="submit" className={styles.button}>Register</button>
      </form>
    </div>
  );
};

export default AdminRegister;
