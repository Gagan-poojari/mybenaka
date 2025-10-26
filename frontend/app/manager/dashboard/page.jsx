"use client";
import React, { useState, useEffect, useCallback, useContext } from "react";
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
  RefreshCw,
} from "lucide-react";
import { set } from "react-hook-form";
import { authDataContext } from "@/app/contexts/AuthContext";
import ManagerLeftbar from "@/app/components/dashboard/ManagerLeftBar";
import Link from "next/link";

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

const ManagerDashboard = () => {
  const { serverUrl } = useContext(authDataContext)
  console.log(serverUrl);

  const [dashboardData, setDashboardData] = useState(null);
  const [last24hrsPaymentData, setLast24hrsPaymentData] = useState({});
  const [duePaymentsToday, setDuePaymentsToday] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // UseCallback so Retry button uses same reference
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // adjust this URL to your backend (relative path works with proxy)
      const token = localStorage.getItem("token");
      const res = await fetch(`${serverUrl}/api/manager/dashboard`, {
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

  const fetch24hrPayments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${serverUrl}/api/loans/payments/24hrs`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.message || `Failed to fetch payments: ${res.status}`);
      }

      const data = await res.json(); // this is an array of payments
      console.log("Raw 24hr payments:", data);

      // --- OPTIONAL: Aggregate / transform data for your dashboard ---
      const totalCollected = data.reduce((sum, p) => sum + (p.amount || 0), 0);
      const paymentsByUser = {};
      data.forEach((p) => {
        const id = p.receivedBy?._id;
        const name = p.receivedBy?.name || "Unknown";
        if (id) {
          if (!paymentsByUser[id]) paymentsByUser[id] = { name, amount: 0, count: 0 };
          paymentsByUser[id].amount += p.amount || 0;
          paymentsByUser[id].count += 1;
        }
      });

      const normalized = {
        raw: data,
        totalCollected,
        paymentsByUser,
        paymentCount: data.length,
      };

      console.log("Normalized 24hr payments:", normalized);
      setLast24hrsPaymentData(normalized);
      console.log("24hr payments data (last24hrsPaymentData):", last24hrsPaymentData);
      setLoading(false);
    } catch (err) {
      console.error("24hr payments data fetch error:", err);
      setError(err.message || "Unknown error");
      setLoading(false);
    }
  }, []);

  const fetchDuePayments = useCallback( async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${serverUrl}/api/loans/due/today`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        const data = await res.json();
        setDuePaymentsToday(data);
      }
    } catch (err) {
      console.error("Failed to fetch due payments:", err);
    }
  }, [serverUrl]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    fetch24hrPayments();
  }, [fetch24hrPayments]);

  useEffect(() => {
    fetchDuePayments();
  }, [fetchDuePayments]);

  const formatCurrency = (amount) => {
    const safe = Number(amount || 0);
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(safe);
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(date));
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
              onClick={() => {
                fetchDashboardData();
                fetch24hrPayments();
              }
              }
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
            <button
              onClick={() => {
                // quick helpful action: clear token and retry if token is the problem
                localStorage.removeItem("token");
                fetchDashboardData();
                fetch24hrPayments();
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
  } = dashboardData;

  const pieData = [
    { name: "Active", value: Number(loanStatusDistribution.active || 0), color: "#10B981" },
    { name: "Overdue", value: Number(loanStatusDistribution.overdue || 0), color: "#EF4444" },
    { name: "Closed", value: Number(loanStatusDistribution.closed || 0), color: "#6B7280" },
  ];

  const loanComparison = [
    { name: "Total Loaned", value: overview.totalLoaned },
    { name: "Total Repaid", value: overview.totalRepaid },
    { name: "Outstanding", value: overview.outstanding },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <ManagerLeftbar />

      {/* Main Content */}
      <div className="flex-1 max-w-full p-6">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manager Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Welcome back! Here's your system overview.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                fetchDashboardData();
                fetch24hrPayments();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
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
              {parsePercent(overview.totalLoaned ? (overview.totalRepaid / overview.totalLoaned) * 100 : 0)}% collection rate
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

        {/* Repayment due today */}
        <div className="bg-white rounded-xl shadow p-6 border-t-4 mb-7 border-orange-500">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Due Payments Today ({duePaymentsToday.length})
          </h3>

          {duePaymentsToday.length > 0 ? (
            duePaymentsToday.map((payment) => (
              <div
                key={payment._id}
                className="bg-white rounded-xl shadow p-6 border-l-4 border-red-500 mb-4 hover:shadow-lg transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Due Today</p>
                    <p className="text-2xl font-bold text-red-600 mt-1">
                      {formatCurrency(payment.dueToday)}
                    </p>
                  </div>
                  <div className="bg-red-100 p-3 rounded-lg">
                    <IndianRupee className="w-6 h-6 text-red-600" />
                  </div>
                </div>

                <div className="mt-4 text-sm text-gray-700 space-y-1">
                  <p>
                    <span className="font-semibold">Borrower:</span>{" "}
                    {payment.borrower?.name || "N/A"}
                  </p>
                  <p>
                    <span className="font-semibold">Phone:</span>{" "}
                    {payment.borrower?.phone || "N/A"}
                  </p>
                  <p>
                    <span className="font-semibold">Current Balance:</span>{" "}
                    {formatCurrency(payment.currentBalance)}
                  </p>
                  <p>
                    <span className="font-semibold">Loan Manager:</span>{" "}
                    {payment.issuedBy?.name || "N/A"} ({payment.issuedByRole})
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <Link href={`/manager/loans/record-payment/${payment._id}`}>
                    <button className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold py-2 rounded-lg hover:from-green-600 hover:to-green-700 transition">
                      Record Payment
                    </button>
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-8">
              No payments due today!
            </p>
          )}
        </div>

        {/* 24hrs payments dashboard */}
        <div className="bg-white rounded-xl shadow p-6 border-t-4 border-green-500">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Payments (Last 24 hrs)
          </h3>

          {last24hrsPaymentData.raw && last24hrsPaymentData.raw.length > 0 ? (
            last24hrsPaymentData.raw.map((payment) => (
              <div
                key={payment._id}
                className="bg-white rounded-xl shadow p-6 border-l-4 border-green-500 mb-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Amount Collected</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">
                      {formatCurrency(payment.amount)}
                    </p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-lg">
                    <IndianRupee className="w-6 h-6 text-green-600" />
                  </div>
                </div>

                <div className="mt-4 text-sm text-gray-700 space-y-1">
                  <p>
                    <span className="font-semibold">Borrower:</span>{" "}
                    {payment.borrower?.name || "N/A"}
                  </p>
                  <p>
                    <span className="font-semibold">Collected By:</span>{" "}
                    {payment.receivedBy?.name || "N/A"} ({payment.receivedByRole || "N/A"})
                  </p>
                  <p>
                    <span className="font-semibold">Loan ID:</span>{" "}
                    {payment.loan?.id || "N/A"}
                  </p>
                  <p>
                    <span className="font-semibold">Time:</span>{" "}
                    {formatDate(payment.timestamp)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-8">
              No payments recorded in the last 24 hours
            </p>
          )}
        </div>
        

      </div>
    </div>
  );
};

export default ManagerDashboard;