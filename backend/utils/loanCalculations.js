
// Calculate EMI (Equated Monthly Installment)
export const calculateEMI = (principal, annualRate, tenureMonths) => {
  const monthlyRate = annualRate / 12 / 100;
  const emi = 
    (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
    (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  return Math.round(emi);
};

// Calculate total interest
export const calculateTotalInterest = (principal, rate) => {
  return (principal * rate) / 100;
};

// Calculate remaining balance
export const calculateRemainingBalance = (loan) => {
  const totalDue = loan.amount + calculateTotalInterest(loan.amount, loan.interestRate);
  const totalPaid = loan.payments.reduce((sum, payment) => sum + payment.amount, 0);
  return totalDue - totalPaid;
};

// Check if loan is overdue
export const isLoanOverdue = (loan) => {
  return new Date() > new Date(loan.dueDate) && loan.status === "active";
};

// Generate EMI schedule
export const generateEMISchedule = (principal, annualRate, startDate, tenureMonths) => {
  const schedule = [];
  const emi = calculateEMI(principal, annualRate, tenureMonths);
  let remainingPrincipal = principal;
  const monthlyRate = annualRate / 12 / 100;

  for (let i = 1; i <= tenureMonths; i++) {
    const interestPayment = remainingPrincipal * monthlyRate;
    const principalPayment = emi - interestPayment;
    remainingPrincipal -= principalPayment;

    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + i);

    schedule.push({
      month: i,
      dueDate,
      emi: Math.round(emi),
      principal: Math.round(principalPayment),
      interest: Math.round(interestPayment),
      balance: Math.round(Math.max(0, remainingPrincipal))
    });
  }

  return schedule;
};

// Calculate late fee
export const calculateLateFee = (principal, daysOverdue, lateFeePercentage = 0.5) => {
  return Math.round((principal * lateFeePercentage * daysOverdue) / 100);
};
