
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from '@/hooks/use-mobile';

import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  UserPlus, 
  Edit, 
  Trash2, 
  Phone, 
  MapPin,
  Calendar,
  Eye,
  Loader2,
  X,
  Upload,
  Image as ImageIcon,
  Download,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign as DollarSignIcon,
  FileText,
  Palmtree
} from "lucide-react";
import * as XLSX from 'xlsx';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  employeeService, 
  Employee, 
  CreateEmployeeData, 
  salaryService, 
  timeEntryService, 
  holidayService,
  shiftTemplateService,
  scheduleService,
  pointageService as rhPointageService
} from "@/utils/rhService";
import { pointageService } from "@/utils/pointageService";
import WeeklyPlanningCreator from "@/components/WeeklyPlanningCreator";
import { Checkbox } from "@/components/ui/checkbox";
import { DollarSign, CalendarPlus } from "lucide-react";



const Employes = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [regionFilter, setRegionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPlanningCreator, setShowPlanningCreator] = useState(false);
  const [selectedEmployeeForPlanning, setSelectedEmployeeForPlanning] = useState<Employee | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    includeSalary: false,
    salaryPeriod: 'current' as 'current' | 'monthly' | 'yearly',
    includeHours: false,
    includeLeaves: false
  });
  const [exporting, setExporting] = useState(false);
  const [employeeStatus, setEmployeeStatus] = useState<Record<number, { 
    hasPlanning: boolean; 
    hasSalary: boolean;
    workedDays: number;
    absences: number;
  }>>({});
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [selectedEmployeeForLeave, setSelectedEmployeeForLeave] = useState<Employee | null>(null);
  const [leaveData, setLeaveData] = useState({
    date: new Date().toISOString().split('T')[0],
    dateEnd: '',
    leaveType: 'single' as 'single' | 'period',
    leaveCategory: 'annual' as 'annual' | 'sick' | 'special' | 'unpaid' | 'maternity' | 'paternity' | 'other',
    halfDay: 'FULL' as 'AM' | 'PM' | 'FULL',
    startTime: '',
    endTime: '',
    motif: '',
    isPaid: true,
  });
  const [showImportModal, setShowImportModal] = useState(false);
  const [importRows, setImportRows] = useState<any[]>([]);
  const [importColumns, setImportColumns] = useState<string[]>([]);
  const [unmatchedRows, setUnmatchedRows] = useState<any[]>([]);
  const [importFileName, setImportFileName] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const isMobile = useIsMobile();
  const { toast } = useToast();

  const regions = [
    "Tunis",
    "Ariana",
    "Ben Arous",
    "Manouba",
    "Nabeul",
    "Zaghouan",
    "Bizerte",
    "Béja",
    "Jendouba",
    "Kef",
    "Siliana",
    "Sousse",
    "Monastir",
    "Mahdia",
    "Sfax",
    "Kairouan",
    "Kasserine",
    "Sidi Bouzid",
    "Gabès",
    "Medenine",
    "Tataouine",
    "Gafsa",
    "Tozeur",
    "Kebili"
  ];
  
  const statutCivilLabels = {
    celibataire: "Célibataire",
    marie: "Marié(e)",
    divorce: "Divorcé(e)",
    veuf: "Veuf/Veuve",
    autre: "Autre"
  };

  // Load employees on component mount
  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      console.log('🚀 loadEmployees called');
      setLoading(true);
      const data = await employeeService.getAll({
        region: regionFilter !== "all" ? regionFilter : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        search: searchTerm || undefined
      });
      console.log('👥 Employees loaded:', data.length, data);
      setEmployees(data);
      
      // Load status for each employee
      await loadEmployeeStatus(data);
    } catch (error) {
      console.error('❌ Error loading employees:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les employés",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadEmployeeStatus = async (employees: Employee[]) => {
    const statusMap: Record<number, { 
      hasPlanning: boolean; 
      hasSalary: boolean;
      workedDays: number;
      absences: number;
    }> = {};
    
    // Get current month for pointage lookup (YYYY-MM format)
    const currentMonth = new Date().toISOString().slice(0, 7);
    console.log('📅 Current month for pointage:', currentMonth);
    console.log('👥 Loading status for employees:', employees.map(e => ({ id: e.id, name: `${e.prenom} ${e.nom}` })));
    
    await Promise.all(
      employees.map(async (employee) => {
        try {
          console.log(`\n🔍 Processing employee ${employee.id} (${employee.prenom} ${employee.nom})`);
          console.log(`  Employee ID type: ${typeof employee.id}, value: ${employee.id}`);
          
          // Check for planning (shift templates or schedules) and salaries
          const [templates, schedules, salaries, pointageRecords] = await Promise.all([
            shiftTemplateService.getAll(employee.id),
            scheduleService.getAll({ employee_id: employee.id }),
            salaryService.getAll({ employee_id: employee.id }),
            rhPointageService.getAll({ employee_id: employee.id, month: currentMonth })
          ]);
          
          console.log(`  📊 Pointage records for employee ${employee.id}:`, pointageRecords);
          console.log(`  📊 Number of pointage records: ${pointageRecords.length}`);
          
          // Get worked days and absences from pointage table for current month
          let workedDays = 0;
          let absences = 0;
          
          if (pointageRecords && pointageRecords.length > 0) {
            // Log each record in detail
            pointageRecords.forEach((record, index) => {
              console.log(`  📋 Record ${index}:`, {
                id: record.id,
                employee_id: record.employee_id,
                employee_id_type: typeof record.employee_id,
                month: record.month,
                jr_travaille_count: record.jr_travaille_count,
                jr_travaille_type: typeof record.jr_travaille_count,
                absent_count: record.absent_count,
                absent_type: typeof record.absent_count,
                raw_record: record
              });
              
              // Check if this record matches the current employee
              const employeeIdMatch = Number(record.employee_id) === Number(employee.id);
              console.log(`    ✓ Employee ID match (${record.employee_id} === ${employee.id}): ${employeeIdMatch}`);
              
              // Check if month matches
              const monthMatch = record.month === currentMonth;
              console.log(`    ✓ Month match (${record.month} === ${currentMonth}): ${monthMatch}`);
            });
            
            // Sum up all records for this employee and month
            workedDays = pointageRecords.reduce((sum, record) => {
              const count = Number(record.jr_travaille_count) || 0;
              console.log(`  ➕ Adding jr_travaille_count: ${record.jr_travaille_count} (converted: ${count})`);
              return sum + count;
            }, 0);
            
            absences = pointageRecords.reduce((sum, record) => {
              const count = Number(record.absent_count) || 0;
              console.log(`  ➕ Adding absent_count: ${record.absent_count} (converted: ${count})`);
              return sum + count;
            }, 0);
            
            console.log(`  ✅ FINAL for employee ${employee.id} (${employee.prenom} ${employee.nom}): workedDays=${workedDays}, absences=${absences}`);
          } else {
            console.log(`  ⚠️ NO POINTAGE RECORDS found for employee ${employee.id} in month ${currentMonth}`);
          }
          
          const finalStatus = {
            hasPlanning: templates.length > 0 || schedules.length > 0,
            hasSalary: salaries.length > 0,
            workedDays,
            absences
          };
          
          console.log(`  📝 Setting status for employee ${employee.id}:`, finalStatus);
          statusMap[employee.id] = finalStatus;
          
        } catch (error) {
          console.error(`❌ Error loading status for employee ${employee.id}:`, error);
          // If error, mark as not filled
          statusMap[employee.id] = {
            hasPlanning: false,
            hasSalary: false,
            workedDays: 0,
            absences: 0
          };
        }
      })
    );
    
    console.log('\n📊 ========== FINAL employeeStatus map ==========');
    Object.entries(statusMap).forEach(([empId, status]) => {
      const emp = employees.find(e => String(e.id) === String(empId));
      console.log(`Employee ${empId} (${emp?.prenom} ${emp?.nom}):`, status);
    });
    console.log('================================================\n');
    
    setEmployeeStatus(statusMap);
  };

  // Reload when filters change
  useEffect(() => {
    if (!loading) {
      loadEmployees();
    }
  }, [regionFilter, statusFilter, searchTerm]);



  // Save import preview to server
  const savePointage = async () => {
    if (!importRows || importRows.length === 0) return;
    setImportLoading(true);
    try {
      const payload = { rows: importRows };
      const res = await fetch('https://luccibyey.com.tn/production/api/rh_employe_pointage.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data && data.success) {
        toast({ title: 'Enregistré', description: data.message || 'Pointage enregistré avec succès' });
        setImportRows([]);
        setImportColumns([]);
        setUnmatchedRows([]);
        setImportFileName(null);
        setShowImportModal(false);
        await loadEmployees();
      } else {
        throw new Error(data && data.message ? data.message : 'Erreur serveur');
      }
    } catch (err: any) {
      console.error('Save pointage error:', err);
      toast({ title: 'Erreur', description: err.message || 'Erreur lors de l\'enregistrement', variant: 'destructive' });
    } finally {
      setImportLoading(false);
    }
  };

  const handleDeleteEmployee = async (employee: Employee) => {
    try {
      const result = await employeeService.delete(employee.id);
      
      if (result.success) {
        toast({
          title: "Succès",
          description: result.message || "Employé supprimé avec succès"
        });
        loadEmployees();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de la suppression",
        variant: "destructive"
      });
    }
  };

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = (
      employee.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.prenom.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchesRegion = regionFilter === "all" || employee.region === regionFilter;
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "actif" && employee.actif) ||
      (statusFilter === "inactif" && !employee.actif);
    
    console.log('🔎 Filtering:', {
      total: employees.length,
      searchTerm,
      regionFilter,
      statusFilter,
      matchesSearch,
      matchesRegion,
      matchesStatus
    });
    
    return matchesSearch && matchesRegion && matchesStatus;
  });
  
  console.log('📊 Filtered employees count:', filteredEmployees.length);


  const getPhotoUrl = (photoPath?: string) => {
    if (!photoPath) return null;
    if (photoPath.startsWith('http')) return photoPath;
    return `https://luccibyey.com.tn/production/${photoPath}`;
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      
      // Base employee data
      const exportData = await Promise.all(
        filteredEmployees.map(async (employee) => {
          const row: any = {
            'Nom': employee.nom,
            'Prénom': employee.prenom,
            'Téléphone': employee.telephone || '-',
            'Adresse': employee.adresse || '-',
            'Région': employee.region || '-',
            'Rôle': employee.role || '-',
            'Âge': employee.age || '-',
            'Statut Civil': statutCivilLabels[employee.statut_civil],
            'Statut': employee.actif ? 'Actif' : 'Inactif',
            'Date d\'embauche': new Date(employee.created_at).toLocaleDateString('fr-FR')
          };

          // Add salary data if requested
          if (exportOptions.includeSalary) {
            try {
              const salaries = await salaryService.getAll({ 
                employee_id: employee.id,
                current: exportOptions.salaryPeriod === 'current'
              });
              
              if (exportOptions.salaryPeriod === 'current' && salaries.length > 0) {
                const currentSalary = salaries[0];
                row['Salaire Net'] = Number(currentSalary.net_total).toFixed(3);
                row['Salaire Brut'] = currentSalary.brut_total ? Number(currentSalary.brut_total).toFixed(3) : '-';
                row['Charges'] = currentSalary.taxes ? Number(currentSalary.taxes).toFixed(3) : '-';
              } else if (exportOptions.salaryPeriod === 'monthly') {
                const totalNet = salaries.reduce((sum, s) => sum + Number(s.net_total), 0);
                row['Salaire Net (Mensuel)'] = totalNet.toFixed(3);
              } else if (exportOptions.salaryPeriod === 'yearly') {
                const totalNet = salaries.reduce((sum, s) => sum + Number(s.net_total), 0);
                row['Salaire Net (Annuel)'] = totalNet.toFixed(3);
              }
            } catch (error) {
              console.error('Error fetching salary:', error);
            }
          }

          // Add hours worked if requested
          if (exportOptions.includeHours) {
            try {
              const timeEntries = await timeEntryService.getAll({ 
                employee_id: employee.id 
              });
              const totalHours = timeEntries.reduce((sum, entry) => 
                sum + (entry.total_hours || 0), 0
              );
              row['Heures Travaillées'] = totalHours.toFixed(2);
            } catch (error) {
              console.error('Error fetching time entries:', error);
              row['Heures Travaillées'] = '-';
            }
          }

          // Add leave hours if requested
          if (exportOptions.includeLeaves) {
            try {
              const holidays = await holidayService.getAll({ 
                employee_id: employee.id,
                status: 'approved'
              });
              const totalLeaveDays = holidays.reduce((sum, holiday) => {
                if (holiday.half_day === 'FULL') return sum + 1;
                if (holiday.half_day === 'AM' || holiday.half_day === 'PM') return sum + 0.5;
                return sum;
              }, 0);
              row['Jours de Congé'] = totalLeaveDays.toFixed(1);
              row['Heures de Congé'] = (totalLeaveDays * 8).toFixed(2);
            } catch (error) {
              console.error('Error fetching holidays:', error);
              row['Jours de Congé'] = '-';
              row['Heures de Congé'] = '-';
            }
          }

          return row;
        })
      );

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // Set column widths
      const columnWidths = Object.keys(exportData[0] || {}).map(() => ({ wch: 20 }));
      ws['!cols'] = columnWidths;

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Employés');

      // Generate filename with timestamp
      const filename = `employes_${new Date().toISOString().split('T')[0]}.xlsx`;

      // Download
      XLSX.writeFile(wb, filename);

      toast({
        title: "Succès",
        description: `Export de ${filteredEmployees.length} employé(s) réussi`
      });

      setShowExportModal(false);
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de l'export des données",
        variant: "destructive"
      });
    } finally {
      setExporting(false);
    }
  };


  return (
    <div className="container mx-auto p-2 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6">
      <div className="container mx-auto p-2 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6">
        <div className="flex items-start gap-2">
          <Button 
            variant="outline" 
            size={isMobile ? "sm" : "default"}
            onClick={() => window.location.href = '/rh'}
            className="shrink-0"
          >
            <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
              {isMobile ? "Employés" : "Gestion des Employés"}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">
              {isMobile ? "Gérer les employés" : "Gérer la liste des employés et leurs informations"}
            </p>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto justify-end">
          <Button 
            variant="outline" 
            size={isMobile ? "sm" : "default"} 
            onClick={() => setShowImportModal(true)}
            className="flex-1 sm:flex-initial"
          >
            <Upload className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="text-xs sm:text-sm">Importer</span>
          </Button>
          <Button 
            variant="outline" 
            size={isMobile ? "sm" : "default"} 
            onClick={() => setShowExportModal(true)}
            className="flex-1 sm:flex-initial"
          >
            <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="text-xs sm:text-sm">Exporter</span>
          </Button>
          <Button 
            size={isMobile ? "sm" : "default"} 
            className="flex-1 sm:flex-initial"
            onClick={() => navigate('/rh/employes/add')}
          >
            <UserPlus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="text-xs sm:text-sm">{isMobile ? "Employé" : "Nouvel Employé"}</span>
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
        <Card className="modern-card bg-primary text-primary-foreground">
          <CardHeader className="p-2 sm:p-3 md:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-primary-foreground">
              {isMobile ? "Total" : "Total Employés"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-3 pt-0">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-primary-foreground">{employees.length}</div>
          </CardContent>
        </Card>
        
        <Card className="modern-card bg-primary text-primary-foreground">
          <CardHeader className="p-2 sm:p-3 md:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-primary-foreground">
              Actifs
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-3 pt-0">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-primary-foreground">
              {employees.filter(e => e.actif).length}
            </div>
          </CardContent>
        </Card>

        <Card className="modern-card bg-primary text-primary-foreground">
          <CardHeader className="p-2 sm:p-3 md:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-primary-foreground">
              Inactifs
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-3 pt-0">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-primary-foreground">
              {employees.filter(e => !e.actif).length}
            </div>
          </CardContent>
        </Card>

        <Card className="modern-card bg-primary text-primary-foreground">
          <CardHeader className="p-2 sm:p-3 md:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-primary-foreground">
              Régions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-3 pt-0">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-primary-foreground">
              {new Set(employees.map(e => e.region).filter(Boolean)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader className="p-3 sm:p-4 md:p-6">
          <CardTitle className="text-sm sm:text-base md:text-lg">
            {isMobile ? "Filtres" : "Filtres et Recherche"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              <Input
                placeholder={isMobile ? "Rechercher..." : "Rechercher par nom ou prénom..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-6 sm:pl-8 text-xs sm:text-sm"
              />
            </div>
            
            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger className="text-xs sm:text-sm">
                <SelectValue placeholder="Toutes les régions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les Régions</SelectItem>
                {regions.map(region => (
                  <SelectItem key={region} value={region}>{region}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="text-xs sm:text-sm">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les Statuts</SelectItem>
                <SelectItem value="actif">Actifs</SelectItem>
                <SelectItem value="inactif">Inactifs</SelectItem>
              </SelectContent>
            </Select>

            <div className="text-xs sm:text-sm text-muted-foreground flex items-center">
              <span className="truncate">Résultats: {filteredEmployees.length}</span>
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Liste des employés */}
      <Card>
        <CardHeader className="p-3 sm:p-4 md:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <CardTitle className="text-sm sm:text-base md:text-lg">Liste des Employés</CardTitle>
            {selectedEmployees.length > 0 && !isMobile && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedEmployees.length} sélectionné(s)
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const employee = employees.find(e => e.id === selectedEmployees[0]);
                    if (employee) {
                      setSelectedEmployeeForPlanning(employee);
                      setShowPlanningCreator(true);
                    }
                  }}
                  disabled={selectedEmployees.length !== 1}
                >
                  <CalendarPlus className="h-4 w-4 mr-1" />
                  Planning
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const employee = employees.find(e => e.id === selectedEmployees[0]);
                    if (employee) {
                      navigate('/rh/salaires/definir', { state: { employee } });
                    }
                  }}
                  disabled={selectedEmployees.length !== 1}
                >
                  <DollarSign className="h-4 w-4 mr-1" />
                  Salaire
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-2 sm:p-4 md:p-6 pt-0">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2 text-sm">Chargement...</span>
            </div>
          ) : isMobile ? (
            <div className="space-y-2">
              {filteredEmployees.map((employee) => {
                const status = employeeStatus[employee.id] || { hasPlanning: false, hasSalary: false, workedDays: 0, absences: 0 };
                return (
                <Card 
                  key={employee.id} 
                  className="border-l-4 border-l-primary cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => navigate(`/rh/employes/${employee.id}`)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-start gap-2 flex-1">
                        {employee.photo ? (
                          <img 
                            src={getPhotoUrl(employee.photo) || ''} 
                            alt={`${employee.prenom} ${employee.nom}`}
                            className="w-12 h-12 object-cover rounded-full border shrink-0"
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder.svg';
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0">
                            <ImageIcon className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm">{employee.prenom} {employee.nom}</h3>
                          {employee.telephone && (
                            <div className="flex items-center text-xs text-muted-foreground mt-1">
                              <Phone className="h-3 w-3 mr-1" />
                              {employee.telephone}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant={employee.actif ? "default" : "destructive"} className="text-xs">
                          {employee.actif ? "Actif" : "Inactif"}
                        </Badge>
                        <div className="flex gap-1" title="Planning et Salaire">
                          {status.hasPlanning ? (
                            <div title="Planning rempli">
                              <Clock className="h-4 w-4 text-green-500" />
                            </div>
                          ) : (
                            <div title="Planning manquant">
                              <Clock className="h-4 w-4 text-red-500" />
                            </div>
                          )}
                          {status.hasSalary ? (
                            <div title="Salaire rempli">
                              <DollarSignIcon className="h-4 w-4 text-green-500" />
                            </div>
                          ) : (
                            <div title="Salaire manquant">
                              <DollarSignIcon className="h-4 w-4 text-red-500" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      {employee.region && (
                        <span className="flex items-center">
                          <MapPin className="h-3 w-3 mr-0.5" />
                          {employee.region}
                        </span>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {statutCivilLabels[employee.statut_civil]}
                      </Badge>
                    </div>
                    <div className="flex gap-1 pt-2 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 h-8 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/rh/employes/${employee.id}`);
                        }}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Voir
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 h-8 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEmployeeForPlanning(employee);
                          setShowPlanningCreator(true);
                        }}
                      >
                        <CalendarPlus className="h-3 w-3 mr-1" />
                        Planning
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 h-8 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/rh/salaires/definir', { state: { employee } });
                        }}
                      >
                        <DollarSign className="h-3 w-3 mr-1" />
                        Salaire
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/rh/employes/edit/${employee.id}`);
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                            <AlertDialogDescription>
                              Supprimer {employee.prenom} {employee.nom} ? Cette action est irréversible.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteEmployee(employee)}>
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
                );
              })}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedEmployees.length === filteredEmployees.length && filteredEmployees.length > 0}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedEmployees(filteredEmployees.map(e => e.id));
                        } else {
                          setSelectedEmployees([]);
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>Photo</TableHead>
                  <TableHead>Nom Complet</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Statut Civil</TableHead>
                  <TableHead className="text-center">Planning/Salaire</TableHead>
                  <TableHead className="text-center">Jours Travaillés</TableHead>
                  <TableHead className="text-center">Absences</TableHead>
                  <TableHead>Date d'embauche</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => (
                  <TableRow 
                    key={employee.id} 
                    className={`cursor-pointer hover:bg-muted/50 transition-colors ${selectedEmployees.includes(employee.id) ? "bg-muted/50" : ""}`}
                    onClick={() => navigate(`/rh/employes/${employee.id}`)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedEmployees.includes(employee.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedEmployees([...selectedEmployees, employee.id]);
                          } else {
                            setSelectedEmployees(selectedEmployees.filter(id => id !== employee.id));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      {employee.photo ? (
                        <img 
                          src={getPhotoUrl(employee.photo) || ''} 
                          alt={`${employee.prenom} ${employee.nom}`}
                          className="w-10 h-10 object-cover rounded-full border"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder.svg';
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {employee.prenom} {employee.nom}
                      </div>
                    </TableCell>
                    <TableCell>
                      {employee.telephone && (
                        <div className="flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          {employee.telephone}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {statutCivilLabels[employee.statut_civil]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        {(() => {
                          const status = employeeStatus[employee.id] || { hasPlanning: false, hasSalary: false, workedDays: 0, absences: 0 };
                          return (
                            <>
                              <div title={status.hasPlanning ? "Planning rempli" : "Planning manquant"}>
                                <Clock className={`h-4 w-4 ${status.hasPlanning ? 'text-green-500' : 'text-red-500'}`} />
                              </div>
                              <div title={status.hasSalary ? "Salaire rempli" : "Salaire manquant"}>
                                <DollarSignIcon className={`h-4 w-4 ${status.hasSalary ? 'text-green-500' : 'text-red-500'}`} />
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">
                        {employeeStatus[employee.id]?.workedDays || 0}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={employeeStatus[employee.id]?.absences > 0 ? "destructive" : "outline"}>
                        {employeeStatus[employee.id]?.absences || 0}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(employee.created_at).toLocaleDateString('fr-FR')}
                      </div>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEmployeeForPlanning(employee);
                            setShowPlanningCreator(true);
                          }}
                          title="Créer planning"
                        >
                          <CalendarPlus className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('/rh/salaires/definir', { state: { employee } });
                          }}
                          title="Gérer le salaire"
                        >
                          <DollarSign className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEmployeeForLeave(employee);
                            setLeaveData({
                              date: new Date().toISOString().split('T')[0],
                              dateEnd: '',
                              leaveType: 'single',
                              leaveCategory: 'annual',
                              halfDay: 'FULL',
                              startTime: '',
                              endTime: '',
                              motif: '',
                              isPaid: true,
                            });
                            setShowLeaveDialog(true);
                          }}
                          title="Marquer en congé"
                        >
                          <Palmtree className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/rh/employes/edit/${employee.id}`);
                          }}
                          title="Modifier"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                              <AlertDialogDescription>
                                Êtes-vous sûr de vouloir supprimer {employee.prenom} {employee.nom} ?
                                Cette action est irréversible.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteEmployee(employee)}>
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Leave Dialog */}
      <Dialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Marquer en congé</DialogTitle>
            <DialogDescription>
              Créer un congé pour {selectedEmployeeForLeave?.prenom} {selectedEmployeeForLeave?.nom}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Leave Type Category */}
            <div className="space-y-2">
              <Label>Catégorie de congé</Label>
              <Select
                value={leaveData.leaveCategory || 'annual'}
                onValueChange={(value) => setLeaveData({ ...leaveData, leaveCategory: value as any })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="annual">Congé annuel</SelectItem>
                  <SelectItem value="sick">Congé maladie</SelectItem>
                  <SelectItem value="special">Congé spécial</SelectItem>
                  <SelectItem value="unpaid">Congé non payé</SelectItem>
                  <SelectItem value="maternity">Congé maternité</SelectItem>
                  <SelectItem value="paternity">Congé paternité</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Type de congé */}
            <div className="space-y-2">
              <Label>Durée du congé</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={leaveData.leaveType === 'single' ? 'default' : 'outline'}
                  onClick={() => setLeaveData({ ...leaveData, leaveType: 'single', dateEnd: '' })}
                  className="w-full"
                >
                  Jour unique
                </Button>
                <Button
                  type="button"
                  variant={leaveData.leaveType === 'period' ? 'default' : 'outline'}
                  onClick={() => setLeaveData({ ...leaveData, leaveType: 'period' })}
                  className="w-full"
                >
                  Période
                </Button>
              </div>
            </div>

            {/* Date selection */}
            {leaveData.leaveType === 'single' ? (
              <div>
                <Label htmlFor="leave-date">Date du congé</Label>
                <Input
                  id="leave-date"
                  type="date"
                  value={leaveData.date}
                  onChange={(e) => setLeaveData({ ...leaveData, date: e.target.value })}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="leave-date-start">Date de début</Label>
                  <Input
                    id="leave-date-start"
                    type="date"
                    value={leaveData.date}
                    onChange={(e) => setLeaveData({ ...leaveData, date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="leave-date-end">Date de fin</Label>
                  <Input
                    id="leave-date-end"
                    type="date"
                    value={leaveData.dateEnd}
                    onChange={(e) => setLeaveData({ ...leaveData, dateEnd: e.target.value })}
                    min={leaveData.date}
                  />
                </div>
              </div>
            )}

            {/* Half day or Full day (only for single day) */}
            {leaveData.leaveType === 'single' && (
              <div className="space-y-2">
                <Label>Durée</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant={leaveData.halfDay === 'FULL' ? 'default' : 'outline'}
                    onClick={() => setLeaveData({ ...leaveData, halfDay: 'FULL' })}
                    className="w-full"
                  >
                    Journée complète
                  </Button>
                  <Button
                    type="button"
                    variant={leaveData.halfDay === 'AM' ? 'default' : 'outline'}
                    onClick={() => setLeaveData({ ...leaveData, halfDay: 'AM' })}
                    className="w-full"
                  >
                    Matin
                  </Button>
                  <Button
                    type="button"
                    variant={leaveData.halfDay === 'PM' ? 'default' : 'outline'}
                    onClick={() => setLeaveData({ ...leaveData, halfDay: 'PM' })}
                    className="w-full"
                  >
                    Après-midi
                  </Button>
                </div>
              </div>
            )}

            {/* Time range (only for single day and full day) */}
            {leaveData.leaveType === 'single' && leaveData.halfDay === 'FULL' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-time">Heure de début (optionnel)</Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={leaveData.startTime}
                    onChange={(e) => setLeaveData({ ...leaveData, startTime: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="end-time">Heure de fin (optionnel)</Label>
                  <Input
                    id="end-time"
                    type="time"
                    value={leaveData.endTime}
                    onChange={(e) => setLeaveData({ ...leaveData, endTime: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* Paid/Unpaid */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is-paid"
                checked={leaveData.isPaid}
                onCheckedChange={(checked) => setLeaveData({ ...leaveData, isPaid: checked as boolean })}
              />
              <Label htmlFor="is-paid" className="cursor-pointer">
                Congé payé
              </Label>
            </div>

            {/* Motif */}
            <div>
              <Label htmlFor="leave-motif">Motif (optionnel)</Label>
              <Textarea
                id="leave-motif"
                placeholder="Raison du congé..."
                value={leaveData.motif}
                onChange={(e) => setLeaveData({ ...leaveData, motif: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLeaveDialog(false)}>
              Annuler
            </Button>
            <Button onClick={async () => {
              console.log('🔵 BUTTON CLICKED - Créer le congé');
              try {
                console.log('🔵 Inside try block');
                console.log('🔵 selectedEmployeeForLeave:', selectedEmployeeForLeave);
                if (!selectedEmployeeForLeave) {
                  console.log('❌ No employee selected, returning');
                  return;
                }

                console.log('🏖️ === LEAVE SUBMISSION START ===');
                console.log('👤 Employee:', {
                  id: selectedEmployeeForLeave.id,
                  name: `${selectedEmployeeForLeave.prenom} ${selectedEmployeeForLeave.nom}`
                });
                console.log('📋 Leave Data:', leaveData);

                // Validate period dates
                if (leaveData.leaveType === 'period' && (!leaveData.dateEnd || leaveData.dateEnd < leaveData.date)) {
                  console.log('❌ Validation failed: Invalid period dates');
                  toast({
                    title: "Erreur",
                    description: "Veuillez sélectionner une date de fin valide",
                    variant: "destructive"
                  });
                  return;
                }
                
                // Determine leave_duration based on half_day and times
                let leave_duration: 'FULL' | 'AM' | 'PM' | 'HOURS' = 'FULL';
                let leave_hours: number | undefined = undefined;
                
                if (leaveData.halfDay === 'AM') {
                  leave_duration = 'AM';
                } else if (leaveData.halfDay === 'PM') {
                  leave_duration = 'PM';
                } else if (leaveData.startTime && leaveData.endTime) {
                  // Calculate hours-based leave
                  const start = new Date(`2000-01-01T${leaveData.startTime}`);
                  const end = new Date(`2000-01-01T${leaveData.endTime}`);
                  leave_hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                  leave_duration = 'HOURS';
                }

                console.log('⏱️ Calculated Duration:', {
                  leave_duration,
                  leave_hours: leave_hours || 'N/A'
                });
                
                // Use pointage service to mark leave
                if (leaveData.leaveType === 'period' && leaveData.dateEnd) {
                  console.log('📅 Submitting PERIOD leave:', {
                    employee_id: selectedEmployeeForLeave.id,
                    start_date: leaveData.date,
                    end_date: leaveData.dateEnd,
                    leave_type: leaveData.leaveCategory,
                    leave_duration,
                    leave_hours,
                    motif: leaveData.motif || 'Congé',
                    is_paid_leave: leaveData.isPaid,
                    leave_status: 'approved'
                  });

                  // Mark leave for date range
                  await pointageService.markLeaveRange(
                    selectedEmployeeForLeave.id,
                    leaveData.date,
                    leaveData.dateEnd,
                    {
                      leave_type: (leaveData.leaveCategory as any) || 'annual',
                      leave_duration,
                      leave_hours,
                      motif: leaveData.motif || 'Congé',
                      is_paid_leave: leaveData.isPaid,
                      leave_status: 'approved'
                    }
                  );
                  console.log('✅ Period leave marked successfully');
                } else {
                  console.log('📅 Submitting SINGLE DAY leave:', {
                    employee_id: selectedEmployeeForLeave.id,
                    date: leaveData.date,
                    leave_type: leaveData.leaveCategory,
                    leave_duration,
                    leave_hours,
                    motif: leaveData.motif || 'Congé',
                    is_paid_leave: leaveData.isPaid,
                    leave_status: 'approved'
                  });

                  // Mark single day leave
                  await pointageService.markLeave({
                    employee_id: selectedEmployeeForLeave.id,
                    date: leaveData.date,
                    leave_type: (leaveData.leaveCategory as any) || 'annual',
                    leave_duration,
                    leave_hours,
                    motif: leaveData.motif || 'Congé',
                    is_paid_leave: leaveData.isPaid,
                    leave_status: 'approved'
                  });
                  console.log('✅ Single day leave marked successfully');
                }

                console.log('🏖️ === LEAVE SUBMISSION END ===');

                toast({
                  title: "Congé créé",
                  description: `Le congé pour ${selectedEmployeeForLeave.prenom} ${selectedEmployeeForLeave.nom} a été marqué dans le pointage.`,
                });

                // Refetch employees to get latest data
                await loadEmployees();

                setShowLeaveDialog(false);
                setSelectedEmployeeForLeave(null);
                setLeaveData({
                  date: new Date().toISOString().split('T')[0],
                  dateEnd: '',
                  leaveType: 'single',
                  leaveCategory: 'annual',
                  halfDay: 'FULL',
                  startTime: '',
                  endTime: '',
                  motif: '',
                  isPaid: true,
                });
              } catch (error) {
                console.error("Error creating leave:", error);
                toast({
                  title: "Erreur",
                  description: "Erreur lors de la création du congé",
                  variant: "destructive"
                });
              }
            }}>
              Créer le congé
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Actions Modals */}
      {showPlanningCreator && selectedEmployeeForPlanning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-background rounded-lg max-w-[98vw] sm:max-w-4xl lg:max-w-5xl w-full max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => {
                setShowPlanningCreator(false);
                setSelectedEmployeeForPlanning(null);
              }}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 h-8 w-8 rounded-full bg-background border border-border hover:bg-muted transition-colors flex items-center justify-center"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="p-3 sm:p-4 md:p-6">
              <WeeklyPlanningCreator
                employee={selectedEmployeeForPlanning}
                onSuccess={async () => {
                  setShowPlanningCreator(false);
                  setSelectedEmployeeForPlanning(null);
                  toast({
                    title: "Succès",
                    description: "Planning créé avec succès",
                  });
                  // Reload employee status to update icons instantly
                  await loadEmployeeStatus(employees);
                }}
                onCancel={() => {
                  setShowPlanningCreator(false);
                  setSelectedEmployeeForPlanning(null);
                }}
              />
            </div>
          </div>
        </div>
      )}


      {/* Import Poitage Modal */}
      <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Importer Poitage (Excel)</DialogTitle>
            <DialogDescription>
              Importez un fichier Excel (.xls/.xlsx) avec toutes les colonnes de données. Vous pourrez prévisualiser avant l'enregistrement.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end gap-2 px-6 pt-4">
            <Button onClick={savePointage} disabled={importLoading || importRows.length === 0}>
              {importLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer ({importRows.length} lignes)
            </Button>
          </div>

          <div className="space-y-4 py-4 px-6">
            <div>
              <input
                id="poitage-file"
                type="file"
                accept=".xls,.xlsx"
                className="hidden"
                onChange={async (e) => {
                  setImportError(null);
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setImportFileName(file.name);
                  setImportLoading(true);
                  try {
                    const data = await file.arrayBuffer();
                    const workbook = XLSX.read(data, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' }) as any[];
                    if (!Array.isArray(json) || json.length === 0) {
                      setImportError('Fichier invalide ou feuille vide');
                      setImportRows([]);
                      setImportColumns([]);
                    } else {
                      console.log('[Import] parsed rows count:', json.length);
                      // Helper to find a column value by possible header names
                      const findField = (row: any, candidates: string[]) => {
                        const keys = Object.keys(row || {});
                        for (const k of keys) {
                          const kn = k.trim().toLowerCase();
                          for (const c of candidates) {
                            if (kn === c.toLowerCase().trim()) return row[k];
                          }
                        }
                        // try contains
                        for (const k of keys) {
                          const kn = k.trim().toLowerCase();
                          for (const c of candidates) {
                            if (kn.indexOf(c.toLowerCase().trim()) !== -1) return row[k];
                          }
                        }
                        return '';
                      };

                      // Normalization helpers
                      const normalize = (s: string) => {
                        if (!s && s !== '') return '';
                        const str = String(s);
                        return str
                          .normalize('NFD')
                          .replace(/\p{Diacritic}/gu, '')
                          .replace(/\s+/g, ' ')
                          .trim()
                          .toLowerCase();
                      };

                      // Levenshtein distance for fuzzy matching
                      const levenshtein = (a: string, b: string) => {
                        if (a === b) return 0;
                        const al = a.length; const bl = b.length;
                        if (al === 0) return bl;
                        if (bl === 0) return al;
                        const v = new Array(bl + 1).fill(0).map((_, i) => i);
                        for (let i = 0; i < al; i++) {
                          let prev = i + 1;
                          for (let j = 0; j < bl; j++) {
                            const cur = v[j + 1];
                            const cost = a[i] === b[j] ? 0 : 1;
                            v[j + 1] = Math.min(v[j + 1] + 1, v[j] + 1, prev + cost);
                            prev = cur;
                          }
                        }
                        return v[bl];
                      };

                      const prenomNames = ['prénom', 'prénom.', 'prenom', 'prenom.','prénom '];
                      const nomNames = ['nom', 'nom.'];
                      const dateNames = ['date', 'date.'];

                      // Parse all rows with ALL Excel columns
                      const previewRows: any[] = [];
                      const unmatched: any[] = [];

                      for (let idx = 0; idx < json.length; idx++) {
                        const row = json[idx];
                        const prenomVal = String(findField(row, prenomNames) || '').trim();
                        const nomVal = String(findField(row, nomNames) || '').trim();
                        const dateVal = String(findField(row, dateNames) || '').trim();

                        if (!prenomVal || !nomVal) {
                          continue; // skip rows without names
                        }

                        // Match employee by name (normalized)
                        const normPrenom = normalize(prenomVal);
                        const normNom = normalize(nomVal);
                        let matched = employees.find(e => {
                          if (!e.prenom || !e.nom) return false;
                          const ePren = normalize(String(e.prenom));
                          const eNom = normalize(String(e.nom));
                          return ePren === normPrenom && eNom === normNom;
                        });

                        // Try swapped columns
                        if (!matched) {
                          matched = employees.find(e => {
                            if (!e.prenom || !e.nom) return false;
                            const ePren = normalize(String(e.prenom));
                            const eNom = normalize(String(e.nom));
                            return ePren === normNom && eNom === normPrenom;
                          });
                        }

                        // Fuzzy matching
                        if (!matched) {
                          const excelFull = normalize(`${prenomVal} ${nomVal}`);
                          let best: { emp?: Employee; dist: number } = { emp: undefined, dist: Infinity };
                          for (const e of employees) {
                            if (!e.prenom || !e.nom) continue;
                            const empFull = normalize(`${e.prenom} ${e.nom}`);
                            const d = levenshtein(excelFull, empFull);
                            if (d < best.dist) best = { emp: e, dist: d };
                          }
                          if (best.emp && best.dist <= 2) {
                            matched = best.emp;
                          }
                        }

                        if (!matched) {
                          unmatched.push({ __rowIndex: idx, raw: row, prenom: prenomVal, nom: nomVal, date: dateVal });
                          continue;
                        }

                        // Parse date to month (YYYY-MM format)
                        let monthLabel = '';
                        let parsedDate = '';
                        try {
                          let parsedDateObj: Date | null = null;
                          const dm = dateVal.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
                          if (dm) {
                            const d = parseInt(dm[1], 10);
                            const m = parseInt(dm[2], 10) - 1;
                            const y = parseInt(dm[3], 10);
                            parsedDateObj = new Date(y, m, d);
                          } else {
                            const tryDate = new Date(dateVal);
                            if (!isNaN(tryDate.getTime())) parsedDateObj = tryDate;
                          }
                          if (parsedDateObj) {
                            const year = parsedDateObj.getFullYear();
                            const monthNum = String(parsedDateObj.getMonth() + 1).padStart(2, '0');
                            const day = String(parsedDateObj.getDate()).padStart(2, '0');
                            parsedDate = `${year}-${monthNum}-${day}`;
                            monthLabel = `${year}-${monthNum}`;
                          }
                        } catch (e) {
                          monthLabel = '';
                        }

                        // Extract ALL columns from Excel
                        const pointageData: any = {
                          employee_id: matched.id,
                          month: monthLabel || new Date().toISOString().slice(0, 7),
                          emp_no: findField(row, ['emp no.', 'emp no', 'emp_no']) || null,
                          matricule: findField(row, ['matricule.', 'matricule']) || null,
                          prenom: prenomVal,
                          nom: nomVal,
                          jr_repos: findField(row, ['jr repos.', 'jr repos', 'jr_repos']) || null,
                          date: parsedDate,
                          horaire: findField(row, ['horaire.', 'horaire']) || null,
                          debut: findField(row, ['début.', 'début', 'debut']) || null,
                          fin: findField(row, ['fin.', 'fin']) || null,
                          entree: findField(row, ['entrée.', 'entrée', 'entree']) || null,
                          sortie: findField(row, ['sortie.', 'sortie']) || null,
                          jr_normalement_trv: parseFloat(String(findField(row, ['jr normalement trv', 'jr_normalement_trv']) || '0').replace(',', '.')) || 0,
                          jr_travaille: parseFloat(String(findField(row, ['jr. travaillé.', 'jr travaillé', 'jr travaille', 'jr_travaille']) || '0').replace(',', '.')) || 0,
                          retard: parseFloat(String(findField(row, ['retard.', 'retard']) || '0').replace(',', '.')) || 0,
                          depart_anticipe: parseFloat(String(findField(row, ['départ anticipé.', 'depart anticipé', 'depart_anticipe']) || '0').replace(',', '.')) || 0,
                          absent: String(findField(row, ['absent.', 'absent']) || '').toLowerCase() === 'true' ? 1 : 0,
                          h_sup: parseFloat(String(findField(row, ['h sup.', 'h sup', 'h_sup']) || '0').replace(',', '.')) || 0,
                          presence_planning: findField(row, ['présence planning.', 'presence planning', 'presence_planning']) || null,
                          motif: findField(row, ['motif']) || null,
                          ptg_entree_obligatoire: findField(row, ['ptg entrée obligatoire', 'ptg_entree_obligatoire']) || null,
                          ptg_sortie_obligatoire: findField(row, ['ptg sortie obligatoire', 'ptg_sortie_obligatoire']) || null,
                          departement: findField(row, ['département', 'departement']) || null,
                          ndays: parseFloat(String(findField(row, ['ndays']) || '0').replace(',', '.')) || 0,
                          weekend: parseFloat(String(findField(row, ['weekend']) || '0').replace(',', '.')) || 0,
                          holiday: parseFloat(String(findField(row, ['holiday']) || '0').replace(',', '.')) || 0,
                          presence_reelle: findField(row, ['présence réelle.', 'presence réelle', 'presence_reelle']) || null,
                          weekend_ot: parseFloat(String(findField(row, ['weekend_ot']) || '0').replace(',', '.')) || 0,
                          ndays_ot: parseFloat(String(findField(row, ['ndays_ot']) || '0').replace(',', '.')) || 0,
                          holiday_ot: parseFloat(String(findField(row, ['holiday_ot']) || '0').replace(',', '.')) || 0,
                          sspe_day_holiday_ot: parseFloat(String(findField(row, ['sspedayholidayot', 'sspe_day_holiday_ot']) || '0').replace(',', '.')) || 0,
                          jr_travaille_count: parseFloat(String(findField(row, ['jr. travaillé.', 'jr travaillé', 'jr_travaille']) || '0').replace(',', '.')) >= 1 ? 1 : 0,
                          absent_count: String(findField(row, ['absent.', 'absent']) || '').toLowerCase() === 'true' ? 1 : 0,
                        };

                        previewRows.push(pointageData);
                      }

                      setImportRows(previewRows);
                      // Only show essential columns in UI, but all data is preserved in rows
                      setImportColumns([
                        'matricule', 'prenom', 'nom', 'jr_repos', 'date', 
                        'horaire', 'debut', 'fin', 'entree', 'sortie'
                      ]);
                      setUnmatchedRows(unmatched);
                    }
                  } catch (err: any) {
                    console.error('Import error:', err);
                    setImportError('Erreur lors de la lecture du fichier');
                    setImportRows([]);
                    setImportColumns([]);
                  } finally {
                    setImportLoading(false);
                    (document.getElementById('poitage-file') as HTMLInputElement | null)!.value = '';
                  }
                }}
              />

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => document.getElementById('poitage-file')?.click()}>
                  <Upload className="h-4 w-4 mr-2" />
                  Choisir le fichier
                </Button>
                <div className="flex items-center text-sm text-muted-foreground">{importFileName || 'Aucun fichier sélectionné'}</div>
              </div>
              {importError && <div className="text-sm text-destructive mt-2">{importError}</div>}
            </div>

            <div>
              <div className="overflow-x-auto border rounded">
                <table className="min-w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      {importColumns.map((col) => (
                        <th key={col} className="py-2 px-3 text-left font-medium">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {importRows.slice(0, 200).map((row, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? '' : 'bg-muted/20'}>
                        {importColumns.map((col) => (
                          <td key={col} className="py-2 px-3 align-top whitespace-nowrap max-w-[220px] overflow-hidden text-ellipsis">{String((row as any)[col] ?? '')}</td>
                        ))}
                      </tr>
                    ))}
                    {importRows.length === 0 && (
                      <tr>
                        <td colSpan={importColumns.length || 1} className="p-4 text-center text-muted-foreground">Aucune donnée à afficher</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {importRows.length > 200 && (
                <div className="text-xs text-muted-foreground mt-1">Aperçu limité aux 200 premières lignes</div>
              )}
            </div>

            {unmatchedRows.length > 0 && (
              <div className="space-y-2 border-t pt-3">
                <h3 className="text-sm font-medium text-destructive">Lignes non appariées ({unmatchedRows.length})</h3>
                <p className="text-xs text-muted-foreground">Ces employés n'ont pas pu être matchés automatiquement</p>
                <div className="overflow-x-auto border rounded max-h-[200px]">
                  <table className="min-w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="py-2 px-3 text-left">Prénom</th>
                        <th className="py-2 px-3 text-left">Nom</th>
                        <th className="py-2 px-3 text-left">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {unmatchedRows.map((r, i) => (
                        <tr key={i} className={i % 2 === 0 ? '' : 'bg-muted/20'}>
                          <td className="py-2 px-3">{r.prenom}</td>
                          <td className="py-2 px-3">{r.nom}</td>
                          <td className="py-2 px-3">{r.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowImportModal(false);
              setImportRows([]);
              setImportColumns([]);
              setUnmatchedRows([]);
              setImportFileName(null);
            }}>
              Annuler
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Modal */}
      <Dialog open={showExportModal} onOpenChange={setShowExportModal}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Exporter les Données des Employés</DialogTitle>
            <DialogDescription>
              Sélectionnez les données à inclure dans l'export
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Données de base incluses:</p>
              <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
                <li>Nom, Prénom, Contact</li>
                <li>Adresse, Région, Rôle, Âge</li>
                <li>Statut civil et professionnel</li>
                <li>Date d'embauche</li>
              </ul>
            </div>

            <div className="space-y-3 pt-2 border-t">
              <p className="text-sm font-medium">Données supplémentaires:</p>
              
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="salary"
                  checked={exportOptions.includeSalary}
                  onCheckedChange={(checked) => 
                    setExportOptions({...exportOptions, includeSalary: checked as boolean})
                  }
                />
                <div className="flex-1 space-y-2">
                  <Label htmlFor="salary" className="text-sm font-normal cursor-pointer">
                    Salaires
                  </Label>
                  {exportOptions.includeSalary && (
                    <Select
                      value={exportOptions.salaryPeriod}
                      onValueChange={(value: any) => 
                        setExportOptions({...exportOptions, salaryPeriod: value})
                      }
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="current">Salaire Actuel</SelectItem>
                        <SelectItem value="monthly">Total Mensuel</SelectItem>
                        <SelectItem value="yearly">Total Annuel</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hours"
                  checked={exportOptions.includeHours}
                  onCheckedChange={(checked) => 
                    setExportOptions({...exportOptions, includeHours: checked as boolean})
                  }
                />
                <Label htmlFor="hours" className="text-sm font-normal cursor-pointer">
                  Heures travaillées (total)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="leaves"
                  checked={exportOptions.includeLeaves}
                  onCheckedChange={(checked) => 
                    setExportOptions({...exportOptions, includeLeaves: checked as boolean})
                  }
                />
                <Label htmlFor="leaves" className="text-sm font-normal cursor-pointer">
                  Congés (jours et heures)
                </Label>
              </div>
            </div>

            <div className="text-xs text-muted-foreground pt-2">
              {filteredEmployees.length} employé(s) seront exporté(s)
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExportModal(false)}>
              Annuler
            </Button>
            <Button onClick={handleExport} disabled={exporting}>
              {exporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Exporter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Employes;