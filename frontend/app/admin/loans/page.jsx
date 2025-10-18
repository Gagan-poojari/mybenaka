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
} from "lucide-react";
import AdminLeftbar from "@/app/components/dashboard/AdminLeftBar";
import Link from "next/link";
import { authDataContext } from "@/app/contexts/AuthContext";

const AdminLoans = () => {
  const { serverUrl } = useContext(authDataContext)
  
  const [loansData, setLoansData] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterIssuer, setFilterIssuer] = useState("all");
  const [selectedLoan, setSelectedLoan] = useState(null);

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
        } catch (e) {}
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
  }, []);

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

  const getOverallStats = () => {
    const totalLoanAmount = loansData.reduce((sum, loan) => sum + (loan.amount || 0), 0);
    const totalPaid = loansData.reduce((sum, loan) => sum + (loan.amountPaid || 0), 0);
    const totalOutstanding = loansData.reduce((sum, loan) => sum + (loan.outstanding || 0), 0);
    const totalInterest = loansData.reduce((sum, loan) => sum + (loan.interestAmount || 0), 0);
    
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
      <AdminLeftbar />

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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
                <CreditCard className="w-6 h-6" />
              </div>
              <BarChart3 className="w-6 h-6 opacity-70" />
            </div>
            <p className="text-sm opacity-90 mb-1">Total Loans</p>
            <p className="text-3xl font-bold">{stats.totalLoans}</p>
            <p className="text-xs opacity-75 mt-2">
              Avg: {formatCurrency(stats.avgLoanSize)}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Disbursed</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(stats.totalLoanAmount)}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <IndianRupee className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Interest: {formatCurrency(stats.totalInterest)}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Collected</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {formatCurrency(stats.totalPaid)}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {stats.collectionRate.toFixed(1)}% collection rate
            </p>
          </div>

          <div className="bg-white rounded-xl shadow p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Outstanding</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {formatCurrency(stats.totalOutstanding)}
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Pending collection</p>
          </div>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
        </div>

        {/* Issue a new loan link cum button */}

        <div className="flex w-full justify-center mb-6">
          <Link href="/admin/loans/issueloan">
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
                  className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedLoan(selectedLoan?._id === loan._id ? null : loan)}
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Main Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold">
                          <CreditCard className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">
                              {loan.borrower?.name || "Unknown Borrower"}
                            </h3>
                            <span className={`px-2 py-1 text-xs rounded-full font-medium border ${getStatusColor(loan.status)}`}>
                              {loan.status}
                            </span>
                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                              loan.issuedByRole === 'Admin' 
                                ? 'bg-blue-100 text-blue-700' 
                                : 'bg-purple-100 text-purple-700'
                            }`}>
                              {loan.issuedByRole}
                            </span>
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
                      </div>

                      {/* Financial Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1">Loan Amount</p>
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
                          <p className="text-lg font-bold text-purple-600">
                            {loan.interestRate}%
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
                            style={{ width: `${Math.min((loan.amountPaid / loan.totalDue) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* View Button */}
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
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
                              <span className="font-medium">{formatCurrency(loan.interestAmount)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Late Fees:</span>
                              <span className="font-medium">{formatCurrency(loan.totalLateFees)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Disbursed:</span>
                              <span className={`font-medium ${loan.disbursement?.isDisbursed ? 'text-green-600' : 'text-gray-600'}`}>
                                {loan.disbursement?.isDisbursed ? 'Yes' : 'No'}
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
                                <div key={payment._id} className="bg-gray-50 p-3 rounded-lg">
                                  <div className="flex justify-between items-start mb-1">
                                    <span className="font-semibold text-green-600">
                                      {formatCurrency(payment.amount)}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {formatDate(payment.date)}
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-600">
                                    <div>Balance: {formatCurrency(payment.currentBalance)}</div>
                                    <div>By: {payment.receivedByRole}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 italic">No payments recorded yet</p>
                          )}
                        </div>
                      </div>

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
    </div>
  );
};

export default AdminLoans;