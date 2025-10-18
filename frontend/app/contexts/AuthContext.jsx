"use client"
import React, { createContext } from 'react'

export const authDataContext = createContext();

const AuthContext = ({ children }) => {
    const serverUrl = "http://localhost:8000"
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
