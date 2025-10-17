"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  PieChart,
  Pie,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  TrendingUp,
  Users,
  IndianRupee,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import AdminLeftbar from "@/app/components/dashboard/AdminLeftBar";

const defaultOverview = {
  totalLoaned: 0,
  totalLoans: 0,
  outstanding: 0,
  overdueLoans: 0,
  collectionRate: 0,
  totalRepaid: 0,
  totalBorrowers: 0,
  totalManagers: 0,
};

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // UseCallback so Retry button uses same reference
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // adjust this URL to your backend (relative path works with proxy)
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8000/api/admin/dashboard", {
        headers: {
          // ensure token is a string (don't store an object in localStorage)
          Authorization: token ? `Bearer ${token}` : undefined,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        // try to read error message from response body
        let msg = `Failed to fetch dashboard: ${res.status} ${res.statusText}`;
        try {
          const json = await res.json();
          if (json?.message) msg = json.message;
        } catch (e) {
          // ignore JSON parse errors
        }
        throw new Error(msg);
      }

      const data = await res.json();

      console.log("Dashboard data 1:", data);

      // Defensive normalization - ensure shapes exist
      const normalized = {
        overview: { ...defaultOverview, ...(data || {}) },
        loanStatusDistribution: {
          active: (data.activeLoans),
          overdue: (data.overdueLoans),
          closed: (data.closedLoans),
        },
        monthlyTrends: Array.isArray(data.monthlyTrends) ? data.monthlyTrends : [],
        topPerformers: Array.isArray(data.topPerformers) ? data.topPerformers : [],
        paymentMethodStats: data.paymentMethodStats ?? {},
        overdueAlerts: Array.isArray(data.overdueAlerts) ? data.overdueAlerts : [],
        thisMonthStats: data.thisMonthStats ?? {},
        raw: data, // keep original for debugging if needed
      };

      setDashboardData(normalized);
      setLoading(false);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError(err.message || "Unknown error");
      setLoading(false);
    }
  }, []);

  const fetchTodaysReports = useCallback(async () => {
    
  })
  
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const formatCurrency = (amount) => {
    const safe = Number(amount || 0);
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(safe);
  };

  // Small helper to safely parse a percent-like value
  const parsePercent = (v) => {
    const n = Number(v);
    if (Number.isFinite(n)) return Math.round(n * 100) / 100;
    return 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center max-w-lg">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-xl text-gray-900 mb-2">Failed to load dashboard</p>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={fetchDashboardData}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
            <button
              onClick={() => {
                // quick helpful action: clear token and retry if token is the problem
                localStorage.removeItem("token");
                fetchDashboardData();
              }}
              className="px-6 py-2 border rounded-lg"
            >
              Clear token & retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  const {
    overview,
    loanStatusDistribution,
    monthlyTrends,
    topPerformers,
    paymentMethodStats,
    overdueAlerts,
  } = dashboardData;

  const pieData = [
    { name: "Active", value: Number(loanStatusDistribution.active || 0), color: "#10B981" },
    { name: "Overdue", value: Number(loanStatusDistribution.overdue || 0), color: "#EF4444" },
    { name: "Closed", value: Number(loanStatusDistribution.closed || 0), color: "#6B7280" },
  ];

  console.log("Dashboard data:", dashboardData);
  console.log("pieData:", pieData);

  const paymentMethodData = Object.entries(paymentMethodStats || {}).map(([method, d]) => ({
    name: method.replace(/_/g, " ").toUpperCase(),
    amount: Number(d?.amount || 0),
    count: Number(d?.count || 0),
  }));

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <AdminLeftbar />

      {/* Main Content */}
      <div className="flex-1 max-w-full p-6">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Welcome back! Here's your system overview.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchDashboardData}
              className="px-4 py-2 border rounded hover:bg-gray-100 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Loaned */}
          <div className="bg-white rounded-xl shadow p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Loaned</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(overview.totalLoaned)}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <IndianRupee className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {overview.totalLoans} total loans
            </p>
          </div>

          {/* Outstanding */}
          <div className="bg-white rounded-xl shadow p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Outstanding</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {formatCurrency(overview.outstanding)}
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {overview.overdueLoans} overdue loans
            </p>
          </div>

          {/* Collection Rate */}
          <div className="bg-white rounded-xl shadow p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Collection</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {formatCurrency(overview.totalRepaid)}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {parsePercent(overview.outstanding ? overview.totalRepaid / overview.outstanding : 0)}% collection rate
            </p>
          </div>

          {/* Total Borrowers */}
          <div className="bg-white rounded-xl shadow p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Loans</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {overview.totalBorrowers}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {overview.totalManagers} managers
            </p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Loan Status Pie Chart */}
          <div className="bg-white rounded-xl shadow p-6 h-[500px] border-t-4 border-orange-500">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Loan Status Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly Trends */}
          <div className="bg-white rounded-xl shadow p-6 border-t-4 border-orange-500">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Monthly Trends
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="amountLoaned"
                  stroke="#3B82F6"
                  name="Loaned"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="amountCollected"
                  stroke="#10B981"
                  name="Collected"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Performers */}
        <div className="bg-white rounded-xl shadow p-6 border-t-4 border-orange-500">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Top Performing Managers
          </h3>
          {topPerformers.length > 0 ? (
            <div className="space-y-4">
              {topPerformers.map((manager, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-semibold">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{manager.name}</p>
                      <p className="text-sm text-gray-600">
                        {formatCurrency(manager.totalCollected)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${parsePercent(manager.collectionRate) >= 80
                          ? "bg-green-100 text-green-800"
                          : parsePercent(manager.collectionRate) >= 60
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                    >
                      {parsePercent(manager.collectionRate)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No managers yet</p>
          )}
        </div>

        {/* Overdue Alerts */}
        <div className="bg-white rounded-xl shadow p-6 border-t-4 border-red-500">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            Overdue Alerts
          </h3>
          {overdueAlerts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Borrower
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Amount
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Days Overdue
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Manager
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {overdueAlerts.map((alert, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-900">{alert.borrowerName}</td>
                      <td className="py-3 px-4 text-sm font-semibold text-gray-900">{formatCurrency(alert.amount)}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-semibold">
                          {alert.daysOverdue} days
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{alert.issuedBy}</td>
                      <td className="py-3 px-4">
                        <button className="text-blue-600 hover:text-blue-800 text-sm font-semibold">
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No overdue loans</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;