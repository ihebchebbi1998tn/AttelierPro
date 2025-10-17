# Leave Tracking Integration with Pointage System

## Overview

The leave tracking system has been integrated directly into the `production_employe_pointage` table. This ensures that leaves (congés) are automatically reflected in the daily work tracking (jr_travaille and absent counts), providing accurate attendance data.

## Database Schema Changes

### New Columns in `production_employe_pointage`

```sql
- leave_type: ENUM('annual', 'sick', 'special', 'unpaid', 'maternity', 'paternity', 'other')
  - Type of leave
  
- leave_duration: ENUM('FULL', 'AM', 'PM', 'HOURS')
  - Duration of leave (full day, morning, afternoon, or specific hours)
  
- leave_hours: DECIMAL(5,2)
  - Number of hours if leave_duration is 'HOURS'
  
- leave_status: ENUM('pending', 'approved', 'rejected')
  - Status of the leave request
  
- is_paid_leave: TINYINT(1)
  - Whether the leave is paid (1) or unpaid (0)
```

## Migration

Run the migration to add leave tracking columns:

```bash
php production/api/run_alter_pointage_for_leave_tracking.php
```

## How It Works

### 1. **Full Day Leave**
When `leave_duration = 'FULL'`:
- `jr_travaille` = 0
- `absent` = 1
- `jr_travaille_count` = 0
- `absent_count` = 1

### 2. **Half Day Leave (AM or PM)**
When `leave_duration = 'AM'` or `'PM'`:
- `jr_travaille` = 0.5
- `absent` = 0.5
- `jr_travaille_count` = 0
- `absent_count` = 1

### 3. **Hours-Based Leave**
When `leave_duration = 'HOURS'`:
- Calculation based on `leave_hours` / standard hours (8)
- Example: 4 hours leave
  - `jr_travaille` = 0.5 (4/8)
  - `absent` = 0.5 (4/8)

## API Usage

### Mark a Single Day Leave

```javascript
import { pointageService } from '@/utils/pointageService';

await pointageService.markLeave({
  employee_id: 5,
  date: '2025-10-15',
  leave_type: 'annual',
  leave_duration: 'FULL',
  motif: 'Congé annuel',
  is_paid_leave: true,
  leave_status: 'approved'
});
```

### Mark a Date Range Leave

```javascript
await pointageService.markLeaveRange(
  employeeId: 5,
  start_date: '2025-10-15',
  end_date: '2025-10-20',
  {
    leave_type: 'annual',
    leave_duration: 'FULL',
    motif: 'Congé annuel',
    is_paid_leave: true,
    leave_status: 'approved'
  }
);
```

### Mark Hours-Based Leave

```javascript
await pointageService.markLeave({
  employee_id: 5,
  date: '2025-10-15',
  leave_type: 'sick',
  leave_duration: 'HOURS',
  leave_hours: 4, // 4 hours
  motif: 'Rendez-vous médical',
  is_paid_leave: true,
  leave_status: 'approved'
});
```

### Get Leave Records

```javascript
// Get all leave records for an employee
const leaveRecords = await pointageService.getLeaveRecords({
  employee_id: 5,
  month: '2025-10'
});

// Get pending leave requests
const pendingLeaves = await pointageService.getLeaveRecords({
  leave_status: 'pending'
});
```

## Frontend Integration

The "Marquer en congé" (Mark as Leave) feature in the HR module now:

1. **Creates pointage records** with leave information instead of separate holiday records
2. **Automatically calculates** jr_travaille and absent based on leave duration
3. **Supports multiple leave types**: annual, sick, special, unpaid, maternity, paternity
4. **Supports multiple durations**: full day, half day (AM/PM), or specific hours
5. **Maintains leave status**: pending, approved, rejected

## Benefits

### 1. **Single Source of Truth**
- All attendance and leave data in one table
- No need to reconcile separate holiday and pointage tables

### 2. **Accurate Calculations**
- `jr_travaille` and `absent` automatically reflect leave days
- Monthly totals (`jr_travaille_count`, `absent_count`) are accurate

### 3. **Flexible Leave Tracking**
- Support for full day, half day (AM/PM), or hourly leaves
- Different leave types with different business rules

### 4. **Excel Import Compatibility**
- Existing Excel import functionality continues to work
- Can now import leave data alongside attendance data

## Backward Compatibility

### Old Holiday Table
The `production_holidays` table can still be used if needed, but the recommended approach is to use the integrated pointage system for:
- More accurate calculations
- Single source of truth
- Better reporting

### Migration Path
If you have existing data in `production_holidays`:
1. Keep the old table for historical reference
2. Use the new pointage-based system going forward
3. Optional: Migrate old holidays to pointage records with a migration script

## Example Scenarios

### Scenario 1: Employee Takes 3 Days Annual Leave
```javascript
await pointageService.markLeaveRange(
  5, // employee_id
  '2025-10-20',
  '2025-10-22',
  {
    leave_type: 'annual',
    leave_duration: 'FULL',
    motif: 'Vacances',
    is_paid_leave: true,
    leave_status: 'approved'
  }
);
```
Result: 3 pointage records created, each with `jr_travaille = 0`, `absent = 1`

### Scenario 2: Employee Has Medical Appointment (4 hours)
```javascript
await pointageService.markLeave({
  employee_id: 5,
  date: '2025-10-25',
  leave_type: 'sick',
  leave_duration: 'HOURS',
  leave_hours: 4,
  motif: 'Rendez-vous médical',
  is_paid_leave: true,
  leave_status: 'approved'
});
```
Result: 1 pointage record with `jr_travaille = 0.5`, `absent = 0.5`

### Scenario 3: Half Day Leave (Morning)
```javascript
await pointageService.markLeave({
  employee_id: 5,
  date: '2025-10-26',
  leave_type: 'special',
  leave_duration: 'AM',
  motif: 'Affaires personnelles',
  is_paid_leave: true,
  leave_status: 'approved'
});
```
Result: 1 pointage record with `jr_travaille = 0.5`, `absent = 0.5`

## Salary Integration

When calculating salaries:
- **Paid leaves** (`is_paid_leave = 1`): Count as worked days for salary calculation
- **Unpaid leaves** (`is_paid_leave = 0`): Deducted from salary
- Use `jr_travaille` to calculate actual worked days including paid leaves
- Use `absent` to identify unpaid absences

## Reporting

### Monthly Attendance Report
```sql
SELECT 
  employee_id,
  month,
  SUM(jr_travaille) as total_days_worked,
  SUM(absent) as total_days_absent,
  SUM(CASE WHEN leave_type IS NOT NULL AND is_paid_leave = 1 THEN absent ELSE 0 END) as paid_leave_days,
  SUM(CASE WHEN leave_type IS NOT NULL AND is_paid_leave = 0 THEN absent ELSE 0 END) as unpaid_leave_days
FROM production_employe_pointage
WHERE month = '2025-10'
GROUP BY employee_id, month;
```

### Leave Balance Report
Track how many leave days each employee has used:
```sql
SELECT 
  employee_id,
  leave_type,
  SUM(absent) as days_used
FROM production_employe_pointage
WHERE leave_type IS NOT NULL 
  AND YEAR(date) = 2025
GROUP BY employee_id, leave_type;
```

## Testing

Test the integration:
1. Mark a full day leave for an employee
2. Check that `jr_travaille = 0` and `absent = 1`
3. Mark a half day leave
4. Check that `jr_travaille = 0.5` and `absent = 0.5`
5. Import Excel data - should not affect leave records
6. Verify salary calculations use correct worked days
