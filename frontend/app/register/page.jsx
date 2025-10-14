"use client";
import Link from "next/link";
import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { IoIosEye, IoIosEyeOff } from "react-icons/io";
import { authDataContext } from "../contexts/AuthContext";
import { userDataContext } from "../contexts/UserContext";
import { useRouter } from "next/navigation";

const RegisterPage = () => {
    const router = useRouter();
    const { userData, setUserData } = useContext(userDataContext);
    const { serverUrl } = useContext(authDataContext);

    const [showPassword, setShowPassword] = useState(false);
    const [disableSignup, setDisableSignup] = useState(false);

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        if (userData) {
            if (userData.role === "main-admin") router.push("/dashboard/admin");
            else if (userData.role === "partial-admin")
                router.push("/dashboard/partial-admin");
            else router.push("/dashboard/user");
        }
    }, [userData, router]);

    const handleSignup = async (e) => {
        e.preventDefault();
        setDisableSignup(true);
        setError("");

        try {
            const res = await axios.post(
                `${serverUrl}/api/auth/register`,
                { name, email, password },
                { withCredentials: true }
            );

            setUserData(res.data);
            const role = res.data.role;

            if (role === "main-admin") router.push("/dashboard/admin");
            else if (role === "partial-admin") router.push("/dashboard/partial-admin");
            else router.push("/dashboard/user");
        } catch (err) {
            setError(err.response?.data?.message || "Signup failed");
            setDisableSignup(false);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-orange-50 to-orange-200 px-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-3xl font-bold mb-6 text-orange-600 text-center">
                    Create Your MyBenaka Account
                </h2>

                <form onSubmit={handleSignup} className="flex flex-col gap-4">
                    <input
                        type="text"
                        placeholder="Username"
                        required
                        className="p-2 border rounded"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />

                    <input
                        type="email"
                        placeholder="Email"
                        required
                        className="p-2 border rounded"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />

                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Password (6+ characters)"
                            required
                            className="p-2 border rounded w-full pr-10"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        {showPassword ? (
                            <IoIosEye
                                onClick={() => setShowPassword(false)}
                                className="absolute top-1/2 right-3 transform -translate-y-1/2 cursor-pointer text-2xl text-orange-500"
                            />
                        ) : (
                            <IoIosEyeOff
                                onClick={() => setShowPassword(true)}
                                className="absolute top-1/2 right-3 transform -translate-y-1/2 cursor-pointer text-2xl text-orange-500"
                            />
                        )}
                    </div>

                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    <button
                        type="submit"
                        className="bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition cursor-pointer disabled:opacity-70"
                        disabled={disableSignup}
                    >
                        {disableSignup ? "Creating Account..." : "Sign Up"}
                    </button>
                </form>

                <p className="text-sm mt-4 text-center">
                    Already have an account?{" "}
                    <Link href="/login" className="text-orange-600 hover:underline">
                        Log in
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default RegisterPage;
