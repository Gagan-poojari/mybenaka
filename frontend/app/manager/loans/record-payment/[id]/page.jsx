"use client";
import React, { useState, useEffect, useCallback, useContext } from "react";
import {
  Wallet,
  IndianRupee,
  Calendar,
  Search,
  AlertCircle,
  CheckCircle,
  X,
  ArrowRight,
  Phone,
  Clock,
  TrendingDown,
  CreditCard,
  User,
  FileText,
  DollarSign,
} from "lucide-react";
import { authDataContext } from "@/app/contexts/AuthContext";

const RecordPayment = () => {
  const { serverUrl } = useContext(authDataContext);

  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showLoanList, setShowLoanList] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    loanId: "",
    borrowerName: "",
    borrowerPhone: "",
    loanAmount: 0,
    currentBalance: 0,
    amount: "",
    date: new Date().toISOString().split('T')[0],
  });

  // Calculation state
  const [calculations, setCalculations] = useState({
    paymentAmount: 0,
    remainingBalance: 0,
    percentagePaid: 0,
    willCloseLoan: false,
  });

  // Fetch active loans
  const fetchLoans = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${serverUrl}/api/loans`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        const data = await res.json();

        let loansArray = [];

        if (Array.isArray(data)) {
          loansArray = data;
        } else if (data.loans && Array.isArray(data.loans)) {
          loansArray = data.loans;
        } else if (data.data && Array.isArray(data.data)) {
          loansArray = data.data;
        }

        const activeLoans = loansArray.filter(loan => {
          return loan.status === "active" || loan.status === "overdue";
        });
        
        setLoans(activeLoans);
      }
    } catch (err) {
      console.error("Failed to fetch loans:", err);
    }
  }, [serverUrl]);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  // Calculate payment details
  useEffect(() => {
    const amount = parseFloat(formData.amount) || 0;
    const currentBalance = formData.currentBalance || 0;
    const remainingBalance = Math.max(0, currentBalance - amount);
    const percentagePaid = currentBalance > 0 ? ((currentBalance - remainingBalance) / currentBalance) * 100 : 0;
    const willCloseLoan = remainingBalance <= 0;

    setCalculations({
      paymentAmount: amount,
      remainingBalance,
      percentagePaid,
      willCloseLoan,
    });
  }, [formData.amount, formData.currentBalance]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleLoanSelect = (loan) => {
    const totalDue = loan.amount + (loan.amount * loan.interestRate / 100);
    const totalPaid = loan.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
    const currentBalance = totalDue - totalPaid;

    setFormData({
      ...formData,
      loanId: loan._id,
      borrowerName: loan.borrower?.name || "Unknown",
      borrowerPhone: loan.borrower?.phone || "N/A",
      loanAmount: totalDue,
      currentBalance: currentBalance,
      amount: "",
    });
    setShowLoanList(false);
    setSearchTerm("");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const validateForm = () => {
    if (!formData.loanId) {
      setError("Please select a loan");
      return false;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError("Please enter a valid payment amount");
      return false;
    }
    if (parseFloat(formData.amount) > formData.currentBalance) {
      setError("Payment amount cannot exceed current balance");
      return false;
    }
    if (!formData.date) {
      setError("Please select a payment date");
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
      const res = await fetch(`${serverUrl}/api/loans/record-payment/${formData.loanId}`, {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          loanId: formData.loanId,
          amount: parseFloat(formData.amount),
          date: formData.date,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to record payment");
      }

      setSuccess("Payment recorded successfully!");
      
      // Reset form
      setFormData({
        loanId: "",
        borrowerName: "",
        borrowerPhone: "",
        loanAmount: 0,
        currentBalance: 0,
        amount: "",
        date: new Date().toISOString().split('T')[0],
      });

      // Refresh loans list
      fetchLoans();

      // Redirect after 2 seconds
      setTimeout(() => {
        window.location.href = "/manager/loans";
      }, 2000);
    } catch (err) {
      setError(err.message || "Error recording payment");
    } finally {
      setLoading(false);
    }
  };

  const filteredLoans = loans.filter((loan) =>
    loan.borrower?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loan.borrower?.phone?.includes(searchTerm) ||
    loan._id?.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* AdminLeftbar would go here */}
      
      <div className="flex-1 p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Record Payment</h1>
          <p className="text-gray-600 mt-2">
            Record a payment against an active loan
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Loan Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Select Loan *
                  </label>
                  <div className="relative">
                    {formData.loanId ? (
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border-2 border-green-300">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-lg">
                            {formData.borrowerName?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{formData.borrowerName}</p>
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {formData.borrowerPhone}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Balance: {formatCurrency(formData.currentBalance)}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormData({
                            loanId: "",
                            borrowerName: "",
                            borrowerPhone: "",
                            loanAmount: 0,
                            currentBalance: 0,
                            amount: "",
                            date: formData.date,
                          })}
                          className="p-2 hover:bg-green-200 rounded-lg transition-colors"
                        >
                          <X className="w-5 h-5 text-gray-600" />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <button
                          type="button"
                          onClick={() => setShowLoanList(!showLoanList)}
                          className="w-full flex items-center justify-between p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors"
                        >
                          <span className="text-gray-500 flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Click to select a loan
                          </span>
                          <Search className="w-5 h-5 text-gray-400" />
                        </button>

                        {showLoanList && (
                          <div className="absolute z-10 w-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 max-h-80 overflow-hidden">
                            <div className="p-3 border-b border-gray-200 sticky top-0 bg-white">
                              <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                  type="text"
                                  placeholder="Search by name, phone, or loan ID..."
                                  value={searchTerm}
                                  onChange={(e) => setSearchTerm(e.target.value)}
                                  className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                                />
                              </div>
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                              {filteredLoans.length === 0 ? (
                                <div className="p-4 text-center text-gray-500">
                                  No active loans found
                                </div>
                              ) : (
                                filteredLoans.map((loan) => {
                                  const totalDue = loan.amount + (loan.amount * loan.interestRate / 100);
                                  const totalPaid = loan.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
                                  const balance = totalDue - totalPaid;
                                  
                                  return (
                                    <button
                                      key={loan._id}
                                      type="button"
                                      onClick={() => handleLoanSelect(loan)}
                                      className="w-full flex items-center gap-3 p-3 hover:bg-green-50 transition-colors text-left border-b border-gray-100"
                                    >
                                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold">
                                        {loan.borrower?.name?.charAt(0).toUpperCase()}
                                      </div>
                                      <div className="flex-1">
                                        <p className="font-medium text-gray-900">{loan.borrower?.name}</p>
                                        <p className="text-xs text-gray-500">{loan.borrower?.phone}</p>
                                        <p className="text-xs text-green-600 font-semibold mt-1">
                                          Balance: {formatCurrency(balance)}
                                        </p>
                                      </div>
                                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                                        loan.status === "overdue" 
                                          ? "bg-red-100 text-red-700" 
                                          : "bg-green-100 text-green-700"
                                      }`}>
                                        {loan.status}
                                      </div>
                                    </button>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Amount */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Payment Amount (₹) *
                  </label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleInputChange}
                      placeholder="Enter payment amount"
                    //   min="1"
                      max={formData.currentBalance}
                    //   step="100"
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                      disabled={!formData.loanId}
                    />
                  </div>
                  {formData.currentBalance > 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      Maximum: {formatCurrency(formData.currentBalance)}
                    </p>
                  )}
                </div>

                {/* Payment Date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Payment Date *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                {/* Quick Amount Buttons */}
                {formData.currentBalance > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Quick Select
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[25, 50, 75, 100].map((percentage) => {
                        const amount = Math.floor((formData.currentBalance * percentage) / 100);
                        return (
                          <button
                            key={percentage}
                            type="button"
                            onClick={() => setFormData({ ...formData, amount: amount.toString() })}
                            className="px-3 py-2 bg-gray-100 hover:bg-green-100 border border-gray-300 hover:border-green-400 rounded-lg text-sm font-medium transition-colors"
                          >
                            {percentage}%
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

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
                  disabled={loading || !formData.loanId}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg font-semibold"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Wallet className="w-5 h-5" />
                      Record Payment
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Payment Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white sticky top-6">
              <div className="flex items-center gap-2 mb-6">
                <DollarSign className="w-6 h-6" />
                <h2 className="text-xl font-bold">Payment Summary</h2>
              </div>

              <div className="space-y-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <p className="text-sm opacity-90 mb-1">Current Balance</p>
                  <p className="text-2xl font-bold">{formatCurrency(formData.currentBalance)}</p>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <p className="text-sm opacity-90 mb-1">Payment Amount</p>
                  <p className="text-2xl font-bold">{formatCurrency(calculations.paymentAmount)}</p>
                </div>

                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 border-2 border-white/30">
                  <p className="text-sm opacity-90 mb-1">Remaining Balance</p>
                  <p className="text-3xl font-bold">{formatCurrency(calculations.remainingBalance)}</p>
                </div>

                {calculations.paymentAmount > 0 && (
                  <>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                      <div className="flex items-center gap-1 mb-2">
                        <TrendingDown className="w-4 h-4" />
                        <p className="text-sm opacity-90">Payment Progress</p>
                      </div>
                      <div className="w-full bg-white/20 rounded-full h-3 mb-2">
                        <div 
                          className="bg-white rounded-full h-3 transition-all duration-500"
                          style={{ width: `${Math.min(calculations.percentagePaid, 100)}%` }}
                        />
                      </div>
                      <p className="text-lg font-bold">{calculations.percentagePaid.toFixed(1)}%</p>
                    </div>

                    {calculations.willCloseLoan && (
                      <div className="bg-yellow-400/20 backdrop-blur-sm rounded-lg p-4 border-2 border-yellow-300/50">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5" />
                          <p className="font-semibold">This will close the loan!</p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-white/20">
                <p className="text-xs opacity-75 text-center">
                  Payment will be recorded against the selected loan
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecordPayment;