"use client";
import React, { useState, useEffect, useContext } from "react";
import {
    IndianRupee,
    Calendar,
    AlertCircle,
    CheckCircle,
    ArrowLeft,
    Edit3,
    Trash2,
    Phone,
    DollarSign,
    FileText,
} from "lucide-react";
import { authDataContext } from "@/app/contexts/AuthContext";

const EditPayment = () => {
    const { serverUrl } = useContext(authDataContext);

    const [loanId, setLoanId] = useState("");
    const [paymentId, setPaymentId] = useState("");
    const [loan, setLoan] = useState(null);
    const [payment, setPayment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(null);
    const [error, setError] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const [formData, setFormData] = useState({
        newAmount: "",
        newDate: "",
        reason: "",
    });

    const [calculations, setCalculations] = useState({
        currentBalance: 0,
        newBalance: 0,
        difference: 0,
        percentageChange: 0,
    });

    useEffect(() => {
        const path = window.location.pathname;
        const parts = path.split('/');
        const lId = parts[parts.length - 2];
        const pId = parts[parts.length - 1];
        setLoanId(lId);
        setPaymentId(pId);
    }, []);

    useEffect(() => {
        if (!loanId || !paymentId) return;

        const fetchData = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch(`${serverUrl}/api/loans/${loanId}`, {
                    headers: {
                        Authorization: token ? `Bearer ${token}` : undefined,
                    },
                });

                if (res.ok) {
                    const loanData = await res.json();
                    setLoan(loanData);

                    const foundPayment = loanData.payments?.find(
                        p => p._id === paymentId
                    );

                    if (foundPayment) {
                        setPayment(foundPayment);
                        setFormData({
                            newAmount: foundPayment.amount.toString(),
                            newDate: new Date(foundPayment.date).toISOString().split('T')[0],
                            reason: "",
                        });
                    } else {
                        setError("Payment not found");
                    }
                } else {
                    setError("Failed to fetch loan details");
                }
            } catch (err) {
                setError("Error loading payment details");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [loanId, paymentId]);

    useEffect(() => {
        if (!payment || !loan) return;

        const newAmount = parseFloat(formData.newAmount) || 0;
        const oldAmount = payment.amount;
        const totalDue = loan.amount + (loan.amount * loan.interestRate / 100);
        const totalPaid = loan.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;

        const currentBalance = totalDue - totalPaid;
        const amountDifference = newAmount - oldAmount;
        const newBalance = currentBalance - amountDifference;
        const percentageChange = oldAmount > 0 ? ((amountDifference / oldAmount) * 100) : 0;

        setCalculations({
            currentBalance,
            newBalance,
            difference: amountDifference,
            percentageChange,
        });
    }, [formData.newAmount, payment, loan]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleEdit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!formData.newAmount || parseFloat(formData.newAmount) <= 0) {
            setError("Please enter a valid payment amount");
            return;
        }

        if (!formData.reason.trim()) {
            setError("Please provide a reason for editing");
            return;
        }

        setSubmitting(true);

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(
                `${serverUrl}/api/loans/record-payment/${loanId}/${paymentId}`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: token ? `Bearer ${token}` : undefined,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        newAmount: parseFloat(formData.newAmount),
                        newDate: formData.newDate,
                        reason: formData.reason,
                    }),
                }
            );

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Failed to edit payment");
            }

            setSuccess("Payment updated successfully!");

            setTimeout(() => {
                window.location.href = `/admin/loans/`;
            }, 2000);
        } catch (err) {
            setError(err.message || "Error editing payment");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        setError(null);
        setSuccess(null);

        if (!formData.reason.trim()) {
            setError("Please provide a reason for deletion");
            return;
        }

        setSubmitting(true);

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(
                `${serverUrl}/api/loans/record-payment/${loanId}/${paymentId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: token ? `Bearer ${token}` : undefined,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        reason: formData.reason,
                    }),
                }
            );

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Failed to delete payment");
            }

            setSuccess("Payment deleted successfully!");

            setTimeout(() => {
                window.location.href = `/admin/loans`;
            }, 2000);
        } catch (err) {
            setError(err.message || "Error deleting payment");
        } finally {
            setSubmitting(false);
            setShowDeleteModal(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500" />
            </div>
        );
    }

    if (!loan || !payment) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Not Found</h2>
                    <p className="text-gray-600">The payment you're looking for doesn't exist.</p>
                    <button
                        onClick={() => window.history.back()}
                        className="mt-4 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto mb-6">
                <button
                    onClick={() => window.history.back()}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Back to Loan Details
                </button>
                <h1 className="text-3xl font-bold text-gray-900">Edit Payment</h1>
                <p className="text-gray-600 mt-2">Modify or delete this payment record</p>
            </div>

            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                                    {loan.borrower?.name?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900">{loan.borrower?.name}</p>
                                    <p className="text-sm text-gray-600 flex items-center gap-1">
                                        <Phone className="w-3 h-3" />
                                        {loan.borrower?.phone}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                Current Payment Details
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600">Amount</p>
                                    <p className="text-lg font-bold text-gray-900">
                                        {formatCurrency(payment.amount)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Date</p>
                                    <p className="text-lg font-bold text-gray-900">
                                        {new Date(payment.date).toLocaleDateString('en-IN')}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    New Payment Amount (₹) *
                                </label>
                                <div className="relative">
                                    <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="number"
                                        name="newAmount"
                                        value={formData.newAmount}
                                        onChange={handleInputChange}
                                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Payment Date *
                                </label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="date"
                                        name="newDate"
                                        value={formData.newDate}
                                        onChange={handleInputChange}
                                        max={new Date().toISOString().split('T')[0]}
                                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Reason for Change *
                                </label>
                                <textarea
                                    name="reason"
                                    value={formData.reason}
                                    onChange={handleInputChange}
                                    placeholder="e.g., Correction - wrong amount entered"
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                                    rows="3"
                                    required
                                />
                            </div>

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

                            <div className="flex gap-3">
                                <button
                                    onClick={handleEdit}
                                    disabled={submitting}
                                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg font-semibold"
                                >
                                    {submitting ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                                            Updating...
                                        </>
                                    ) : (
                                        <>
                                            <Edit3 className="w-5 h-5" />
                                            Update Payment
                                        </>
                                    )}
                                </button>

                                <button
                                    onClick={() => setShowDeleteModal(true)}
                                    disabled={submitting}
                                    className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg font-semibold flex items-center gap-2"
                                >
                                    <Trash2 className="w-5 h-5" />
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1">
                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white sticky top-6">
                        <div className="flex items-center gap-2 mb-6">
                            <DollarSign className="w-6 h-6" />
                            <h2 className="text-xl font-bold">Changes Summary</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                                <p className="text-sm opacity-90 mb-1">Original Amount</p>
                                <p className="text-2xl font-bold">{formatCurrency(payment.amount)}</p>
                            </div>

                            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                                <p className="text-sm opacity-90 mb-1">New Amount</p>
                                <p className="text-2xl font-bold">
                                    {formatCurrency(parseFloat(formData.newAmount) || 0)}
                                </p>
                            </div>

                            <div className={`bg-white/20 backdrop-blur-sm rounded-lg p-4 border-2 ${calculations.difference >= 0 ? 'border-green-300' : 'border-red-300'
                                }`}>
                                <p className="text-sm opacity-90 mb-1">Difference</p>
                                <p className="text-3xl font-bold">
                                    {calculations.difference >= 0 ? '+' : ''}
                                    {formatCurrency(calculations.difference)}
                                </p>
                                <p className="text-sm opacity-90 mt-1">
                                    {calculations.percentageChange >= 0 ? '+' : ''}
                                    {calculations.percentageChange.toFixed(1)}%
                                </p>
                            </div>

                            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                                <p className="text-sm opacity-90 mb-1">New Balance After Edit</p>
                                <p className="text-2xl font-bold">
                                    {formatCurrency(Math.max(0, calculations.newBalance))}
                                </p>
                            </div>

                            {calculations.newBalance <= 0 && (
                                <div className="bg-yellow-400/20 backdrop-blur-sm rounded-lg p-4 border-2 border-yellow-300/50">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5" />
                                        <p className="font-semibold">This will close the loan!</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {showDeleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                <Trash2 className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Delete Payment</h3>
                        </div>

                        <p className="text-gray-600 mb-4">
                            Are you sure you want to delete this payment of {formatCurrency(payment.amount)}?
                            This action will recalculate the loan balance.
                        </p>

                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Reason for Deletion *
                            </label>
                            <textarea
                                name="reason"
                                value={formData.reason}
                                onChange={handleInputChange}
                                placeholder="e.g., Duplicate entry"
                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                                rows="2"
                                required
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={submitting || !formData.reason.trim()}
                                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                            >
                                {submitting ? "Deleting..." : "Delete Payment"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EditPayment;