"use client";

import React, { useCallback, useEffect, useState } from "react";
import { fetchFitnessCenterUsers, addFitnessCenterUser } from "../../services/api";
import { useAuth } from "../../store/auth";
import styles from "./AdminDashboard.module.css";

const AdminDashboard = () => {
  // The context exports LogoutAdmin; there has never been a `logout` key, so
  // the logout button threw a TypeError when clicked.
  const { token, LogoutAdmin, admin } = useAuth();
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({
    name: "",
    age: "",
    mobileNumber: "",
    dob: "",
    joiningDate: "",
    paymentMonths: "",
  });

  // fetchFitnessCenterUsers resolves with an error object rather than
  // rejecting when the request fails, so the result has to be checked before
  // it reaches setUsers or the users.map below throws.
  const loadUsers = useCallback(async () => {
    const result = await fetchFitnessCenterUsers(token);
    if (Array.isArray(result)) {
      setUsers(result);
    } else {
      console.error("Error fetching users:", result?.message);
      setUsers([]);
    }
  }, [token]);

  useEffect(() => {
    if (admin) {
      loadUsers();
    }
  }, [admin, loadUsers]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser({ ...newUser, [name]: value });
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      await addFitnessCenterUser(newUser, token);
      alert("User added successfully!");
      setNewUser({ name: "", age: "", mobileNumber: "", dob: "", joiningDate: "", paymentMonths: "" });
      await loadUsers();
    } catch (error) {
      alert("Failed to add user");
    }
  };

  return (
    <div className={styles["admin-dashboard-container"]}>
      <div className={styles["admin-dashboard-header"]}>
        <h1>Welcome, Admin {admin?.name}</h1>
        <button onClick={LogoutAdmin}>Logout</button>
      </div>

      <div className={styles["admin-dashboard-users"]}>
        <h2>Registered Users</h2>
        <table>
    <thead>
      <tr>
        <th>Name</th>
        <th>Mobile Number</th>
        <th>Age</th>
        <th>DOB</th>
        <th>Joining Date</th>
        <th>Payment Months</th>
      </tr>
    </thead>
    <tbody>
      {users.map((user) => (
        <tr key={user._id}>
          <td>{user.name}</td>
          <td>{user.mobileNumber}</td>
          <td>{user.age}</td>
          <td>{user.dob}</td>
          <td>{user.joiningDate}</td>
          <td>{user.paymentMonths}</td>
        </tr>
      ))}
    </tbody>
  </table>
      </div>

      <div className={styles["admin-dashboard-form"]}>
        <h2>Add New User</h2>
        <form onSubmit={handleAddUser}>
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={newUser.name}
            onChange={handleInputChange}
            required
          />
          <input
            type="number"
            name="age"
            placeholder="Age"
            value={newUser.age}
            onChange={handleInputChange}
            required
          />
          <input
            type="text"
            name="mobileNumber"
            placeholder="Mobile Number"
            value={newUser.mobileNumber}
            onChange={handleInputChange}
            required
          />
          <input
            type="date"
            name="dob"
            value={newUser.dob}
            onChange={handleInputChange}
            required
          />
          <input
            type="date"
            name="joiningDate"
            value={newUser.joiningDate}
            onChange={handleInputChange}
            required
          />
          <input
            type="number"
            name="paymentMonths"
            placeholder="Payment Months"
            value={newUser.paymentMonths}
            onChange={handleInputChange}
            required
          />
          <button type="submit">Add User</button>
        </form>
      </div>
    </div>
  );
};

export default AdminDashboard;
