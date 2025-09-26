const API_BASE_URL = 'https://luccibyey.com.tn/api';

export interface DynamicTry {
  id: number;
  order_id: number;
  try_number: number;
  scheduled_date: string;
  scheduled_time?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface DynamicTriesResponse {
  success: boolean;
  tries: DynamicTry[];
}

export interface AddTryRequest {
  order_id: number;
  scheduled_date: string;
  scheduled_time?: string;
}

export interface UpdateTryRequest {
  try_id: number;
  scheduled_date?: string;
  scheduled_time?: string;
  completed_at?: string | null;
}

const apiRequest = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(API_BASE_URL + url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  
  const data = await response.json();
  return data;
};

export const getDynamicTries = async (orderId: number): Promise<DynamicTry[]> => {
  try {
    const response = await apiRequest(`/get_sur_mesure_tries.php?order_id=${orderId}`);
    if (response.success) {
      return response.tries;
    }
    throw new Error(response.error || 'Failed to fetch tries');
  } catch (error) {
    console.error('Error fetching dynamic tries:', error);
    
    // Fallback: Return empty array if API is not available yet
    // This allows the component to render without tries until the server is configured
    console.warn('Falling back to empty tries list - server configuration needed');
    return [];
  }
};

export const addDynamicTry = async (tryData: AddTryRequest): Promise<DynamicTry> => {
  try {
    const response = await apiRequest('/add_sur_mesure_try.php', {
      method: 'POST',
      body: JSON.stringify(tryData)
    });
    
    if (response.success) {
      return response.try;
    }
    throw new Error(response.error || 'Failed to add try');
  } catch (error) {
    console.error('Error adding dynamic try:', error);
    throw error;
  }
};

export const updateDynamicTry = async (tryData: UpdateTryRequest): Promise<DynamicTry> => {
  console.log('🌐 updateDynamicTry called with:', tryData);
  
  try {
    const response = await apiRequest('/update_sur_mesure_try.php', {
      method: 'POST',
      body: JSON.stringify(tryData)
    });
    
    console.log('🌐 updateDynamicTry API response:', response);
    
    if (response.success) {
      console.log('✅ updateDynamicTry success, returning try:', response.try);
      return response.try;
    }
    throw new Error(response.error || 'Failed to update try');
  } catch (error) {
    console.error('❌ Error updating dynamic try:', error);
    throw error;
  }
};

export const deleteDynamicTry = async (tryId: number): Promise<void> => {
  try {
    const response = await apiRequest('/delete_sur_mesure_try.php', {
      method: 'POST',
      body: JSON.stringify({ try_id: tryId })
    });
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete try');
    }
  } catch (error) {
    console.error('Error deleting dynamic try:', error);
    throw error;
  }
};

// Helper function to get ordinal numbers in French
export const getOrdinalFrench = (num: number): string => {
  if (num === 1) return '1er';
  return `${num}ème`;
};

// Helper function to validate try date sequence
export const validateTrySequence = (tries: DynamicTry[], newTryNumber: number, newDate: string): string | null => {
  const newDateTime = new Date(newDate);
  
  // Check if the new date is before any previous try
  for (const existingTry of tries) {
    if (existingTry.try_number < newTryNumber) {
      const existingDate = existingTry.completed_at ? 
        new Date(existingTry.completed_at) : 
        new Date(existingTry.scheduled_date);
      
      if (newDateTime < existingDate) {
        return `La date du ${getOrdinalFrench(newTryNumber)} essai ne peut pas être antérieure à celle du ${getOrdinalFrench(existingTry.try_number)} essai`;
      }
    }
  }
  
  return null; // No validation errors
};