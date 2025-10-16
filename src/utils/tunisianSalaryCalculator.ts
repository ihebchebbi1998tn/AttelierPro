/**
 * Tunisian Salary Calculator - 2025
 * Based on official Loi de Finances 2025
 * Now supports dynamic configuration from database
 */

export interface SalaryCalculationInput {
  salaire_brut: number;
  chef_de_famille: boolean;
  nombre_enfants: number;
}

export interface SalaryCalculationResult {
  salaire_brut: number;
  cnss: number;
  salaire_brut_imposable: number;
  deductions_fiscales: number;
  base_imposable: number;
  irpp: number;
  css: number;
  salaire_net: number;
  breakdown: {
    deduction_chef_famille: number;
    deduction_enfants: number;
  };
}

export interface TaxBracketConfig {
  min_amount: number;
  max_amount: number | null;
  tax_rate: number;
}

export interface SalaryConfigParams {
  cnss_rate: number;
  css_rate: number;
  deduction_chef_famille: number;
  deduction_per_child: number;
  tax_brackets: TaxBracketConfig[];
}

// Default configuration (fallback if API fails) - 2025 Tunisia Tax Brackets (Loi de Finances 2025)
const DEFAULT_CONFIG: SalaryConfigParams = {
  cnss_rate: 0.0968, // 9.18% + 0.5% FOPROLOS
  css_rate: 0.005, // 0.5% (updated from 1% in 2025)
  deduction_chef_famille: 300, // 300 TND (updated from 150 TND in 2025)
  deduction_per_child: 100,
  // 2025 Progressive tax brackets (monthly - derived from annual barème ÷ 12)
  tax_brackets: [
    { min_amount: 0.000, max_amount: 416.667, tax_rate: 0.0000 },      // 0-416.67 TND: 0% (Annual: 0-5,000)
    { min_amount: 416.667, max_amount: 833.333, tax_rate: 0.1500 },    // 416.67-833.33: 15% (Annual: 5,000-10,000)
    { min_amount: 833.333, max_amount: 1666.667, tax_rate: 0.2500 },   // 833.33-1,666.67: 25% (Annual: 10,000-20,000)
    { min_amount: 1666.667, max_amount: 2500.000, tax_rate: 0.3000 },  // 1,666.67-2,500: 30% (Annual: 20,000-30,000)
    { min_amount: 2500.000, max_amount: 3333.333, tax_rate: 0.3300 },  // 2,500-3,333.33: 33% (Annual: 30,000-40,000)
    { min_amount: 3333.333, max_amount: 4166.667, tax_rate: 0.3600 },  // 3,333.33-4,166.67: 36% (Annual: 40,000-50,000)
    { min_amount: 4166.667, max_amount: 5833.333, tax_rate: 0.3800 },  // 4,166.67-5,833.33: 38% (Annual: 50,000-70,000)
    { min_amount: 5833.333, max_amount: null, tax_rate: 0.4000 }       // > 5,833.33: 40% (Annual: > 70,000)
  ]
};

/**
 * Calculate progressive income tax (IRPP) based on Tunisian brackets
 * Uses proper bracket logic: each bracket taxes the portion that falls within it
 */
function calculateIRPP(baseImposable: number, taxBrackets: TaxBracketConfig[]): number {
  if (baseImposable <= 0) return 0;
  
  let tax = 0;
  
  for (const bracket of taxBrackets) {
    // Skip brackets below the taxable income
    if (baseImposable <= bracket.min_amount) {
      continue;
    }
    
    // Calculate the portion of income in this bracket
    const maxInBracket = bracket.max_amount !== null ? bracket.max_amount : Infinity;
    const minInBracket = bracket.min_amount;
    
    // The taxable amount in this bracket is the minimum of:
    // - the income that falls in this bracket (baseImposable - minInBracket)
    // - the width of the bracket (maxInBracket - minInBracket)
    const taxableInBracket = Math.min(
      baseImposable - minInBracket,
      maxInBracket - minInBracket
    );
    
    // Only tax positive amounts
    if (taxableInBracket > 0) {
      tax += taxableInBracket * bracket.tax_rate;
    }
    
    // If we've covered all the income, stop
    if (baseImposable <= maxInBracket) {
      break;
    }
  }
  
  return Math.round(tax * 1000) / 1000; // Round to 3 decimals (TND format)
}

/**
 * Calculate complete salary breakdown according to Tunisian law
 * @param input - Salary calculation input
 * @param config - Optional configuration parameters (uses defaults if not provided)
 */
export function calculateTunisianSalary(
  input: SalaryCalculationInput, 
  config: SalaryConfigParams = DEFAULT_CONFIG
): SalaryCalculationResult {
  const { salaire_brut, chef_de_famille, nombre_enfants } = input;
  
  // Step 1: Calculate CNSS (employee social contribution)
  const cnss = Math.round(salaire_brut * config.cnss_rate * 1000) / 1000;
  
  // Step 2: Calculate taxable salary
  const salaire_brut_imposable = Math.round((salaire_brut - cnss) * 1000) / 1000;
  
  // Step 3: Calculate fiscal deductions
  const deduction_chef_famille = chef_de_famille ? config.deduction_chef_famille : 0;
  const deduction_enfants = nombre_enfants * config.deduction_per_child;
  const deductions_fiscales = deduction_chef_famille + deduction_enfants;
  
  // Step 4: Calculate taxable base after deductions
  const base_imposable = Math.max(0, salaire_brut_imposable - deductions_fiscales);
  
  // Step 5: Calculate income tax (IRPP) using provided tax brackets
  const irpp = calculateIRPP(base_imposable, config.tax_brackets);
  
  // Step 6: Calculate social solidarity contribution (CSS)
  const css = Math.round(salaire_brut_imposable * config.css_rate * 1000) / 1000;
  
  // Step 7: Calculate net salary
  const salaire_net = Math.round((salaire_brut - cnss - irpp - css) * 1000) / 1000;
  
  return {
    salaire_brut,
    cnss,
    salaire_brut_imposable,
    deductions_fiscales,
    base_imposable,
    irpp,
    css,
    salaire_net,
    breakdown: {
      deduction_chef_famille,
      deduction_enfants
    }
  };
}

/**
 * Reverse calculation: Calculate gross salary from desired net salary
 * Uses iterative approach since IRPP is progressive
 */
export function calculateGrossFromNet(
  desiredNet: number,
  chef_de_famille: boolean,
  nombre_enfants: number,
  config: SalaryConfigParams = DEFAULT_CONFIG
): SalaryCalculationResult {
  // Initial estimate: net salary is roughly 85-90% of gross
  let estimatedGross = desiredNet / 0.87;
  let iterations = 0;
  const maxIterations = 50;
  const tolerance = 0.01; // 0.01 TND tolerance
  
  while (iterations < maxIterations) {
    const result = calculateTunisianSalary(
      { salaire_brut: estimatedGross, chef_de_famille, nombre_enfants },
      config
    );
    
    const netDifference = result.salaire_net - desiredNet;
    
    // If we're close enough, return the result
    if (Math.abs(netDifference) < tolerance) {
      return result;
    }
    
    // Adjust estimate based on difference
    // If net is too high, decrease gross; if too low, increase gross
    const adjustmentFactor = 1 + (netDifference / desiredNet) * -0.5;
    estimatedGross *= adjustmentFactor;
    
    iterations++;
  }
  
  // Final calculation with best estimate
  return calculateTunisianSalary(
    { salaire_brut: estimatedGross, chef_de_famille, nombre_enfants },
    config
  );
}

/**
 * Format currency for display
 */
export function formatTND(amount: number): string {
  const numAmount = Number(amount);
  if (isNaN(numAmount)) return '0.000 TND';
  return `${numAmount.toFixed(3)} TND`;
}
