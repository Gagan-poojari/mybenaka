"use client";
import React, { useState, useEffect, useCallback, useContext } from "react";
import {
  CreditCard,
  User,
  IndianRupee,
  Percent,
  Calendar,
  Search,
  Plus,
  Calculator,
  AlertCircle,
  CheckCircle,
  X,
  ArrowRight,
  Phone,
  Clock,
  TrendingUp,
} from "lucide-react";
import AdminLeftbar from "@/app/components/dashboard/AdminLeftBar";
import { authDataContext } from "@/app/contexts/AuthContext";

const IssueLoan = () => {
  const { serverUrl } = useContext(authDataContext)

  const [borrowers, setBorrowers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showBorrowerList, setShowBorrowerList] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    borrowerId: "",
    borrowerName: "",
    borrowerPhone: "",
    amount: "",
    interestRate: "",
    startDate: new Date().toISOString().split('T')[0],
    dueDate: "",
  });

  // Calculation state
  const [calculations, setCalculations] = useState({
    principal: 0,
    interest: 0,
    totalDue: 0,
    monthlyPayment: 0,
    loanDuration: 0,
  });

  // Fetch borrowers
  const fetchBorrowers = useCallback(async () => {
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
    }
  }, []);

  useEffect(() => {
    fetchBorrowers();
  }, [fetchBorrowers]);

  // Calculate loan details
  useEffect(() => {
    const amount = parseFloat(formData.amount) || 0;
    const rate = parseFloat(formData.interestRate) || 0;
    const interest = (amount * rate) / 100;
    const totalDue = amount + interest;

    let duration = 0;
    let monthlyPayment = 0;

    if (formData.startDate && formData.dueDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.dueDate);
      duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24 * 30));
      monthlyPayment = duration > 0 ? totalDue / duration : 0;
    }

    setCalculations({
      principal: amount,
      interest,
      totalDue,
      monthlyPayment,
      loanDuration: duration,
    });
  }, [formData.amount, formData.interestRate, formData.startDate, formData.dueDate]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleBorrowerSelect = (borrower) => {
    setFormData({
      ...formData,
      borrowerId: borrower._id,
      borrowerName: borrower.name,
      borrowerPhone: borrower.phone,
    });
    setShowBorrowerList(false);
    setSearchTerm("");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const validateForm = () => {
    if (!formData.borrowerId) {
      setError("Please select a borrower");
      return false;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError("Please enter a valid loan amount");
      return false;
    }
    if (!formData.interestRate || parseFloat(formData.interestRate) < 0) {
      setError("Please enter a valid interest rate");
      return false;
    }
    if (!formData.startDate) {
      setError("Please select a start date");
      return false;
    }
    if (!formData.dueDate) {
      setError("Please select a due date");
      return false;
    }
    if (new Date(formData.dueDate) <= new Date(formData.startDate)) {
      setError("Due date must be after start date");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateForm()) return;

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${serverUrl}/api/loans`, {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          borrowerId: formData.borrowerId,
          amount: parseFloat(formData.amount),
          interestRate: parseFloat(formData.interestRate),
          startDate: formData.startDate,
          dueDate: formData.dueDate,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to issue loan");
      }

      setSuccess("Loan issued successfully!");
      
      // Reset form
      setFormData({
        borrowerId: "",
        borrowerName: "",
        borrowerPhone: "",
        amount: "",
        interestRate: "",
        startDate: new Date().toISOString().split('T')[0],
        dueDate: "",
      });

      // Redirect after 2 seconds
      setTimeout(() => {
        window.location.href = "/admin/loans";
      }, 2000);
    } catch (err) {
      setError(err.message || "Error issuing loan");
    } finally {
      setLoading(false);
    }
  };

  const filteredBorrowers = borrowers.filter((b) =>
    b.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.phone?.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminLeftbar />

      <div className="flex-1 p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Issue New Loan</h1>
          <p className="text-gray-600 mt-2">
            Create a new loan account for a borrower
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Borrower Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Select Borrower *
                  </label>
                  <div className="relative">
                    {formData.borrowerId ? (
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg border-2 border-orange-300">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-lg">
                            {formData.borrowerName?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{formData.borrowerName}</p>
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {formData.borrowerPhone}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormData({
                            ...formData,
                            borrowerId: "",
                            borrowerName: "",
                            borrowerPhone: "",
                          })}
                          className="p-2 hover:bg-orange-200 rounded-lg transition-colors"
                        >
                          <X className="w-5 h-5 text-gray-600" />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <button
                          type="button"
                          onClick={() => setShowBorrowerList(!showBorrowerList)}
                          className="w-full flex items-center justify-between p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition-colors"
                        >
                          <span className="text-gray-500 flex items-center gap-2">
                            <User className="w-5 h-5" />
                            Click to select a borrower
                          </span>
                          <Plus className="w-5 h-5 text-gray-400" />
                        </button>

                        {showBorrowerList && (
                          <div className="absolute z-10 w-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 max-h-80 overflow-hidden">
                            <div className="p-3 border-b border-gray-200 sticky top-0 bg-white">
                              <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                  type="text"
                                  placeholder="Search borrowers..."
                                  value={searchTerm}
                                  onChange={(e) => setSearchTerm(e.target.value)}
                                  className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                                />
                              </div>
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                              {filteredBorrowers.length === 0 ? (
                                <div className="p-4 text-center text-gray-500">
                                  No borrowers found
                                </div>
                              ) : (
                                filteredBorrowers.map((borrower) => (
                                  <button
                                    key={borrower._id}
                                    type="button"
                                    onClick={() => handleBorrowerSelect(borrower)}
                                    className="w-full flex items-center gap-3 p-3 hover:bg-orange-50 transition-colors text-left"
                                  >
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold">
                                      {borrower.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                      <p className="font-medium text-gray-900">{borrower.name}</p>
                                      <p className="text-sm text-gray-500">{borrower.phone}</p>
                                    </div>
                                  </button>
                                ))
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Loan Amount (₹) *
                  </label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleInputChange}
                      placeholder="Enter amount"
                      // min="1"
                      // step="1000"
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                {/* Interest Rate */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Interest Rate (%) *
                  </label>
                  <div className="relative">
                    <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="number"
                      name="interestRate"
                      value={formData.interestRate}
                      onChange={handleInputChange}
                      placeholder="Enter interest rate"
                      min="0"
                      step="0.1"
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Start Date *
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Due Date *
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="date"
                        name="dueDate"
                        value={formData.dueDate}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Error/Success Messages */}
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

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg font-semibold"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      Issue Loan
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Calculations Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white sticky top-6">
              <div className="flex items-center gap-2 mb-6">
                <Calculator className="w-6 h-6" />
                <h2 className="text-xl font-bold">Loan Summary</h2>
              </div>

              <div className="space-y-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <p className="text-sm opacity-90 mb-1">Principal Amount</p>
                  <p className="text-2xl font-bold">{formatCurrency(calculations.principal)}</p>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <p className="text-sm opacity-90 mb-1">Interest Amount</p>
                  <p className="text-2xl font-bold">{formatCurrency(calculations.interest)}</p>
                </div>

                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 border-2 border-white/30">
                  <p className="text-sm opacity-90 mb-1">Total Due</p>
                  <p className="text-3xl font-bold">{formatCurrency(calculations.totalDue)}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                    <div className="flex items-center gap-1 mb-1">
                      <Clock className="w-4 h-4" />
                      <p className="text-xs opacity-90">Duration</p>
                    </div>
                    <p className="text-lg font-bold">{calculations.loanDuration} months</p>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                    <div className="flex items-center gap-1 mb-1">
                      <TrendingUp className="w-4 h-4" />
                      <p className="text-xs opacity-90">Monthly</p>
                    </div>
                    <p className="text-lg font-bold">
                      {calculations.monthlyPayment > 0 
                        ? formatCurrency(calculations.monthlyPayment)
                        : "—"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-white/20">
                <p className="text-xs opacity-75 text-center">
                  All calculations are approximate and based on simple interest
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssueLoan;