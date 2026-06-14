export type ExecutivePeriod = 'TODAY' | 'WEEK' | 'MONTH';

export interface AuthRequest {
  companyLoginCode?: string;
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  patronymic?: string;
  fullName: string;
  role: string;
  companyId: number;
  companyLoginCode?: string;
  storeIds: number[];
  allowedModules: string[];
  moduleAccessCustom: boolean;
}

export interface ExecutiveComparison {
  salesPercent: number;
  profitPercent: number;
  expensesPercent: number;
}

export interface ExecutiveChartDay {
  date: string;
  income: number;
  expense: number;
  netProfit: number;
}

export interface ExecutiveExpenseItem {
  categoryName: string;
  amount: number;
}

export interface ExecutivePreviousPeriod {
  revenue: number;
  expenses: number;
  netProfit: number;
  salesAmount: number;
  salesCount: number;
}

export interface ExecutiveSummary {
  period: ExecutivePeriod;
  salesAmount: number;
  salesCount: number;
  revenueToday: number;
  expensesToday: number;
  netProfitToday: number;
  revenuePeriod: number;
  expensesPeriod: number;
  netProfitPeriod: number;
  cashTotal: number;
  bankTotal: number;
  moneyTotal: number;
  customerDebtTotal: number;
  supplierDebtTotal: number;
  vsPrevious: ExecutiveComparison;
  chart: ExecutiveChartDay[];
  expensesTodayTotal: number;
  topExpenses: ExecutiveExpenseItem[];
  periodSalesAmount: number;
  periodSalesCount: number;
  averageCheck: number;
  previousPeriod: ExecutivePreviousPeriod;
  updatedAt: string;
}
