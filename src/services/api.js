import { AUTH_API_URL } from "./config";

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
