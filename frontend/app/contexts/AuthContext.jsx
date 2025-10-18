"use client"
import React, { createContext } from 'react'

export const authDataContext = createContext();

const AuthContext = ({ children }) => {
    const serverUrl = "https://mybenaka-backend.onrender.com/";
    const values = {
        serverUrl
    }

  return (
    <div>
      <authDataContext.Provider value={values}>
        {children}
      </authDataContext.Provider>
    </div>
  )
}

export default AuthContext
