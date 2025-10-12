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
  scheduleService
} from "@/utils/rhService";
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
  // Import Poitage states
  const [showImportModal, setShowImportModal] = useState(false);
  const [importRows, setImportRows] = useState<any[]>([]);
  const [importColumns, setImportColumns] = useState<string[]>([]);
  const [unmatchedRows, setUnmatchedRows] = useState<any[]>([]);
  const [importFileName, setImportFileName] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [employeeStatus, setEmployeeStatus] = useState<Record<number, { hasPlanning: boolean; hasSalary: boolean }>>({});
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [selectedEmployeeForLeave, setSelectedEmployeeForLeave] = useState<Employee | null>(null);
  const [leaveData, setLeaveData] = useState({
    date: new Date().toISOString().split('T')[0],
    dateEnd: '',
    leaveType: 'single' as 'single' | 'period',
    halfDay: 'FULL' as 'AM' | 'PM' | 'FULL',
    startTime: '',
    endTime: '',
    motif: '',
    isPaid: true,
  });
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
    const statusMap: Record<number, { hasPlanning: boolean; hasSalary: boolean }> = {};
    
    await Promise.all(
      employees.map(async (employee) => {
        try {
          // Check for planning (shift templates or schedules)
          const [templates, schedules, salaries] = await Promise.all([
            shiftTemplateService.getAll(employee.id),
            scheduleService.getAll({ employee_id: employee.id }),
            salaryService.getAll({ employee_id: employee.id })
          ]);
          
          statusMap[employee.id] = {
            hasPlanning: templates.length > 0 || schedules.length > 0,
            hasSalary: salaries.length > 0
          };
        } catch (error) {
          // If error, mark as not filled
          statusMap[employee.id] = {
            hasPlanning: false,
            hasSalary: false
          };
        }
      })
    );
    
    setEmployeeStatus(statusMap);
  };

  // Reload when filters change
  useEffect(() => {
    if (!loading) {
      loadEmployees();
    }
  }, [regionFilter, statusFilter, searchTerm]);



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
            <span className="text-xs sm:text-sm">Importer Poitage</span>
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
                const status = employeeStatus[employee.id] || { hasPlanning: false, hasSalary: false };
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
                          const status = employeeStatus[employee.id] || { hasPlanning: false, hasSalary: false };
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
            {/* Type de congé */}
            <div className="space-y-2">
              <Label>Type de congé</Label>
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
              try {
                if (!selectedEmployeeForLeave) return;

                // Validate period dates
                if (leaveData.leaveType === 'period' && (!leaveData.dateEnd || leaveData.dateEnd < leaveData.date)) {
                  toast({
                    title: "Erreur",
                    description: "Veuillez sélectionner une date de fin valide",
                    variant: "destructive"
                  });
                  return;
                }
                
                await holidayService.create({
                  employee_id: selectedEmployeeForLeave.id,
                  date: leaveData.date,
                  date_end: leaveData.leaveType === 'period' ? leaveData.dateEnd : undefined,
                  half_day: leaveData.halfDay,
                  start_time: leaveData.startTime || undefined,
                  end_time: leaveData.endTime || undefined,
                  motif: leaveData.motif || 'Congé',
                  status: 'approved',
                  is_paid: leaveData.isPaid,
                });

                toast({
                  title: "Congé créé",
                  description: `Le congé pour ${selectedEmployeeForLeave.prenom} ${selectedEmployeeForLeave.nom} a été créé avec succès.`,
                });

                setShowLeaveDialog(false);
                setSelectedEmployeeForLeave(null);
                setLeaveData({
                  date: new Date().toISOString().split('T')[0],
                  dateEnd: '',
                  leaveType: 'single',
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

      {/* Import Poitage Modal */}
      <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Importer Poitage (Excel)</DialogTitle>
            <DialogDescription>
              Importez un fichier Excel (.xls/.xlsx) avec la structure de colonnes attendue. Vous pourrez prévisualiser les lignes avant traitement.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
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
                      console.log('[Import] sample rows:', json.slice(0, 5));
                      console.log('[Import] employees loaded count:', employees.length, 'sample:', employees.slice(0, 5));
                      // Helper to find a column value by a list of possible header names
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

                      // Normalization helpers (remove accents, lowercase, collapse spaces)
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
                      const jrTravNames = ['jr. travaillé.', 'jr. travaillé', 'jr travaille', 'jr. travaillé', 'jr travaillé', 'jr.travaill '];
                      const absentNames = ['absent', 'absent.'];
                      const entreeNames = ['entrée', 'entree', 'entrée.','entrée '];
                      const sortieNames = ['sortie', 'sortie.'];

                      // Log normalized header keys to help debugging
                      const rawHeaders = Object.keys(json[0] || {});
                      const normalizedHeaders = rawHeaders.map(h => ({ raw: h, normalized: normalize(h) }));
                      console.log('[Import] detected headers:', normalizedHeaders);

                      // Build a map keyed by employeeId|month
                      const map: Record<string, { employeeId?: number; prenom: string; nom: string; month: string; totalWorked: number; absentCount: number } > = {};

                      for (let idx = 0; idx < json.length; idx++) {
                        const row = json[idx];
                        const prenomVal = String(findField(row, prenomNames) || '').trim();
                        const nomVal = String(findField(row, nomNames) || '').trim();
                        const dateVal = String(findField(row, dateNames) || '').trim();
                        const jrValRaw = findField(row, jrTravNames) || '';
                        const absentRaw = String(findField(row, absentNames) || '').trim();
                        const entreeVal = String(findField(row, entreeNames) || '').trim();
                        const sortieVal = String(findField(row, sortieNames) || '').trim();

                        console.log(`[Import] row ${idx} raw -> prenom:'${prenomVal}', nom:'${nomVal}', date:'${dateVal}', entree:'${entreeVal}', sortie:'${sortieVal}', absent:'${absentRaw}'`);

                        if (!prenomVal || !nomVal) {
                          console.log(`[Import] row ${idx} skipped: missing prenom or nom`);
                          continue; // only consider rows with names
                        }

                        // Match employee by prenom & nom using normalized values
                        const normPrenom = normalize(prenomVal);
                        const normNom = normalize(nomVal);
                        console.log(`[Import] normalized excel name -> '${normPrenom}' '${normNom}'`);
                        let matched = employees.find(e => {
                          if (!e.prenom || !e.nom) return false;
                          const ePren = normalize(String(e.prenom));
                          const eNom = normalize(String(e.nom));
                          // log comparison for debugging
                          // console.log(`[Import] compare exact: excel='${normPrenom} ${normNom}' emp='${ePren} ${eNom}'`);
                          return ePren === normPrenom && eNom === normNom;
                        });

                        // If not found, try swapped columns (excel might have Prénom/ Nom reversed)
                        if (!matched) {
                          matched = employees.find(e => {
                            if (!e.prenom || !e.nom) return false;
                            const ePren = normalize(String(e.prenom));
                            const eNom = normalize(String(e.nom));
                            return ePren === normNom && eNom === normPrenom;
                          });
                          if (matched) console.log(`[Import] row ${idx} matched by swapped fields to id=${matched.id} (${matched.prenom} ${matched.nom})`);
                        }

                        // If still not matched, try fuzzy matching on full name (normalized)
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
                            console.log(`[Import] row ${idx} fuzzy matched to id=${matched.id} (${matched.prenom} ${matched.nom}) with dist=${best.dist}`);
                          } else if (best.emp) {
                            console.log(`[Import] row ${idx} best fuzzy candidate id=${best.emp.id} (${best.emp.prenom} ${best.emp.nom}) dist=${best.dist} - too far`);
                          }
                        }

                        if (!matched) {
                          // push to unmatched list for manual mapping
                          setUnmatchedRows(prev => [...prev, { __rowIndex: idx, raw: row, prenom: prenomVal, nom: nomVal, date: dateVal, entree: entreeVal, sortie: sortieVal, absent: absentRaw }] );
                          console.log(`[Import] row ${idx} no match found for '${prenomVal} ${nomVal}' -> added to unmatchedRows`);
                          continue;
                        }
                        console.log(`[Import] row ${idx} FINAL matched employee id=${matched.id} (${matched.prenom} ${matched.nom})`);

                        // Parse date to month
                        let monthLabel = 'unknown';
                        try {
                          let parsedDate: Date | null = null;
                          const dm = dateVal.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
                          if (dm) {
                            // dd/mm/yyyy
                            const d = parseInt(dm[1], 10);
                            const m = parseInt(dm[2], 10) - 1;
                            const y = parseInt(dm[3], 10);
                            parsedDate = new Date(y, m, d);
                          } else {
                            const tryDate = new Date(dateVal);
                            if (!isNaN(tryDate.getTime())) parsedDate = tryDate;
                          }
                          if (parsedDate) {
                            monthLabel = parsedDate.toLocaleString('en-US', { month: 'long' }).toLowerCase();
                          }
                        } catch (e) {
                          monthLabel = 'unknown';
                        }

                        // Determine Jr. travaillé for this row
                        let jrWorked = 0;
                        if (jrValRaw !== '') {
                          const jrNum = Number(String(jrValRaw).replace(',', '.'));
                          jrWorked = !isNaN(jrNum) && jrNum >= 1 ? 1 : 0;
                        } else {
                          // fallback: if entry and sortie exist and not absent
                          const absentFlag = String(absentRaw).trim().toLowerCase();
                          const isAbsent = ['true', '1', 'yes', 'oui'].includes(absentFlag);
                          if (entreeVal && sortieVal && !isAbsent) jrWorked = 1;
                        }

                        const absentFlag = String(absentRaw).trim().toLowerCase();
                        const isAbsentRow = ['true', '1', 'yes', 'oui'].includes(absentFlag);

                        const key = `${matched.id}|${monthLabel}`;
                        if (!map[key]) {
                          map[key] = {
                            employeeId: matched.id,
                            prenom: matched.prenom,
                            nom: matched.nom,
                            month: monthLabel,
                            totalWorked: 0,
                            absentCount: 0
                          };
                        }
                        map[key].totalWorked += jrWorked;
                        map[key].absentCount += isAbsentRow ? 1 : 0;
                      }

                      // Convert map to rows for preview
                      const previewRows = Object.values(map).map(r => ({
                        employee_id: r.employeeId,
                        prenom: r.prenom,
                        nom: r.nom,
                        month: r.month,
                        jr_travaille_count: r.totalWorked,
                        absent_count: r.absentCount
                      }));

                      setImportRows(previewRows);
                      setImportColumns(['employee_id', 'prenom', 'nom', 'month', 'jr_travaille_count', 'absent_count']);
                    }
                  } catch (err: any) {
                    console.error('Import error:', err);
                    setImportError('Erreur lors de la lecture du fichier');
                    setImportRows([]);
                    setImportColumns([]);
                  } finally {
                    setImportLoading(false);
                    // clear the input so same file can be re-selected
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

            {/* Unmatched rows mapping UI */}
            {unmatchedRows.length > 0 && (
              <div className="space-y-2 border-t pt-3">
                <h3 className="text-sm font-medium">Lignes non appariées ({unmatchedRows.length})</h3>
                {/* Global apply-to-all mapping control */}
                <div className="flex items-center gap-2 mb-2">
                  <select id="apply-all-select" className="rounded border px-2 py-1 text-sm">
                    <option value="">-- Appliquer à tous --</option>
                    {employees.map(emp => (
                      <option key={`apply-all-${emp.id}`} value={emp.id}>{emp.prenom} {emp.nom} ({emp.id})</option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    onClick={() => {
                      const sel = (document.getElementById('apply-all-select') as HTMLSelectElement | null);
                      if (!sel) return;
                      const val = sel.value;
                      if (!val) return;
                      const empId = Number(val);
                      const emp = employees.find(e => e.id === empId);
                      if (!emp) return;

                      // For each unmatched row, compute month and update importRows aggregation
                      setImportRows(prev => {
                        const copy = [...prev];
                        const toProcess = [...unmatchedRows];
                        for (const r of toProcess) {
                          const monthLabel = (() => {
                            try {
                              const dm = String(r.date).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
                              if (dm) {
                                const m = parseInt(dm[2], 10) - 1;
                                return new Date(parseInt(dm[3],10), m, parseInt(dm[1],10)).toLocaleString('en-US', { month: 'long' }).toLowerCase();
                              }
                              const d2 = new Date(r.date);
                              if (!isNaN(d2.getTime())) return d2.toLocaleString('en-US', { month: 'long' }).toLowerCase();
                            } catch (e) {}
                            return 'unknown';
                          })();

                          const keyExists = copy.find(p => p.employee_id === emp.id && p.month === monthLabel);
                          const jrInc = (r.entree && r.sortie && (!r.absent || r.absent === 'false')) ? 1 : 0;
                          const absInc = (['true','1','yes','oui'].includes(String(r.absent).toLowerCase()) ? 1 : 0);
                          if (keyExists) {
                            keyExists.jr_travaille_count = (keyExists.jr_travaille_count || 0) + jrInc;
                            keyExists.absent_count = (keyExists.absent_count || 0) + absInc;
                          } else {
                            copy.push({
                              employee_id: emp.id,
                              prenom: emp.prenom,
                              nom: emp.nom,
                              month: monthLabel,
                              jr_travaille_count: jrInc,
                              absent_count: absInc
                            });
                          }
                        }
                        return copy;
                      });

                      // Clear unmatched rows since we've applied mapping
                      setUnmatchedRows([]);
                      // reset the select
                      sel.value = '';
                      toast({ title: 'Mapping appliqué', description: `Toutes les lignes non appariées ont été associées à ${emp.prenom} ${emp.nom}` });
                    }}
                  >Appliquer à tous</Button>
                </div>

                <div className="overflow-x-auto border rounded">
                  <table className="min-w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="py-2 px-3 text-left">#</th>
                        <th className="py-2 px-3 text-left">Prénom</th>
                        <th className="py-2 px-3 text-left">Nom</th>
                        <th className="py-2 px-3 text-left">Date</th>
                        <th className="py-2 px-3 text-left">Mapper</th>
                      </tr>
                    </thead>
                    <tbody>
                      {unmatchedRows.map((r, i) => (
                        <tr key={i} className={i % 2 === 0 ? '' : 'bg-muted/20'}>
                          <td className="py-2 px-3">{r.__rowIndex}</td>
                          <td className="py-2 px-3">{r.prenom}</td>
                          <td className="py-2 px-3">{r.nom}</td>
                          <td className="py-2 px-3">{r.date}</td>
                          <td className="py-2 px-3">
                            <div className="flex gap-2 items-center">
                              <select
                                className="rounded border px-2 py-1 text-sm"
                                defaultValue=""
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (!val) return;
                                  const empId = Number(val);
                                  const emp = employees.find(x => x.id === empId);
                                  if (!emp) return;
                                  // assign this unmatched row to emp and recalculate aggregated preview
                                  // create a synthetic matched object for this row
                                  const monthLabel = (() => {
                                    try {
                                      const dm = String(r.date).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
                                      if (dm) {
                                        const m = parseInt(dm[2], 10) - 1;
                                        return new Date(parseInt(dm[3],10), m, parseInt(dm[1],10)).toLocaleString('en-US', { month: 'long' }).toLowerCase();
                                      }
                                      const d2 = new Date(r.date);
                                      if (!isNaN(d2.getTime())) return d2.toLocaleString('en-US', { month: 'long' }).toLowerCase();
                                    } catch (e) {}
                                    return 'unknown';
                                  })();

                                  setImportRows(prev => {
                                    // add or update aggregated row for emp+month
                                    const key = `${emp.id}|${monthLabel}`;
                                    const exists = prev.find(p => p.employee_id === emp.id && p.month === monthLabel);
                                    if (exists) {
                                      // increment counts conservatively: if we can detect absent
                                      exists.jr_travaille_count = (exists.jr_travaille_count || 0) + (r.entree && r.sortie && (!r.absent || r.absent === 'false') ? 1 : 0);
                                      exists.absent_count = (exists.absent_count || 0) + (['true','1','yes','oui'].includes(String(r.absent).toLowerCase()) ? 1 : 0);
                                      return [...prev];
                                    } else {
                                      const newRow = {
                                        employee_id: emp.id,
                                        prenom: emp.prenom,
                                        nom: emp.nom,
                                        month: monthLabel,
                                        jr_travaille_count: (r.entree && r.sortie && (!r.absent || r.absent === 'false')) ? 1 : 0,
                                        absent_count: (['true','1','yes','oui'].includes(String(r.absent).toLowerCase()) ? 1 : 0)
                                      };
                                      return [...prev, newRow];
                                    }
                                  });

                                  // remove from unmatchedRows
                                  setUnmatchedRows(prev => prev.filter(u => u.__rowIndex !== r.__rowIndex));
                                }}
                              >
                                <option value="">-- choisir --</option>
                                {employees.map(emp => (
                                  <option key={emp.id} value={emp.id}>{emp.prenom} {emp.nom} ({emp.id})</option>
                                ))}
                              </select>
                              <Button variant="ghost" size="sm" onClick={() => setUnmatchedRows(prev => prev.filter(u => u.__rowIndex !== r.__rowIndex))}>Ignorer</Button>
                            </div>
                          </td>
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
              setImportFileName(null);
              setImportError(null);
            }}>
              Annuler
            </Button>
            <Button onClick={() => {
              // For now we only preview; here you can call an API to import rows server-side
              toast({ title: 'Import terminé', description: `${importRows.length} ligne(s) prêtes à être traitées` });
            }} disabled={importRows.length === 0 || importLoading}>
              {importLoading ? 'Chargement...' : 'Traiter l\'import'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Employes;