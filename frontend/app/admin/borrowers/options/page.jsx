"use client";
import React, { useState, useEffect, useCallback, useContext } from "react";
import {
    Users,
    Plus,
    Search,
    Edit,
    Trash2,
    Eye,
    Mail,
    Phone,
    MapPin,
    Lock,
    X,
    Save,
    AlertCircle,
    CheckCircle,
    TrendingUp,
    CreditCard,
    DollarSign,
    IndianRupee,
    BarChart3,
    RefreshCw,
} from "lucide-react";
import AdminLeftbar from "@/app/components/dashboard/AdminLeftBar";
import { authDataContext } from "@/app/contexts/AuthContext";

const BorrowersOptions = () => {
    const { serverUrl } = useContext(authDataContext);

    const [borrowers, setBorrowers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    // Modals
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showPortfolioModal, setShowPortfolioModal] = useState(false);
    const [selectedBorrower, setSelectedBorrower] = useState(null);
    const [portfolioData, setPortfolioData] = useState(null);

    // Form data
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        aadharNumber: "",
        panNumber: "",
        chequeNumber: "",
        // email: "",
        photo: "",
        alternatePhone: "",
        guardianName: "",
        guardianPhoto: "",
        relationship: "",
        permanentAddress: "",
        temporaryAddress: "",
    });

    const fetchBorrowers = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${serverUrl}/api/borrowers`, {
                headers: {
                    Authorization: token ? `Bearer ${token}` : undefined,
                    "Content-Type": "application/json",
                },
            });

            if (res.ok) {
                const data = await res.json();
                setBorrowers(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error("Failed to fetch borrowers:", err);
            setError("Failed to load borrowers");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBorrowers();
    }, [fetchBorrowers]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(amount || 0);
    };

    const resetForm = () => {
        setFormData({
            name: "",
            phone: "",
            aadharNumber: "",
            panNumber: "",
            chequeNumber: "",
            // email: "",
            photo: "",
            alternatePhone: "",
            guardianName: "",
            guardianPhoto: "",
            relationship: "",
            permanentAddress: "",
            temporaryAddress: "",
        });
    };

    const convertToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const fileReader = new FileReader();
            fileReader.readAsDataURL(file);
            fileReader.onload = () => resolve(fileReader.result);
            fileReader.onerror = (error) => reject(error);
        });
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const token = localStorage.getItem("token");

            let photoBase64 = "";
            if (formData.photo && typeof formData.photo !== 'string') {
                photoBase64 = await convertToBase64(formData.photo);
            } else {
                photoBase64 = formData.photo;
            }

            let guardianPhotoBase64 = "";
            if (formData.guardianPhoto && typeof formData.guardianPhoto !== 'string') {
                guardianPhotoBase64 = await convertToBase64(formData.guardianPhoto);
            } else {
                guardianPhotoBase64 = formData.guardianPhoto;
            }

            const res = await fetch(`${serverUrl}/api/borrowers`, {
                method: "POST",
                headers: {
                    Authorization: token ? `Bearer ${token}` : undefined,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: formData.name,
                    phone: formData.phone,
                    aadharNumber: formData.aadharNumber,
                    panNumber: formData.panNumber,
                    chequeNumber: formData.chequeNumber,
                    // email: formData.email,
                    photo: photoBase64,
                    alternatePhone: formData.alternatePhone,
                    guardianName: formData.guardianName,
                    guardianPhoto: guardianPhotoBase64,
                    relationship: formData.relationship,
                    permanentAddress: formData.permanentAddress,
                    temporaryAddress: formData.temporaryAddress,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Failed to create borrower");
            }

            setSuccess("Borrower created successfully!");
            resetForm();
            setShowCreateModal(false);
            fetchBorrowers();
        } catch (err) {
            setError(err.message || "Error creating borrower");
        } finally {
            setActionLoading(false);
        }
    };

    const handleEdit = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const token = localStorage.getItem("token");

            let photoBase64 = "";
            if (formData.photo && typeof formData.photo !== 'string') {
                photoBase64 = await convertToBase64(formData.photo);
            } else {
                photoBase64 = formData.photo;
            }

            let guardianPhotoBase64 = "";
            if (formData.guardianPhoto && typeof formData.guardianPhoto !== 'string') {
                guardianPhotoBase64 = await convertToBase64(formData.guardianPhoto);
            } else {
                photoBase64 = formData.guardianPhoto;
            }

            const res = await fetch(`${serverUrl}/api/borrowers/${selectedBorrower._id}`, {
                method: "PUT",
                headers: {
                    Authorization: token ? `Bearer ${token}` : undefined,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: formData.name,
                    phone: formData.phone,
                    aadharNumber: formData.aadharNumber,
                    panNumber: formData.panNumber,
                    chequeNumber: formData.chequeNumber,
                    // email: formData.email,
                    photo: photoBase64,
                    alternatePhone: formData.alternatePhone,
                    guardianName: formData.guardianName,
                    guardianPhoto: guardianPhotoBase64,
                    relationship: formData.relationship,
                    permanentAddress: formData.permanentAddress,
                    temporaryAddress: formData.temporaryAddress,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Failed to update borrower");
            }

            setSuccess("Borrower updated successfully!");
            resetForm();
            setShowEditModal(false);
            setSelectedBorrower(null);
            fetchBorrowers();
        } catch (err) {
            setError(err.message || "Error updating borrower");
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async () => {
        setActionLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${serverUrl}/api/borrowers/${selectedBorrower._id}`, {
                method: "DELETE",
                headers: {
                    Authorization: token ? `Bearer ${token}` : undefined,
                    "Content-Type": "application/json",
                },
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Failed to delete borrower");
            }

            setSuccess("Borrower deleted successfully!");
            setShowDeleteModal(false);
            setSelectedBorrower(null);
            fetchBorrowers();
        } catch (err) {
            setError(err.message || "Error deleting borrower");
        } finally {
            setActionLoading(false);
        }
    };

    const fetchPortfolio = async (borrowerId) => {
        setActionLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${serverUrl}/api/borrowers/${borrowerId}/portfolio`, {
                headers: {
                    Authorization: token ? `Bearer ${token}` : undefined,
                    "Content-Type": "application/json",
                },
            });

            if (res.ok) {
                const data = await res.json();
                setPortfolioData(data);
            }
        } catch (err) {
            console.error("Failed to fetch portfolio:", err);
        } finally {
            setActionLoading(false);
        }
    };

    const openEditModal = (borrower) => {
        setSelectedBorrower(borrower);
        setFormData({
            name: borrower.name || "",
            phone: borrower.phone || "",
            aadharNumber: borrower.aadharNumber || "",
            panNumber: borrower.panNumber || "",
            chequeNumber: borrower.chequeNumber || "",
            // email: borrower.email || "",
            photo: borrower.photo || "",
            alternatePhone: borrower.alternatePhone || "",
            guardianName: borrower.guardianName || "",
            guardianPhoto: borrower.guardianPhoto || "",
            relationship: borrower.relationship || "",
            permanentAddress: borrower.permanentAddress || "",
            temporaryAddress: borrower.temporaryAddress || "",
        });
        setShowEditModal(true);
        setError(null);
        setSuccess(null);
    };

    const openDeleteModal = (borrower) => {
        setSelectedBorrower(borrower);
        setShowDeleteModal(true);
        setError(null);
        setSuccess(null);
    };

    const openPortfolioModal = (borrower) => {
        setSelectedBorrower(borrower);
        fetchPortfolio(borrower._id);
        setShowPortfolioModal(true);
    };

    const filteredBorrowers = borrowers.filter((b) =>
        b.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-600 mx-auto" />
                    <p className="mt-4 text-gray-600">Loading borrowers...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <AdminLeftbar />

            <div className="flex-1 p-6">
                {/* Header */}
                <div className="mb-8 flex flex-col md:flex-row items-start justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Borrower Management</h1>
                        <p className="text-gray-600 mt-2">
                            Create, edit, and manage borrowers
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            resetForm();
                            setShowCreateModal(true);
                            setError(null);
                            setSuccess(null);
                        }}
                        className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors shadow-lg font-semibold"
                    >
                        <Plus className="w-5 h-5" />
                        Create Borrower
                    </button>
                </div>

                {/* Success/Error Messages */}
                {error && (
                    <div className="mb-6 flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span>{error}</span>
                        <button onClick={() => setError(null)} className="ml-auto">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                )}

                {success && (
                    <div className="mb-6 flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                        <CheckCircle className="w-5 h-5 flex-shrink-0" />
                        <span>{success}</span>
                        <button onClick={() => setSuccess(null)} className="ml-auto">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                )}

                {/* Search */}
                <div className="bg-white rounded-xl shadow p-6 mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search borrowers by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Borrowers Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredBorrowers.map((borrower) => (
                        <div
                            key={borrower._id}
                            className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow border-t-4 border-orange-500"
                        >
                            <div className="p-6">
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <img src={borrower.photo ? borrower.photo : "https://static.vecteezy.com/system/resources/thumbnails/009/292/244/small/default-avatar-icon-of-social-media-user-vector.jpg"} alt="borrower" className="w-14 h-14 rounded-full object-cover" />

                                        <div>
                                            <h3 className="font-semibold text-gray-900 text-lg">{borrower.name}</h3>
                                            <p className="text-sm text-gray-500">{borrower.email}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="space-y-2 mb-4">
                                    {borrower.phone && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Phone className="w-4 h-4" />
                                            <span>{borrower.phone}</span>
                                        </div>
                                    )}
                                    {borrower.address && (
                                        <div className="flex items-start gap-2 text-sm text-gray-600">
                                            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                            <span className="line-clamp-2">{borrower.address}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                                        <p className="text-sm text-gray-600">Total Loans</p>
                                        <p className="text-xl font-bold text-blue-600">
                                            {borrower.loans?.length || 0}
                                        </p>
                                    </div>
                                    <div className="bg-green-50 rounded-lg p-3 text-center">
                                        <p className="text-sm text-gray-600">Active</p>
                                        <p className="text-xl font-bold text-green-600">
                                            {borrower.loans?.filter(l => l.status === "active").length || 0}
                                        </p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="grid grid-cols-2 gap-2">
                                    {/* <button
                                        onClick={() => openPortfolioModal(borrower)}
                                        className="flex items-center justify-center gap-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                                    >
                                        <Eye className="w-4 h-4" />
                                        View
                                    </button> */}
                                    <button
                                        onClick={() => openEditModal(borrower)}
                                        className="flex items-center justify-center gap-1 px-3 py-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors text-sm font-medium"
                                    >
                                        <Edit className="w-4 h-4" />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => openDeleteModal(borrower)}
                                        className="flex items-center justify-center gap-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredBorrowers.length === 0 && (
                    <div className="text-center py-12">
                        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No borrowers found</p>
                    </div>
                )}

                {/* Create Borrower Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
                                <h2 className="text-2xl font-bold text-gray-900">Create New Borrower</h2>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleCreate} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        placeholder="Enter borrower name"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Phone Number *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        placeholder="Enter phone number"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Aadhar Number *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.aadharNumber}
                                        onChange={(e) => setFormData({ ...formData, aadharNumber: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        placeholder="Enter Aadhar number"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Pan Number
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.panNumber}
                                        onChange={(e) => setFormData({ ...formData, panNumber: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        placeholder="Enter Aadhar number"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Cheque Number
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.chequeNumber}
                                        onChange={(e) => setFormData({ ...formData, chequeNumber: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        placeholder="Enter cheque number"
                                    />
                                </div>

                                {/* <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        placeholder="borrower@mybenaka.com"
                                        required
                                    />
                                </div> */}

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Photo
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setFormData({ ...formData, photo: e.target.files[0] })}
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Alternate Phone Number
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.alternatePhone}
                                        onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        placeholder="Enter alternate phone number"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Guardian Name
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.guardianName}
                                        onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        placeholder="Enter guardian name of the borrower"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Guardian Photo
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setFormData({ ...formData, guardianPhoto: e.target.files[0] })}
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Guardian's Relationship
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.relationship}
                                        onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        placeholder="Enter relationship of guardian to the borrower"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Permanent Address
                                    </label>
                                    <textarea
                                        value={formData.permanentAddress}
                                        onChange={(e) => setFormData({ ...formData, permanentAddress: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        placeholder="Enter permanent address"
                                        rows="3"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Temporary Address
                                    </label>
                                    <textarea
                                        value={formData.temporaryAddress}
                                        onChange={(e) => setFormData({ ...formData, temporaryAddress: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        placeholder="Enter temporary address"
                                        rows="3"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
                                >
                                    {actionLoading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-5 h-5" />
                                            Create Borrower
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Edit Borrower Modal */}
                {showEditModal && selectedBorrower && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
                                <h2 className="text-2xl font-bold text-gray-900">Edit Borrower</h2>
                                <button
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setSelectedBorrower(null);
                                    }}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleEdit} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        placeholder="Enter borrower name"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Phone Number *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        placeholder="Enter phone number"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Aadhar Number *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.aadharNumber}
                                        onChange={(e) => setFormData({ ...formData, aadharNumber: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        placeholder="Enter Aadhar number"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        PAN Number
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.panNumber}
                                        onChange={(e) => setFormData({ ...formData, panNumber: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        placeholder="Enter PAN number"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Cheque Number
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.chequeNumber}
                                        onChange={(e) => setFormData({ ...formData, chequeNumber: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        placeholder="Enter cheque number"
                                    />
                                </div>

                                {/* <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        placeholder="borrower@mybenaka.com"
                                        required
                                    />
                                </div> */}

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Photo
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setFormData({ ...formData, photo: e.target.files[0] })}
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Alternate Phone Number
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.alternatePhone}
                                        onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        placeholder="Enter alternate phone number"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Guardian Name
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.guardianName}
                                        onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        placeholder="Enter guardian name of the borrower"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Guardian's Photo 
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setFormData({ ...formData, guardianPhoto: e.target.files[0] })}
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Guardian's Relationship
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.relationship}
                                        onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        placeholder="Enter relationship of guardian to the borrower"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Permanent Address
                                    </label>
                                    <textarea
                                        value={formData.permanentAddress}
                                        onChange={(e) => setFormData({ ...formData, permanentAddress: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        placeholder="Enter permanent address"
                                        rows="3"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Temporary Address
                                    </label>
                                    <textarea
                                        value={formData.temporaryAddress}
                                        onChange={(e) => setFormData({ ...formData, temporaryAddress: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        placeholder="Enter temporary address"
                                        rows="3"
                                    />
                                </div>


                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
                                >
                                    {actionLoading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                                            Updating...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-5 h-5" />
                                            Update Borrower
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {showDeleteModal && selectedBorrower && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                            <div className="p-6">
                                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mx-auto mb-4">
                                    <AlertCircle className="w-8 h-8 text-red-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
                                    Delete Borrower?
                                </h2>
                                <p className="text-gray-600 text-center mb-6">
                                    Are you sure you want to delete <strong>{selectedBorrower.name}</strong>?
                                    This action cannot be undone.
                                </p>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            setShowDeleteModal(false);
                                            setSelectedBorrower(null);
                                        }}
                                        className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        disabled={actionLoading}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
                                    >
                                        {actionLoading ? (
                                            <>
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                                                Deleting...
                                            </>
                                        ) : (
                                            <>
                                                <Trash2 className="w-5 h-5" />
                                                Delete
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Portfolio Modal */}
                {showPortfolioModal && selectedBorrower && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {selectedBorrower.name}'s Portfolio
                                </h2>
                                <button
                                    onClick={() => {
                                        setShowPortfolioModal(false);
                                        setSelectedBorrower(null);
                                        setPortfolioData(null);
                                    }}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="p-6">
                                {actionLoading ? (
                                    <div className="text-center py-12">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto" />
                                        <p className="mt-4 text-gray-600">Loading portfolio...</p>
                                    </div>
                                ) : portfolioData ? (
                                    <>
                                        {/* Stats Grid */}
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                                            <div className="bg-blue-50 rounded-lg p-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <CreditCard className="w-5 h-5 text-blue-600" />
                                                    <span className="text-sm text-gray-600">Total Loans</span>
                                                </div>
                                                <p className="text-2xl font-bold text-blue-600">
                                                    {portfolioData.totalLoans}
                                                </p>
                                            </div>

                                            <div className="bg-green-50 rounded-lg p-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <TrendingUp className="w-5 h-5 text-green-600" />
                                                    <span className="text-sm text-gray-600">Active</span>
                                                </div>
                                                <p className="text-2xl font-bold text-green-600">
                                                    {portfolioData.activeLoans}
                                                </p>
                                            </div>

                                            <div className="bg-red-50 rounded-lg p-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <AlertCircle className="w-5 h-5 text-red-600" />
                                                    <span className="text-sm text-gray-600">Overdue</span>
                                                </div>
                                                <p className="text-2xl font-bold text-red-600">
                                                    {portfolioData.overdueLoans}
                                                </p>
                                            </div>

                                            <div className="bg-purple-50 rounded-lg p-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <IndianRupee className="w-5 h-5 text-purple-600" />
                                                    <span className="text-sm text-gray-600">Total Loaned</span>
                                                </div>
                                                <p className="text-lg font-bold text-purple-600">
                                                    {formatCurrency(portfolioData.totalLoaned)}
                                                </p>
                                            </div>

                                            <div className="bg-orange-50 rounded-lg p-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <DollarSign className="w-5 h-5 text-orange-600" />
                                                    <span className="text-sm text-gray-600">Repaid</span>
                                                </div>
                                                <p className="text-lg font-bold text-orange-600">
                                                    {formatCurrency(portfolioData.totalRepaid)}
                                                </p>
                                            </div>

                                            <div className="bg-gray-50 rounded-lg p-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <BarChart3 className="w-5 h-5 text-gray-600" />
                                                    <span className="text-sm text-gray-600">Outstanding</span>
                                                </div>
                                                <p className="text-lg font-bold text-gray-600">
                                                    {formatCurrency(portfolioData.outstanding)}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Loans List */}
                                        {portfolioData.loans && portfolioData.loans.length > 0 ? (
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                                    Loan Details ({portfolioData.loans.length})
                                                </h3>
                                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                                    {portfolioData.loans.map((loan) => (
                                                        <div
                                                            key={loan._id}
                                                            className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                                                        >
                                                            <div className="flex items-start justify-between mb-2">
                                                                <div>
                                                                    <p className="font-semibold text-gray-900">
                                                                        {loan.borrower?.name || "Unknown Borrower"}
                                                                    </p>
                                                                    <p className="text-sm text-gray-500">
                                                                        {loan.borrower?.phone}
                                                                    </p>
                                                                </div>
                                                                <span
                                                                    className={`px-3 py-1 rounded-full text-xs font-medium ${loan.status === "active"
                                                                        ? "bg-green-100 text-green-700"
                                                                        : loan.status === "closed"
                                                                            ? "bg-gray-100 text-gray-700"
                                                                            : "bg-red-100 text-red-700"
                                                                        }`}
                                                                >
                                                                    {loan.status}
                                                                </span>
                                                            </div>
                                                            <div className="grid grid-cols-3 gap-3 text-sm">
                                                                <div>
                                                                    <p className="text-gray-600">Amount</p>
                                                                    <p className="font-semibold text-gray-900">
                                                                        {formatCurrency(loan.amount)}
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-gray-600">Paid</p>
                                                                    <p className="font-semibold text-green-600">
                                                                        {formatCurrency(loan.amountPaid)}
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-gray-600">Outstanding</p>
                                                                    <p className="font-semibold text-red-600">
                                                                        {formatCurrency(loan.outstanding)}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 text-gray-500">
                                                No loans issued yet
                                            </div>
                                        )}
                                    </>
                                ) : null}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BorrowersOptions;