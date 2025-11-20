"use client";
import React, { useState, useEffect, useCallback, useContext } from "react";
import {
  CreditCard,
  Search,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Calendar,
  User,
  Phone,
  Eye,
  RefreshCw,
  IndianRupee,
  Clock,
  Percent,
  FileText,
  XCircle,
  Activity,
  BarChart3,
  Edit3,
  AlertCircle,
  DollarSignIcon,
  ShieldAlert,
  Gift
} from "lucide-react";
import Link from "next/link";
import { authDataContext } from "@/app/contexts/AuthContext";
import ManagerLeftbar from "@/app/components/dashboard/ManagerLeftBar";

const ManagerLoans = () => {
  const { serverUrl } = useContext(authDataContext);

  const [loansData, setLoansData] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterIssuer, setFilterIssuer] = useState("all");
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [showLateFeeModal, setShowLateFeeModal] = useState(false);
  const [lateFeeType, setLateFeeType] = useState(""); // 'missed' or 'overdue'
  const [selectedLoanForFee, setSelectedLoanForFee] = useState(null);
  const [feeReason, setFeeReason] = useState("");
  const [processingFee, setProcessingFee] = useState(false);

  const fetchLoansData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${serverUrl}/api/loans`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        let msg = `Failed to fetch loans data: ${res.status} ${res.statusText}`;
        try {
          const json = await res.json();
          if (json?.message) msg = json.message;
        } catch (e) { }
        throw new Error(msg);
      }

      const data = await res.json();
      console.log("Loans data:", data);
      setLoansData(data.loans || []);
      setTotalCount(data.count || 0);
      setLoading(false);
    } catch (err) {
      console.error("Loans fetch error:", err);
      setError(err.message || "Unknown error");
      setLoading(false);
    }
  }, [serverUrl]);

  useEffect(() => {
    fetchLoansData();
  }, [fetchLoansData]);

  const formatCurrency = (amount) => {
    const safe = Number(amount || 0);
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(safe);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-700 border-green-200";
      case "closed":
        return "bg-gray-100 text-gray-700 border-gray-200";
      case "overdue":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-blue-100 text-blue-700 border-blue-200";
    }
  };

  const handleApplyLateFee = async () => {
    if (!selectedLoanForFee) return;

    // Validation
    if (!lateFeeAmount || lateFeeAmount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    if (!feeReason || feeReason.trim() === "") {
      alert("Please provide a reason for the late fee");
      return;
    }

    setProcessingFee(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${serverUrl}/api/loans/${selectedLoanForFee._id}/late-fee`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: parseFloat(lateFeeAmount),
            reason: feeReason.trim()
          }),
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to apply late fee");
      }

      const data = await res.json();
      alert(data.message || "Late fee applied successfully");

      // Refresh loans data
      await fetchLoansData();

      // Close modal and reset
      setShowLateFeeModal(false);
      setSelectedLoanForFee(null);
      setLateFeeAmount("");
      setFeeReason("");
    } catch (err) {
      alert(err.message);
    } finally {
      setProcessingFee(false);
    }
  };

  // Add this state at the top with your other states
  const [lateFeeAmount, setLateFeeAmount] = useState("");

  const handleWaiveLateFee = async (loanId, lateFeeId) => {
    const reason = prompt("Enter reason for waiving this late fee:");
    if (!reason) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${serverUrl}/api/loans/${loanId}/late-fee/${lateFeeId}/waive`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reason }),
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to waive late fee");
      }

      const data = await res.json();
      alert(data.message || "Late fee waived successfully");

      // Refresh loans data
      await fetchLoansData();
    } catch (err) {
      alert(err.message);
    }
  };

  const openLateFeeModal = (loan) => {
    setSelectedLoanForFee(loan);
    setShowLateFeeModal(true);
  };

  const getOverallStats = () => {
    const totalLoanAmount = loansData.reduce((sum, loan) => sum + (loan.amount || 0), 0);
    const totalPaid = loansData.reduce((sum, loan) => sum + (loan.amountPaid || 0), 0);
    const totalOutstanding = loansData.reduce((sum, loan) => sum + (loan.outstanding || 0), 0);
    const totalInterest = loansData.reduce((sum, loan) => sum + (loan.interestAmount || 0), 0);
    const totalLateFees = loansData.reduce((sum, loan) => sum + (loan.totalLateFees || 0), 0);

    const activeLoans = loansData.filter(l => l.status === "active").length;
    const closedLoans = loansData.filter(l => l.status === "closed").length;
    const overdueLoans = loansData.filter(l => l.status === "overdue").length;

    const avgLoanSize = loansData.length > 0 ? totalLoanAmount / loansData.length : 0;
    const collectionRate = totalLoanAmount > 0 ? (totalPaid / totalLoanAmount) * 100 : 0;

    return {
      totalLoans: loansData.length,
      totalLoanAmount,
      totalPaid,
      totalOutstanding,
      totalInterest,
      totalLateFees,
      activeLoans,
      closedLoans,
      overdueLoans,
      avgLoanSize,
      collectionRate,
    };
  };

  const filteredLoans = loansData.filter((loan) => {
    const matchesSearch =
      loan.borrower?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.borrower?.phone?.includes(searchTerm) ||
      loan.id?.includes(searchTerm) ||
      loan.amount?.toString().includes(searchTerm);

    const matchesStatus = filterStatus === "all" || loan.status === filterStatus;
    const matchesIssuer = filterIssuer === "all" || loan.issuedByRole === filterIssuer;

    return matchesSearch && matchesStatus && matchesIssuer;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading loans data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center max-w-lg">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-xl text-gray-900 mb-2">Failed to load loans</p>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchLoansData}
            className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const stats = getOverallStats();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <ManagerLeftbar />

      <div className="flex-1 p-6">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Loans Management</h1>
            <p className="text-gray-600 mt-2">
              Track and manage all loan accounts across the system
            </p>
          </div>
          <button
            onClick={fetchLoansData}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-700">Active Loans</h3>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-green-600">{stats.activeLoans}</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
              <div
                className="bg-green-500 h-2 rounded-full"
                style={{ width: `${(stats.activeLoans / stats.totalLoans) * 100}%` }}
              />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-700">Closed Loans</h3>
              <XCircle className="w-5 h-5 text-gray-600" />
            </div>
            <p className="text-3xl font-bold text-gray-600">{stats.closedLoans}</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
              <div
                className="bg-gray-500 h-2 rounded-full"
                style={{ width: `${(stats.closedLoans / stats.totalLoans) * 100}%` }}
              />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-700">Overdue Loans</h3>
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-3xl font-bold text-red-600">{stats.overdueLoans}</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
              <div
                className="bg-red-500 h-2 rounded-full"
                style={{ width: `${(stats.overdueLoans / stats.totalLoans) * 100}%` }}
              />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-700">Total Late Fees</h3>
              <ShieldAlert className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-3xl font-bold text-orange-600">
              {formatCurrency(stats.totalLateFees)}
            </p>
            <p className="text-xs text-gray-500 mt-2">Unpaid penalties</p>
          </div>
        </div>

        {/* Issue a new loan link cum button */}
        <div className="flex w-full justify-center mb-6">
          <Link href="/manager/loans/issueloan">
            <button className="bg-gradient-to-r from-orange-400 to-orange-500 hover:transform hover:scale-105 text-white font-semibold py-2 px-6 rounded-lg cursor-pointer transition duration-300 ease-in-out">
              Issue a new loan
            </button>
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by borrower, phone, or loan ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
              <option value="overdue">Overdue</option>
            </select>

            <select
              value={filterIssuer}
              onChange={(e) => setFilterIssuer(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="all">All Issuers</option>
              <option value="Admin">Admin</option>
              <option value="Manager">Manager</option>
            </select>
          </div>
        </div>

        {/* Loans List */}
        <div className="bg-white rounded-xl shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Loan Accounts</h2>
            <p className="text-sm text-gray-500 mt-1">
              Showing {filteredLoans.length} of {stats.totalLoans} loans
            </p>
          </div>

          {filteredLoans.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No loans found matching your criteria</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredLoans.map((loan) => (
                <div
                  key={loan._id}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Main Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <img
                          src={
                            loan.borrower.photo
                              ? loan.borrower.photo
                              : "https://static.vecteezy.com/system/resources/thumbnails/009/292/244/small/default-avatar-icon-of-social-media-user-vector.jpg"
                          }
                          alt="borrower"
                          className="w-14 h-14 rounded-full object-cover"
                        />

                        <div className="flex gap-5 flex-1">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-gray-900">
                                {loan.borrower?.name || "Unknown Borrower"}
                              </h3>
                              <span
                                className={`px-2 py-1 text-xs rounded-full font-medium border ${getStatusColor(
                                  loan.status
                                )}`}
                              >
                                {loan.status}
                              </span>
                              <span
                                className={`px-2 py-1 text-xs rounded-full font-medium ${loan.issuedByRole === "Admin"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-purple-100 text-purple-700"
                                  }`}
                              >
                                {loan.issuedByRole}
                              </span>
                              {loan.totalLateFees > 0 && (
                                <span className="px-2 py-1 text-xs rounded-full font-medium bg-orange-100 text-orange-700 border border-orange-200">
                                  Late Fees: {formatCurrency(loan.totalLateFees)}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {loan.borrower?.phone}
                              </span>
                              <span className="flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                ID: {loan.id?.slice(-8)}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Link href={`/manager/loans/record-payment/${loan._id}`}>
                              <button className="bg-gradient-to-br from-orange-400 to-orange-600 text-white font-semibold px-4 py-2 rounded-full hover:transform hover:scale-105 transition cursor-pointer">
                                Record Payment
                              </button>
                            </Link>
                            {(loan.status === "active" || loan.status === "overdue") && (
                              <div className="relative group">
                                <button
                                  onClick={() => openLateFeeModal(loan)}
                                  className="bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-full transition">
                                  Apply Late Fee
                                </button>
                                {/* <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 hidden group-hover:block z-10">
                                  <button
                                    onClick={() => openLateFeeModal(loan, "missed")}
                                    className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
                                  >
                                    ₹500 - Missed Payment
                                  </button>
                                  <button
                                    onClick={() => openLateFeeModal(loan, "overdue")}
                                    className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm border-t"
                                  >
                                    15% - Overdue Penalty
                                  </button>
                                </div> */}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Financial Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                        <div className="bg-indigo-50 p-3 rounded-lg border-2 border-indigo-200">
                          <p className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                            Total Amount
                          </p>
                          <p className="text-lg font-bold text-indigo-600">
                            {formatCurrency(loan.totalDue)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            With all charges
                          </p>
                        </div>

                        <div className="bg-blue-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1">Principal</p>
                          <p className="text-lg font-bold text-blue-600">
                            {formatCurrency(loan.amount)}
                          </p>
                        </div>

                        <div className="bg-green-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1">Paid</p>
                          <p className="text-lg font-bold text-green-600">
                            {formatCurrency(loan.amountPaid)}
                          </p>
                        </div>

                        <div className="bg-red-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1">Outstanding</p>
                          <p className="text-lg font-bold text-red-600">
                            {formatCurrency(loan.outstanding)}
                          </p>
                        </div>

                        <div className="bg-purple-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1">Interest</p>
                          <p className="text-sm font-bold text-purple-600">
                            {loan.interestRate}% = {formatCurrency(loan.interestAmount)}
                          </p>
                        </div>

                        <div className="bg-orange-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1">Late Fees</p>
                          <p className="text-lg font-bold text-orange-600">
                            {formatCurrency(loan.totalLateFees || 0)}
                          </p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-4">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Payment Progress</span>
                          <span className="font-semibold">
                            {((loan.amountPaid / loan.totalDue) * 100 || 0).toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all"
                            style={{
                              width: `${Math.min((loan.amountPaid / loan.totalDue) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* View Button */}
                    <button
                      onClick={() => setSelectedLoan(selectedLoan?._id === loan._id ? null : loan)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Eye className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>

                  {/* Expanded Details */}
                  {selectedLoan?._id === loan._id && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Loan Details */}
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">Loan Details</h4>
                          <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Start Date:</span>
                              <span className="font-medium">{formatDate(loan.startDate)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Due Date:</span>
                              <span className="font-medium">{formatDate(loan.dueDate)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Total Due:</span>
                              <span className="font-medium">{formatCurrency(loan.totalDue)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Interest Amount:</span>
                              <span className="font-medium">
                                {formatCurrency(loan.interestAmount)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Late Fees:</span>
                              <span className="font-medium text-orange-600">
                                {formatCurrency(loan.totalLateFees)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Waivers:</span>
                              <span className="font-medium text-green-600">
                                {formatCurrency(loan.totalWaivers || 0)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Disbursed:</span>
                              <span
                                className={`font-medium ${loan.disbursement?.isDisbursed
                                  ? "text-green-600"
                                  : "text-gray-600"
                                  }`}
                              >
                                {loan.disbursement?.isDisbursed ? "Yes" : "No"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Payment History */}
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">
                            Payment History ({loan.payments?.length || 0})
                          </h4>
                          {loan.payments && loan.payments.length > 0 ? (
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                              {loan.payments.map((payment) => (
                                <div
                                  key={payment._id}
                                  className="bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                  <div className="flex justify-between items-start mb-1">
                                    <span className="font-semibold text-green-600">
                                      {formatCurrency(payment.amount)}
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-gray-500">
                                        {formatDate(payment.date)}
                                      </span>
                                      <Link
                                        href={`/manager/loans/record-payment/${loan._id}/${payment._id}`}
                                      >
                                        <button
                                          className="p-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
                                          title="Edit payment"
                                        >
                                          <Edit3 className="w-3.5 h-3.5" />
                                        </button>
                                      </Link>
                                    </div>
                                  </div>
                                  <div className="text-xs text-gray-600">
                                    <div>Balance: {formatCurrency(payment.currentBalance)}</div>
                                    <div>By: {payment.receivedByRole}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 italic">
                              No payments recorded yet
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Late Fees Section */}
                      {loan.lateFees && loan.lateFees.length > 0 && (
                        <div className="mt-6 pt-4 border-t border-gray-100">
                          <h4 className="font-semibold text-gray-900 mb-3">
                            Late Fees ({loan.lateFees.length})
                          </h4>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {loan.lateFees.map((fee) => (
                              <div
                                key={fee._id}
                                className={`p-3 rounded-lg border ${fee.isPaid
                                  ? "bg-gray-50 border-gray-200"
                                  : "bg-orange-50 border-orange-200"
                                  }`}
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span
                                        className={`font-semibold ${fee.isPaid ? "text-gray-600" : "text-orange-600"
                                          }`}
                                      >
                                        {formatCurrency(fee.amount)}
                                      </span>
                                      {fee.isPaid && (
                                        <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded">
                                          Paid/Waived
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-600 mb-1">{fee.reason}</p>
                                    <div className="flex items-center gap-3 text-xs text-gray-500">
                                      <span>
                                        Applied: {formatDate(fee.appliedDate)}
                                      </span>
                                      {fee.daysOverdue && (
                                        <span className="text-red-600">
                                          {fee.daysOverdue} days overdue
                                        </span>
                                      )}
                                      <span>By: {fee.appliedByRole || "System"}</span>
                                    </div>
                                  </div>
                                  {!fee.isPaid && (
                                    <button
                                      onClick={() => handleWaiveLateFee(loan._id, fee._id)}
                                      className="ml-2 p-1.5 bg-green-500 hover:bg-green-600 text-white rounded transition-colors"
                                      title="Waive this late fee"
                                    >
                                      <Gift className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Waivers Section */}
                      {loan.waivers && loan.waivers.length > 0 && (
                        <div className="mt-6 pt-4 border-t border-gray-100">
                          <h4 className="font-semibold text-gray-900 mb-3">
                            Waivers ({loan.waivers.length})
                          </h4>
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {loan.waivers.map((waiver) => (
                              <div
                                key={waiver._id}
                                className="bg-green-50 p-3 rounded-lg border border-green-200"
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-semibold text-green-600">
                                        {formatCurrency(waiver.amount)}
                                      </span>
                                      <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded">
                                        {waiver.type.replace(/_/g, " ")}
                                      </span>
                                    </div>
                                    <p className="text-xs text-gray-600 mb-1">
                                      {waiver.reason}
                                    </p>
                                    <div className="flex items-center gap-3 text-xs text-gray-500">
                                      <span>
                                        Granted: {formatDate(waiver.grantedDate)}
                                      </span>
                                      <span>By: {waiver.grantedByRole}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Meta Info */}
                      <div className="mt-6 pt-4 border-t border-gray-100 text-xs text-gray-500">
                        <div className="flex justify-between">
                          <span>Created: {formatDate(loan.createdAt)}</span>
                          <span>Updated: {formatDate(loan.updatedAt)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Late Fee Modal */}
      {/* {showLateFeeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                Apply Late Fee
              </h3>
              <button
                onClick={() => {
                  setShowLateFeeModal(false);
                  setSelectedLoanForFee(null);
                  setLateFeeType("");
                  setFeeReason("");
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-4">
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-gray-600 mb-1">Borrower</p>
                <p className="font-semibold text-gray-900">
                  {selectedLoanForFee?.borrower?.name}
                </p>
                <p className="text-sm text-gray-600 mt-2">Outstanding</p>
                <p className="font-semibold text-red-600">
                  {formatCurrency(selectedLoanForFee?.outstanding)}
                </p>
              </div>

              <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg mb-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-orange-900 mb-1">
                      {lateFeeType === "missed"
                        ? "₹500 Missed Payment Fee"
                        : "15% Overdue Penalty"}
                    </p>
                    <p className="text-sm text-orange-700">
                      {lateFeeType === "missed"
                        ? "Applied when borrower misses a scheduled repayment"
                        : `15% of outstanding amount: ${formatCurrency(
                          (selectedLoanForFee?.outstanding || 0) * 0.15
                        )}`}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason (Optional)
                </label>
                <textarea
                  value={feeReason}
                  onChange={(e) => setFeeReason(e.target.value)}
                  placeholder="Enter reason for applying this late fee..."
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  rows="3"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowLateFeeModal(false);
                  setSelectedLoanForFee(null);
                  setLateFeeType("");
                  setFeeReason("");
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={processingFee}
              >
                Cancel
              </button>
              <button
                onClick={handleApplyLateFee}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={processingFee}
              >
                {processingFee ? "Applying..." : "Apply Late Fee"}
              </button>
            </div>
          </div>
        </div>
      )} */}

      {showLateFeeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                Apply Late Fee
              </h3>
              <button
                onClick={() => {
                  setShowLateFeeModal(false);
                  setSelectedLoanForFee(null);
                  setLateFeeAmount("");
                  setFeeReason("");
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-4">
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-gray-600 mb-1">Borrower</p>
                <p className="font-semibold text-gray-900">
                  {selectedLoanForFee?.borrower?.name}
                </p>
                <p className="text-sm text-gray-600 mt-2">Phone</p>
                <p className="font-semibold text-gray-700">
                  {selectedLoanForFee?.borrower?.phone}
                </p>
                <p className="text-sm text-gray-600 mt-2">Outstanding Amount</p>
                <p className="font-semibold text-red-600">
                  {formatCurrency(selectedLoanForFee?.outstanding)}
                </p>
              </div>

              <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg mb-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-orange-700">
                    <p className="font-medium mb-1">Common Late Fee Amounts:</p>
                    <p>• ₹500 for missed payment</p>
                    <p>• 15% of outstanding for overdue penalty</p>
                    <p>• Or enter any custom amount below</p>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Late Fee Amount <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={lateFeeAmount}
                    onChange={(e) => setLateFeeAmount(e.target.value)}
                    placeholder="Enter amount"
                    min="0"
                    step="0.01"
                    className="w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  />
                </div>
                {/* Quick amount buttons */}
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setLateFeeAmount("500")}
                    className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    ₹500
                  </button>
                  <button
                    type="button"
                    onClick={() => setLateFeeAmount(
                      String(Math.round((selectedLoanForFee?.outstanding || 0) * 0.15))
                    )}
                    className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    15% (₹{Math.round((selectedLoanForFee?.outstanding || 0) * 0.15)})
                  </button>
                  <button
                    type="button"
                    onClick={() => setLateFeeAmount("1000")}
                    className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    ₹1,000
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={feeReason}
                  onChange={(e) => setFeeReason(e.target.value)}
                  placeholder="Enter reason for applying this late fee..."
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  rows="3"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowLateFeeModal(false);
                  setSelectedLoanForFee(null);
                  setLateFeeAmount("");
                  setFeeReason("");
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={processingFee}
              >
                Cancel
              </button>
              <button
                onClick={handleApplyLateFee}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={processingFee}
              >
                {processingFee ? "Applying..." : "Apply Late Fee"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerLoans;