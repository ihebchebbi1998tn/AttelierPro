const API_BASE_URL = 'https://luccibyey.com.tn/api';

export interface Measurement {
  name: string;
  value: number;
  tolerance: number;
}

export interface MeasurementsResponse {
  success: boolean;
  data?: {
    order_id: number;
    measurements: Measurement[];
    measurements_object: Record<string, number>;
    tolerance_object: Record<string, number>;
    count: number;
  };
  message?: string;
  error?: string;
}

export interface MeasurementOperationResponse {
  success: boolean;
  measurements?: Record<string, number>;
  tolerance?: Record<string, number>;
  message?: string;
  error?: string;
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

export const measurementService = {
  // Get all measurements for an order
  async getMeasurements(orderId: number): Promise<MeasurementsResponse> {
    try {
      const response = await apiRequest(`/measurements_get.php?order_id=${orderId}`);
      return response;
    } catch (error) {
      console.error('Error fetching measurements:', error);
      throw error;
    }
  },

  // Add a new measurement to an order
  async createMeasurement(
    orderId: number,
    measurementName: string,
    measurementValue: number,
    toleranceValue: number
  ): Promise<MeasurementOperationResponse> {
    try {
      const response = await apiRequest('/measurements_create.php', {
        method: 'POST',
        body: JSON.stringify({
          order_id: orderId,
          measurement_name: measurementName,
          measurement_value: measurementValue,
          tolerance_value: toleranceValue
        })
      });
      return response;
    } catch (error) {
      console.error('Error creating measurement:', error);
      throw error;
    }
  },

  // Update an existing measurement
  async updateMeasurement(
    orderId: number,
    oldMeasurementName: string,
    newMeasurementName: string,
    measurementValue: number,
    toleranceValue: number
  ): Promise<MeasurementOperationResponse> {
    try {
      const response = await apiRequest('/measurements_update.php', {
        method: 'PUT',
        body: JSON.stringify({
          order_id: orderId,
          old_measurement_name: oldMeasurementName,
          new_measurement_name: newMeasurementName,
          measurement_value: measurementValue,
          tolerance_value: toleranceValue
        })
      });
      return response;
    } catch (error) {
      console.error('Error updating measurement:', error);
      throw error;
    }
  },

  // Delete a measurement from an order
  async deleteMeasurement(
    orderId: number,
    measurementName: string
  ): Promise<MeasurementOperationResponse> {
    try {
      const response = await apiRequest('/measurements_delete.php', {
        method: 'DELETE',
        body: JSON.stringify({
          order_id: orderId,
          measurement_name: measurementName
        })
      });
      return response;
    } catch (error) {
      console.error('Error deleting measurement:', error);
      throw error;
    }
  },

  // Bulk update all measurements for an order
  async bulkUpdateMeasurements(
    orderId: number,
    measurements: Record<string, number>,
    tolerance: Record<string, number>
  ): Promise<MeasurementOperationResponse> {
    try {
      const response = await apiRequest('/measurements_bulk_update.php', {
        method: 'PUT',
        body: JSON.stringify({
          order_id: orderId,
          measurements: measurements,
          tolerance: tolerance
        })
      });
      return response;
    } catch (error) {
      console.error('Error bulk updating measurements:', error);
      throw error;
    }
  },

  // Convert measurements array to objects for API calls
  measurementsArrayToObjects(measurements: Measurement[]): {
    measurements: Record<string, number>;
    tolerance: Record<string, number>;
  } {
    const measurementsObj: Record<string, number> = {};
    const toleranceObj: Record<string, number> = {};

    measurements.forEach(m => {
      measurementsObj[m.name] = m.value;
      toleranceObj[m.name] = m.tolerance;
    });

    return {
      measurements: measurementsObj,
      tolerance: toleranceObj
    };
  },

  // Convert objects to measurements array for UI
  objectsToMeasurementsArray(
    measurements: Record<string, number>,
    tolerance: Record<string, number>
  ): Measurement[] {
    return Object.entries(measurements).map(([name, value]) => ({
      name,
      value,
      tolerance: tolerance[name] || 0.5
    }));
  }
};