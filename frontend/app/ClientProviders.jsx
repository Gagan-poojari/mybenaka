"use client";

import AuthContext from "./contexts/AuthContext";

export default function ClientProviders({ children }) {
  return (
    <AuthContext>
        {children}
    </AuthContext>
  );
}
