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
    deduction_professionnelle: number;
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

// Default configuration (fallback if API fails) - 2025 Tunisia Tax Brackets
const DEFAULT_CONFIG: SalaryConfigParams = {
  cnss_rate: 0.0968, // 9.18% + 0.5% FOPROLOS
  css_rate: 0.01, // 1%
  deduction_chef_famille: 300, // Annual: 300 TND
  deduction_per_child: 100, // Annual: 100 TND per child
  // 2025 Progressive tax brackets (ANNUAL amounts in TND)
  tax_brackets: [
    { min_amount: 0, max_amount: 5000, tax_rate: 0.0000 },      // 0-5,000: 0%
    { min_amount: 5000, max_amount: 10000, tax_rate: 0.1500 },    // 5,000-10,000: 15%
    { min_amount: 10000, max_amount: 20000, tax_rate: 0.2500 },   // 10,000-20,000: 25%
    { min_amount: 20000, max_amount: 30000, tax_rate: 0.3000 },  // 20,000-30,000: 30%
    { min_amount: 30000, max_amount: 40000, tax_rate: 0.3300 },  // 30,000-40,000: 33%
    { min_amount: 40000, max_amount: 50000, tax_rate: 0.3600 },  // 40,000-50,000: 36%
    { min_amount: 50000, max_amount: 70000, tax_rate: 0.3800 },  // 50,000-70,000: 38%
    { min_amount: 70000, max_amount: null, tax_rate: 0.4000 }       // > 70,000: 40%
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
 * Calculate complete salary breakdown according to Tunisian law 2025
 * This follows the ANNUAL calculation method as per official tax law
 * @param input - Salary calculation input (monthly gross)
 * @param config - Optional configuration parameters (uses defaults if not provided)
 */
export function calculateTunisianSalary(
  input: SalaryCalculationInput, 
  config: SalaryConfigParams = DEFAULT_CONFIG
): SalaryCalculationResult {
  const { salaire_brut, chef_de_famille, nombre_enfants } = input;
  
  // Step 1: Convert to annual amounts for IRPP calculation
  const salaire_brut_annuel = salaire_brut * 12;
  
  // Step 2: Calculate annual CNSS (employee social contribution: 9.68%)
  const cnss_annuel = salaire_brut_annuel * config.cnss_rate;
  
  // Step 3: Calculate salary after CNSS
  const salaire_apres_cnss = salaire_brut_annuel - cnss_annuel;
  
  // Step 4: Calculate professional deduction (10% capped at 2,000 TND annually)
  const deduction_professionnelle = Math.min(salaire_apres_cnss * 0.10, 2000);
  
  // Step 5: Calculate family deductions (annual amounts)
  const deduction_chef_famille = chef_de_famille ? config.deduction_chef_famille : 0;
  const deduction_enfants = Math.min(nombre_enfants, 4) * config.deduction_per_child; // Max 4 children
  const deductions_familiales = deduction_chef_famille + deduction_enfants;
  
  // Step 6: Calculate annual taxable base
  const base_imposable_annuelle = Math.max(0, 
    salaire_apres_cnss - deduction_professionnelle - deductions_familiales
  );
  
  // Step 7: Calculate annual IRPP using progressive tax brackets
  const irpp_annuel = calculateIRPP(base_imposable_annuelle, config.tax_brackets);
  
  // Step 8: Calculate annual CSS (1% of gross after CNSS)
  const css_annuel = salaire_apres_cnss * config.css_rate;
  
  // Step 9: Calculate annual net salary
  const salaire_net_annuel = salaire_brut_annuel - cnss_annuel - irpp_annuel - css_annuel;
  
  // Step 10: Convert back to monthly amounts
  const cnss = Math.round((cnss_annuel / 12) * 1000) / 1000;
  const salaire_brut_imposable = Math.round((salaire_apres_cnss / 12) * 1000) / 1000;
  const irpp = Math.round((irpp_annuel / 12) * 1000) / 1000;
  const css = Math.round((css_annuel / 12) * 1000) / 1000;
  const salaire_net = Math.round((salaire_net_annuel / 12) * 1000) / 1000;
  
  // Monthly deductions for display (divided by 12)
  const deductions_fiscales = Math.round(((deduction_professionnelle + deductions_familiales) / 12) * 1000) / 1000;
  const base_imposable = Math.round((base_imposable_annuelle / 12) * 1000) / 1000;
  
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
      deduction_chef_famille: Math.round((deduction_chef_famille / 12) * 1000) / 1000,
      deduction_enfants: Math.round((deduction_enfants / 12) * 1000) / 1000,
      deduction_professionnelle: Math.round((deduction_professionnelle / 12) * 1000) / 1000
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
