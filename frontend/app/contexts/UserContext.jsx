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
            const result = await axios.get(`${serverUrl}/api/auth/user`, 
                { withCredentials: true }
            )
            if (result.data && result.data._id) {
                setUserData(result.data)
            } else {
                setUserData(null)
            }
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