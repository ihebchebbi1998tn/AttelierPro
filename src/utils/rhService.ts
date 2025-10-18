import axios from 'axios';

const BASE_URL = 'https://luccibyey.com.tn/production/api';

// API Response interface
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  id?: number; // For employee creation response
}

// Employee interfaces
export interface Employee {
  id: number;
  nom: string;
  prenom: string;
  nom_complet?: string;
  poste?: string;
  telephone?: string;
  adresse?: string;
  region?: string;
  statut_civil: 'celibataire' | 'marie' | 'divorce' | 'veuf' | 'autre';
  actif: boolean;
  photo?: string;
  role?: string;
  age?: number;
  carte_identite?: string;
  sexe?: 'homme' | 'femme';
  cnss_code?: string;
  nombre_enfants?: number;
  date_naissance?: string;
  fiche_paie_url?: string;
  chef_de_famille?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface CreateEmployeeData {
  nom: string;
  prenom: string;
  poste?: string;
  telephone?: string;
  adresse?: string;
  region?: string;
  statut_civil?: 'celibataire' | 'marie' | 'divorce' | 'veuf' | 'autre';
  actif?: boolean;
  photo?: string;
  role?: string;
  age?: number;
  carte_identite?: string;
  sexe?: 'homme' | 'femme';
  cnss_code?: string;
  nombre_enfants?: number;
  date_naissance?: string;
  chef_de_famille?: boolean;
}

// Schedule interfaces
export interface Schedule {
  id: number;
  employee_id: number;
  employee_name?: string;
  nom?: string;
  prenom?: string;
  date: string;
  start_time?: string;
  end_time?: string;
  lunch_start?: string;
  lunch_end?: string;
  is_half_day: boolean;
  note?: string;
  created_at: string;
  updated_at?: string;
}

export interface CreateScheduleData {
  employee_id: number;
  date: string;
  start_time?: string;
  end_time?: string;
  lunch_start?: string;
  lunch_end?: string;
  is_half_day?: boolean;
  note?: string;
}

// Shift Template interfaces
export interface ShiftTemplate {
  id: number;
  employee_id: number;
  employee_name?: string;
  nom?: string;
  prenom?: string;
  weekday: number;
  weekday_name?: string;
  start_time: string;
  end_time: string;
  lunch_start?: string;
  lunch_end?: string;
  active: boolean;
  created_at: string;
}

export interface CreateShiftTemplateData {
  employee_id: number;
  weekday: number;
  start_time: string;
  end_time: string;
  lunch_start?: string;
  lunch_end?: string;
  active?: boolean;
}

// Holiday interfaces
export interface Holiday {
  id: number;
  employee_id: number;
  employee_name?: string;
  nom?: string;
  prenom?: string;
  date: string;
  date_end?: string;
  half_day: 'AM' | 'PM' | 'FULL';
  start_time?: string;
  end_time?: string;
  motif?: string;
  status: 'pending' | 'approved' | 'rejected';
  is_paid: boolean;
  created_by?: number;
  approved_by?: number;
  approved_at?: string;
  created_at: string;
  created_by_nom?: string;
  created_by_prenom?: string;
  approved_by_nom?: string;
  approved_by_prenom?: string;
}

export interface CreateHolidayData {
  employee_id: number;
  date: string;
  date_end?: string;
  half_day?: 'AM' | 'PM' | 'FULL';
  start_time?: string;
  end_time?: string;
  motif?: string;
  status?: 'pending' | 'approved' | 'rejected';
  is_paid?: boolean;
  created_by?: number;
}

// Salary interfaces
export interface Salary {
  id: number;
  employee_id: number;
  employee_name?: string;
  nom?: string;
  prenom?: string;
  // New detailed breakdown fields (2025 Tunisian payroll)
  salaire_brut: number;
  cnss: number;
  salaire_brut_imposable: number;
  irpp: number;
  css: number;
  salaire_net: number;
  // Legacy fields (kept for backward compatibility)
  net_total?: number;
  brut_total?: number;
  taxes?: number;
  effective_from: string;
  effective_to?: string;
  note?: string;
  created_at: string;
}

export interface CreateSalaryData {
  employee_id: number;
  salaire_brut: number;
  chef_de_famille: boolean;
  nombre_enfants: number;
  effective_from: string;
  note?: string;
}

// Time Entry interfaces
export interface TimeEntry {
  id: number;
  employee_id: number;
  employee_name?: string;
  nom?: string;
  prenom?: string;
  date: string;
  clock_in?: string;
  clock_out?: string;
  total_hours?: number;
  created_at: string;
}

// Statistics interfaces
export interface RHStatistics {
  total_employees: number;
  active_employees: number;
  total_hours_today: number;
  total_hours_this_week: number;
  total_hours_this_month: number;
  total_hours_this_year: number;
  total_salaries_this_month: number;
  total_salaries_this_year: number;
  avg_hours_per_employee: number;
  avg_salary_per_employee: number;
  pending_holidays: number;
  approved_holidays_this_month: number;
  attendance_rate: number;
}

// Employee API
export const employeeService = {
  // Get all employees with optional filters
  getAll: async (filters?: {
    region?: string;
    status?: string;
    search?: string;
  }): Promise<Employee[]> => {
    const params = new URLSearchParams();
    if (filters?.region && filters.region !== 'all') params.append('region', filters.region);
    if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);

    console.log('🔍 Fetching employees with params:', params.toString());
    const response = await axios.get(
      `${BASE_URL}/rh_employees.php?${params.toString()}`,
      {
        transformResponse: [(data) => {
          // If data is already an object, return it
          if (typeof data === 'object') return data;
          
          // If data is a string, clean it and parse
          if (typeof data === 'string') {
            console.log('⚠️ Response is string, cleaning...');
            // Remove any content before the first {
            const jsonStart = data.indexOf('{');
            if (jsonStart > 0) {
              console.log('⚠️ Removing leading characters:', data.substring(0, jsonStart));
              data = data.substring(jsonStart);
            }
            try {
              return JSON.parse(data);
            } catch (e) {
              console.error('❌ JSON parse error:', e);
              console.error('❌ Data:', data);
              return { success: false, data: [] };
            }
          }
          
          return data;
        }]
      }
    );
    console.log('📦 Cleaned API response:', response.data);
    console.log('📦 response.data.data:', response.data.data);
    console.log('📦 response.data.data is array?', Array.isArray(response.data.data));
    
    // Convert actif string to boolean
    const employees = (response.data.data || []).map((emp: any) => ({
      ...emp,
      actif: emp.actif === '1' || emp.actif === true,
      age: emp.age ? Number(emp.age) : undefined,
      nombre_enfants: emp.nombre_enfants ? Number(emp.nombre_enfants) : 0,
      chef_de_famille: emp.chef_de_famille === '1' || emp.chef_de_famille === true
    }));
    console.log('✅ Processed employees:', employees);
    console.log('✅ Processed employees length:', employees.length);
    return employees;
  },

  // Get single employee
  getById: async (id: number): Promise<Employee | null> => {
    const response = await axios.get<ApiResponse<any>>(
      `${BASE_URL}/rh_employees.php?id=${id}`
    );
    if (!response.data.data) return null;
    // Convert actif string to boolean
    const emp = response.data.data;
    return {
      ...emp,
      actif: emp.actif === '1' || emp.actif === true,
      age: emp.age ? Number(emp.age) : undefined,
      nombre_enfants: emp.nombre_enfants ? Number(emp.nombre_enfants) : 0,
      chef_de_famille: emp.chef_de_famille === '1' || emp.chef_de_famille === true
    };
  },

  // Create new employee
  create: async (data: CreateEmployeeData): Promise<ApiResponse> => {
    const response = await axios.post<ApiResponse>(
      `${BASE_URL}/rh_employees.php`,
      data
    );
    return response.data;
  },

  // Update employee
  update: async (id: number, data: Partial<CreateEmployeeData>): Promise<ApiResponse> => {
    const response = await axios.put<ApiResponse>(
      `${BASE_URL}/rh_employees.php?id=${id}`,
      data
    );
    return response.data;
  },

  // Delete employee
  delete: async (id: number): Promise<ApiResponse> => {
    const response = await axios.delete<ApiResponse>(
      `${BASE_URL}/rh_employees.php?id=${id}`
    );
    return response.data;
  },

  // Upload employee photo
  uploadPhoto: async (employeeId: number, file: File): Promise<ApiResponse> => {
    const formData = new FormData();
    formData.append('employee_id', employeeId.toString());
    formData.append('photo', file);

    const response = await axios.post<ApiResponse>(
      `${BASE_URL}/rh_employee_photo.php`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  // Delete employee photo
  deletePhoto: async (employeeId: number): Promise<ApiResponse> => {
    const response = await axios.delete<ApiResponse>(
      `${BASE_URL}/rh_employee_photo.php?employee_id=${employeeId}`
    );
    return response.data;
  }
};

// Schedule API
export const scheduleService = {
  // Get schedules with optional filters
  getAll: async (filters?: {
    employee_id?: number;
    date?: string;
    date_start?: string;
    date_end?: string;
  }): Promise<Schedule[]> => {
    const params = new URLSearchParams();
    if (filters?.employee_id) params.append('employee_id', filters.employee_id.toString());
    if (filters?.date) params.append('date', filters.date);
    if (filters?.date_start) params.append('date_start', filters.date_start);
    if (filters?.date_end) params.append('date_end', filters.date_end);

    const response = await axios.get<ApiResponse<Schedule[]>>(
      `${BASE_URL}/rh_schedules.php?${params.toString()}`
    );
    return response.data.data || [];
  },

  // Create or update schedule
  createOrUpdate: async (data: CreateScheduleData): Promise<ApiResponse> => {
    const response = await axios.post<ApiResponse>(
      `${BASE_URL}/rh_schedules.php`,
      data
    );
    return response.data;
  },

  // Update schedule
  update: async (id: number, data: Partial<CreateScheduleData>): Promise<ApiResponse> => {
    const response = await axios.put<ApiResponse>(
      `${BASE_URL}/rh_schedules.php?id=${id}`,
      data
    );
    return response.data;
  },

  // Delete schedule
  delete: async (id: number): Promise<ApiResponse> => {
    const response = await axios.delete<ApiResponse>(
      `${BASE_URL}/rh_schedules.php?id=${id}`
    );
    return response.data;
  }
};

// Shift Template API
export const shiftTemplateService = {
  // Get shift templates
  getAll: async (employee_id?: number): Promise<ShiftTemplate[]> => {
    const params = employee_id ? `?employee_id=${employee_id}` : '';
    const response = await axios.get<ApiResponse<ShiftTemplate[]>>(
      `${BASE_URL}/rh_shift_templates.php${params}`
    );
    return response.data.data || [];
  },

  // Create shift template
  create: async (data: CreateShiftTemplateData): Promise<ApiResponse> => {
    const response = await axios.post<ApiResponse>(
      `${BASE_URL}/rh_shift_templates.php`,
      data
    );
    return response.data;
  },

  // Update shift template
  update: async (id: number, data: Partial<CreateShiftTemplateData>): Promise<ApiResponse> => {
    const response = await axios.put<ApiResponse>(
      `${BASE_URL}/rh_shift_templates.php?id=${id}`,
      data
    );
    return response.data;
  },

  // Delete shift template
  delete: async (id: number): Promise<ApiResponse> => {
    const response = await axios.delete<ApiResponse>(
      `${BASE_URL}/rh_shift_templates.php?id=${id}`
    );
    return response.data;
  }
};

// Holiday API
export const holidayService = {
  // Get holidays with optional filters
  getAll: async (filters?: {
    employee_id?: number;
    status?: string;
    date_start?: string;
    date_end?: string;
    year?: string;
  }): Promise<Holiday[]> => {
    const params = new URLSearchParams();
    if (filters?.employee_id) params.append('employee_id', filters.employee_id.toString());
    if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters?.date_start) params.append('date_start', filters.date_start);
    if (filters?.date_end) params.append('date_end', filters.date_end);
    if (filters?.year) params.append('year', filters.year);

    const response = await axios.get<ApiResponse<Holiday[]>>(
      `${BASE_URL}/rh_holidays.php?${params.toString()}`
    );
    return response.data.data || [];
  },

  // Create holiday request
  create: async (data: CreateHolidayData): Promise<ApiResponse> => {
    const response = await axios.post<ApiResponse>(
      `${BASE_URL}/rh_holidays.php`,
      data
    );
    return response.data;
  },

  // Update holiday status (approve/reject)
  updateStatus: async (id: number, status: 'approved' | 'rejected', approved_by?: number): Promise<ApiResponse> => {
    const response = await axios.put<ApiResponse>(
      `${BASE_URL}/rh_holidays.php?id=${id}`,
      { status, approved_by }
    );
    return response.data;
  },

  // Update holiday
  update: async (id: number, data: Partial<CreateHolidayData>): Promise<ApiResponse> => {
    const response = await axios.put<ApiResponse>(
      `${BASE_URL}/rh_holidays.php?id=${id}`,
      data
    );
    return response.data;
  },

  // Delete holiday
  delete: async (id: number): Promise<ApiResponse> => {
    const response = await axios.delete<ApiResponse>(
      `${BASE_URL}/rh_holidays.php?id=${id}`
    );
    return response.data;
  }
};

// Salary API
export const salaryService = {
  // Get salaries with optional filters
  getAll: async (filters?: {
    employee_id?: number;
    current?: boolean;
  }): Promise<Salary[]> => {
    const params = new URLSearchParams();
    if (filters?.employee_id) params.append('employee_id', filters.employee_id.toString());
    if (filters?.current) params.append('current', 'true');

    const response = await axios.get<ApiResponse<Salary[]>>(
      `${BASE_URL}/rh_salaries.php?${params.toString()}`
    );
    return response.data.data || [];
  },

  // Create salary entry
  create: async (data: CreateSalaryData): Promise<ApiResponse> => {
    const response = await axios.post<ApiResponse>(
      `${BASE_URL}/rh_salaries.php`,
      data
    );
    return response.data;
  },

  // Update salary
  update: async (id: number, data: Partial<CreateSalaryData & { effective_to?: string }>): Promise<ApiResponse> => {
    const response = await axios.put<ApiResponse>(
      `${BASE_URL}/rh_salaries.php?id=${id}`,
      data
    );
    return response.data;
  },

  // Delete salary
  delete: async (id: number): Promise<ApiResponse> => {
    const response = await axios.delete<ApiResponse>(
      `${BASE_URL}/rh_salaries.php?id=${id}`
    );
    return response.data;
  }
};

// Time Entry API
export const timeEntryService = {
  // Get time entries with optional filters
  getAll: async (filters?: {
    employee_id?: number;
    date?: string;
    date_start?: string;
    date_end?: string;
  }): Promise<TimeEntry[]> => {
    const params = new URLSearchParams();
    if (filters?.employee_id) params.append('employee_id', filters.employee_id.toString());
    if (filters?.date) params.append('date', filters.date);
    if (filters?.date_start) params.append('date_start', filters.date_start);
    if (filters?.date_end) params.append('date_end', filters.date_end);

    const response = await axios.get<ApiResponse<TimeEntry[]>>(
      `${BASE_URL}/rh_time_entries.php?${params.toString()}`
    );
    return response.data.data || [];
  },

  // Create time entry
  create: async (data: Omit<TimeEntry, 'id' | 'created_at' | 'employee_name' | 'nom' | 'prenom'>): Promise<ApiResponse> => {
    const response = await axios.post<ApiResponse>(
      `${BASE_URL}/rh_time_entries.php`,
      data
    );
    return response.data;
  },

  // Update time entry
  update: async (id: number, data: Partial<Omit<TimeEntry, 'id' | 'created_at' | 'employee_name' | 'nom' | 'prenom'>>): Promise<ApiResponse> => {
    const response = await axios.put<ApiResponse>(
      `${BASE_URL}/rh_time_entries.php?id=${id}`,
      data
    );
    return response.data;
  },

  // Delete time entry
  delete: async (id: number): Promise<ApiResponse> => {
    const response = await axios.delete<ApiResponse>(
      `${BASE_URL}/rh_time_entries.php?id=${id}`
    );
    return response.data;
  }
};

// Pointage interfaces
export interface EmployeePointage {
  id: number;
  employee_id: number;
  month: string;
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
  jr_normalement_trv?: number;
  jr_travaille?: number;
  retard?: number;
  depart_anticipe?: number;
  absent?: number;
  h_sup?: number;
  presence_planning?: string;
  motif?: string;
  ptg_entree_obligatoire?: string;
  ptg_sortie_obligatoire?: string;
  departement?: string;
  ndays?: number;
  weekend?: number;
  holiday?: number;
  presence_reelle?: string;
  weekend_ot?: number;
  ndays_ot?: number;
  holiday_ot?: number;
  sspe_day_holiday_ot?: number;
  jr_travaille_count: number;
  absent_count: number;
  created_at: string;
  updated_at?: string;
}

// Pointage API
export const pointageService = {
  // Get pointage records with optional filters
  getAll: async (filters?: {
    employee_id?: number;
    month?: string;
  }): Promise<EmployeePointage[]> => {
    const params = new URLSearchParams();
    if (filters?.employee_id) params.append('employee_id', filters.employee_id.toString());
    if (filters?.month) params.append('month', filters.month);

    console.log('🔍 Fetching pointage with params:', params.toString());
    const response = await axios.get<ApiResponse<EmployeePointage[]>>(
      `${BASE_URL}/rh_employe_pointage.php?${params.toString()}`
    );
    console.log('📦 Pointage API response:', response.data);
    return response.data.data || [];
  },

  // Create or update pointage records
  createOrUpdateBatch: async (rows: Array<Partial<EmployeePointage> & {
    employee_id: number;
    month: string;
  }>): Promise<ApiResponse> => {
    const response = await axios.post<ApiResponse>(
      `${BASE_URL}/rh_employe_pointage.php`,
      { rows }
    );
    return response.data;
  }
};

// Statistics API
export const statisticsService = {
  // Get RH statistics
  getStats: async (filters?: {
    period?: 'today' | 'week' | 'month' | 'year';
    employee_id?: number;
    date_start?: string;
    date_end?: string;
  }): Promise<RHStatistics> => {
    const params = new URLSearchParams();
    if (filters?.period) params.append('period', filters.period);
    if (filters?.employee_id) params.append('employee_id', filters.employee_id.toString());
    if (filters?.date_start) params.append('date_start', filters.date_start);
    if (filters?.date_end) params.append('date_end', filters.date_end);

    const response = await axios.get<ApiResponse<RHStatistics>>(
      `${BASE_URL}/rh_statistics.php?${params.toString()}`
    );
    return response.data.data || {} as RHStatistics;
  }
};