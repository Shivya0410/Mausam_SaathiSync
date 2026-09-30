"use client";

import { createContext, useCallback, useContext, useEffect, useState, useSyncExternalStore } from "react";
import { AUTH_API_URL } from "../services/config";

export const AuthContext = createContext();

const TOKEN_KEY = "token";
const TOKEN_EVENT = "mausam:auth-token";

// The token lives in localStorage, which does not exist during the server
// render. Reading it through useSyncExternalStore gives the server (and the
// hydrating client) `null`, then the real value, without a mismatch and
// without setState inside an effect (the same pattern as trackerStore.js).
function subscribe(callback) {
    window.addEventListener("storage", callback);
    window.addEventListener(TOKEN_EVENT, callback);
    return () => {
        window.removeEventListener("storage", callback);
        window.removeEventListener(TOKEN_EVENT, callback);
    };
}

function readToken() {
    try {
        return localStorage.getItem(TOKEN_KEY) || "";
    } catch {
        return "";
    }
}

function writeToken(value) {
    try {
        if (value) localStorage.setItem(TOKEN_KEY, value);
        else localStorage.removeItem(TOKEN_KEY);
    } catch {
        // Storage blocked (private mode): sign-in lasts for this page only.
    }
    window.dispatchEvent(new Event(TOKEN_EVENT));
}

// Optional sign-in (PRD 9.5): no feature depends on it. The admin client
// code was removed with the admin pages (PRD 13.10, item 8), so the app no
// longer calls /api/admin.
export const AuthProvider = ({ children }) => {
    // null until the client has read storage: guards against flashing
    // signed-out UI for signed-in users on first paint.
    const stored = useSyncExternalStore(subscribe, readToken, () => null);
    const isAuthReady = stored !== null;
    const token = stored || "";

    // Profile fetched for a specific token; a different (or no) token means
    // no profile, so nothing has to be cleared by hand.
    const [profile, setProfile] = useState({ forToken: "", data: "" });
    const user = token && profile.forToken === token ? profile.data : "";

    const storetokenInLS = useCallback((serverToken) => writeToken(serverToken), []);
    const LogoutUser = useCallback(() => writeToken(""), []);

    const isLoggedIN = !!token;

    useEffect(() => {
        if (!token) return undefined;
        let cancelled = false;
        (async () => {
            try {
                const response = await fetch(`${AUTH_API_URL}/user`, {
                    method: "GET",
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (response.ok) {
                    const data = await response.json();
                    if (!cancelled) setProfile({ forToken: token, data: data.userData });
                }
            } catch {
                console.error("Error at frontend jwt authorization");
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [token]);

    return (
        <AuthContext.Provider value={{ isLoggedIN, isAuthReady, token, storetokenInLS, LogoutUser, user }}>
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
