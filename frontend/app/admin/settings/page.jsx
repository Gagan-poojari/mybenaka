"use client";
import React, { useState, useEffect, useCallback, useContext } from "react";
import {
    Settings,
    User,
    Lock,
    Mail,
    Phone,
    Save,
    Eye,
    EyeOff,
    AlertCircle,
    CheckCircle,
    Shield,
    Bell,
    Palette,
    LogOut,
    RefreshCw,
    Users,
    CreditCard,
} from "lucide-react";
import AdminLeftbar from "@/app/components/dashboard/AdminLeftBar";
import { authDataContext } from "@/app/contexts/AuthContext";

const AdminSettings = () => {
    const { serverUrl } = useContext(authDataContext)
    const [activeTab, setActiveTab] = useState("profile");
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);
    const [success, setSuccess] = useState(null);
    const [error, setError] = useState(null);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Profile state
    const [profileData, setProfileData] = useState({
        name: "",
        email: "",
        contacts: [],
        managers: [],
        borrowers: [],
    });

    // Profile edit state
    const [editProfile, setEditProfile] = useState({
        name: "",
        contacts: "",
    });

    // Password state
    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    // Fetch admin profile
    const fetchProfile = useCallback(async () => {
        setFetchLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${serverUrl}/api/admin/profile`, {
                headers: {
                    Authorization: token ? `Bearer ${token}` : undefined,
                    "Content-Type": "application/json",
                },
            });

            if (!res.ok) {
                throw new Error("Failed to fetch profile");
            }

            const data = await res.json();
            setProfileData(data);
            setEditProfile({
                name: data.name || "",
                contacts: data.contacts?.join(", ") || "",
            });
        } catch (err) {
            console.error("Profile fetch error:", err);
            setError(err.message);
        } finally {
            setFetchLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    // Update profile
    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const token = localStorage.getItem("token");
            const contactsArray = editProfile.contacts
                .split(",")
                .map(c => c.trim())
                .filter(c => c);

            const res = await fetch(`${serverUrl}/api/admin/profile`, {
                method: "PUT",
                headers: {
                    Authorization: token ? `Bearer ${token}` : undefined,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: editProfile.name,
                    contacts: contactsArray,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Failed to update profile");
            }

            setSuccess("Profile updated successfully!");
            fetchProfile();
        } catch (err) {
            setError(err.message || "Error updating profile");
        } finally {
            setLoading(false);
        }
    };

    // Change password
    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        // Validation
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setError("New passwords do not match");
            setLoading(false);
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setError("New password must be at least 6 characters");
            setLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${serverUrl}/api/admin/password`, {
                method: "PUT",
                headers: {
                    Authorization: token ? `Bearer ${token}` : undefined,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Failed to change password");
            }

            setSuccess("Password changed successfully!");
            setPasswordData({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            });
        } catch (err) {
            setError(err.message || "Error changing password");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        window.location.href = "/login";
    };

    if (fetchLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-600 mx-auto" />
                    <p className="mt-4 text-gray-600">Loading settings...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <AdminLeftbar />

            <div className="flex-1 p-6">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                    <p className="text-gray-600 mt-2">
                        Manage your account settings and preferences
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Sidebar Navigation */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow p-4 sticky top-6">
                            <nav className="space-y-2">
                                <button
                                    onClick={() => {
                                        setActiveTab("profile");
                                        setError(null);
                                        setSuccess(null);
                                    }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === "profile"
                                            ? "bg-orange-50 text-orange-600"
                                            : "text-gray-700 hover:bg-gray-50"
                                        }`}
                                >
                                    <User className="w-5 h-5" />
                                    <span className="font-medium">Profile</span>
                                </button>

                                <button
                                    onClick={() => {
                                        setActiveTab("security");
                                        setError(null);
                                        setSuccess(null);
                                    }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === "security"
                                            ? "bg-orange-50 text-orange-600"
                                            : "text-gray-700 hover:bg-gray-50"
                                        }`}
                                >
                                    <Lock className="w-5 h-5" />
                                    <span className="font-medium">Security</span>
                                </button>

                                <button
                                    onClick={() => {
                                        setActiveTab("stats");
                                        setError(null);
                                        setSuccess(null);
                                    }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === "stats"
                                            ? "bg-orange-50 text-orange-600"
                                            : "text-gray-700 hover:bg-gray-50"
                                        }`}
                                >
                                    <Shield className="w-5 h-5" />
                                    <span className="font-medium">Statistics</span>
                                </button>

                                <hr className="my-4" />

                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                                >
                                    <LogOut className="w-5 h-5" />
                                    <span className="font-medium">Logout</span>
                                </button>
                            </nav>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-3">
                        {/* Profile Tab */}
                        {activeTab === "profile" && (
                            <div className="bg-white rounded-xl shadow">
                                <div className="p-6 border-b border-gray-200">
                                    <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Update your account profile information
                                    </p>
                                </div>

                                <form onSubmit={handleProfileUpdate} className="p-6 space-y-6">
                                    {/* Avatar Section */}
                                    <div className="flex items-center gap-6">
                                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                                            {profileData.name?.charAt(0).toUpperCase() || "A"}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">{profileData.name}</h3>
                                            <p className="text-sm text-gray-500">{profileData.email}</p>
                                            <p className="text-xs text-orange-600 mt-1 font-medium">Super Admin</p>
                                        </div>
                                    </div>

                                    {/* Name */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Full Name
                                        </label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                            <input
                                                type="text"
                                                value={editProfile.name}
                                                onChange={(e) => setEditProfile({ ...editProfile, name: e.target.value })}
                                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                                placeholder="Enter your name"
                                            />
                                        </div>
                                    </div>

                                    {/* Email (Read-only) */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Email Address
                                        </label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                            <input
                                                type="email"
                                                value={profileData.email}
                                                disabled
                                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                                    </div>

                                    {/* Contacts */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Contact Numbers
                                        </label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                            <input
                                                type="text"
                                                value={editProfile.contacts}
                                                onChange={(e) => setEditProfile({ ...editProfile, contacts: e.target.value })}
                                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                                placeholder="Enter contact numbers (comma-separated)"
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Separate multiple numbers with commas
                                        </p>
                                    </div>

                                    {/* Error/Success Messages */}
                                    {error && (
                                        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                            <span>{error}</span>
                                        </div>
                                    )}

                                    {success && (
                                        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                                            <CheckCircle className="w-5 h-5 flex-shrink-0" />
                                            <span>{success}</span>
                                        </div>
                                    )}

                                    {/* Submit Button */}
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
                                    >
                                        {loading ? (
                                            <>
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                                                Updating...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-5 h-5" />
                                                Save Changes
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* Security Tab */}
                        {activeTab === "security" && (
                            <div className="bg-white rounded-xl shadow">
                                <div className="p-6 border-b border-gray-200">
                                    <h2 className="text-xl font-semibold text-gray-900">Security Settings</h2>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Update your password to keep your account secure
                                    </p>
                                </div>

                                <form onSubmit={handlePasswordChange} className="p-6 space-y-6">
                                    {/* Current Password */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Current Password
                                        </label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                            <input
                                                type={showCurrentPassword ? "text" : "password"}
                                                value={passwordData.currentPassword}
                                                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                                className="w-full pl-10 pr-12 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                                placeholder="Enter current password"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* New Password */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            New Password
                                        </label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                            <input
                                                type={showNewPassword ? "text" : "password"}
                                                value={passwordData.newPassword}
                                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                                className="w-full pl-10 pr-12 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                                placeholder="Enter new password"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Must be at least 6 characters long
                                        </p>
                                    </div>

                                    {/* Confirm Password */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Confirm New Password
                                        </label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                            <input
                                                type={showConfirmPassword ? "text" : "password"}
                                                value={passwordData.confirmPassword}
                                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                                className="w-full pl-10 pr-12 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                                placeholder="Confirm new password"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Error/Success Messages */}
                                    {error && (
                                        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                            <span>{error}</span>
                                        </div>
                                    )}

                                    {success && (
                                        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                                            <CheckCircle className="w-5 h-5 flex-shrink-0" />
                                            <span>{success}</span>
                                        </div>
                                    )}

                                    {/* Submit Button */}
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
                                    >
                                        {loading ? (
                                            <>
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                                                Changing Password...
                                            </>
                                        ) : (
                                            <>
                                                <Shield className="w-5 h-5" />
                                                Change Password
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* Statistics Tab */}
                        {activeTab === "stats" && (
                            <div className="space-y-6">
                                <div className="bg-white rounded-xl shadow p-6">
                                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Account Statistics</h2>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
                                            <div className="flex items-center justify-between mb-4">
                                                <Users className="w-8 h-8 text-orange-600" />
                                                <span className="text-3xl font-bold text-orange-600">
                                                    {profileData.managers?.length || 0}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-semibold text-gray-900">Managers</h3>
                                            <p className="text-sm text-gray-600 mt-1">Total managers created</p>
                                        </div>

                                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                                            <div className="flex items-center justify-between mb-4">
                                                <User className="w-8 h-8 text-blue-600" />
                                                <span className="text-3xl font-bold text-blue-600">
                                                    {profileData.borrowers?.length || 0}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-semibold text-gray-900">Borrowers</h3>
                                            <p className="text-sm text-gray-600 mt-1">Total borrowers added</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Recent Managers */}
                                {profileData.managers && profileData.managers.length > 0 && (
                                    <div className="bg-white rounded-xl shadow p-6">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Managers</h3>
                                        <div className="space-y-3">
                                            {profileData.managers.slice(0, 5).map((manager) => (
                                                <div key={manager._id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold">
                                                        {manager.name?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-medium text-gray-900">{manager.name}</p>
                                                        <p className="text-sm text-gray-500">{manager.email}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminSettings;