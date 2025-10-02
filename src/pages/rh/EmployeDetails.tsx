import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Loader2
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
import { format, differenceInCalendarDays, startOfDay, parseISO, isSameDay, isWeekend } from "date-fns";
import { fr } from "date-fns/locale";

const EmployeDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentSalary, setCurrentSalary] = useState<any>(null);
  const [workSchedules, setWorkSchedules] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [shiftTemplates, setShiftTemplates] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [totalDaysWorked, setTotalDaysWorked] = useState(0);

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
        </div>

        {/* Employee Info Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Photo */}
              <div className="flex justify-center md:justify-start">
                {employee.photo ? (
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
              </div>

              {/* Info */}
              <div className="flex-1 space-y-4">
                <div>
                  <h1 className="text-3xl font-bold">
                    {employee.prenom} {employee.nom}
                  </h1>
                  <Badge variant={employee.actif ? "default" : "secondary"} className="mt-2">
                    {employee.actif ? "Actif" : "Inactif"}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {employee.role && (
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Rôle:</span>
                      <span>{employee.role}</span>
                    </div>
                  )}
                  
                  {employee.age && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Âge:</span>
                      <span>{employee.age} ans</span>
                    </div>
                  )}

                  {employee.telephone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Téléphone:</span>
                      <span>{employee.telephone}</span>
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

                  {employee.created_at && (
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Date de recrutement:</span>
                      <span>{format(parseISO(employee.created_at), "dd MMMM yyyy", { locale: fr })}</span>
                    </div>
                  )}
                </div>
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
              <div className="text-2xl font-bold">
                {currentSalary ? `${Math.round(currentSalary.net_total).toLocaleString('fr-FR')} TND` : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                Salaire actuel
              </p>
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
                        {format(parseISO(holiday.date), "dd MMMM yyyy", { locale: fr })}
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
                      {format(parseISO(currentSalary.effective_from), "dd MMMM yyyy", { locale: fr })}
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
