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

// Default configuration (fallback if API fails)
const DEFAULT_CONFIG: SalaryConfigParams = {
  cnss_rate: 0.0968,
  css_rate: 0.01,
  deduction_chef_famille: 150,
  deduction_per_child: 100,
  tax_brackets: [
    { min_amount: 0, max_amount: 416.66, tax_rate: 0 },
    { min_amount: 416.67, max_amount: 1666.66, tax_rate: 0.26 },
    { min_amount: 1666.67, max_amount: 2500.00, tax_rate: 0.28 },
    { min_amount: 2500.01, max_amount: 4166.66, tax_rate: 0.32 },
    { min_amount: 4166.67, max_amount: null, tax_rate: 0.35 }
  ]
};

/**
 * Calculate progressive income tax (IRPP) based on Tunisian brackets
 */
function calculateIRPP(baseImposable: number, taxBrackets: TaxBracketConfig[]): number {
  let tax = 0;
  
  for (let i = 0; i < taxBrackets.length; i++) {
    const bracket = taxBrackets[i];
    const prevMax = i > 0 ? (taxBrackets[i - 1].max_amount || taxBrackets[i - 1].min_amount) : 0;
    
    if (baseImposable <= prevMax) {
      break;
    }
    
    const maxInBracket = bracket.max_amount !== null ? bracket.max_amount : Infinity;
    const taxableInBracket = Math.min(
      baseImposable - prevMax,
      maxInBracket - prevMax
    );
    
    tax += taxableInBracket * bracket.tax_rate;
  }
  
  return Math.round(tax * 1000) / 1000; // Round to 3 decimals
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
 * Format currency for display
 */
export function formatTND(amount: number): string {
  return `${amount.toFixed(3)} TND`;
}
