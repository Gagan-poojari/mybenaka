"use client";
import React, { useState, useEffect, useCallback, useContext } from "react";
import {
  DollarSign,
  Search,
  Calendar,
  User,
  TrendingUp,
  CreditCard,
  CheckCircle,
  Clock,
  Filter,
  Download,
  RefreshCw,
  IndianRupee,
  Users,
  Phone,
  Mail,
  AlertCircle,
} from "lucide-react";
import AdminLeftbar from "@/app/components/dashboard/AdminLeftBar";
import { authDataContext } from "@/app/contexts/AuthContext";

const CollectionLogs = () => {
  const { serverUrl } = useContext(authDataContext)

  const [logsData, setLogsData] = useState([]);
  const [totalCollected, setTotalCollected] = useState(0);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchCollectionLogs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${serverUrl}/api/logs/collection/all`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        let msg = `Failed to fetch collection logs: ${res.status} ${res.statusText}`;
        try {
          const json = await res.json();
          if (json?.message) msg = json.message;
        } catch (e) { }
        throw new Error(msg);
      }

      const data = await res.json();
      console.log("Collection logs data:", data);

      setLogsData(data.logs || []);
      setTotalCollected(data.totalCollected || 0);
      setPagination(data.pagination || {});
      setLoading(false);
    } catch (err) {
      console.error("Collection logs fetch error:", err);
      setError(err.message || "Unknown error");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCollectionLogs();
  }, [fetchCollectionLogs]);

  const formatCurrency = (amount) => {
    const safe = Number(amount || 0);
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(safe);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDateFilteredLogs = (logs, filter) => {
    const now = new Date();
    switch (filter) {
      case "today":
        return logs.filter(log => {
          const logDate = new Date(log.timestamp);
          return logDate.toDateString() === now.toDateString();
        });
      case "week":
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return logs.filter(log => new Date(log.timestamp) >= weekAgo);
      case "month":
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return logs.filter(log => new Date(log.timestamp) >= monthAgo);
      default:
        return logs;
    }
  };

  const getStats = () => {
    const adminCollections = logsData.filter(log => log.receivedByRole === "Admin");
    const managerCollections = logsData.filter(log => log.receivedByRole === "Manager");

    const adminTotal = adminCollections.reduce((sum, log) => sum + (log.amount || 0), 0);
    const managerTotal = managerCollections.reduce((sum, log) => sum + (log.amount || 0), 0);

    const today = new Date().toDateString();
    const todayCollections = logsData.filter(log =>
      new Date(log.timestamp).toDateString() === today
    );
    const todayTotal = todayCollections.reduce((sum, log) => sum + (log.amount || 0), 0);

    const avgCollection = logsData.length > 0
      ? totalCollected / logsData.length
      : 0;

    return {
      totalCollections: logsData.length,
      adminCollections: adminCollections.length,
      managerCollections: managerCollections.length,
      adminTotal,
      managerTotal,
      todayCollections: todayCollections.length,
      todayTotal,
      avgCollection,
    };
  };

  const exportToCSV = () => {
    // Use the filtered logs for export
    const dataToExport = dateFilteredLogs;

    if (dataToExport.length === 0) {
      alert("No data to export");
      return;
    }

    // Define CSV headers
    const headers = [
      "Transaction ID",
      "Date & Time",
      "Amount (₹)",
      "Borrower Name",
      "Borrower Phone",
      "Collector Name",
      "Collector Role",
      "Collector Email",
      "Loan Amount (₹)",
      "Loan Status",
      "Details",
      "Status"
    ];

    // Convert data to CSV rows
    const rows = dataToExport.map(log => [
      log._id || "",
      new Date(log.timestamp).toLocaleString("en-IN"),
      log.amount || 0,
      log.borrower?.name || "",
      log.borrower?.phone || "",
      log.borrower?.photo || "",
      log.receivedBy?.name || "",
      log.receivedByRole || "",
      log.receivedBy?.email || "",
      log.loan?.amount || "",
      log.loan?.status || "",
      log.details || "",
      log.metadata?.status || "Cleared"
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...rows.map(row =>
        row.map(cell => {
          // Escape cells that contain commas or quotes
          const cellStr = String(cell);
          if (cellStr.includes(",") || cellStr.includes('"') || cellStr.includes("\n")) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        }).join(",")
      )
    ].join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", `collection-logs-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLogs = logsData.filter((log) => {
    const matchesSearch =
      log.borrower?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.receivedBy?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.borrower?.phone?.includes(searchTerm) ||
      log.details?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = filterRole === "all" || log.receivedByRole === filterRole;

    return matchesSearch && matchesRole;
  });

  const dateFilteredLogs = getDateFilteredLogs(filteredLogs, dateFilter);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading collection logs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center max-w-lg">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-xl text-gray-900 mb-2">Failed to load collection logs</p>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchCollectionLogs}
            className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const stats = getStats();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminLeftbar />

      <div className="flex-1 p-6">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Collection Logs</h1>
            <p className="text-gray-600 mt-2">
              Track all payment collections and monitor collection performance
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchCollectionLogs}
              className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
                <IndianRupee className="w-6 h-6" />
              </div>
              <TrendingUp className="w-6 h-6 opacity-70" />
            </div>
            <p className="text-sm opacity-90 mb-1">Total Collected</p>
            <p className="text-3xl font-bold">{formatCurrency(totalCollected)}</p>
            <p className="text-xs opacity-75 mt-2">{stats.totalCollections} transactions</p>
          </div>

          <div className="bg-white rounded-xl shadow p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today's Collection</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(stats.todayTotal)}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {stats.todayCollections} payments today
            </p>
          </div>

          <div className="bg-white rounded-xl shadow p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Collection</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(stats.avgCollection)}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Per transaction</p>
          </div>

          <div className="bg-white rounded-xl shadow p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Collection Rate</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.managerCollections}
                  </p>
                  <span className="text-sm text-gray-500">/ {stats.adminCollections}</span>
                </div>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Manager / Admin</p>
          </div>
        </div> */}

        {/* Role Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Admin Collections</h3>
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl font-bold text-blue-600">
                {formatCurrency(stats.adminTotal)}
              </span>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                {stats.adminCollections} payments
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 mt-4">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all"
                style={{ width: `${(stats.adminTotal / totalCollected) * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {((stats.adminTotal / totalCollected) * 100).toFixed(1)}% of total
            </p>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Manager Collections</h3>
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl font-bold text-orange-600">
                {formatCurrency(stats.managerTotal)}
              </span>
              <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                {stats.managerCollections} payments
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 mt-4">
              <div
                className="bg-gradient-to-r from-orange-500 to-orange-600 h-3 rounded-full transition-all"
                style={{ width: `${(stats.managerTotal / totalCollected) * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {((stats.managerTotal / totalCollected) * 100).toFixed(1)}% of total
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by borrower, collector, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            {/* Role Filter */}
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="all">All Collectors</option>
              <option value="Admin">Admin</option>
              <option value="Manager">Manager</option>
            </select>

            {/* Date Filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>
        </div>

        {/* Collections List */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Collections</h2>

          {dateFilteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No collections found matching your criteria</p>
            </div>
          ) : (
            <div className="space-y-4">
              {dateFilteredLogs.map((log) => (
                <div
                  key={log._id}
                  className="flex gap-4 p-4 rounded-lg border-2 border-gray-100 hover:border-orange-200 hover:shadow-md transition-all cursor-pointer bg-gradient-to-r from-white to-gray-50"
                  onClick={() => setSelectedLog(selectedLog?._id === log._id ? null : log)}
                >
                  {/* Amount Badge */}
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white shadow-lg">
                      {/* <div className="text-center">
                        <IndianRupee className="w-6 h-6 mx-auto" />
                        <p className="text-xs font-bold mt-1">
                          {(log.amount / 1000).toFixed(0)}K
                        </p>
                      </div> */}
                      <img src={loan.borrower.photo ? loan.borrower.photo : "https://static.vecteezy.com/system/resources/thumbnails/009/292/244/small/default-avatar-icon-of-social-media-user-vector.jpg"} alt="borrower" className="w-14 h-14 rounded-full object-cover" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span className="text-2xl font-bold text-gray-900">
                            {formatCurrency(log.amount)}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full font-medium ${log.receivedByRole === 'Admin'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-orange-100 text-orange-700'
                            }`}>
                            {log.receivedByRole}
                          </span>
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 font-medium">
                            <CheckCircle className="w-3 h-3 inline mr-1" />
                            {log.metadata?.status || 'Cleared'}
                          </span>
                        </div>

                        {log.borrower && (
                          <div className="flex items-center gap-4 mb-2">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <span className="font-medium text-gray-900">{log.borrower.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600">{log.borrower.phone}</span>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span>Collected by: <span className="font-medium">{log.receivedBy?.name || "Unknown"}</span></span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{formatDate(log.timestamp)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {selectedLog?._id === log._id && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {log.loan && (
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <CreditCard className="w-4 h-4" />
                                Loan Details
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Loan Amount:</span>
                                  <span className="font-medium">{formatCurrency(log.loan.amount)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Status:</span>
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${log.loan.status === 'active'
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-gray-100 text-gray-700'
                                    }`}>
                                    {log.loan.status}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Loan ID:</span>
                                  <span className="font-mono text-xs">{log.loan.id.slice(-8)}</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {log.receivedBy && (
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <User className="w-4 h-4" />
                                Collector Details
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Name:</span>
                                  <span className="font-medium">{log.receivedBy.name}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Email:</span>
                                  <span className="text-xs">{log.receivedBy.email}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Role:</span>
                                  <span className="font-medium">{log.receivedByRole}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-gray-700">
                            <span className="font-semibold">Details:</span> {log.details}
                          </p>
                        </div>

                        <div className="mt-3 text-xs text-gray-500">
                          <span>Transaction ID: {log._id}</span>
                          <span className="mx-2">•</span>
                          <span>Created: {new Date(log.createdAt).toLocaleString("en-IN")}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CollectionLogs;