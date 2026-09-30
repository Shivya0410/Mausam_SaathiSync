"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { ADMIN_API_URL, AUTH_API_URL } from "../services/config";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    // The token cannot be read from localStorage during the initial render:
    // that render also happens on the server, where localStorage does not
    // exist, and seeding state from it would make the client hydrate with a
    // different value than the server produced. Start empty and load it in an
    // effect, which only ever runs in the browser.
    const [token, setToken] = useState("");
    const [user, setUser] = useState("");
    const [admin, setAdmin] = useState("");
    // True once localStorage has been read on the client. Guards against the
    // login hero flashing for already-logged-in users on first paint.
    const [isAuthReady, setIsAuthReady] = useState(false);

    useEffect(() => {
        setToken(localStorage.getItem("token") || "");
        setIsAuthReady(true);
    }, []);

    const storetokenInLS = useCallback((serverToken) => {
        localStorage.setItem("token", serverToken);
        setToken(serverToken);
    }, []);

    const isLoggedIN = !!token;

    const LogoutUser = useCallback(() => {
        setToken("");
        setUser("");
        localStorage.removeItem("token");
    }, []);

    const LogoutAdmin = useCallback(() => {
        setToken("");
        setAdmin("");
        localStorage.removeItem("token");
    }, []);

    useEffect(() => {
        if (!token) {
            setUser("");
            setAdmin("");
            return;
        }

        let cancelled = false;

        const userAuthentication = async () => {
            try {
                const response = await fetch(`${AUTH_API_URL}/user`, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    if (!cancelled) setUser(data.userData);
                }
            } catch (error) {
                console.error("Error at frontend jwt authorization");
            }
        };

        const adminAuthentication = async () => {
            try {
                const response = await fetch(`${ADMIN_API_URL}/admindet`, {
                    method: "GET",
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (response.ok) {
                    const data = await response.json();
                    if (!cancelled) setAdmin(data.adminData);
                }
            } catch (error) {
                console.error("Error in admin JWT authorization");
            }
        };

        userAuthentication();
        adminAuthentication();

        return () => {
            cancelled = true;
        };
        // Depends on `token` so that logging in loads the profile straight
        // away. The previous empty dependency array meant a fresh login did
        // not populate user data until the page was reloaded by hand.
    }, [token]);

    return (
        <AuthContext.Provider
            value={{ isLoggedIN, isAuthReady, token, storetokenInLS, LogoutUser, LogoutAdmin, user, admin }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const authContextValue = useContext(AuthContext);
    if (!authContextValue) {
        throw new Error("useAuth used outside the Provider");
    }
    return authContextValue;
};
