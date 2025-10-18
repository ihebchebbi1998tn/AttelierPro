import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Users, 
  Calendar as CalendarIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
  Loader2
} from "lucide-react";
import { 
  employeeService, 
  scheduleService,
  holidayService,
  shiftTemplateService,
  Employee
} from "@/utils/rhService";
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  addDays, 
  addWeeks,
  subWeeks,
  isSameDay,
  parseISO,
  isWithinInterval
} from "date-fns";
import { fr } from "date-fns/locale";

interface DaySchedule {
  employee: Employee;
  status: 'working' | 'leave' | 'off';
  startTime?: string;
  endTime?: string;
  hoursWorked?: string;
  leaveReason?: string;
}

const TeamPlanning = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [shiftTemplates, setShiftTemplates] = useState<any[]>([]);
  const [weekSchedule, setWeekSchedule] = useState<Map<string, DaySchedule[]>>(new Map());

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  useEffect(() => {
    loadData();
  }, [currentWeek]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load all employees
      const employeesData = await employeeService.getAll();
      const activeEmployees = employeesData.filter((e: Employee) => e.actif);
      setEmployees(activeEmployees);

      // Load schedules for the week
      const schedulesData = await scheduleService.getAll();
      setSchedules(schedulesData || []);

      // Load shift templates
      const templatesData = await shiftTemplateService.getAll();
      setShiftTemplates(templatesData || []);

      // Load holidays
      const holidaysData = await holidayService.getAll();
      setHolidays(holidaysData || []);

      // Build week schedule
      buildWeekSchedule(activeEmployees, schedulesData || [], templatesData || [], holidaysData || []);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors du chargement des données",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const buildWeekSchedule = (emps: Employee[], scheds: any[], templates: any[], hols: any[]) => {
    const schedule = new Map<string, DaySchedule[]>();

    weekDays.forEach(day => {
      const dayKey = format(day, 'yyyy-MM-dd');
      const daySchedules: DaySchedule[] = [];
      const dayOfWeek = day.getDay();

      emps.forEach(emp => {
        // Check if employee has a holiday on this day
        const holiday = hols.find(h => 
          h.employee_id === emp.id && 
          isSameDay(parseISO(h.date), day) &&
          h.status === 'approved'
        );

        if (holiday) {
          daySchedules.push({
            employee: emp,
            status: 'leave',
            leaveReason: holiday.motif
          });
          return;
        }

        // Check if employee has a specific schedule for this day
        const schedule = scheds.find(s => 
          s.employee_id === emp.id && 
          isSameDay(parseISO(s.date), day)
        );

        if (schedule) {
          daySchedules.push({
            employee: emp,
            status: 'working',
            startTime: schedule.start_time,
            endTime: schedule.end_time,
            hoursWorked: schedule.hours_worked
          });
          return;
        }

        // Check if employee has a shift template for this day
        const template = templates.find(t => 
          t.employee_id === emp.id && 
          parseInt(t.weekday) === dayOfWeek &&
          t.active === '1'
        );

        if (template) {
          // Calculate hours worked from template
          const start = template.start_time.split(':');
          const end = template.end_time.split(':');
          const lunchStart = template.lunch_start?.split(':');
          const lunchEnd = template.lunch_end?.split(':');
          
          let hoursWorked = 0;
          if (start && end) {
            const startMinutes = parseInt(start[0]) * 60 + parseInt(start[1]);
            const endMinutes = parseInt(end[0]) * 60 + parseInt(end[1]);
            hoursWorked = (endMinutes - startMinutes) / 60;
            
            if (lunchStart && lunchEnd) {
              const lunchStartMinutes = parseInt(lunchStart[0]) * 60 + parseInt(lunchStart[1]);
              const lunchEndMinutes = parseInt(lunchEnd[0]) * 60 + parseInt(lunchEnd[1]);
              hoursWorked -= (lunchEndMinutes - lunchStartMinutes) / 60;
            }
          }

          daySchedules.push({
            employee: emp,
            status: 'working',
            startTime: template.start_time,
            endTime: template.end_time,
            hoursWorked: hoursWorked.toFixed(1)
          });
        } else {
          // No schedule or template - mark as off
          daySchedules.push({
            employee: emp,
            status: 'off'
          });
        }
      });

      schedule.set(dayKey, daySchedules);
    });

    setWeekSchedule(schedule);
  };

  const getStatusBadge = (status: 'working' | 'leave' | 'off') => {
    switch (status) {
      case 'working':
        return <Badge className="bg-green-500 text-white">Travail</Badge>;
      case 'leave':
        return <Badge className="bg-red-500 text-white">Congé</Badge>;
      case 'off':
        return <Badge className="bg-amber-500 text-white">Repos</Badge>;
    }
  };

  const getDaySummary = (dayKey: string) => {
    const daySchedules = weekSchedule.get(dayKey) || [];
    const working = daySchedules.filter(s => s.status === 'working').length;
    const leave = daySchedules.filter(s => s.status === 'leave').length;
    const off = daySchedules.filter(s => s.status === 'off').length;

    return { working, leave, off };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/rh/planning")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Planning Équipe</h1>
            <p className="text-muted-foreground">
              Vue hebdomadaire de l'équipe
            </p>
          </div>
        </div>
      </div>

      {/* Week Navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Semaine précédente
            </Button>
            
            <div className="text-center">
              <h2 className="text-xl font-semibold">
                {format(weekStart, "d MMM", { locale: fr })} - {format(weekEnd, "d MMM yyyy", { locale: fr })}
              </h2>
              <p className="text-sm text-muted-foreground">
                Semaine {format(weekStart, "w", { locale: fr })}
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
            >
              Semaine suivante
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Week Overview */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {weekDays.map(day => {
          const dayKey = format(day, 'yyyy-MM-dd');
          const summary = getDaySummary(dayKey);
          const isToday = isSameDay(day, new Date());

          return (
            <Card key={dayKey} className={isToday ? "ring-2 ring-primary" : ""}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  {format(day, "EEEE", { locale: fr })}
                  <div className="text-xs text-muted-foreground font-normal">
                    {format(day, "d MMM", { locale: fr })}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-green-600 font-medium">Travail</span>
                  <span className="font-bold">{summary.working}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-red-600 font-medium">Congé</span>
                  <span className="font-bold">{summary.leave}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-amber-600 font-medium">Repos</span>
                  <span className="font-bold">{summary.off}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detailed Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Planning Détaillé</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold sticky left-0 bg-background z-10">
                    Employé
                  </th>
                  {weekDays.map(day => (
                    <th key={format(day, 'yyyy-MM-dd')} className="text-center p-3 font-semibold min-w-[150px]">
                      <div>{format(day, "EEE", { locale: fr })}</div>
                      <div className="text-xs text-muted-foreground font-normal">
                        {format(day, "d MMM", { locale: fr })}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => (
                  <tr key={emp.id} className="border-b hover:bg-muted/50">
                    <td className="p-3 sticky left-0 bg-background z-10">
                      <div className="font-medium">{emp.prenom} {emp.nom}</div>
                      <div className="text-xs text-muted-foreground">{emp.poste}</div>
                    </td>
                    {weekDays.map(day => {
                      const dayKey = format(day, 'yyyy-MM-dd');
                      const daySchedules = weekSchedule.get(dayKey) || [];
                      const empSchedule = daySchedules.find(s => s.employee.id === emp.id);

                      if (!empSchedule) {
                        return <td key={dayKey} className="p-3 text-center">-</td>;
                      }

                      return (
                        <td key={dayKey} className="p-3 text-center">
                          <div className="space-y-1">
                            {getStatusBadge(empSchedule.status)}
                            {empSchedule.status === 'working' && (
                              <>
                                <div className="text-xs flex items-center justify-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {empSchedule.startTime} - {empSchedule.endTime}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {empSchedule.hoursWorked}h
                                </div>
                              </>
                            )}
                            {empSchedule.status === 'leave' && empSchedule.leaveReason && (
                              <div className="text-xs text-muted-foreground">
                                {empSchedule.leaveReason}
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamPlanning;
