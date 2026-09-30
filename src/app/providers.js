"use client";

import { AuthProvider } from "../store/auth";
import LanguageSwitcher from "../components/LanguageSwitcher";
import StyledComponentsRegistry from "./styled-components-registry";
import "../i18n";

// The LanguageSwitcher rendered above every page here is what App.js used to
// render inside its router, so it stays visible on every route.
export default function Providers({ children }) {
  return (
    <StyledComponentsRegistry>
      <AuthProvider>
        <LanguageSwitcher />
        {children}
      </AuthProvider>
    </StyledComponentsRegistry>
  );
}
