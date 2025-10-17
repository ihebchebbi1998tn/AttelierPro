import axios from 'axios';

const API_BASE_URL = 'https://luccibyey.com.tn/production/api';

export interface PointageRecord {
  id: number;
  employee_id: number;
  emp_no?: string;
  matricule?: string;
  prenom?: string;
  nom?: string;
  jr_repos?: string;
  date?: string;
  horaire?: string;
  debut?: string;
  fin?: string;
  entree?: string;
  sortie?: string;
  jr_normalement_trv: number;
  jr_travaille: number;
  retard: number;
  depart_anticipe: number;
  absent: number;
  h_sup: number;
  presence_planning?: string;
  motif?: string;
  ptg_entree_obligatoire?: string;
  ptg_sortie_obligatoire?: string;
  departement?: string;
  ndays: number;
  weekend: number;
  holiday: number;
  presence_reelle?: string;
  weekend_ot: number;
  ndays_ot: number;
  holiday_ot: number;
  sspe_day_holiday_ot: number;
  month: string;
  jr_travaille_count: number;
  absent_count: number;
  leave_type?: 'annual' | 'sick' | 'special' | 'unpaid' | 'maternity' | 'paternity' | 'other';
  leave_duration?: 'FULL' | 'AM' | 'PM' | 'HOURS';
  leave_hours?: number;
  leave_status?: 'pending' | 'approved' | 'rejected';
  is_paid_leave?: boolean;
  created_at: string;
  updated_at: string;
}

export interface MarkLeaveData {
  employee_id: number;
  date: string;
  leave_type: 'annual' | 'sick' | 'special' | 'unpaid' | 'maternity' | 'paternity' | 'other';
  leave_duration: 'FULL' | 'AM' | 'PM' | 'HOURS';
  leave_hours?: number;
  motif?: string;
  is_paid_leave?: boolean;
  leave_status?: 'pending' | 'approved' | 'rejected';
}

export const pointageService = {
  /**
   * Get pointage records with optional filters
   */
  async getPointage(filters?: { employee_id?: number; month?: string }): Promise<PointageRecord[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.employee_id) params.append('employee_id', filters.employee_id.toString());
      if (filters?.month) params.append('month', filters.month);

      const response = await axios.get(`${API_BASE_URL}/rh_employe_pointage.php?${params.toString()}`);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch pointage');
      }
    } catch (error) {
      console.error('Error fetching pointage:', error);
      throw error;
    }
  },

  /**
   * Mark an employee as on leave for a specific date
   * This creates/updates a pointage record with leave information
   */
  async markLeave(data: MarkLeaveData): Promise<{ success: boolean; message: string }> {
    try {
      const payload = {
        mark_leave: true,
        employee_id: data.employee_id,
        date: data.date,
        leave_type: data.leave_type,
        leave_duration: data.leave_duration,
        leave_hours: data.leave_hours,
        motif: data.motif,
        is_paid_leave: data.is_paid_leave !== undefined ? (data.is_paid_leave ? 1 : 0) : 1,
        leave_status: data.leave_status || 'approved'
      };

      console.log('📤 Sending to API:', `${API_BASE_URL}/rh_employe_pointage.php`);
      console.log('📦 Payload:', payload);

      const response = await axios.post(`${API_BASE_URL}/rh_employe_pointage.php`, payload);
      
      console.log('📥 API Response:', response.data);
      console.log('✅ Success status:', response.data.success);
      console.log('💬 Message:', response.data.message);
      
      return {
        success: response.data.success,
        message: response.data.message
      };
    } catch (error) {
      console.error('❌ Error marking leave:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('📥 Error response:', error.response.data);
      }
      throw error;
    }
  },

  /**
   * Mark multiple days as leave (for date ranges)
   */
  async markLeaveRange(
    employee_id: number,
    start_date: string,
    end_date: string,
    leave_data: Omit<MarkLeaveData, 'employee_id' | 'date'>
  ): Promise<{ success: boolean; message: string }> {
    try {
      const start = new Date(start_date);
      const end = new Date(end_date);
      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      
      const promises = [];
      for (let i = 0; i <= daysDiff; i++) {
        const currentDate = new Date(start);
        currentDate.setDate(start.getDate() + i);
        
        // Skip weekends if needed (optional - can be configured)
        const dayOfWeek = currentDate.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          continue; // Skip Sunday (0) and Saturday (6)
        }
        
        promises.push(
          this.markLeave({
            employee_id,
            date: currentDate.toISOString().split('T')[0],
            ...leave_data
          })
        );
      }
      
      await Promise.all(promises);
      
      return {
        success: true,
        message: `Congé marqué pour ${promises.length} jour(s)`
      };
    } catch (error) {
      console.error('Error marking leave range:', error);
      throw error;
    }
  },

  /**
   * Import bulk pointage records (from Excel etc.)
   */
  async importPointage(rows: Partial<PointageRecord>[]): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axios.post(`${API_BASE_URL}/rh_employe_pointage.php`, { rows });
      
      return {
        success: response.data.success,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error importing pointage:', error);
      throw error;
    }
  },

  /**
   * Get leave records from pointage (records where leave_type is set)
   */
  async getLeaveRecords(filters?: { employee_id?: number; month?: string; leave_status?: string }): Promise<PointageRecord[]> {
    try {
      const allRecords = await this.getPointage({
        employee_id: filters?.employee_id,
        month: filters?.month
      });
      
      // Filter for records with leave information
      let leaveRecords = allRecords.filter(record => record.leave_type !== null && record.leave_type !== undefined);
      
      // Apply leave_status filter if provided
      if (filters?.leave_status && filters.leave_status !== 'all') {
        leaveRecords = leaveRecords.filter(record => record.leave_status === filters.leave_status);
      }
      
      return leaveRecords;
    } catch (error) {
      console.error('Error fetching leave records:', error);
      throw error;
    }
  }
};
