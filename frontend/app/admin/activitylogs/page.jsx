"use client";
import React, { useState, useEffect, useCallback, useContext } from "react";
import {
    Activity,
    Search,
    Filter,
    Calendar,
    User,
    DollarSign,
    UserPlus,
    Trash2,
    CreditCard,
    Users,
    Clock,
    AlertCircle,
    CheckCircle,
    XCircle,
    RefreshCw,
} from "lucide-react";
import AdminLeftbar from "@/app/components/dashboard/AdminLeftBar";
import { authDataContext } from "@/app/contexts/AuthContext";

const ActivityLogs = () => {
    const { serverUrl } = useContext(authDataContext);

    const [logsData, setLogsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterAction, setFilterAction] = useState("all");
    const [filterOwnerType, setFilterOwnerType] = useState("all");
    const [selectedLog, setSelectedLog] = useState(null);

    const fetchActivityLogs = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${serverUrl}/api/logs/activity/all`, {
                headers: {
                    Authorization: token ? `Bearer ${token}` : undefined,
                    "Content-Type": "application/json",
                },
            });

            if (!res.ok) {
                let msg = `Failed to fetch activity logs: ${res.status} ${res.statusText}`;
                try {
                    const json = await res.json();
                    if (json?.message) msg = json.message;
                } catch (e) { }
                throw new Error(msg);
            }

            const data = await res.json();
            console.log("Activity logs data:", data);

            // Handle both direct array and nested structure
            const logs = data.logs || (Array.isArray(data) ? data : []);
            setLogsData(logs);
            setLoading(false);
        } catch (err) {
            console.error("Activity logs fetch error:", err);
            setError(err.message || "Unknown error");
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchActivityLogs();
    }, [fetchActivityLogs]);

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

    const getActionIcon = (action) => {
        switch (action) {
            case "RECORD_PAYMENT":
                return <DollarSign className="w-5 h-5" />;
            case "ISSUE_LOAN":
                return <CreditCard className="w-5 h-5" />;
            case "ADD_BORROWER":
                return <UserPlus className="w-5 h-5" />;
            case "CREATE_MANAGER":
                return <Users className="w-5 h-5" />;
            case "DELETE_LOAN":
                return <Trash2 className="w-5 h-5" />;
            default:
                return <Activity className="w-5 h-5" />;
        }
    };

    const getActionColor = (action) => {
        switch (action) {
            case "RECORD_PAYMENT":
                return "bg-green-100 text-green-700 border-green-200";
            case "ISSUE_LOAN":
                return "bg-blue-100 text-blue-700 border-blue-200";
            case "ADD_BORROWER":
                return "bg-purple-100 text-purple-700 border-purple-200";
            case "CREATE_MANAGER":
                return "bg-orange-100 text-orange-700 border-orange-200";
            case "DELETE_LOAN":
                return "bg-red-100 text-red-700 border-red-200";
            default:
                return "bg-gray-100 text-gray-700 border-gray-200";
        }
    };

    const getActionLabel = (action) => {
        return action.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    };

    const getStats = () => {
        const actionCounts = logsData.reduce((acc, log) => {
            acc[log.action] = (acc[log.action] || 0) + 1;
            return acc;
        }, {});

        const ownerTypeCounts = logsData.reduce((acc, log) => {
            acc[log.ownerType] = (acc[log.ownerType] || 0) + 1;
            return acc;
        }, {});

        return {
            totalLogs: logsData.length,
            actionCounts,
            ownerTypeCounts,
            last24Hours: logsData.filter(log => {
                const logDate = new Date(log.timestamp);
                const now = new Date();
                return (now - logDate) < 86400000;
            }).length,
        };
    };

    const filteredLogs = logsData.filter((log) => {
        const matchesSearch =
            log.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.ownerId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.ownerId?.email?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesAction = filterAction === "all" || log.action === filterAction;
        const matchesOwnerType = filterOwnerType === "all" || log.ownerType === filterOwnerType;

        return matchesSearch && matchesAction && matchesOwnerType;
    });

    const uniqueActions = [...new Set(logsData.map(log => log.action))];
    const uniqueOwnerTypes = [...new Set(logsData.map(log => log.ownerType))];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-600 mx-auto" />
                    <p className="mt-4 text-gray-600">Loading activity logs...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="text-center max-w-lg">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <p className="text-xl text-gray-900 mb-2">Failed to load activity logs</p>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={fetchActivityLogs}
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
                        <h1 className="text-3xl font-bold text-gray-900">Activity Logs</h1>
                        <p className="text-gray-600 mt-2">
                            Monitor all system activities and user actions
                        </p>
                    </div>
                    <button
                        onClick={fetchActivityLogs}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow p-6 border-l-4 border-orange-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Activities</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">
                                    {stats.totalLogs}
                                </p>
                            </div>
                            <div className="bg-orange-100 p-3 rounded-lg">
                                <Activity className="w-6 h-6 text-orange-600" />
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">All time activities</p>
                    </div>

                    <div className="bg-white rounded-xl shadow p-6 border-l-4 border-blue-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Last 24 Hours</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">
                                    {stats.last24Hours}
                                </p>
                            </div>
                            <div className="bg-blue-100 p-3 rounded-lg">
                                <Clock className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Recent activities</p>
                    </div>

                    <div className="bg-white rounded-xl shadow p-6 border-l-4 border-green-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Payments Recorded</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">
                                    {stats.actionCounts.RECORD_PAYMENT || 0}
                                </p>
                            </div>
                            <div className="bg-green-100 p-3 rounded-lg">
                                <DollarSign className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Payment transactions</p>
                    </div>

                    <div className="bg-white rounded-xl shadow p-6 border-l-4 border-purple-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Loans Issued</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">
                                    {stats.actionCounts.ISSUE_LOAN || 0}
                                </p>
                            </div>
                            <div className="bg-purple-100 p-3 rounded-lg">
                                <CreditCard className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Total loans created</p>
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
                                placeholder="Search logs..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                        </div>

                        {/* Action Filter */}
                        <select
                            value={filterAction}
                            onChange={(e) => setFilterAction(e.target.value)}
                            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        >
                            <option value="all">All Actions</option>
                            {uniqueActions.map(action => (
                                <option key={action} value={action}>
                                    {getActionLabel(action)}
                                </option>
                            ))}
                        </select>

                        {/* Owner Type Filter */}
                        <select
                            value={filterOwnerType}
                            onChange={(e) => setFilterOwnerType(e.target.value)}
                            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        >
                            <option value="all">All Users</option>
                            {uniqueOwnerTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Activity Timeline */}
                <div className="bg-white rounded-xl shadow p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Activity Timeline</h2>

                    {filteredLogs.length === 0 ? (
                        <div className="text-center py-12">
                            <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">No activities found matching your criteria</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredLogs.map((log) => (
                                <div
                                    key={log._id}
                                    className="flex gap-4 p-4 rounded-lg border border-gray-200 hover:border-orange-300 hover:shadow-md transition-all cursor-pointer"
                                    onClick={() => setSelectedLog(selectedLog?._id === log._id ? null : log)}
                                >
                                    {/* Icon */}
                                    <div className={`flex-shrink-0 w-12 h-12 rounded-lg border flex items-center justify-center ${getActionColor(log.action)}`}>
                                        {getActionIcon(log.action)}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${getActionColor(log.action)}`}>
                                                        {getActionLabel(log.action)}
                                                    </span>
                                                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                                                        {log.ownerType}
                                                    </span>
                                                </div>
                                                <p className="text-gray-900 mt-2 font-medium">{log.details}</p>

                                                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                                                    <div className="flex items-center gap-1">
                                                        <User className="w-4 h-4" />
                                                        <span>{log.ownerId?.name || "Unknown"}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="w-4 h-4" />
                                                        <span>{formatDate(log.timestamp)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Status Badge */}
                                            {log.metadata?.status && (
                                                <div className={`flex-shrink-0 px-2 py-1 rounded-full text-xs font-medium ${log.metadata.status === 'cleared'
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                    {log.metadata.status}
                                                </div>
                                            )}
                                        </div>

                                        {/* Expanded Details */}
                                        {selectedLog?._id === log._id && (
                                            <div className="mt-4 pt-4 border-t border-gray-200">
                                                <div className="grid grid-cols-2 gap-4 text-sm">
                                                    <div>
                                                        <span className="text-gray-500">Email:</span>
                                                        <p className="font-medium text-gray-900">{log.ownerId?.email || "N/A"}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500">Log ID:</span>
                                                        <p className="font-mono text-xs text-gray-700">{log._id}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500">Created:</span>
                                                        <p className="font-medium text-gray-900">
                                                            {new Date(log.createdAt).toLocaleString("en-IN")}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500">Type:</span>
                                                        <p className="font-medium text-gray-900">{log.type}</p>
                                                    </div>
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

export default ActivityLogs;