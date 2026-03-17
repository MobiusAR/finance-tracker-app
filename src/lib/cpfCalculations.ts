import { differenceInYears } from 'date-fns';

export interface CpfCalculationParams {
  grossPay: number;
  bonus: number;
  dateOfBirth: Date;
  currentDate?: Date;
}

export interface CpfCalculationResult {
  employeeContribution: number;
  employerContribution: number;
  totalContribution: number;
  allocations: {
    oa: number;
    sa: number;
    ma: number;
  };
}

// Age groups and rates for Private Sector & Non-Pensionable Employees (From Jan 2025)
// Values as percentages
const CPF_RATES = [
  { maxAge: 35, employee: 20, employer: 17, oa: 62.17, sa: 16.21, ma: 21.62 }, // rounded slightly for allocation logic (23%, 6%, 8% of total 37% rate) -> 23/37 = 62.162%, etc.
  { maxAge: 45, employee: 20, employer: 17, oa: 56.77, sa: 18.91, ma: 24.32 }, // OA 21%, SA 7%, MA 9%
  { maxAge: 50, employee: 20, employer: 17, oa: 51.36, sa: 21.62, ma: 27.02 }, // OA 19%, SA 8%, MA 10%
  { maxAge: 55, employee: 20, employer: 17, oa: 40.55, sa: 31.08, ma: 28.37 }, // OA 15%, SA 11.5%, MA 10.5%
  { maxAge: 60, employee: 17, employer: 12.5, oa: 40.68, sa: 23.73, ma: 35.59 }, // 29.5 total. OA 12%, SA 7%, MA 10.5%
  { maxAge: 65, employee: 11.5, employer: 10, oa: 20.93, sa: 18.60, ma: 60.47 }, // 21.5 total. OA 4.5%, SA 4%, MA 13%
  { maxAge: 70, employee: 7.5, employer: 8, oa: 6.45, sa: 6.45, ma: 87.10 }, // 15.5 total. OA 1%, SA 1%, MA 13.5%
  { maxAge: 999, employee: 5, employer: 7.5, oa: 8.00, sa: 8.00, ma: 84.00 } // 12.5 total. OA 1%, SA 1%, MA 10.5%
];

// Re-defining precise allocations against total wage (to prevent rounding errors from the /37 step)
// The tables above define total contribution % of wage correctly as:
const CPF_ALLOCATION_RATES = [
  { maxAge: 35, oaRate: 0.23, saRate: 0.06, maRate: 0.08 },
  { maxAge: 45, oaRate: 0.21, saRate: 0.07, maRate: 0.09 },
  { maxAge: 50, oaRate: 0.19, saRate: 0.08, maRate: 0.10 },
  { maxAge: 55, oaRate: 0.15, saRate: 0.115, maRate: 0.105 },
  { maxAge: 60, oaRate: 0.12, saRate: 0.07, maRate: 0.105 },
  { maxAge: 65, maxEmployee: 11.5, maxEmployer: 10, oaRate: 0.045, saRate: 0.04, maRate: 0.13 }, // Note employee/employer rates drop
  { maxAge: 70, oaRate: 0.01, saRate: 0.01, maRate: 0.135 },
  { maxAge: 999, oaRate: 0.01, saRate: 0.01, maRate: 0.105 }
];

const OW_CEILING = 8000; // Updated to 2025 OW ceiling

export function calculateCpf(params: CpfCalculationParams): CpfCalculationResult {
  const { grossPay, bonus, dateOfBirth, currentDate = new Date() } = params;
  
  const age = differenceInYears(currentDate, dateOfBirth);
  
  // Find applicable rate bracket
  const rateBracket = CPF_RATES.find(r => age <= r.maxAge) || CPF_RATES[CPF_RATES.length - 1];
  const allocBracket = CPF_ALLOCATION_RATES.find(r => age <= r.maxAge) || CPF_ALLOCATION_RATES[CPF_ALLOCATION_RATES.length - 1];

  // Ordinary Wage (capped)
  const owSubjectToCpf = Math.min(grossPay, OW_CEILING);
  
  // Additional Wage (Bonus) - Has its own complex ceiling, but for standard scenarios we apply the rate
  // Simplified AW handling: assuming Annual Wage Ceiling (AWC) of $102,000 is not breached
  const awSubjectToCpf = bonus; 

  const totalSubjectToCpf = owSubjectToCpf + awSubjectToCpf;

  const employeeContribution = Math.floor(totalSubjectToCpf * (rateBracket.employee / 100)); // Standard rules round off
  const employerContribution = Math.floor(totalSubjectToCpf * (rateBracket.employer / 100));
  const totalContribution = employeeContribution + employerContribution;

  // Calculate strict allocations based on the exact % of wage from the CPF Board 
  // (Prevents rounding discrepancies between total and the three accounts)
  const oa = Math.floor(totalSubjectToCpf * allocBracket.oaRate);
  const sa = Math.floor(totalSubjectToCpf * allocBracket.saRate);
  const ma = totalContribution - oa - sa; // The remainder almost always goes to MA based on CPF logic 

  return {
    employeeContribution,
    employerContribution,
    totalContribution,
    allocations: {
      oa,
      sa,
      ma
    }
  };
}
