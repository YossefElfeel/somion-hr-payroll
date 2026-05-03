import type {
  Bonus,
  ComputedTotals,
  Deduction,
  Employee,
} from "./types";

export function computeTotals(
  employee: Employee,
  bonuses: Bonus[],
  deductions: Deduction[],
): ComputedTotals {
  const bonusTotal = bonuses.reduce((s, b) => s + b.amount, 0);
  const manualDeductions = deductions.filter((d) => d.source === "MANUAL");
  const loanInstallments = deductions.filter((d) => d.source === "LOAN_INSTALLMENT");
  const extraLoanRepayments = deductions.filter(
    (d) => d.source === "EXTRA_LOAN_REPAYMENT",
  );

  const deductionTotal = manualDeductions.reduce((s, d) => s + d.amount, 0);
  const loanInstallmentTotal = loanInstallments.reduce((s, d) => s + d.amount, 0);
  const extraLoanRepaymentTotal = extraLoanRepayments.reduce(
    (s, d) => s + d.amount,
    0,
  );

  const total =
    employee.basicSalary +
    bonusTotal -
    deductionTotal -
    loanInstallmentTotal -
    extraLoanRepaymentTotal;

  return {
    basicSalary: employee.basicSalary,
    bonusTotal,
    deductionTotal,
    loanInstallmentTotal,
    extraLoanRepaymentTotal,
    total,
  };
}

export function formatCHF(n: number): string {
  return `${n.toLocaleString("en-CH", { maximumFractionDigits: 0 })} CHF`;
}
