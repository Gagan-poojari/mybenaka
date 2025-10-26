"use client";

import AuthContext from "./contexts/AuthContext";
import UserContext from "./contexts/UserContext";

export default function ClientProviders({ children }) {
  return (
    <AuthContext>
      <UserContext>
        {children}
      </UserContext>
    </AuthContext>
  );
}
