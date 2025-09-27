import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Calendar, 
  Clock, 
  Plus, 
  Edit, 
  Trash2,
  Coffee,
  Loader2,
  Users,
  CalendarPlus,
  Phone,
  MapPin
} from "lucide-react";
import WeeklyPlanningCreator from "@/components/WeeklyPlanningCreator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  scheduleService, 
  shiftTemplateService, 
  Employee, 
  Schedule, 
  ShiftTemplate, 
  CreateScheduleData, 
  CreateShiftTemplateData 
} from "@/utils/rhService";

const Planning = () => {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedWeek, setSelectedWeek] = useState(new Date().toISOString().split('T')[0]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shiftTemplates, setShiftTemplates] = useState<ShiftTemplate[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingTemplate, setIsAddingTemplate] = useState(false);
  const [isAddingSchedule, setIsAddingSchedule] = useState(false);
  const [isEditingTemplate, setIsEditingTemplate] = useState<ShiftTemplate | null>(null);
  const [isEditingSchedule, setIsEditingSchedule] = useState<Schedule | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showWeeklyCreator, setShowWeeklyCreator] = useState(false);
  const [selectedEmployeeForPlanning, setSelectedEmployeeForPlanning] = useState<Employee | null>(null);
  const { toast } = useToast();

  const [newTemplate, setNewTemplate] = useState<CreateShiftTemplateData>({
    employee_id: 0,
    weekday: 1,
    start_time: "09:00",
    end_time: "17:00",
    lunch_start: "12:00",
    lunch_end: "13:00",
    active: true
  });

  const [newSchedule, setNewSchedule] = useState<CreateScheduleData>({
    employee_id: 0,
    date: new Date().toISOString().split('T')[0],
    start_time: "09:00",
    end_time: "17:00",
    lunch_start: "12:00",
    lunch_end: "13:00",
    is_half_day: false,
    note: ""
  });

  const weekdays = [
    { id: 0, name: "Dimanche" },
    { id: 1, name: "Lundi" },
    { id: 2, name: "Mardi" },
    { id: 3, name: "Mercredi" },
    { id: 4, name: "Jeudi" },
    { id: 5, name: "Vendredi" },
    { id: 6, name: "Samedi" }
  ];

  // Load data on component mount
  useEffect(() => {
    loadEmployees();
  }, []);

  // Reload when selected employee changes
  useEffect(() => {
    if (!loading && selectedEmployee) {
      loadShiftTemplates();
      loadSchedules();
    }
  }, [selectedEmployee]);

  const loadEmployees = async () => {
    try {
      const data = await employeeService.getAll({ status: 'actif' });
      setEmployees(data);
      setLoading(false);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les employés",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  const loadShiftTemplates = async () => {
    if (!selectedEmployee) return;
    
    try {
      setLoading(true);
      const data = await shiftTemplateService.getAll(selectedEmployee.id);
      setShiftTemplates(data);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les templates d'horaires",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSchedules = async () => {
    if (!selectedEmployee) return;
    
    try {
      const data = await scheduleService.getAll({ employee_id: selectedEmployee.id });
      setSchedules(data);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les plannings",
        variant: "destructive"
      });
    }
  };

  const handleAddTemplate = async () => {
    if (!selectedEmployee || !newTemplate.start_time || !newTemplate.end_time) {
      toast({
        title: "Erreur",
        description: "Heure de début et fin sont obligatoires",
        variant: "destructive"
      });
      return;
    }

    const templateData = {
      ...newTemplate,
      employee_id: selectedEmployee.id
    };

    try {
      setSubmitting(true);
      const result = await shiftTemplateService.create(templateData);
      
      if (result.success) {
        toast({
          title: "Succès",
          description: result.message || "Template créé avec succès"
        });
        setNewTemplate({
          employee_id: selectedEmployee.id,
          weekday: 1,
          start_time: "09:00",
          end_time: "17:00",
          lunch_start: "12:00",
          lunch_end: "13:00",
          active: true
        });
        setIsAddingTemplate(false);
        loadShiftTemplates();
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la création du template",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddSchedule = async () => {
    if (!selectedEmployee || !newSchedule.date) {
      toast({
        title: "Erreur",
        description: "Date est obligatoire",
        variant: "destructive"
      });
      return;
    }

    const scheduleData = {
      ...newSchedule,
      employee_id: selectedEmployee.id
    };

    try {
      setSubmitting(true);
      const result = await scheduleService.createOrUpdate(scheduleData);
      
      if (result.success) {
        toast({
          title: "Succès",
          description: result.message || "Planning créé avec succès"
        });
        setNewSchedule({
          employee_id: selectedEmployee.id,
          date: new Date().toISOString().split('T')[0],
          start_time: "09:00",
          end_time: "17:00",
          lunch_start: "12:00",
          lunch_end: "13:00",
          is_half_day: false,
          note: ""
        });
        setIsAddingSchedule(false);
        loadSchedules();
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la création du planning",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTemplate = async (template: ShiftTemplate) => {
    try {
      const result = await shiftTemplateService.delete(template.id);
      
      if (result.success) {
        toast({
          title: "Succès",
          description: result.message || "Template supprimé avec succès"
        });
        loadShiftTemplates();
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression",
        variant: "destructive"
      });
    }
  };

  const handleDeleteSchedule = async (schedule: Schedule) => {
    try {
      const result = await scheduleService.delete(schedule.id);
      
      if (result.success) {
        toast({
          title: "Succès",
          description: result.message || "Planning supprimé avec succès"
        });
        loadSchedules();
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression",
        variant: "destructive"
      });
    }
  };

  const handleSelectEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setLoading(true);
  };

  const handleBackToEmployeeList = () => {
    setSelectedEmployee(null);
    setShiftTemplates([]);
    setSchedules([]);
  };

  const calculateWorkHours = (start: string, end: string, lunchStart?: string, lunchEnd?: string) => {
    const startTime = new Date(`2000-01-01 ${start}`);
    const endTime = new Date(`2000-01-01 ${end}`);
    let totalMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
    
    if (lunchStart && lunchEnd) {
      const lunchStartTime = new Date(`2000-01-01 ${lunchStart}`);
      const lunchEndTime = new Date(`2000-01-01 ${lunchEnd}`);
      const lunchMinutes = (lunchEndTime.getTime() - lunchStartTime.getTime()) / (1000 * 60);
      totalMinutes -= lunchMinutes;
    }
    
    return (totalMinutes / 60).toFixed(1);
  };

  // Employee List View
  if (!selectedEmployee) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Planning & Horaires</h1>
            <p className="text-muted-foreground mt-2">
              Sélectionnez un employé pour voir son planning
            </p>
          </div>
          <Button onClick={() => setShowWeeklyCreator(true)}>
            <CalendarPlus className="h-4 w-4 mr-2" />
            Créer Planning Rapide
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Chargement des employés...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {employees.map((employee) => (
              <Card 
                key={employee.id} 
                className="cursor-pointer hover:shadow-md transition-shadow bg-primary text-primary-foreground"
                onClick={() => handleSelectEmployee(employee)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-primary-foreground">
                    {employee.prenom} {employee.nom}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-primary-foreground/80">
                    {employee.region && (
                      <div className="flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {employee.region}
                      </div>
                    )}
                    {employee.telephone && (
                      <div className="flex items-center">
                        <Phone className="h-3 w-3 mr-1" />
                        {employee.telephone}
                      </div>
                    )}
                    <Badge 
                      variant={employee.actif ? "default" : "destructive"}
                      className="bg-primary-foreground text-primary"
                    >
                      {employee.actif ? "Actif" : "Inactif"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Quick Weekly Planning Creator */}
        {showWeeklyCreator && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Créer un Planning Rapide
                </h2>
                
                {!selectedEmployeeForPlanning ? (
                  <div className="space-y-4">
                    <p className="text-muted-foreground">Sélectionnez un employé pour créer son planning hebdomadaire</p>
                    <div className="grid gap-2 max-h-60 overflow-auto">
                      {employees.map(emp => (
                        <Button
                          key={emp.id}
                          variant="outline"
                          className="justify-start p-4 h-auto"
                          onClick={() => setSelectedEmployeeForPlanning(emp)}
                        >
                          <div className="text-left">
                            <div className="font-medium">{emp.prenom} {emp.nom}</div>
                            {emp.region && (
                              <div className="text-sm text-muted-foreground">{emp.region}</div>
                            )}
                          </div>
                        </Button>
                      ))}
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setShowWeeklyCreator(false)}
                    >
                      Annuler
                    </Button>
                  </div>
                ) : (
                  <WeeklyPlanningCreator
                    employee={selectedEmployeeForPlanning}
                    onSuccess={() => {
                      setShowWeeklyCreator(false);
                      setSelectedEmployeeForPlanning(null);
                      loadShiftTemplates();
                    }}
                    onCancel={() => {
                      setShowWeeklyCreator(false);
                      setSelectedEmployeeForPlanning(null);
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Individual Employee Planning View
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={handleBackToEmployeeList}
            className="flex items-center gap-2"
          >
            <Calendar className="h-4 w-4" />
            ← Retour à la liste
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Planning de {selectedEmployee.prenom} {selectedEmployee.nom}
            </h1>
            <p className="text-muted-foreground mt-2">
              Gérer les horaires de travail et plannings
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => {
              setSelectedEmployeeForPlanning(selectedEmployee);
              setShowWeeklyCreator(true);
            }}
          >
            <CalendarPlus className="h-4 w-4 mr-2" />
            Planning Rapide
          </Button>
          <Dialog open={isAddingTemplate} onOpenChange={setIsAddingTemplate}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Planning Avancé
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouveau Template ou Planning</DialogTitle>
                <DialogDescription>
                  Créer un template d'horaire ou un planning spécifique
                </DialogDescription>
              </DialogHeader>
              <Tabs defaultValue="template" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="template">Template Hebdo</TabsTrigger>
                  <TabsTrigger value="schedule">Planning Spécifique</TabsTrigger>
                </TabsList>
                
                <TabsContent value="template" className="space-y-4">
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="template-employee" className="text-right">Employé</Label>
                      <Input
                        value={`${selectedEmployee.prenom} ${selectedEmployee.nom}`}
                        disabled
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="template-weekday" className="text-right">Jour</Label>
                      <Select
                        value={newTemplate.weekday.toString()}
                        onValueChange={(value) => setNewTemplate({...newTemplate, weekday: parseInt(value)})}
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {weekdays.map(day => (
                            <SelectItem key={day.id} value={day.id.toString()}>{day.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="template-start" className="text-right">Début</Label>
                      <Input
                        id="template-start"
                        type="time"
                        value={newTemplate.start_time}
                        onChange={(e) => setNewTemplate({...newTemplate, start_time: e.target.value})}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="template-end" className="text-right">Fin</Label>
                      <Input
                        id="template-end"
                        type="time"
                        value={newTemplate.end_time}
                        onChange={(e) => setNewTemplate({...newTemplate, end_time: e.target.value})}
                        className="col-span-3"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" onClick={handleAddTemplate} disabled={submitting}>
                      {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Créer Template
                    </Button>
                  </DialogFooter>
                </TabsContent>
                
                <TabsContent value="schedule" className="space-y-4">
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="schedule-employee" className="text-right">Employé</Label>
                      <Input
                        value={`${selectedEmployee.prenom} ${selectedEmployee.nom}`}
                        disabled
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="schedule-date" className="text-right">Date</Label>
                      <Input
                        id="schedule-date"
                        type="date"
                        value={newSchedule.date}
                        onChange={(e) => setNewSchedule({...newSchedule, date: e.target.value})}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="schedule-start" className="text-right">Début</Label>
                      <Input
                        id="schedule-start"
                        type="time"
                        value={newSchedule.start_time}
                        onChange={(e) => setNewSchedule({...newSchedule, start_time: e.target.value})}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="schedule-end" className="text-right">Fin</Label>
                      <Input
                        id="schedule-end"
                        type="time"
                        value={newSchedule.end_time}
                        onChange={(e) => setNewSchedule({...newSchedule, end_time: e.target.value})}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="schedule-note" className="text-right">Note</Label>
                      <Textarea
                        id="schedule-note"
                        value={newSchedule.note}
                        onChange={(e) => setNewSchedule({...newSchedule, note: e.target.value})}
                        className="col-span-3"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" onClick={handleAddSchedule} disabled={submitting}>
                      {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Créer Planning
                    </Button>
                  </DialogFooter>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Quick Weekly Planning Creator */}
      {showWeeklyCreator && selectedEmployeeForPlanning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <WeeklyPlanningCreator
                employee={selectedEmployeeForPlanning}
                onSuccess={() => {
                  setShowWeeklyCreator(false);
                  setSelectedEmployeeForPlanning(null);
                  loadShiftTemplates();
                }}
                onCancel={() => {
                  setShowWeeklyCreator(false);
                  setSelectedEmployeeForPlanning(null);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="date"
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              placeholder="Date de référence"
            />
            <div className="text-sm text-muted-foreground flex items-center">
              Planning pour: {selectedEmployee.prenom} {selectedEmployee.nom}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates d'horaires */}
      <Card>
        <CardHeader>
          <CardTitle>Templates d'Horaires Hebdomadaires</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Chargement...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Jour</TableHead>
                  <TableHead>Heures</TableHead>
                  <TableHead>Pause Déjeuner</TableHead>
                  <TableHead>Total Heures</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shiftTemplates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell>
                      <Badge variant="outline">
                        {weekdays.find(d => d.id === template.weekday)?.name}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {template.start_time} - {template.end_time}
                      </div>
                    </TableCell>
                    <TableCell>
                      {template.lunch_start && template.lunch_end ? (
                        <div className="flex items-center">
                          <Coffee className="h-3 w-3 mr-1" />
                          {template.lunch_start} - {template.lunch_end}
                        </div>
                      ) : (
                        "Aucune"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {calculateWorkHours(template.start_time, template.end_time, template.lunch_start || undefined, template.lunch_end || undefined)}h
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={template.active ? "default" : "destructive"}>
                        {template.active ? "Actif" : "Inactif"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
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
                                Supprimer le template pour {weekdays.find(d => d.id === template.weekday)?.name} ?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteTemplate(template)}>
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

      {/* Plannings spécifiques */}
      <Card>
        <CardHeader>
          <CardTitle>Plannings Spécifiques</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Heures</TableHead>
                <TableHead>Pause Déjeuner</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Note</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules.map((schedule) => (
                <TableRow key={schedule.id}>
                  <TableCell>
                    {new Date(schedule.date).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell>
                    {schedule.start_time && schedule.end_time ? (
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {schedule.start_time} - {schedule.end_time}
                      </div>
                    ) : (
                      "Non défini"
                    )}
                  </TableCell>
                  <TableCell>
                    {schedule.lunch_start && schedule.lunch_end ? (
                      <div className="flex items-center">
                        <Coffee className="h-3 w-3 mr-1" />
                        {schedule.lunch_start} - {schedule.lunch_end}
                      </div>
                    ) : (
                      "Aucune"
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={schedule.is_half_day ? "secondary" : "default"}>
                      {schedule.is_half_day ? "Demi-journée" : "Journée complète"}
                    </Badge>
                  </TableCell>
                  <TableCell>{schedule.note || "-"}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
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
                              Supprimer le planning du {new Date(schedule.date).toLocaleDateString('fr-FR')} ?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteSchedule(schedule)}>
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
        </CardContent>
      </Card>
    </div>
  );
};

export default Planning;