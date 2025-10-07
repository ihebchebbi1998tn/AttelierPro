import axios from 'axios';

const BASE_URL = 'https://luccibyey.com.tn/production/api';

export interface SalaryConfig {
  id: number;
  config_key: string;
  config_value: number;
  description?: string;
  updated_at: string;
}

export interface TaxBracket {
  id: number;
  bracket_order: number;
  min_amount: number;
  max_amount?: number;
  tax_rate: number;
  description?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FullSalaryConfig {
  config: SalaryConfig[];
  tax_brackets: TaxBracket[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

export const salaryConfigService = {
  // Get all configuration
  getFullConfig: async (): Promise<FullSalaryConfig> => {
    const response = await axios.get<ApiResponse<FullSalaryConfig>>(
      `${BASE_URL}/salary_config.php?type=full`
    );
    return response.data.data || { config: [], tax_brackets: [] };
  },

  // Update a config value
  updateConfig: async (config_key: string, config_value: number, description?: string): Promise<ApiResponse> => {
    const response = await axios.put<ApiResponse>(
      `${BASE_URL}/salary_config.php?type=config`,
      { config_key, config_value, description }
    );
    return response.data;
  },

  // Update a tax bracket
  updateBracket: async (id: number, data: Partial<TaxBracket>): Promise<ApiResponse> => {
    const response = await axios.put<ApiResponse>(
      `${BASE_URL}/salary_config.php?type=bracket&id=${id}`,
      data
    );
    return response.data;
  },

  // Add new tax bracket
  addBracket: async (data: Omit<TaxBracket, 'id' | 'active' | 'created_at' | 'updated_at'>): Promise<ApiResponse> => {
    const response = await axios.post<ApiResponse>(
      `${BASE_URL}/salary_config.php?type=bracket`,
      data
    );
    return response.data;
  },

  // Delete (deactivate) tax bracket
  deleteBracket: async (id: number): Promise<ApiResponse> => {
    const response = await axios.delete<ApiResponse>(
      `${BASE_URL}/salary_config.php?type=bracket&id=${id}`
    );
    return response.data;
  }
};
