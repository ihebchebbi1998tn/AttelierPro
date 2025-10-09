import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, FileText } from "lucide-react";
import { Employee, Salary, shiftTemplateService, holidayService } from "@/utils/rhService";
import { SalaryCalculationResult } from "@/utils/tunisianSalaryCalculator";
import { format, getDaysInMonth, getDay } from "date-fns";
import { fr } from "date-fns/locale";
import { useEffect, useState } from "react";

interface PaySlipModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee;
  salary?: Salary;
  calculatedSalary?: SalaryCalculationResult;
  month?: string; // Format: YYYY-MM
  workDays?: number;
  showIRPPBreakdown?: boolean; // Show detailed IRPP calculation
}

export const PaySlipModal = ({ 
  open, 
  onOpenChange, 
  employee, 
  salary, 
  calculatedSalary,
  month, 
  workDays: providedWorkDays,
  showIRPPBreakdown = true 
}: PaySlipModalProps) => {
  const monthDate = month ? new Date(month + "-01") : new Date();
  const monthName = format(monthDate, "MMMM yyyy", { locale: fr });
  
  const [calculatedWorkDays, setCalculatedWorkDays] = useState<number>(providedWorkDays || 26);

  // Calculate actual work days based on shift templates and sick days
  useEffect(() => {
    const calculateWorkDays = async () => {
      if (!month) return;

      try {
        // Get shift templates for the employee
        const templates = await shiftTemplateService.getAll(employee.id);
        const activeTemplates = templates.filter(t => t.active);

        // Get sick days (approved holidays) for this month
        const [year, monthNum] = month.split('-');
        const startDate = `${month}-01`;
        const daysInMonth = getDaysInMonth(new Date(month + "-01"));
        const endDate = `${month}-${daysInMonth.toString().padStart(2, '0')}`;
        
        const holidays = await holidayService.getAll({
          employee_id: employee.id,
          status: 'approved',
          date_start: startDate,
          date_end: endDate
        });

        // Count work days based on shift templates
        let workDaysCount = 0;
        for (let day = 1; day <= daysInMonth; day++) {
          const currentDate = new Date(parseInt(year), parseInt(monthNum) - 1, day);
          const weekday = getDay(currentDate); // 0 = Sunday, 1 = Monday, etc.
          
          // Check if this day has an active shift template
          const hasShift = activeTemplates.some(t => t.weekday === weekday);
          
          if (hasShift) {
            workDaysCount++;
          }
        }

        // Subtract sick days (full day holidays count as 1, half days as 0.5)
        let sickDaysCount = 0;
        holidays.forEach(holiday => {
          if (holiday.half_day === 'FULL') {
            sickDaysCount += 1;
          } else if (holiday.half_day === 'AM' || holiday.half_day === 'PM') {
            sickDaysCount += 0.5;
          }
        });

        const finalWorkDays = workDaysCount - sickDaysCount;
        setCalculatedWorkDays(finalWorkDays > 0 ? finalWorkDays : 0);
      } catch (error) {
        console.error('Error calculating work days:', error);
        // Fallback to provided or default value
        setCalculatedWorkDays(providedWorkDays || 26);
      }
    };

    if (open) {
      calculateWorkDays();
    }
  }, [open, month, employee.id, providedWorkDays]);

  const workDays = calculatedWorkDays;

  // Use calculated salary if provided, otherwise use saved salary
  const salaryData = calculatedSalary || {
    salaire_brut: Number(salary?.salaire_brut || salary?.brut_total || 0),
    cnss: Number(salary?.cnss || 0),
    salaire_brut_imposable: Number(salary?.salaire_brut_imposable || 0),
    irpp: Number(salary?.irpp || 0),
    css: Number(salary?.css || 0),
    salaire_net: Number(salary?.salaire_net || salary?.net_total || 0),
  };

  const handlePrint = () => {
    const printContent = document.getElementById('pay-slip-content');
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const employeeName = `${employee.prenom} ${employee.nom}`;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Bulletin de Paie - ${employeeName} - ${monthName}</title>
          <meta charset="UTF-8">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            @page {
              margin: 0;
              size: A4 portrait;
            }
            @media print {
              body {
                margin: 0;
                padding: 0;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .bulletin-container {
                page-break-inside: avoid;
                margin: 0;
                padding: 15mm 10mm;
              }
              /* Remove browser headers and footers */
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                height: 100%;
              }
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
              color: #000;
              background: #fff;
              padding: 0;
              margin: 0;
            }
            .bulletin-container {
              max-width: 100%;
              margin: 0 auto;
              background: white;
            }
            .header {
              text-align: center;
              border: 1px solid #666;
              padding: 6px 10px;
              margin: 6px 30px 8px 30px;
              background: #fff;
              border-radius: 6px;
            }
            .header h1 {
              font-size: 14px;
              font-weight: bold;
              letter-spacing: 1px;
              text-transform: uppercase;
              display: inline-block;
              margin-right: 12px;
            }
            .header h2 {
              font-size: 12px;
              font-weight: 500;
              color: #333;
              text-transform: capitalize;
              display: inline-block;
            }
            .info-section {
              margin: 0 30px 10px 30px;
              border: 2px solid #000;
              border-radius: 4px;
              overflow: hidden;
              background: #fff;
            }
            .info-row {
              display: grid;
              grid-template-columns: 1fr 1fr 1fr;
              border-bottom: 1px solid #000;
            }
            .info-row:last-child {
              border-bottom: none;
            }
            .info-row:nth-child(odd) {
              background: #fff;
            }
            .info-row:nth-child(even) {
              background: #fafafa;
            }
            .info-cell {
              padding: 4px 8px;
              border-right: 1px solid #000;
              font-size: 9px;
              line-height: 1.1;
            }
            .info-cell:last-child {
              border-right: none;
            }
            .salary-table-wrapper {
              margin: 0 30px 15px 30px;
            }
            .salary-table {
              width: 100%;
              border-collapse: collapse;
              border: 2px solid #000;
              font-size: 10px;
              border-radius: 6px;
              overflow: hidden;
            }
            .salary-table th {
              background: linear-gradient(to bottom, #e8e8e8, #d0d0d0);
              padding: 7.5px 6px;
              border: 1px solid #000;
              font-weight: bold;
            }
            .salary-table th:nth-child(1) { text-align: left; width: 40%; }
            .salary-table th:nth-child(2) { text-align: center; width: 15%; }
            .salary-table th:nth-child(3) { text-align: center; width: 15%; }
            .salary-table th:nth-child(4) { text-align: right; width: 15%; }
            .salary-table th:nth-child(5) { text-align: right; width: 15%; }
            .salary-table tbody tr:nth-child(odd) {
              background: #fff;
            }
            .salary-table tbody tr:nth-child(even) {
              background: #fafafa;
            }
            .salary-table td {
              padding: 4.3px 6px;
              border: 1px solid #666;
            }
            .salary-table .total-row {
              background: linear-gradient(to bottom, #f0f0f0, #e0e0e0) !important;
            }
            .salary-table .total-row td {
              padding: 7px 6px;
              font-weight: bold;
              font-size: 11px;
            }
            .salary-table .net-row {
              background: #fff !important;
            }
            .salary-table .net-row td {
              padding: 4.3px 6px;
              font-weight: bold;
              color: #000;
              font-size: 10px;
            }
            .green-text {
              color: #000;
              font-weight: 600;
            }
            .red-text {
              color: #000;
              font-weight: 600;
            }
            .signatures {
              display: grid;
              grid-template-columns: 1fr 1fr;
              margin: 20px 30px 30px 30px;
              font-size: 12px;
              gap: 60px;
            }
            .signature-box {
              text-align: center;
              padding: 0;
              min-height: 80px;
            }
            .signature-box .title {
              font-weight: 400;
              margin-bottom: 60px;
              font-size: 12px;
              color: #000;
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    
    // Wait for content to load before printing
    setTimeout(() => {
      printWindow.print();
      // Guide user to disable headers/footers if needed
      console.log('💡 Pour retirer complètement les en-têtes du navigateur: Dans la fenêtre d\'impression, décochez "En-têtes et pieds de page" dans les options.');
    }, 250);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[95vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-primary/5 to-primary/10">
          <DialogTitle className="text-2xl font-bold flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            Bulletin de Paie - {monthName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto px-6 py-6 bg-muted/20">
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-xl border-2 border-border overflow-hidden">
            <div id="pay-slip-content">
              <div className="bulletin-container">
                {/* Header */}
                <div className="header" style={{
                  textAlign: 'center',
                  border: '1px solid #666',
                  padding: '12px 20px',
                  margin: '20px 30px',
                  background: '#fff',
                  borderRadius: '8px'
                }}>
                  <h1 style={{
                    fontSize: '12px',
                    fontWeight: 'bold',
                    letterSpacing: '1px',
                    display: 'inline-block',
                    marginRight: '15px'
                  }}>BULLETIN DE PAIE</h1>
                  <h2 style={{
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#000',
                    display: 'inline-block'
                  }}>{monthName}</h2>
                </div>

                {/* Employee Information Section */}
                <div className="info-section" style={{
                  margin: '0 30px 30px 30px',
                  border: '1px solid #666',
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}>
                  <div className="info-row" style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    borderBottom: '1px solid #666',
                    background: '#fff'
                  }}>
                    <div className="info-cell" style={{
                      padding: '10px 16px',
                      borderRight: '1px solid #666',
                      fontSize: '12px'
                    }}>
                      <span style={{ fontWeight: 'bold' }}>MI:</span> {employee.id}/{format(monthDate, 'yy')}
                    </div>
                    <div className="info-cell" style={{
                      padding: '10px 16px',
                      borderRight: '1px solid #666',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      <span style={{ fontWeight: 'bold' }}>Travailleur</span>
                    </div>
                    <div className="info-cell" style={{
                      padding: '10px 16px',
                      fontSize: '12px'
                    }}>
                      <span style={{ fontWeight: 'bold' }}>Nb.j:</span> {workDays}
                    </div>
                  </div>
                  <div className="info-row" style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    borderBottom: '1px solid #666',
                    background: '#fff'
                  }}>
                    <div className="info-cell" style={{
                      padding: '10px 16px',
                      borderRight: '1px solid #666',
                      fontSize: '12px'
                    }}>
                      <span style={{ fontWeight: 'bold' }}>Salaire de base:</span> {salaryData.salaire_brut.toFixed(3)}
                    </div>
                    <div className="info-cell" style={{
                      padding: '10px 16px',
                      borderRight: '1px solid #666',
                      fontSize: '12px'
                    }}>
                      <span style={{ fontWeight: 'bold' }}>Situation Fam:</span> {employee.statut_civil || 'Célibataire'}
                    </div>
                    <div className="info-cell" style={{
                      padding: '10px 16px',
                      fontSize: '12px'
                    }}>
                      <span style={{ fontWeight: 'bold' }}>Mat.CNSS:</span> {employee.cnss_code || 'N/A'}
                    </div>
                  </div>
                  <div className="info-row" style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    borderBottom: '1px solid #666',
                    background: '#fafafa'
                  }}>
                    <div className="info-cell" style={{
                      padding: '10px 16px',
                      borderRight: '1px solid #666',
                      fontSize: '12px'
                    }}>
                      <span style={{ fontWeight: 'bold' }}>Catégorie:</span> Employé
                    </div>
                    <div className="info-cell" style={{
                      padding: '10px 16px',
                      borderRight: '1px solid #666',
                      fontSize: '12px'
                    }}>
                      <span style={{ fontWeight: 'bold' }}>Nb.Enf:</span> {employee.nombre_enfants || 0}
                    </div>
                    <div className="info-cell" style={{
                      padding: '10px 16px',
                      fontSize: '12px'
                    }}>
                      <span style={{ fontWeight: 'bold' }}>C/N N°:</span> {employee.carte_identite || 'N/A'}
                    </div>
                  </div>
                  <div className="info-row" style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr',
                    background: '#fff'
                  }}>
                    <div className="info-cell" style={{
                      padding: '10px 16px',
                      fontSize: '12px'
                    }}>
                      <span style={{ fontWeight: 'bold' }}>Date de Naissance:</span> {employee.date_naissance && employee.date_naissance !== '0000-00-00' && !isNaN(new Date(employee.date_naissance).getTime()) ? format(new Date(employee.date_naissance), 'dd/MM/yyyy') : 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Salary Breakdown Table */}
                <div style={{ margin: '0 30px 30px 30px' }}>
                  <table className="salary-table" style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    border: '1px solid #666',
                    fontSize: '12px',
                    borderRadius: '8px',
                    overflow: 'hidden'
                  }}>
                    <thead>
                      <tr>
                        <th style={{
                          background: '#fff',
                          padding: '13px 12px',
                          border: '1px solid #666',
                          textAlign: 'left',
                          fontWeight: 'bold',
                          width: '40%'
                        }}>Libellé</th>
                        <th style={{
                          background: '#fff',
                          padding: '13px 12px',
                          border: '1px solid #666',
                          textAlign: 'center',
                          fontWeight: 'bold',
                          width: '15%'
                        }}>Taux</th>
                        <th style={{
                          background: '#fff',
                          padding: '13px 12px',
                          border: '1px solid #666',
                          textAlign: 'center',
                          fontWeight: 'bold',
                          width: '15%'
                        }}>Nb.Jours</th>
                        <th style={{
                          background: '#fff',
                          padding: '13px 12px',
                          border: '1px solid #666',
                          textAlign: 'right',
                          fontWeight: 'bold',
                          width: '15%'
                        }}>Sal/Prime</th>
                        <th style={{
                          background: '#fff',
                          padding: '13px 12px',
                          border: '1px solid #666',
                          textAlign: 'right',
                          fontWeight: 'bold',
                          width: '15%'
                        }}>Retenues</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Base Salary */}
                      <tr style={{ background: '#fff' }}>
                        <td style={{ padding: '8.5px 12px', border: '1px solid #666' }}>Traitement de base</td>
                        <td style={{ padding: '8.5px 12px', border: '1px solid #666', textAlign: 'center' }}>-</td>
                        <td style={{ padding: '8.5px 12px', border: '1px solid #666', textAlign: 'center', fontWeight: '600' }}>{workDays}</td>
                        <td style={{ padding: '8.5px 12px', border: '1px solid #666', textAlign: 'right', fontWeight: '600', color: '#000' }}>{salaryData.salaire_brut.toFixed(3)}</td>
                        <td style={{ padding: '10px 12px', border: '1px solid #666', textAlign: 'right' }}>-</td>
                      </tr>
                      <tr style={{ background: '#fff' }}>
                        <td style={{ padding: '10px 12px', border: '1px solid #666' }}>Salaire de base</td>
                        <td style={{ padding: '10px 12px', border: '1px solid #666', textAlign: 'center' }}>-</td>
                        <td style={{ padding: '10px 12px', border: '1px solid #666', textAlign: 'center' }}>-</td>
                        <td style={{ padding: '10px 12px', border: '1px solid #666', textAlign: 'right' }}>-</td>
                        <td style={{ padding: '10px 12px', border: '1px solid #666', textAlign: 'right' }}>-</td>
                      </tr>
                      <tr style={{ background: '#fff' }}>
                        <td style={{ padding: '10px 12px', border: '1px solid #666' }}>Prime de présence</td>
                        <td style={{ padding: '10px 12px', border: '1px solid #666', textAlign: 'center' }}>-</td>
                        <td style={{ padding: '10px 12px', border: '1px solid #666', textAlign: 'center' }}>-</td>
                        <td style={{ padding: '10px 12px', border: '1px solid #666', textAlign: 'right' }}>-</td>
                        <td style={{ padding: '10px 12px', border: '1px solid #666', textAlign: 'right' }}>-</td>
                      </tr>
                      <tr style={{ background: '#fff' }}>
                        <td style={{ padding: '10px 12px', border: '1px solid #666' }}>Indemnité de transport</td>
                        <td style={{ padding: '10px 12px', border: '1px solid #666', textAlign: 'center' }}>-</td>
                        <td style={{ padding: '10px 12px', border: '1px solid #666', textAlign: 'center' }}>-</td>
                        <td style={{ padding: '10px 12px', border: '1px solid #666', textAlign: 'right' }}>-</td>
                        <td style={{ padding: '10px 12px', border: '1px solid #666', textAlign: 'right' }}>-</td>
                      </tr>
                      <tr style={{ background: '#fff' }}>
                        <td style={{ padding: '10px 12px', border: '1px solid #666' }}>Prime</td>
                        <td style={{ padding: '10px 12px', border: '1px solid #666', textAlign: 'center' }}>-</td>
                        <td style={{ padding: '10px 12px', border: '1px solid #666', textAlign: 'center' }}>-</td>
                        <td style={{ padding: '10px 12px', border: '1px solid #666', textAlign: 'right' }}>-</td>
                        <td style={{ padding: '10px 12px', border: '1px solid #666', textAlign: 'right' }}>-</td>
                      </tr>
                      
                      {/* Gross Salary Total */}
                      <tr style={{ background: '#fff' }}>
                        <td style={{ padding: '12px', border: '1px solid #666', fontWeight: 'bold' }}>Salaire Brut</td>
                        <td style={{ padding: '12px', border: '1px solid #666', textAlign: 'center' }}>-</td>
                        <td style={{ padding: '12px', border: '1px solid #666', textAlign: 'center' }}>-</td>
                        <td style={{ padding: '12px', border: '1px solid #666', textAlign: 'right', fontWeight: 'bold', fontSize: '12px', color: '#000' }}>{salaryData.salaire_brut.toFixed(3)}</td>
                        <td style={{ padding: '12px', border: '1px solid #666', textAlign: 'right' }}>-</td>
                      </tr>
                      
                      {/* Deductions */}
                      <tr style={{ background: '#fff' }}>
                        <td style={{ padding: '10px 12px', border: '1px solid #666' }}>CNSS</td>
                        <td style={{ padding: '10px 12px', border: '1px solid #666', textAlign: 'center', fontWeight: '600' }}>9.68%</td>
                        <td style={{ padding: '10px 12px', border: '1px solid #666', textAlign: 'center' }}>-</td>
                        <td style={{ padding: '10px 12px', border: '1px solid #666', textAlign: 'right' }}>-</td>
                        <td style={{ padding: '10px 12px', border: '1px solid #666', textAlign: 'right', fontWeight: '600', color: '#000' }}>{salaryData.cnss.toFixed(3)}</td>
                      </tr>
                      <tr style={{ background: '#fff' }}>
                        <td style={{ padding: '10px 12px', border: '1px solid #666' }}>Salaire imposable</td>
                        <td style={{ padding: '10px 12px', border: '1px solid #666', textAlign: 'center' }}>-</td>
                        <td style={{ padding: '10px 12px', border: '1px solid #666', textAlign: 'center' }}>-</td>
                        <td style={{ padding: '10px 12px', border: '1px solid #666', textAlign: 'right', fontWeight: '600' }}>{salaryData.salaire_brut_imposable.toFixed(3)}</td>
                        <td style={{ padding: '10px 12px', border: '1px solid #666', textAlign: 'right' }}>-</td>
                      </tr>
                      <tr style={{ background: '#fff' }}>
                        <td style={{ padding: '10px 12px', border: '1px solid #666' }}>IRPP</td>
                        <td style={{ padding: '10px 12px', border: '1px solid #666', textAlign: 'center' }}>-</td>
                        <td style={{ padding: '10px 12px', border: '1px solid #666', textAlign: 'center' }}>-</td>
                        <td style={{ padding: '10px 12px', border: '1px solid #666', textAlign: 'right' }}>-</td>
                        <td style={{ padding: '10px 12px', border: '1px solid #666', textAlign: 'right', fontWeight: '600', color: '#000' }}>{salaryData.irpp.toFixed(3)}</td>
                      </tr>
                      <tr style={{ background: '#fff' }}>
                        <td style={{ padding: '10px 12px', border: '1px solid #666' }}>CSS 1%</td>
                        <td style={{ padding: '10px 12px', border: '1px solid #666', textAlign: 'center', fontWeight: '600' }}>1%</td>
                        <td style={{ padding: '10px 12px', border: '1px solid #666', textAlign: 'center' }}>-</td>
                        <td style={{ padding: '10px 12px', border: '1px solid #666', textAlign: 'right' }}>-</td>
                        <td style={{ padding: '10px 12px', border: '1px solid #666', textAlign: 'right', fontWeight: '600', color: '#000' }}>{salaryData.css.toFixed(3)}</td>
                      </tr>
                      <tr style={{ background: '#fff' }}>
                        <td style={{ padding: '10px 12px', border: '1px solid #666' }}>Retenues facultatives</td>
                        <td style={{ padding: '10px 12px', border: '1px solid #666', textAlign: 'center' }}>-</td>
                        <td style={{ padding: '10px 12px', border: '1px solid #666', textAlign: 'center' }}>-</td>
                        <td style={{ padding: '10px 12px', border: '1px solid #666', textAlign: 'right' }}>-</td>
                        <td style={{ padding: '10px 12px', border: '1px solid #666', textAlign: 'right' }}>-</td>
                      </tr>
                      <tr style={{ background: '#fff' }}>
                        <td style={{ padding: '8px 12px 8px 32px', border: '1px solid #666', fontSize: '12px' }}>Prêt</td>
                        <td style={{ padding: '8px 12px', border: '1px solid #666', textAlign: 'center' }}>-</td>
                        <td style={{ padding: '8px 12px', border: '1px solid #666', textAlign: 'center' }}>-</td>
                        <td style={{ padding: '8px 12px', border: '1px solid #666', textAlign: 'right' }}>-</td>
                        <td style={{ padding: '8px 12px', border: '1px solid #666', textAlign: 'right' }}>-</td>
                      </tr>
                      <tr style={{ background: '#fff' }}>
                        <td style={{ padding: '8px 12px 8px 32px', border: '1px solid #666', fontSize: '12px' }}>Avance</td>
                        <td style={{ padding: '8px 12px', border: '1px solid #666', textAlign: 'center' }}>-</td>
                        <td style={{ padding: '8px 12px', border: '1px solid #666', textAlign: 'center' }}>-</td>
                        <td style={{ padding: '8px 12px', border: '1px solid #666', textAlign: 'right' }}>-</td>
                        <td style={{ padding: '8px 12px', border: '1px solid #666', textAlign: 'right' }}>-</td>
                      </tr>
                      <tr style={{ background: '#fff' }}>
                        <td style={{ padding: '8px 12px 8px 32px', border: '1px solid #666', fontSize: '12px' }}>Assurance groupe</td>
                        <td style={{ padding: '8px 12px', border: '1px solid #666', textAlign: 'center' }}>-</td>
                        <td style={{ padding: '8px 12px', border: '1px solid #666', textAlign: 'center' }}>-</td>
                        <td style={{ padding: '8px 12px', border: '1px solid #666', textAlign: 'right' }}>-</td>
                        <td style={{ padding: '8px 12px', border: '1px solid #666', textAlign: 'right' }}>-</td>
                      </tr>
                      
                      {/* Totals */}
                      <tr style={{ background: '#fff' }}>
                        <td style={{ padding: '12px', border: '1px solid #666', fontWeight: 'bold' }}>Totaux</td>
                        <td style={{ padding: '12px', border: '1px solid #666', textAlign: 'center' }}>-</td>
                        <td style={{ padding: '12px', border: '1px solid #666', textAlign: 'center' }}>-</td>
                        <td style={{ padding: '12px', border: '1px solid #666', textAlign: 'right', fontWeight: 'bold', fontSize: '12px', color: '#000' }}>{salaryData.salaire_brut.toFixed(3)}</td>
                        <td style={{ padding: '12px', border: '1px solid #666', textAlign: 'right', fontWeight: 'bold', fontSize: '12px', color: '#000' }}>{(salaryData.cnss + salaryData.irpp + salaryData.css).toFixed(3)}</td>
                      </tr>
                      
                      {/* Net to Pay */}
                      <tr style={{ background: '#fff' }}>
                        <td colSpan={3} style={{ padding: '8.5px 12px', border: '1px solid #666', textAlign: 'center', fontWeight: 'bold', fontSize: '12px', color: '#000' }}>Net à payer</td>
                        <td colSpan={2} style={{ padding: '8.5px 12px', border: '1px solid #666', textAlign: 'right', fontWeight: 'bold', fontSize: '12px', color: '#000' }}>{salaryData.salaire_net.toFixed(3)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Signatures */}
                <div className="signatures" style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  margin: '20px 30px 30px 30px',
                  fontSize: '12px',
                  gap: '80px'
                }}>
                  <div className="signature-box" style={{
                    textAlign: 'center',
                    padding: '0'
                  }}>
                    <div style={{ fontWeight: '400', color: '#000', fontSize: '12px' }}>Signature employé</div>
                  </div>
                  <div className="signature-box" style={{
                    textAlign: 'center',
                    padding: '0'
                  }}>
                    <div style={{ fontWeight: '400', color: '#000', fontSize: '12px' }}>Signature & cachet employeur</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-muted/20">
          <Button variant="outline" onClick={() => onOpenChange(false)} size="lg">
            Fermer
          </Button>
          <Button onClick={handlePrint} size="lg" className="gap-2">
            <Printer className="h-4 w-4" />
            Imprimer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
