"use client"
import React, { createContext, useContext, useEffect, useState } from "react"
import { authDataContext } from "./AuthContext"
import axios from "axios"

export const userDataContext = createContext()

const UserContext = ({ children }) => {
    const [userData, setUserData] = useState(null)
    const { serverUrl } = useContext(authDataContext)

    const getUserData = async () => {
        try {
            const token = localStorage.getItem('token');
            const result = await fetch(`${serverUrl}/api/auth/user`, {
                headers: {
                    Authorization: token ? `Bearer ${token}` : undefined,
                    "Content-Type": "application/json",
                },
            })
            if (!result.ok) {
                throw new Error(`Failed to fetch user: ${result.status}`);
            }

            const data = await result.json();
            // console.log("User data fetched:", data);
            setUserData(data);
        } catch (error) {
            console.log("Error getting user data:", error.response?.data || error);
            setUserData(null)
        }
    }

    useEffect(() => {
        getUserData()
    }, [])

    const values = {
        userData, setUserData
    }

    return (
        <div>
            <userDataContext.Provider value={values}>
                {children}
            </userDataContext.Provider>
        </div>
    )
}

export default UserContext