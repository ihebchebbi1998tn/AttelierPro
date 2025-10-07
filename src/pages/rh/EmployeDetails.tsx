import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  User, 
  Phone, 
  MapPin, 
  Calendar as CalendarIcon,
  DollarSign,
  Clock,
  Briefcase,
  Heart,
  Plane,
  Loader2,
  Edit,
  Save,
  X,
  CreditCard,
  Users,
  Cake
} from "lucide-react";
import { 
  employeeService, 
  Employee, 
  salaryService, 
  scheduleService,
  holidayService,
  shiftTemplateService
} from "@/utils/rhService";
import { Calendar } from "@/components/ui/calendar";
import { format, differenceInCalendarDays, startOfDay, parseISO, isSameDay, isWeekend, isValid } from "date-fns";
import { fr } from "date-fns/locale";

const EmployeDetails = () => {
  // Safe date formatter helper
  const formatDate = (dateString: string | null | undefined, formatStr: string): string => {
    if (!dateString) return "Date invalide";
    try {
      const parsedDate = parseISO(dateString);
      if (!isValid(parsedDate)) return "Date invalide";
      return format(parsedDate, formatStr, { locale: fr });
    } catch {
      return "Date invalide";
    }
  };
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedEmployee, setEditedEmployee] = useState<Employee | null>(null);
  const [currentSalary, setCurrentSalary] = useState<any>(null);
  const [workSchedules, setWorkSchedules] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [shiftTemplates, setShiftTemplates] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [totalDaysWorked, setTotalDaysWorked] = useState(0);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadEmployeeData();
    }
  }, [id]);

  const loadEmployeeData = async () => {
    try {
      setLoading(true);
      
      // Load employee info
      const employee = await employeeService.getById(parseInt(id!));
      if (employee) {
        setEmployee(employee);
        
        // Load salary
        const salaries = await salaryService.getAll({ employee_id: parseInt(id!), current: true });
        if (salaries && salaries.length > 0) {
          setCurrentSalary(salaries[0]);
        }
        
        // Load schedules
        const schedules = await scheduleService.getAll({ employee_id: parseInt(id!) });
        if (schedules) {
          setWorkSchedules(schedules);
        }
        
        // Load holidays
        const holidaysData = await holidayService.getAll({ employee_id: parseInt(id!) });
        if (holidaysData) {
          setHolidays(holidaysData);
        }
        
        // Load shift templates
        const templates = await shiftTemplateService.getAll();
        if (templates) {
          const employeeTemplates = templates.filter((t: any) => t.employee_id === parseInt(id!));
          setShiftTemplates(employeeTemplates);
        }
        
        // Calculate total days worked
        calculateTotalDaysWorked(employee, schedules || [], holidaysData || []);
      } else {
        toast({
          title: "Erreur",
          description: "Employé non trouvé",
          variant: "destructive"
        });
        navigate("/rh/employes");
      }
    } catch (error) {
      console.error("Error loading employee:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors du chargement des données",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalDaysWorked = (emp: Employee, schedules: any[], holidays: any[]) => {
    if (!emp.created_at) {
      setTotalDaysWorked(0);
      return;
    }

    const startDate = startOfDay(parseISO(emp.created_at));
    const today = startOfDay(new Date());
    const totalDays = differenceInCalendarDays(today, startDate);

    // Count approved leave days
    const approvedLeaves = holidays.filter(h => h.status === 'approved').length;

    // Count weekends
    let weekendDays = 0;
    let currentDate = new Date(startDate);
    while (currentDate <= today) {
      if (isWeekend(currentDate)) {
        weekendDays++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Calculate worked days = total days - weekends - approved leaves
    const workedDays = totalDays - weekendDays - approvedLeaves;
    setTotalDaysWorked(Math.max(0, workedDays));
  };

  const getLeaveTypeIcon = (motif: string) => {
    if (motif.includes('[annual]')) return <Plane className="h-4 w-4" />;
    if (motif.includes('[sick]')) return <Heart className="h-4 w-4" />;
    return <Briefcase className="h-4 w-4" />;
  };

  const getLeaveTypeName = (motif: string) => {
    if (motif.includes('[annual]')) return 'Congé annuel';
    if (motif.includes('[sick]')) return 'Congé maladie';
    if (motif.includes('[special]')) return 'Congé spécial';
    if (motif.includes('[unpaid]')) return 'Congé sans solde';
    if (motif.includes('[maternity]')) return 'Congé maternité';
    if (motif.includes('[paternity]')) return 'Congé paternité';
    return 'Congé';
  };

  const isDateHoliday = (date: Date) => {
    return holidays.some(h => {
      const holidayDate = parseISO(h.date);
      return isSameDay(holidayDate, date);
    });
  };

  const isDateScheduled = (date: Date) => {
    return workSchedules.some(s => {
      const scheduleDate = parseISO(s.date);
      return isSameDay(scheduleDate, date);
    });
  };

  const isDateWorkDay = (date: Date) => {
    // Don't show as work day if it's a holiday
    if (isDateHoliday(date)) return false;
    
    // Don't show weekends as work days
    if (isWeekend(date)) return false;
    
    // Check if there's a specific schedule for this date
    const hasSchedule = workSchedules.some(s => {
      const scheduleDate = parseISO(s.date);
      return isSameDay(scheduleDate, date);
    });
    
    if (hasSchedule) return true;

    // Check if it's a working day based on shift templates for future dates
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const hasTemplate = shiftTemplates.some(t => t.weekday === dayOfWeek && t.active);
    
    return hasTemplate;
  };

  const getPhotoUrl = (photoPath?: string) => {
    if (!photoPath) return null;
    if (photoPath.startsWith('http')) return photoPath;
    return `https://luccibyey.com.tn/production/${photoPath}`;
  };

  const handleEdit = () => {
    setEditedEmployee(employee);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditedEmployee(null);
    setPhotoFile(null);
    setPhotoPreview(null);
    setIsEditing(false);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Erreur",
          description: "La photo ne doit pas dépasser 5 MB",
          variant: "destructive"
        });
        return;
      }
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!editedEmployee || !editedEmployee.prenom || !editedEmployee.nom) {
      toast({
        title: "Erreur",
        description: "Le prénom et le nom sont obligatoires",
        variant: "destructive"
      });
      return;
    }

    try {
      setSaving(true);

      // Upload photo if changed
      let photoPath = editedEmployee.photo;
      if (photoFile) {
        const formData = new FormData();
        formData.append('photo', photoFile);
        formData.append('employee_id', id!);

        const photoResponse = await fetch('https://luccibyey.com.tn/production/api/rh_employee_photo.php', {
          method: 'POST',
          body: formData
        });

        const photoResult = await photoResponse.json();
        if (photoResult.success && photoResult.photo_path) {
          photoPath = photoResult.photo_path;
        }
      }

      // Update employee
      const response = await employeeService.update(parseInt(id!), {
        ...editedEmployee,
        photo: photoPath
      });

      if (response?.success) {
        // Reload employee data
        await loadEmployeeData();
        setIsEditing(false);
        setPhotoFile(null);
        setPhotoPreview(null);
        toast({
          title: "Succès",
          description: "Employé mis à jour avec succès"
        });
      }
    } catch (error) {
      console.error("Error updating employee:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la mise à jour",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof Employee, value: any) => {
    if (editedEmployee) {
      setEditedEmployee({ ...editedEmployee, [field]: value });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!employee) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate("/rh/employes")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          {!isEditing ? (
            <Button onClick={handleEdit} className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Modifier
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancelEdit} className="flex items-center gap-2">
                <X className="h-4 w-4" />
                Annuler
              </Button>
              <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Enregistrer
              </Button>
            </div>
          )}
        </div>

        {/* Employee Info Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Photo */}
              <div className="flex justify-center md:justify-start flex-col items-center md:items-start gap-2">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-32 h-32 rounded-full object-cover border-4 border-primary"
                  />
                ) : employee.photo ? (
                  <img
                    src={getPhotoUrl(employee.photo) || '/placeholder.svg'}
                    alt={`${employee.prenom} ${employee.nom}`}
                    className="w-32 h-32 rounded-full object-cover border-4 border-primary"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder.svg';
                    }}
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center border-4 border-primary">
                    <User className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
                {isEditing && (
                  <div>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="text-sm"
                    />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 space-y-4">
                {!isEditing ? (
                  <>
                    <div>
                      <h1 className="text-3xl font-bold">
                        {employee.prenom} {employee.nom}
                      </h1>
                      <Badge variant={employee.actif ? "default" : "secondary"} className="mt-2">
                        {employee.actif ? "Actif" : "Inactif"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {employee.poste && (
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Poste:</span>
                          <span>{employee.poste}</span>
                        </div>
                      )}

                      {employee.role && (
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Rôle:</span>
                          <span>{employee.role}</span>
                        </div>
                      )}
                      
                      {employee.sexe && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Sexe:</span>
                          <span className="capitalize">{employee.sexe}</span>
                        </div>
                      )}

                      {employee.age && (
                        <div className="flex items-center gap-2">
                          <Cake className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Âge:</span>
                          <span>{employee.age} ans</span>
                        </div>
                      )}

                      {employee.date_naissance && (
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Date de naissance:</span>
                          <span>{formatDate(employee.date_naissance, "dd/MM/yyyy")}</span>
                        </div>
                      )}

                      {employee.telephone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Téléphone:</span>
                          <span>{employee.telephone}</span>
                        </div>
                      )}

                      {employee.carte_identite && (
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Carte d'identité:</span>
                          <span>{employee.carte_identite}</span>
                        </div>
                      )}

                      {employee.cnss_code && (
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Code CNSS:</span>
                          <span>{employee.cnss_code}</span>
                        </div>
                      )}

                      {employee.region && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Région:</span>
                          <span>{employee.region}</span>
                        </div>
                      )}

                      {employee.adresse && (
                        <div className="flex items-center gap-2 md:col-span-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Adresse:</span>
                          <span>{employee.adresse}</span>
                        </div>
                      )}

                      {employee.statut_civil && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Statut civil:</span>
                          <span className="capitalize">{employee.statut_civil}</span>
                        </div>
                      )}

                      {employee.nombre_enfants !== undefined && (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Nombre d'enfants:</span>
                          <span>{employee.nombre_enfants}</span>
                        </div>
                      )}

                      {employee.chef_de_famille !== undefined && (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Chef de famille:</span>
                          <Badge variant={employee.chef_de_famille ? "default" : "secondary"}>
                            {employee.chef_de_famille ? "Oui" : "Non"}
                          </Badge>
                        </div>
                      )}

                      {employee.created_at && (
                        <div className="flex items-center gap-2 md:col-span-2">
                          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Date de recrutement:</span>
                          <span>{formatDate(employee.created_at, "dd MMMM yyyy")}</span>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="prenom">Prénom *</Label>
                        <Input
                          id="prenom"
                          value={editedEmployee?.prenom || ''}
                          onChange={(e) => updateField('prenom', e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="nom">Nom *</Label>
                        <Input
                          id="nom"
                          value={editedEmployee?.nom || ''}
                          onChange={(e) => updateField('nom', e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="poste">Poste</Label>
                        <Input
                          id="poste"
                          value={editedEmployee?.poste || ''}
                          onChange={(e) => updateField('poste', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="role">Rôle</Label>
                        <Input
                          id="role"
                          value={editedEmployee?.role || ''}
                          onChange={(e) => updateField('role', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="sexe">Sexe</Label>
                        <select
                          id="sexe"
                          value={editedEmployee?.sexe || ''}
                          onChange={(e) => updateField('sexe', e.target.value as 'homme' | 'femme')}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="">Sélectionner</option>
                          <option value="homme">Homme</option>
                          <option value="femme">Femme</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="telephone">Téléphone</Label>
                        <Input
                          id="telephone"
                          value={editedEmployee?.telephone || ''}
                          onChange={(e) => updateField('telephone', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="carte_identite">Carte d'identité</Label>
                        <Input
                          id="carte_identite"
                          value={editedEmployee?.carte_identite || ''}
                          onChange={(e) => updateField('carte_identite', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="cnss_code">Code CNSS</Label>
                        <Input
                          id="cnss_code"
                          value={editedEmployee?.cnss_code || ''}
                          onChange={(e) => updateField('cnss_code', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="age">Âge</Label>
                        <Input
                          id="age"
                          type="number"
                          value={editedEmployee?.age || ''}
                          onChange={(e) => updateField('age', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="date_naissance">Date de naissance</Label>
                        <Input
                          id="date_naissance"
                          type="date"
                          value={editedEmployee?.date_naissance || ''}
                          onChange={(e) => updateField('date_naissance', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="region">Région</Label>
                        <Input
                          id="region"
                          value={editedEmployee?.region || ''}
                          onChange={(e) => updateField('region', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="statut_civil">Statut civil</Label>
                        <select
                          id="statut_civil"
                          value={editedEmployee?.statut_civil || ''}
                          onChange={(e) => updateField('statut_civil', e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="">Sélectionner</option>
                          <option value="célibataire">Célibataire</option>
                          <option value="marié">Marié(e)</option>
                          <option value="divorcé">Divorcé(e)</option>
                          <option value="veuf">Veuf(ve)</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="nombre_enfants">Nombre d'enfants</Label>
                        <Input
                          id="nombre_enfants"
                          type="number"
                          value={editedEmployee?.nombre_enfants || 0}
                          onChange={(e) => updateField('nombre_enfants', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="adresse">Adresse</Label>
                        <Input
                          id="adresse"
                          value={editedEmployee?.adresse || ''}
                          onChange={(e) => updateField('adresse', e.target.value)}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="chef_de_famille"
                          checked={editedEmployee?.chef_de_famille || false}
                          onCheckedChange={(checked) => updateField('chef_de_famille', checked)}
                          disabled={editedEmployee?.sexe === 'femme'}
                        />
                        <Label htmlFor="chef_de_famille">Chef de famille</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="actif"
                          checked={editedEmployee?.actif || false}
                          onCheckedChange={(checked) => updateField('actif', checked)}
                        />
                        <Label htmlFor="actif">Actif</Label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Days Worked */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jours travaillés</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalDaysWorked}</div>
              <p className="text-xs text-muted-foreground">
                Depuis le recrutement
              </p>
            </CardContent>
          </Card>

          {/* Current Salary */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Salaire Net</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {currentSalary ? (
                <>
                  <div className="text-2xl font-bold">
                    {Math.round(currentSalary.net_total).toLocaleString('fr-FR')} TND
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Salaire actuel
                  </p>
                </>
              ) : (
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-muted-foreground">
                    Non défini
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => navigate('/rh/salaires/definir', { state: { employee } })}
                    className="w-full mt-2"
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Définir le salaire
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Leave Days */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jours de congé</CardTitle>
              <Plane className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {holidays.filter(h => h.status === 'approved').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Congés approuvés
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Calendar and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Work Calendar */}
          <Card>
            <CardHeader>
              <CardTitle>Calendrier de travail</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                locale={fr}
                className="rounded-md border pointer-events-auto"
                modifiers={{
                  holiday: (date) => isDateHoliday(date),
                  weekend: (date) => isWeekend(date) && !isDateHoliday(date),
                  workday: (date) => isDateWorkDay(date),
                }}
                modifiersStyles={{
                  holiday: {
                    backgroundColor: 'hsl(0 84% 60% / 0.3)',
                    color: 'hsl(0 84% 60%)',
                    fontWeight: 'bold',
                    border: '2px solid hsl(0 84% 60%)',
                  },
                  weekend: {
                    backgroundColor: 'hsl(45 93% 47% / 0.3)',
                    color: 'hsl(45 70% 35%)',
                    fontWeight: 'bold',
                  },
                  workday: {
                    backgroundColor: 'hsl(142 76% 36% / 0.3)',
                    color: 'hsl(142 76% 25%)',
                    fontWeight: 'bold',
                    border: '2px solid hsl(142 76% 36%)',
                  },
                }}
              />
            </CardContent>
          </Card>

          {/* Recent Leaves */}
          <Card>
            <CardHeader>
              <CardTitle>Congés récents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {holidays.slice(0, 5).map((holiday) => (
                  <div key={holiday.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                    <div className="flex-shrink-0">
                      {getLeaveTypeIcon(holiday.motif)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{getLeaveTypeName(holiday.motif)}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(holiday.date, "dd MMMM yyyy")}
                      </p>
                    </div>
                    <Badge 
                      variant={
                        holiday.status === 'approved' ? 'default' : 
                        holiday.status === 'rejected' ? 'destructive' : 
                        'secondary'
                      }
                    >
                      {holiday.status === 'approved' ? 'Approuvé' : 
                       holiday.status === 'rejected' ? 'Refusé' : 
                       'En attente'}
                    </Badge>
                  </div>
                ))}
                {holidays.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    Aucun congé enregistré
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Salary Details */}
        {currentSalary && (
          <Card>
            <CardHeader>
              <CardTitle>Détails du salaire</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Salaire Net</p>
                  <p className="text-2xl font-bold">
                    {Math.round(currentSalary.net_total).toLocaleString('fr-FR')} TND
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Salaire Brut</p>
                  <p className="text-2xl font-bold">
                    {Math.round(currentSalary.brut_total).toLocaleString('fr-FR')} TND
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Taxes</p>
                  <p className="text-2xl font-bold">
                    {Math.round(currentSalary.taxes_total).toLocaleString('fr-FR')} TND
                  </p>
                </div>
                {currentSalary.effective_from && (
                  <div className="md:col-span-3">
                    <p className="text-sm text-muted-foreground">En vigueur depuis</p>
                    <p className="text-lg font-medium">
                      {formatDate(currentSalary.effective_from, "dd MMMM yyyy")}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default EmployeDetails;
