"use client";
import Link from "next/link";
import axios from "axios";
import React, { useContext, useState, useEffect } from "react";
import { IoIosEye, IoIosEyeOff } from "react-icons/io";
import { authDataContext } from "../contexts/AuthContext";
import { userDataContext } from "../contexts/UserContext";
import { useRouter } from "next/navigation";

const LoginPage = () => {
  const router = useRouter();
  const { serverUrl } = useContext(authDataContext);
  const { userData, setUserData } = useContext(userDataContext);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [disableLogin, setDisableLogin] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (userData) {
      if (userData.role === "Admin") router.push("/admin/dashboard");
      if (userData.role === "Manager") router.push("/manager/dashboard");
      // else router.push("/dashboard/user");
    }
  }, [userData, router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setDisableLogin(true);
    setError("");

    try {
      const res = await axios.post(
        `${serverUrl}/api/auth/login`,
        { email, password },
        { withCredentials: true }
      );

      const userData = res.data.user || res.data; 
      
      console.log('Login response:', res.data); // Debug log
      console.log('User data:', userData); // Debug log

      setUserData(userData);

      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', res.data.token);

      const role = userData.role;

      if (role === "Admin") router.push("/admin/dashboard");
      if (role === "Manager") router.push("/manager/dashboard");
      // else router.push("/dashboard/user");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials");
      setDisableLogin(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-orange-50 to-orange-200 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-3xl font-bold mb-6 text-orange-600 text-center">
          Welcome Back to MyBenaka
        </h2>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
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
              placeholder="Password"
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
            disabled={disableLogin}
          >
            {disableLogin ? "Logging in..." : "Log In"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
