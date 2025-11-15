"use client";
import React, { useState, useEffect, useCallback, useContext } from "react";
import {
  Users,
  Search,
  Phone,
  MapPin,
  CreditCard,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  User,
  UserCheck,
  Shield,
  Calendar,
  Eye,
  RefreshCw,
  IndianRupee,
  Clock,
  Home,
  IdCard,
} from "lucide-react";
import AdminLeftbar from "@/app/components/dashboard/AdminLeftBar";
import Link from "next/link";
import { authDataContext } from "@/app/contexts/AuthContext";

const AdminBorrowers = () => {
  const { serverUrl } = useContext(authDataContext);
  const [borrowersData, setBorrowersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedBorrower, setSelectedBorrower] = useState(null);

  const fetchBorrowersData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${serverUrl}/api/borrowers`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
          "Content-Type": "application/json",
        },
      });


      if (!res.ok) {
        let msg = `Failed to fetch borrowers data: ${res.status} ${res.statusText}`;
        try {
          const json = await res.json();
          if (json?.message) msg = json.message;
        } catch (e) { }
        throw new Error(msg);
      }

      const data = await res.json();
      console.log("Borrowers data:", data);
      setBorrowersData(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (err) {
      console.error("Borrowers fetch error:", err);
      setError(err.message || "Unknown error");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBorrowersData();
  }, [fetchBorrowersData]);

  const formatCurrency = (amount) => {
    const safe = Number(amount || 0);
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(safe);
  };

  const calculateBorrowerStats = (borrower) => {
    const loans = borrower.loans || [];
    const totalBorrowed = loans.reduce((sum, loan) => sum + (loan.amount || 0), 0);
    const totalPaid = loans.reduce((sum, loan) => sum + (loan.amountPaid || 0), 0);
    const totalOutstanding = loans.reduce((sum, loan) => sum + (loan.outstanding || 0), 0);
    const activeLoans = loans.filter(l => l.status === "active").length;
    const closedLoans = loans.filter(l => l.status === "closed").length;
    const overdueLoans = loans.filter(l => l.status === "overdue").length;

    return {
      totalBorrowed,
      totalPaid,
      totalOutstanding,
      activeLoans,
      closedLoans,
      overdueLoans,
      totalLoans: loans.length,
      paymentRate: totalBorrowed > 0 ? (totalPaid / totalBorrowed) * 100 : 0,
    };
  };

  const getOverallStats = () => {
    const stats = borrowersData.map(calculateBorrowerStats);
    return {
      totalBorrowers: borrowersData.length,
      activeBorrowers: borrowersData.filter(b => calculateBorrowerStats(b).activeLoans > 0).length,
      totalBorrowed: stats.reduce((sum, s) => sum + s.totalBorrowed, 0),
      totalPaid: stats.reduce((sum, s) => sum + s.totalPaid, 0),
      totalOutstanding: stats.reduce((sum, s) => sum + s.totalOutstanding, 0),
      totalLoans: stats.reduce((sum, s) => sum + s.totalLoans, 0),
    };
  };

  const filteredBorrowers = borrowersData.filter((borrower) => {
    const matchesSearch =
      borrower.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      borrower.phone?.includes(searchTerm) ||
      borrower.alternatePhone?.includes(searchTerm) ||
      borrower.guardianName?.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterStatus === "all") return matchesSearch;

    const stats = calculateBorrowerStats(borrower);
    if (filterStatus === "active") return matchesSearch && stats.activeLoans > 0;
    if (filterStatus === "inactive") return matchesSearch && stats.activeLoans === 0;
    if (filterStatus === "overdue") return matchesSearch && stats.overdueLoans > 0;

    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading borrowers data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center max-w-lg">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-xl text-gray-900 mb-2">Failed to load borrowers</p>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchBorrowersData}
            className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const overallStats = getOverallStats();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminLeftbar />

      <div className="flex-1 p-6">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Borrowers Management</h1>
            <p className="text-gray-600 mt-2">
              Monitor all borrowers, their loans, and payment history
            </p>
          </div>
          <button
            onClick={fetchBorrowersData}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Stats Cards */}
        {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Borrowers</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {overallStats.totalBorrowers}
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {overallStats.activeBorrowers} active borrowers
            </p>
          </div>

          <div className="bg-white rounded-xl shadow p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Borrowed</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(overallStats.totalBorrowed)}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <IndianRupee className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {overallStats.totalLoans} total loans
            </p>
          </div>

          <div className="bg-white rounded-xl shadow p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Repaid</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {formatCurrency(overallStats.totalPaid)}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {((overallStats.totalPaid / overallStats.totalBorrowed) * 100 || 0).toFixed(1)}% repayment rate
            </p>
          </div>

          <div className="bg-white rounded-xl shadow p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Outstanding</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {formatCurrency(overallStats.totalOutstanding)}
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Pending collection</p>
          </div>
        </div> */}

        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, phone, or guardian..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatus("all")}
                className={`px-4 py-2 rounded-lg transition-colors ${filterStatus === "all"
                  ? "bg-orange-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterStatus("active")}
                className={`px-4 py-2 rounded-lg transition-colors ${filterStatus === "active"
                  ? "bg-orange-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
              >
                Active
              </button>
              <button
                onClick={() => setFilterStatus("inactive")}
                className={`px-4 py-2 rounded-lg transition-colors ${filterStatus === "inactive"
                  ? "bg-orange-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
              >
                Inactive
              </button>
              <button
                onClick={() => setFilterStatus("overdue")}
                className={`px-4 py-2 rounded-lg transition-colors ${filterStatus === "overdue"
                  ? "bg-orange-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
              >
                Overdue
              </button>
            </div>
          </div>
        </div>

        {/* Add Borrower Options Button */}
        <div className="flex w-full justify-center mb-6">
          <Link href="/admin/borrowers/options">
            <button className="bg-gradient-to-r from-orange-400 to-orange-500 hover:transform hover:scale-105 text-white font-semibold py-2 px-6 rounded-lg cursor-pointer transition duration-300 ease-in-out">
              Borrowers Options
            </button>
          </Link>
        </div>

        {/* Borrowers Grid */}
        {/* <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-6"> */}
        <div className="flex flex-col gap-5">
          {filteredBorrowers.map((borrower) => {
            const stats = calculateBorrowerStats(borrower);
            return (
              <div
                key={borrower._id}
                className="bg-white rounded-xl grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-3 gap-2 shadow hover:shadow-lg transition-shadow border-t-4 border-orange-500"
              >
                <div>
                  {/* Header */}
                  <div className="p-6  border-gray-200 border-r">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={borrower.photo || "https://static.vecteezy.com/system/resources/thumbnails/009/292/244/small/default-avatar-icon-of-social-media-user-vector.jpg"}
                          alt="borrower"
                          className="w-14 h-14 rounded-full object-cover border-2 border-gray-200"
                        />
                        <div>
                          <h3 className="font-semibold text-gray-900 text-lg">{borrower.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                            <Phone className="w-3.5 h-3.5" />
                            <span>{borrower.phone}</span>
                          </div>
                        </div>
                      </div>
                      {/* <button
                        onClick={() => setSelectedBorrower(selectedBorrower?._id === borrower._id ? null : borrower)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Eye className="w-5 h-5 text-gray-600" />
                      </button> */}
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-blue-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <CreditCard className="w-4 h-4 text-blue-600" />
                          <span className="text-xs font-medium text-gray-600">Total Loans</span>
                        </div>
                        <p className="text-xl font-bold text-gray-900">{stats.totalLoans}</p>
                      </div>

                      <div className="bg-green-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-xs font-medium text-gray-600">Active</span>
                        </div>
                        <p className="text-xl font-bold text-gray-900">{stats.activeLoans}</p>
                      </div>
                    </div>
                  </div>

                  {/* Financial Summary */}
                  <div className="p-6 bg-gray-50">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">Borrowed:</span>
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(stats.totalBorrowed)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">Repaid:</span>
                        <span className="font-semibold text-green-600">
                          {formatCurrency(stats.totalPaid)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">Outstanding:</span>
                        <span className="font-semibold text-red-600">
                          {formatCurrency(stats.totalOutstanding)}
                        </span>
                      </div>
                    </div>

                    {/* Payment Progress */}
                    <div className="mt-4">
                      <div className="flex justify-between text-xs font-medium text-gray-600 mb-2">
                        <span>Payment Progress</span>
                        <span>{stats.paymentRate.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-gradient-to-r from-green-500 to-green-600 h-2.5 rounded-full transition-all"
                          style={{ width: `${Math.min(stats.paymentRate, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Status Badges */}
                    <div className="flex gap-2 flex-wrap mt-4">
                      {stats.activeLoans > 0 && (
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                          {stats.activeLoans} Active
                        </span>
                      )}
                      {stats.closedLoans > 0 && (
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                          {stats.closedLoans} Closed
                        </span>
                      )}
                      {stats.overdueLoans > 0 && (
                        <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                          {stats.overdueLoans} Overdue
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {/* Expanded Details */}
                {/* {selectedBorrower?._id === borrower._id && ( */}
                <div className="p-6 border-gray-200 border-r">
                  <h4 className="font-semibold text-gray-900 text-lg mb-4">Borrower Details</h4>

                  {/* Contact Info */}
                  {(borrower.guardianName || borrower.alternatePhone) && (
                    <div className="space-y-3 mb-6">
                      {borrower.guardianName && (
                        <div className="flex items-center gap-3">
                          <img
                            src={borrower.guardianPhoto || "https://static.vecteezy.com/system/resources/thumbnails/009/292/244/small/default-avatar-icon-of-social-media-user-vector.jpg"}
                            alt="guardian"
                            className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                          />
                          <div>
                            <p className="text-xs font-medium text-gray-500">Guardian</p>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">{borrower.guardianName}</span>
                              {borrower.relationship && (
                                <span className="text-sm text-gray-500">({borrower.relationship})</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      {borrower.alternatePhone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600 font-medium">Alternate:</span>
                          <span className="font-medium text-gray-900">{borrower.alternatePhone}</span>
                        </div>
                      )}
                    </div>
                  )}
                  {/* Addresses */}
                  {(borrower.permanentAddress || borrower.temporaryAddress) && (
                    <div className="space-y-3 mb-6">
                      {borrower.permanentAddress && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-start gap-3">
                            <Home className="w-4 h-4 text-gray-400 mt-1" />
                            <div>
                              <p className="text-xs font-medium text-gray-500 mb-1">Permanent Address</p>
                              <p className="text-sm text-gray-900">{borrower.permanentAddress}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      {borrower.temporaryAddress && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-start gap-3">
                            <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                            <div>
                              <p className="text-xs font-medium text-gray-500 mb-1">Temporary Address</p>
                              <p className="text-sm text-gray-900">{borrower.temporaryAddress}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="p-6 ">
                  {/* Document Details */}
                  {(borrower.aadharNumber || borrower.panNumber || borrower.chequeNumber) && (
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <IdCard className="w-4 h-4 text-gray-400" />
                        <span className="font-semibold text-gray-900">Document Details</span>
                      </div>
                      <div className="space-y-2 pl-6">
                        {borrower.accountNumber && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-600 font-medium w-20">Account No:</span>
                            <span className="font-medium text-gray-900">{borrower.accountNumber}</span>
                          </div>
                        )}
                        {borrower.aadharNumber && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-600 font-medium w-20">Aadhar No:</span>
                            <span className="font-medium text-gray-900">{borrower.aadharNumber}</span>
                          </div>
                        )}
                        {borrower.panNumber && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-600 font-medium w-20">PAN:</span>
                            <span className="font-medium text-gray-900">{borrower.panNumber}</span>
                          </div>
                        )}
                        {borrower.chequeNumber && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-600 font-medium w-20">Cheque:</span>
                            <span className="font-medium text-gray-900">{borrower.chequeNumber}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {/* Meta Info */}
                  <div className="pt-4 border-t border-gray-100 text-xs text-gray-500">
                    <div className="flex justify-between">
                      <span>Added by: <span className="font-medium text-gray-600">{borrower.addedByRole}</span></span>
                      <span>Joined: <span className="font-medium text-gray-600">{new Date(borrower.createdAt).toLocaleDateString()}</span></span>
                    </div>
                  </div>
                </div>

                {/* )} */}
              </div>
            );
          })}
        </div>

        {filteredBorrowers.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No borrowers found matching your criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBorrowers;