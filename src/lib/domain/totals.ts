import type {
  AmountSpec,
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

// Resolve an AmountSpec into a CHF figure using the employee's current
// basicSalary. Result is rounded — payroll rows never carry fractional CHF.
export function resolveAmount(spec: AmountSpec, basicSalary: number): number {
  switch (spec.kind) {
    case "FIXED":
      return Math.round(spec.value);
    case "DAYS":
      return Math.round((basicSalary / 30) * spec.value);
    case "PERCENT":
      return Math.round((basicSalary * spec.value) / 100);
    case "MONTHS":
      return Math.round(basicSalary * spec.value);
  }
}

// Human-readable label for a spec: "10% × 3,000 CHF = 300 CHF". FIXED
// collapses to just the CHF amount so we don't show "1 × X = X" noise.
// String(n) already drops trailing zeros (0.5 stays "0.5", 2 stays "2").
export function formatAmountSpec(spec: AmountSpec, basicSalary: number): string {
  const resolved = resolveAmount(spec, basicSalary);
  switch (spec.kind) {
    case "FIXED":
      return formatCHF(resolved);
    case "DAYS": {
      const daily = Math.round(basicSalary / 30);
      const unit = spec.value === 1 ? "day" : "days";
      return `${spec.value} ${unit} × ${formatCHF(daily)} = ${formatCHF(resolved)}`;
    }
    case "PERCENT":
      return `${spec.value}% × ${formatCHF(basicSalary)} = ${formatCHF(resolved)}`;
    case "MONTHS": {
      const unit = spec.value === 1 ? "month" : "months";
      return `${spec.value} ${unit} × ${formatCHF(basicSalary)} = ${formatCHF(resolved)}`;
    }
  }
}
