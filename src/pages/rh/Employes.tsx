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
  DollarSign as DollarSignIcon
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
import QuickSalaryModal from "@/components/QuickSalaryModal";
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
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const [isEditingEmployee, setIsEditingEmployee] = useState<Employee | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPlanningCreator, setShowPlanningCreator] = useState(false);
  const [selectedEmployeeForPlanning, setSelectedEmployeeForPlanning] = useState<Employee | null>(null);
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [selectedEmployeeForSalary, setSelectedEmployeeForSalary] = useState<Employee | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    includeSalary: false,
    salaryPeriod: 'current' as 'current' | 'monthly' | 'yearly',
    includeHours: false,
    includeLeaves: false
  });
  const [exporting, setExporting] = useState(false);
  const [employeeStatus, setEmployeeStatus] = useState<Record<number, { hasPlanning: boolean; hasSalary: boolean }>>({});
  const isMobile = useIsMobile();
  const { toast } = useToast();

  const [newEmployee, setNewEmployee] = useState<CreateEmployeeData>({
    nom: "",
    prenom: "",
    telephone: "",
    adresse: "",
    region: "",
    statut_civil: "autre",
    actif: true,
    role: "",
    age: undefined,
    carte_identite: "",
    sexe: undefined,
    cnss_code: "",
    nombre_enfants: 0,
    date_naissance: ""
  });

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

  const handleAddEmployee = async () => {
    if (!newEmployee.nom || !newEmployee.prenom) {
      toast({
        title: "Erreur",
        description: "Le nom et prénom sont obligatoires",
        variant: "destructive"
      });
      return;
    }

    try {
      setSubmitting(true);
      const result = await employeeService.create(newEmployee);
      
      if (result.success) {
        // Upload photo if selected
        if (selectedPhoto && result.id) {
          setUploadingPhoto(true);
          try {
            await employeeService.uploadPhoto(result.id, selectedPhoto);
          } catch (error) {
            console.error('Photo upload error:', error);
            toast({
              title: "Avertissement",
              description: "Employé créé mais erreur lors de l'upload de la photo",
              variant: "destructive"
            });
          } finally {
            setUploadingPhoto(false);
          }
        }

        toast({
          title: "Succès",
          description: result.message || "Employé créé avec succès"
        });
        setNewEmployee({
          nom: "",
          prenom: "",
          telephone: "",
          adresse: "",
          region: "",
          statut_civil: "autre",
          actif: true,
          role: "",
          age: undefined,
          carte_identite: "",
          sexe: undefined,
          cnss_code: "",
          nombre_enfants: 0,
          date_naissance: ""
        });
        setSelectedPhoto(null);
        setPhotoPreview(null);
        setIsAddingEmployee(false);
        loadEmployees();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de la création",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditEmployee = async () => {
    if (!isEditingEmployee || !isEditingEmployee.nom || !isEditingEmployee.prenom) {
      toast({
        title: "Erreur",
        description: "Le nom et prénom sont obligatoires",
        variant: "destructive"
      });
      return;
    }

    try {
      setSubmitting(true);
      const result = await employeeService.update(isEditingEmployee.id, {
        nom: isEditingEmployee.nom,
        prenom: isEditingEmployee.prenom,
        telephone: isEditingEmployee.telephone,
        adresse: isEditingEmployee.adresse,
        region: isEditingEmployee.region,
        statut_civil: isEditingEmployee.statut_civil,
        actif: isEditingEmployee.actif,
        role: isEditingEmployee.role,
        age: isEditingEmployee.age,
        carte_identite: isEditingEmployee.carte_identite,
        sexe: isEditingEmployee.sexe,
        cnss_code: isEditingEmployee.cnss_code,
        nombre_enfants: isEditingEmployee.nombre_enfants,
        date_naissance: isEditingEmployee.date_naissance
      });
      
      if (result.success) {
        // Upload photo if selected
        if (selectedPhoto) {
          setUploadingPhoto(true);
          try {
            await employeeService.uploadPhoto(isEditingEmployee.id, selectedPhoto);
          } catch (error) {
            console.error('Photo upload error:', error);
            toast({
              title: "Avertissement",
              description: "Employé mis à jour mais erreur lors de l'upload de la photo",
              variant: "destructive"
            });
          } finally {
            setUploadingPhoto(false);
          }
        }

        toast({
          title: "Succès",
          description: result.message || "Employé mis à jour avec succès"
        });
        setIsEditingEmployee(null);
        setSelectedPhoto(null);
        setPhotoPreview(null);
        loadEmployees();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de la mise à jour",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
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

  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Erreur",
        description: "Format non supporté. Utilisez JPG, PNG ou WEBP",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erreur",
        description: "La photo ne doit pas dépasser 5MB",
        variant: "destructive"
      });
      return;
    }

    setSelectedPhoto(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const clearPhoto = () => {
    setSelectedPhoto(null);
    setPhotoPreview(null);
  };

  const handleDeletePhoto = async (employeeId: number) => {
    try {
      const result = await employeeService.deletePhoto(employeeId);
      if (result.success) {
        toast({
          title: "Succès",
          description: "Photo supprimée avec succès"
        });
        loadEmployees();
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression de la photo",
        variant: "destructive"
      });
    }
  };

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
            onClick={() => setShowExportModal(true)}
            className="flex-1 sm:flex-initial"
          >
            <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="text-xs sm:text-sm">Exporter</span>
          </Button>
          <Dialog open={isAddingEmployee} onOpenChange={(open) => {
            setIsAddingEmployee(open);
            if (!open) {
              clearPhoto();
            }
          }}>
            <DialogTrigger asChild>
              <Button size={isMobile ? "sm" : "default"} className="flex-1 sm:flex-initial">
                <UserPlus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="text-xs sm:text-sm">{isMobile ? "Employé" : "Nouvel Employé"}</span>
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nouvel Employé</DialogTitle>
              <DialogDescription>
                Ajouter un nouveau membre à l'équipe
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Photo Upload */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-xs sm:text-sm">Photo</Label>
                <div className="col-span-3 space-y-2">
                  {photoPreview ? (
                    <div className="relative">
                      <img 
                        src={photoPreview} 
                        alt="Preview" 
                        className="w-24 h-24 object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6"
                        onClick={clearPhoto}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Input
                        id="photo-upload"
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handlePhotoSelect}
                        className="hidden"
                      />
                      <Label htmlFor="photo-upload" className="cursor-pointer">
                        <div className="flex items-center gap-2 px-3 py-2 border rounded-md hover:bg-accent">
                          <Upload className="h-4 w-4" />
                          <span className="text-xs sm:text-sm">Choisir une photo</span>
                        </div>
                      </Label>
                      <span className="text-xs text-muted-foreground">(Optionnel)</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="nom" className="text-right">Nom *</Label>
                <Input
                  id="nom"
                  value={newEmployee.nom}
                  onChange={(e) => setNewEmployee({...newEmployee, nom: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="prenom" className="text-right">Prénom *</Label>
                <Input
                  id="prenom"
                  value={newEmployee.prenom}
                  onChange={(e) => setNewEmployee({...newEmployee, prenom: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="telephone" className="text-right">Téléphone</Label>
                <Input
                  id="telephone"
                  value={newEmployee.telephone}
                  onChange={(e) => setNewEmployee({...newEmployee, telephone: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="region" className="text-right">Région</Label>
                <Select
                  value={newEmployee.region}
                  onValueChange={(value) => setNewEmployee({...newEmployee, region: value})}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Sélectionner une région" />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map(region => (
                      <SelectItem key={region} value={region}>{region}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="statut_civil" className="text-right">Statut Civil</Label>
                <Select
                  value={newEmployee.statut_civil}
                  onValueChange={(value) => setNewEmployee({...newEmployee, statut_civil: value as any})}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statutCivilLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">Rôle</Label>
                <Input
                  id="role"
                  value={newEmployee.role}
                  onChange={(e) => setNewEmployee({...newEmployee, role: e.target.value})}
                  className="col-span-3"
                  placeholder="Ex: Couturier, Manager..."
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="carte_identite" className="text-right">CIN</Label>
                <Input
                  id="carte_identite"
                  value={newEmployee.carte_identite}
                  onChange={(e) => setNewEmployee({...newEmployee, carte_identite: e.target.value})}
                  className="col-span-3"
                  placeholder="Numéro de carte d'identité"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="sexe" className="text-right">Sexe</Label>
                <Select
                  value={newEmployee.sexe}
                  onValueChange={(value) => setNewEmployee({...newEmployee, sexe: value as 'homme' | 'femme'})}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Sélectionner le sexe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="homme">Homme</SelectItem>
                    <SelectItem value="femme">Femme</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="cnss_code" className="text-right">Code CNSS</Label>
                <Input
                  id="cnss_code"
                  value={newEmployee.cnss_code}
                  onChange={(e) => setNewEmployee({...newEmployee, cnss_code: e.target.value})}
                  className="col-span-3"
                  placeholder="Code de sécurité sociale"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="nombre_enfants" className="text-right">Enfants</Label>
                <Input
                  id="nombre_enfants"
                  type="number"
                  value={newEmployee.nombre_enfants || 0}
                  onChange={(e) => setNewEmployee({...newEmployee, nombre_enfants: parseInt(e.target.value) || 0})}
                  className="col-span-3"
                  placeholder="Nombre d'enfants"
                  min="0"
                  max="20"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date_naissance" className="text-right">Date de naissance</Label>
                <Input
                  id="date_naissance"
                  type="date"
                  value={newEmployee.date_naissance}
                  onChange={(e) => {
                    const dateNaissance = e.target.value;
                    const age = dateNaissance ? Math.floor((new Date().getTime() - new Date(dateNaissance).getTime()) / (1000 * 60 * 60 * 24 * 365.25)) : undefined;
                    setNewEmployee({...newEmployee, date_naissance: dateNaissance, age});
                  }}
                  className="col-span-3"
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
              {newEmployee.date_naissance && newEmployee.age && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right text-muted-foreground">Âge calculé</Label>
                  <div className="col-span-3 text-sm text-muted-foreground">
                    {newEmployee.age} ans
                  </div>
                </div>
              )}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="adresse" className="text-right">Adresse</Label>
                <Textarea
                  id="adresse"
                  value={newEmployee.adresse}
                  onChange={(e) => setNewEmployee({...newEmployee, adresse: e.target.value})}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleAddEmployee} disabled={submitting || uploadingPhoto}>
                {(submitting || uploadingPhoto) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {uploadingPhoto ? "Upload photo..." : "Créer l'Employé"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
                      setSelectedEmployeeForSalary(employee);
                      setShowSalaryModal(true);
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
                          setSelectedEmployeeForSalary(employee);
                          setShowSalaryModal(true);
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
                          setIsEditingEmployee(employee);
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
                  <TableHead>Région</TableHead>
                  <TableHead>Statut Civil</TableHead>
                  <TableHead>Statut</TableHead>
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
                    <TableCell>{employee.region || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {statutCivilLabels[employee.statut_civil]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={employee.actif ? "default" : "destructive"}
                      >
                        {employee.actif ? "Actif" : "Inactif"}
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
                            navigate(`/rh/employes/${employee.id}`);
                          }}
                          title="Voir détails"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
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
                            setSelectedEmployeeForSalary(employee);
                            setShowSalaryModal(true);
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
                            setIsEditingEmployee(employee);
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

      {/* Edit Employee Dialog */}
      <Dialog open={!!isEditingEmployee} onOpenChange={(open) => {
        if (!open) {
          setIsEditingEmployee(null);
          clearPhoto();
        }
      }}>
        <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier l'Employé</DialogTitle>
            <DialogDescription>
              Modifier les informations de {isEditingEmployee?.prenom} {isEditingEmployee?.nom}
            </DialogDescription>
          </DialogHeader>
          {isEditingEmployee && (
            <div className="grid gap-4 py-4">
              {/* Photo Upload/Display */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-xs sm:text-sm">Photo</Label>
                <div className="col-span-3 space-y-2">
                  {photoPreview || isEditingEmployee.photo ? (
                    <div className="relative">
                      <img 
                        src={photoPreview || getPhotoUrl(isEditingEmployee.photo) || ''} 
                        alt="Employee photo" 
                        className="w-24 h-24 object-cover rounded-lg border"
                      />
                      <div className="flex gap-1 mt-2">
                        {photoPreview ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={clearPhoto}
                          >
                            <X className="h-3 w-3 mr-1" />
                            Annuler
                          </Button>
                        ) : isEditingEmployee.photo && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeletePhoto(isEditingEmployee.id)}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Supprimer
                          </Button>
                        )}
                        <Label htmlFor="photo-edit-upload" className="cursor-pointer">
                          <div className="flex items-center gap-1 px-2 py-1 border rounded-md hover:bg-accent text-xs">
                            <Upload className="h-3 w-3" />
                            Changer
                          </div>
                        </Label>
                        <Input
                          id="photo-edit-upload"
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          onChange={handlePhotoSelect}
                          className="hidden"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Input
                        id="photo-edit-upload-new"
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handlePhotoSelect}
                        className="hidden"
                      />
                      <Label htmlFor="photo-edit-upload-new" className="cursor-pointer">
                        <div className="flex items-center gap-2 px-3 py-2 border rounded-md hover:bg-accent">
                          <Upload className="h-4 w-4" />
                          <span className="text-xs sm:text-sm">Ajouter une photo</span>
                        </div>
                      </Label>
                      <span className="text-xs text-muted-foreground">(Optionnel)</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-nom" className="text-right">Nom *</Label>
                <Input
                  id="edit-nom"
                  value={isEditingEmployee.nom}
                  onChange={(e) => setIsEditingEmployee({...isEditingEmployee, nom: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-prenom" className="text-right">Prénom *</Label>
                <Input
                  id="edit-prenom"
                  value={isEditingEmployee.prenom}
                  onChange={(e) => setIsEditingEmployee({...isEditingEmployee, prenom: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-telephone" className="text-right">Téléphone</Label>
                <Input
                  id="edit-telephone"
                  value={isEditingEmployee.telephone || ""}
                  onChange={(e) => setIsEditingEmployee({...isEditingEmployee, telephone: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-region" className="text-right">Région</Label>
                <Select
                  value={isEditingEmployee.region || ""}
                  onValueChange={(value) => setIsEditingEmployee({...isEditingEmployee, region: value})}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Sélectionner une région" />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map(region => (
                      <SelectItem key={region} value={region}>{region}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-statut" className="text-right">Statut Civil</Label>
                <Select
                  value={isEditingEmployee.statut_civil}
                  onValueChange={(value) => setIsEditingEmployee({...isEditingEmployee, statut_civil: value as any})}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statutCivilLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-actif" className="text-right">Actif</Label>
                <Select
                  value={isEditingEmployee.actif ? "true" : "false"}
                  onValueChange={(value) => setIsEditingEmployee({...isEditingEmployee, actif: value === "true"})}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Actif</SelectItem>
                    <SelectItem value="false">Inactif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-role" className="text-right">Rôle</Label>
                <Input
                  id="edit-role"
                  value={isEditingEmployee.role || ""}
                  onChange={(e) => setIsEditingEmployee({...isEditingEmployee, role: e.target.value})}
                  className="col-span-3"
                  placeholder="Ex: Couturier, Manager..."
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-carte_identite" className="text-right">CIN</Label>
                <Input
                  id="edit-carte_identite"
                  value={isEditingEmployee.carte_identite || ""}
                  onChange={(e) => setIsEditingEmployee({...isEditingEmployee, carte_identite: e.target.value})}
                  className="col-span-3"
                  placeholder="Numéro de carte d'identité"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-sexe" className="text-right">Sexe</Label>
                <Select
                  value={isEditingEmployee.sexe || ""}
                  onValueChange={(value) => setIsEditingEmployee({...isEditingEmployee, sexe: value as 'homme' | 'femme'})}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Sélectionner le sexe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="homme">Homme</SelectItem>
                    <SelectItem value="femme">Femme</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-cnss_code" className="text-right">Code CNSS</Label>
                <Input
                  id="edit-cnss_code"
                  value={isEditingEmployee.cnss_code || ""}
                  onChange={(e) => setIsEditingEmployee({...isEditingEmployee, cnss_code: e.target.value})}
                  className="col-span-3"
                  placeholder="Code de sécurité sociale"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-nombre_enfants" className="text-right">Enfants</Label>
                <Input
                  id="edit-nombre_enfants"
                  type="number"
                  value={isEditingEmployee.nombre_enfants || 0}
                  onChange={(e) => setIsEditingEmployee({...isEditingEmployee, nombre_enfants: parseInt(e.target.value) || 0})}
                  className="col-span-3"
                  placeholder="Nombre d'enfants"
                  min="0"
                  max="20"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-date_naissance" className="text-right">Date de naissance</Label>
                <Input
                  id="edit-date_naissance"
                  type="date"
                  value={isEditingEmployee.date_naissance || ""}
                  onChange={(e) => {
                    const dateNaissance = e.target.value;
                    const age = dateNaissance ? Math.floor((new Date().getTime() - new Date(dateNaissance).getTime()) / (1000 * 60 * 60 * 24 * 365.25)) : undefined;
                    setIsEditingEmployee({...isEditingEmployee, date_naissance: dateNaissance, age});
                  }}
                  className="col-span-3"
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
              {isEditingEmployee.date_naissance && isEditingEmployee.age && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right text-muted-foreground">Âge calculé</Label>
                  <div className="col-span-3 text-sm text-muted-foreground">
                    {isEditingEmployee.age} ans
                  </div>
                </div>
              )}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-adresse" className="text-right">Adresse</Label>
                <Textarea
                  id="edit-adresse"
                  value={isEditingEmployee.adresse || ""}
                  onChange={(e) => setIsEditingEmployee({...isEditingEmployee, adresse: e.target.value})}
                  className="col-span-3"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="submit" onClick={handleEditEmployee} disabled={submitting || uploadingPhoto}>
              {(submitting || uploadingPhoto) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {uploadingPhoto ? "Upload photo..." : "Mettre à jour"}
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
                onSuccess={() => {
                  setShowPlanningCreator(false);
                  setSelectedEmployeeForPlanning(null);
                  toast({
                    title: "Succès",
                    description: "Planning créé avec succès",
                  });
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

      {selectedEmployeeForSalary && (
        <QuickSalaryModal
          isOpen={showSalaryModal}
          onClose={() => {
            setShowSalaryModal(false);
            setSelectedEmployeeForSalary(null);
          }}
          employee={selectedEmployeeForSalary}
          onSuccess={() => {
            setShowSalaryModal(false);
            setSelectedEmployeeForSalary(null);
          }}
        />
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
    </div>
  );
};

export default Employes;