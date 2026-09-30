import { ADMIN_API_URL, AUTH_API_URL } from "./config";

// Each of these takes the Next.js router returned by `useRouter()` where the
// Create React App version took the `navigate` function from React Router.

export const registerUser = async (userData, router, storetokenInLS) => {
  try {
    const response = await fetch(`${AUTH_API_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });

    const res_data = await response.json();
    if (response.ok) {
      storetokenInLS(res_data.token);
      alert("Welcome to Swasthnfinity");
      router.push("/login");
      return res_data;
    } else {
      return { error: true, message: res_data.message || "Registration failed" };
    }
  } catch (error) {
    console.error("Error in RegisterUser:", error.message);
    return { error: true, message: error.message || "Network error in Registration" };
  }
};

// Admin Registration
export const registerAdmin = async (adminData, router, storetokenInLS) => {
  try {
    const response = await fetch(`${ADMIN_API_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(adminData),
    });

    const res_data = await response.json();
    if (response.ok) {
      storetokenInLS(res_data.token);
      alert("Admin Registered Successfully");
      router.push("/adminlogin");
      return res_data;
    } else {
      return { error: true, message: res_data.message || "Admin registration failed" };
    }
  } catch (error) {
    console.error("Error in registerAdmin:", error.message);
    return { error: true, message: error.message || "Network error during admin registration" };
  }
};

export const loginUser = async (credentials, router, storetokenInLS) => {
  try {
    const response = await fetch(`${AUTH_API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    const res_data = await response.json();
    if (response.ok) {
      storetokenInLS(res_data.token);
      alert("Login Successfully");
      router.push("/");
      return res_data;
    } else {
      return { error: true, message: res_data.message || "Login failed" };
    }
  } catch (error) {
    console.error("Error in loginUser:", error.message);
    return { error: true, message: error.message || "Network error" };
  }
};

export const loginAdmin = async (credentials, router, storeTokenInLS) => {
  try {
    const response = await fetch(`${ADMIN_API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    const res_data = await response.json();
    if (response.ok) {
      storeTokenInLS(res_data.token);
      alert("Admin Login Successful");
      router.push("/");
      return res_data;
    } else {
      return { error: true, message: res_data.message || "Admin login failed" };
    }
  } catch (error) {
    console.error("Error in loginAdmin:", error.message);
    return { error: true, message: error.message || "Network error" };
  }
};

// Fetch Fitness Center Users
export const fetchFitnessCenterUsers = async (token) => {
  try {
    const response = await fetch(`${ADMIN_API_URL}/users`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.ok ? await response.json() : { error: true, message: "Failed to fetch users" };
  } catch (error) {
    console.error("Error in fetchFitnessCenterUsers:", error.message);
    return { error: true, message: error.message || "Network error" };
  }
};

// Add Fitness Center User
export const addFitnessCenterUser = async (userData, token) => {
  try {
    const response = await fetch(`${ADMIN_API_URL}/add-user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(userData),
    });
    return response.ok ? await response.json() : { error: true, message: "Failed to add user" };
  } catch (error) {
    console.error("Error in addFitnessCenterUser:", error.message);
    return { error: true, message: error.message || "Network error" };
  }
};
