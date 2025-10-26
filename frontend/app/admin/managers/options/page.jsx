"use client";
import React, { useState, useEffect, useCallback, useContext } from "react";
import {
  Users,
  IndianRupee,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Search,
  Filter,
  Eye,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  UserCheck,
  Clock,
  DollarSign,
} from "lucide-react";
import AdminLeftbar from "@/app/components/dashboard/AdminLeftBar";
import Link from "next/link";
import { authDataContext } from "@/app/contexts/AuthContext";

const AdminManagers = () => {
  const { serverUrl } = useContext(authDataContext)

  const [managersData, setManagersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedManager, setSelectedManager] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");

  const fetchManagersData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${serverUrl}/api/admin/managers`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        let msg = `Failed to fetch managers data: ${res.status} ${res.statusText}`;
        try {
          const json = await res.json();
          if (json?.message) msg = json.message;
        } catch (e) {}
        throw new Error(msg);
      }

      const data = await res.json();
      setManagersData(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (err) {
      console.error("Managers fetch error:", err);
      setError(err.message || "Unknown error");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchManagersData();
  }, [fetchManagersData]);

  const formatCurrency = (amount) => {
    const safe = Number(amount || 0);
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(safe);
  };

  const calculateManagerStats = (manager) => {
    const loans = manager.loanIssued || [];
    const totalLoaned = loans.reduce((sum, loan) => sum + (loan.amount || 0), 0);
    const totalCollected = loans.reduce((sum, loan) => sum + (loan.amountPaid || 0), 0);
    const totalOutstanding = loans.reduce((sum, loan) => sum + (loan.outstanding || 0), 0);
    const activeLoans = loans.filter(l => l.status === "active").length;
    const closedLoans = loans.filter(l => l.status === "closed").length;
    const overdueLoans = loans.filter(l => l.status === "overdue").length;

    return {
      totalLoaned,
      totalCollected,
      totalOutstanding,
      activeLoans,
      closedLoans,
      overdueLoans,
      totalLoans: loans.length,
      totalBorrowers: manager.borrowers?.length || 0,
      collectionRate: totalLoaned > 0 ? (totalCollected / totalLoaned) * 100 : 0,
    };
  };

  const getOverallStats = () => {
    const stats = managersData.map(calculateManagerStats);
    return {
      totalManagers: managersData.length,
      totalBorrowers: stats.reduce((sum, s) => sum + s.totalBorrowers, 0),
      totalLoans: stats.reduce((sum, s) => sum + s.totalLoans, 0),
      totalLoaned: stats.reduce((sum, s) => sum + s.totalLoaned, 0),
      totalCollected: stats.reduce((sum, s) => sum + s.totalCollected, 0),
      totalOutstanding: stats.reduce((sum, s) => sum + s.totalOutstanding, 0),
      activeLoans: stats.reduce((sum, s) => sum + s.activeLoans, 0),
    };
  };

  const filteredManagers = managersData.filter((manager) => {
    const matchesSearch = 
      manager.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      manager.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === "all") return matchesSearch;
    
    const stats = calculateManagerStats(manager);
    if (filterStatus === "active") return matchesSearch && stats.activeLoans > 0;
    if (filterStatus === "inactive") return matchesSearch && stats.activeLoans === 0;
    
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading managers data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center max-w-lg">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-xl text-gray-900 mb-2">Failed to load managers</p>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchManagersData}
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
      {/* Sidebar */}
      <AdminLeftbar />

      {/* Main Content */}
      <div className="flex-1 p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Managers Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Manage and monitor all field managers and their performance
          </p>
        </div>

        {/* Overall Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Managers</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {overallStats.totalManagers}
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {overallStats.totalBorrowers} borrowers managed
            </p>
          </div>

          <div className="bg-white rounded-xl shadow p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Loaned</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(overallStats.totalLoaned)}
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
                <p className="text-sm text-gray-600">Total Collected</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {formatCurrency(overallStats.totalCollected)}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {((overallStats.totalCollected / overallStats.totalLoaned) * 100 || 0).toFixed(1)}% collection rate
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
            <p className="text-xs text-gray-500 mt-2">
              {overallStats.activeLoans} active loans
            </p>
          </div>
        </div>

        {/* Manager Operations */}
        <div className="flex w-full justify-center mb-6">
          <Link href="/admin/managers/options">
            <button className="bg-gradient-to-r from-orange-400 to-orange-500 hover:transform hover:scale-105 text-white font-semibold py-2 px-6 rounded-lg cursor-pointer transition duration-300 ease-in-out">
              Manager Options
            </button>
          </Link>
        </div>


        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search managers by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatus("all")}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filterStatus === "all"
                    ? "bg-orange-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterStatus("active")}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filterStatus === "active"
                    ? "bg-orange-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setFilterStatus("inactive")}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filterStatus === "inactive"
                    ? "bg-orange-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Inactive
              </button>
            </div>
          </div>
        </div>

        {/* Managers List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredManagers.map((manager) => {
            const stats = calculateManagerStats(manager);
            return (
              <div
                key={manager._id}
                className="bg-white rounded-xl shadow hover:shadow-lg transition-shadow p-6 border-t-4 border-orange-500"
              >
                {/* Manager Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-lg">
                      {manager.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{manager.name}</h3>
                      <p className="text-sm text-gray-500">{manager.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedManager(selectedManager?._id === manager._id ? null : manager)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Eye className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <UserCheck className="w-4 h-4 text-blue-600" />
                      <span className="text-xs text-gray-600">Borrowers</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">{stats.totalBorrowers}</p>
                  </div>

                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <CreditCard className="w-4 h-4 text-green-600" />
                      <span className="text-xs text-gray-600">Loans</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">{stats.totalLoans}</p>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="w-4 h-4 text-purple-600" />
                      <span className="text-xs text-gray-600">Loaned</span>
                    </div>
                    <p className="text-sm font-bold text-gray-900">
                      {formatCurrency(stats.totalLoaned)}
                    </p>
                  </div>

                  <div className="bg-orange-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-4 h-4 text-orange-600" />
                      <span className="text-xs text-gray-600">Collected</span>
                    </div>
                    <p className="text-sm font-bold text-gray-900">
                      {formatCurrency(stats.totalCollected)}
                    </p>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex gap-2 flex-wrap mb-4">
                  {stats.activeLoans > 0 && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                      {stats.activeLoans} Active
                    </span>
                  )}
                  {stats.closedLoans > 0 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                      {stats.closedLoans} Closed
                    </span>
                  )}
                  {stats.overdueLoans > 0 && (
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                      {stats.overdueLoans} Overdue
                    </span>
                  )}
                </div>

                {/* Performance Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Collection Rate</span>
                    <span className="font-semibold">{stats.collectionRate.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(stats.collectionRate, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Expanded Details */}
                {selectedManager?._id === manager._id && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-3">Details</h4>
                    
                    {manager.address && (
                      <div className="flex items-start gap-2 mb-2">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                        <span className="text-sm text-gray-600">{manager.address}</span>
                      </div>
                    )}

                    <div className="mt-3">
                      <p className="text-xs font-semibold text-gray-700 mb-2">Borrowers:</p>
                      {manager.borrowers && manager.borrowers.length > 0 ? (
                        <div className="space-y-1">
                          {manager.borrowers.slice(0, 3).map((borrower) => (
                            <div key={borrower._id} className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                              {borrower.name} - {borrower.phone}
                            </div>
                          ))}
                          {manager.borrowers.length > 3 && (
                            <p className="text-xs text-gray-500 italic">
                              +{manager.borrowers.length - 3} more
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic">No borrowers assigned</p>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-500">Outstanding:</span>
                          <p className="font-semibold text-red-600">
                            {formatCurrency(stats.totalOutstanding)}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Joined:</span>
                          <p className="font-semibold text-gray-700">
                            {new Date(manager.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredManagers.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No managers found matching your criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminManagers;