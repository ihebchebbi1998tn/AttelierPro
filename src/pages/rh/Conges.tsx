import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Check, 
  X, 
  Clock,
  Plane,
  AlertCircle,
  Loader2,
  Trash2,
  ArrowLeft,
  Heart,
  Briefcase
} from "lucide-react";
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { employeeService, holidayService, Employee, Holiday, CreateHolidayData } from "@/utils/rhService";
import { pointageService, MarkLeaveData } from "@/utils/pointageService";

const Conges = () => {
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedEmployee, setSelectedEmployee] = useState("all");
  const [isAddingHoliday, setIsAddingHoliday] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const isMobile = useIsMobile();
  const { toast } = useToast();
  
  const [newHoliday, setNewHoliday] = useState<CreateHolidayData & { 
    start_date?: Date; 
    end_date?: Date;
    leave_type?: string;
  }>({
    employee_id: 0,
    date: "",
    half_day: "FULL",
    motif: "",
    start_date: undefined,
    end_date: undefined,
    leave_type: "annual"
  });

  // Load data on component mount
  useEffect(() => {
    loadEmployees();
    loadHolidays();
  }, []);

  // Reload when filters change
  useEffect(() => {
    if (!loading) {
      loadHolidays();
    }
  }, [statusFilter, selectedEmployee]);

  const loadEmployees = async () => {
    try {
      const data = await employeeService.getAll({ status: 'actif' });
      setEmployees(data);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les employés",
        variant: "destructive"
      });
    }
  };

  const loadHolidays = async () => {
    try {
      setLoading(true);
      
      // Load leave records from pointage table
      const pointageLeaves = await pointageService.getLeaveRecords({
        employee_id: selectedEmployee !== "all" ? parseInt(selectedEmployee) : undefined,
        leave_status: statusFilter !== "all" ? statusFilter : undefined
      });
      
      // Convert pointage records to Holiday format for display
      const convertedHolidays: Holiday[] = pointageLeaves.map(record => ({
        id: record.id,
        employee_id: record.employee_id,
        employee_name: record.prenom && record.nom ? `${record.prenom} ${record.nom}` : undefined,
        prenom: record.prenom,
        nom: record.nom,
        date: record.date || '',
        half_day: record.leave_duration === 'FULL' ? 'FULL' : 
                  record.leave_duration === 'AM' ? 'AM' : 
                  record.leave_duration === 'PM' ? 'PM' : 'FULL',
        motif: record.motif || '',
        status: record.leave_status || 'approved',
        is_paid: record.is_paid_leave !== undefined ? record.is_paid_leave : true,
        created_at: record.created_at
      }));
      
      setHolidays(convertedHolidays);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les congés",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddHoliday = async () => {
    if (!newHoliday.employee_id || (!newHoliday.start_date && !newHoliday.date) || !newHoliday.motif) {
      toast({
        title: "Erreur",
        description: "Employé, date et motif sont obligatoires",
        variant: "destructive"
      });
      return;
    }

    try {
      setSubmitting(true);
      
      // Prepare leave data for pointage
      const leaveData: Omit<MarkLeaveData, 'employee_id' | 'date'> = {
        leave_type: (newHoliday.leave_type as any) || 'annual',
        leave_duration: newHoliday.half_day as any,
        motif: newHoliday.motif,
        is_paid_leave: true,
        leave_status: 'approved'
      };
      
      // If date range is selected, mark multiple days
      if (newHoliday.start_date && newHoliday.end_date) {
        const startDate = newHoliday.start_date.toISOString().split('T')[0];
        const endDate = newHoliday.end_date.toISOString().split('T')[0];
        
        await pointageService.markLeaveRange(
          newHoliday.employee_id,
          startDate,
          endDate,
          leaveData
        );
      } else {
        // Single date entry
        const leaveDate = newHoliday.start_date 
          ? newHoliday.start_date.toISOString().split('T')[0] 
          : newHoliday.date;
          
        await pointageService.markLeave({
          employee_id: newHoliday.employee_id,
          date: leaveDate,
          ...leaveData
        });
      }
      
      toast({
        title: "Succès",
        description: "Congé marqué avec succès dans le pointage"
      });
      
      setNewHoliday({
        employee_id: 0,
        date: "",
        half_day: "FULL",
        motif: "",
        start_date: undefined,
        end_date: undefined,
        leave_type: "annual"
      });
      setIsAddingHoliday(false);
      loadHolidays();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la création",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (holidayId: number, newStatus: 'approved' | 'rejected') => {
    try {
      const result = await holidayService.updateStatus(holidayId, newStatus);
      
      if (result.success) {
        toast({
          title: "Succès",
          description: result.message || `Congé ${newStatus === 'approved' ? 'approuvé' : 'rejeté'}`
        });
        loadHolidays();
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la mise à jour",
        variant: "destructive"
      });
    }
  };

  const handleDeleteHoliday = async (holiday: Holiday) => {
    try {
      const result = await holidayService.delete(holiday.id);
      
      if (result.success) {
        toast({
          title: "Succès",
          description: result.message || "Congé supprimé avec succès"
        });
        loadHolidays();
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression",
        variant: "destructive"
      });
    }
  };

  const statusLabels = {
    pending: "En attente",
    approved: "Approuvé",
    rejected: "Rejeté"
  };

  const halfDayLabels = {
    AM: "Matin",
    PM: "Après-midi", 
    FULL: "Journée complète"
  };

  const leaveTypeLabels = {
    annual: "Congé annuel",
    sick: "Congé maladie",
    special: "Congé spécial",
    unpaid: "Congé sans solde",
    maternity: "Congé maternité",
    paternity: "Congé paternité"
  };

  const getEmployeeName = (holiday: Holiday) => {
    if (holiday.employee_name) return holiday.employee_name;
    if (holiday.prenom && holiday.nom) return `${holiday.prenom} ${holiday.nom}`;
    return `Employé ${holiday.employee_id}`;
  };

  const getLeaveTypeFromMotif = (motif: string) => {
    const match = motif.match(/^\[(annual|sick|special|unpaid|maternity|paternity)\]/);
    if (match && match[1]) {
      return leaveTypeLabels[match[1] as keyof typeof leaveTypeLabels] || match[1];
    }
    return null;
  };

  const getCleanMotif = (motif: string) => {
    // Remove the leave type prefix if it exists
    return motif.replace(/^\[(annual|sick|special|unpaid|maternity|paternity)\]\s*/, '');
  };

  const filteredHolidays = holidays.filter(holiday => {
    const matchesStatus = statusFilter === "all" || holiday.status === statusFilter;
    const matchesEmployee = selectedEmployee === "all" || holiday.employee_id === parseInt(selectedEmployee);
    return matchesStatus && matchesEmployee;
  });

  const getStatusStats = () => {
    return {
      pending: holidays.filter(h => h.status === 'pending').length,
      approved: holidays.filter(h => h.status === 'approved').length,
      rejected: holidays.filter(h => h.status === 'rejected').length,
      total: holidays.length
    };
  };

  const stats = getStatusStats();

  return (
    <div className="container mx-auto p-2 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
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
              {isMobile ? "Congés" : "Congés & Absences"}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">
              {isMobile ? "Gérer les congés" : "Gérer les demandes de congés et absences des employés"}
            </p>
          </div>
        </div>
        <Dialog open={isAddingHoliday} onOpenChange={setIsAddingHoliday}>
          <DialogTrigger asChild>
            <Button size={isMobile ? "sm" : "default"} className="w-full sm:w-auto">
              <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="text-xs sm:text-sm">{isMobile ? "Demande" : "Nouvelle Demande"}</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nouvelle Demande de Congé</DialogTitle>
              <DialogDescription>
                Ajouter une nouvelle demande de congé ou absence
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="employee" className="text-right text-xs sm:text-sm">
                  Employé *
                </Label>
                <div className="col-span-3">
                  <Select 
                    value={newHoliday.employee_id.toString()} 
                    onValueChange={(value) => setNewHoliday({...newHoliday, employee_id: parseInt(value)})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un employé" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map(emp => (
                        <SelectItem key={emp.id} value={emp.id.toString()}>
                          {emp.prenom} {emp.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-xs sm:text-sm">
                  Type de congé *
                </Label>
                <div className="col-span-3">
                  <Select 
                    value={newHoliday.leave_type} 
                    onValueChange={(value) => setNewHoliday({...newHoliday, leave_type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="annual">
                        <div className="flex items-center">
                          <Plane className="h-4 w-4 mr-2" />
                          Congé annuel
                        </div>
                      </SelectItem>
                      <SelectItem value="sick">
                        <div className="flex items-center">
                          <Heart className="h-4 w-4 mr-2" />
                          Congé maladie
                        </div>
                      </SelectItem>
                      <SelectItem value="special">
                        <div className="flex items-center">
                          <Briefcase className="h-4 w-4 mr-2" />
                          Congé spécial
                        </div>
                      </SelectItem>
                      <SelectItem value="unpaid">Congé sans solde</SelectItem>
                      <SelectItem value="maternity">Congé maternité</SelectItem>
                      <SelectItem value="paternity">Congé paternité</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-xs sm:text-sm">
                  Date début *
                </Label>
                <div className="col-span-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !newHoliday.start_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newHoliday.start_date ? (
                          format(newHoliday.start_date, "PPP", { locale: fr })
                        ) : (
                          <span>Sélectionner une date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={newHoliday.start_date}
                        onSelect={(date) => setNewHoliday({...newHoliday, start_date: date, end_date: date || newHoliday.end_date})}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-xs sm:text-sm">
                  Date fin
                </Label>
                <div className="col-span-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !newHoliday.end_date && "text-muted-foreground"
                        )}
                        disabled={!newHoliday.start_date}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newHoliday.end_date ? (
                          format(newHoliday.end_date, "PPP", { locale: fr })
                        ) : (
                          <span>Même jour</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={newHoliday.end_date}
                        onSelect={(date) => setNewHoliday({...newHoliday, end_date: date})}
                        disabled={(date) => 
                          newHoliday.start_date ? date < newHoliday.start_date : false
                        }
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <p className="text-xs text-muted-foreground mt-1">
                    Optionnel - Pour un seul jour, laissez vide
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="half_day" className="text-right text-xs sm:text-sm">
                  Durée
                </Label>
                <div className="col-span-3">
                  <Select 
                    value={newHoliday.half_day} 
                    onValueChange={(value) => setNewHoliday({...newHoliday, half_day: value as "AM" | "FULL" | "PM"})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FULL">Journée complète</SelectItem>
                      <SelectItem value="AM">Matin seulement</SelectItem>
                      <SelectItem value="PM">Après-midi seulement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="motif" className="text-right text-xs sm:text-sm">
                  Motif *
                </Label>
                <Textarea
                  id="motif"
                  value={newHoliday.motif}
                  onChange={(e) => setNewHoliday({...newHoliday, motif: e.target.value})}
                  className="col-span-3"
                  placeholder="Raison de la demande de congé..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleAddHoliday} disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Ajouter la Demande
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
        <Card className="modern-card bg-primary text-primary-foreground">
          <CardHeader className="p-2 sm:p-3 md:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-primary-foreground">
              {isMobile ? "Total" : "Total Demandes"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-3 pt-0">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-primary-foreground">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card className="modern-card bg-primary text-primary-foreground">
          <CardHeader className="p-2 sm:p-3 md:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-primary-foreground">
              {isMobile ? "Attente" : "En Attente"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-3 pt-0">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-primary-foreground">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card className="modern-card bg-primary text-primary-foreground">
          <CardHeader className="p-2 sm:p-3 md:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-primary-foreground">
              Approuvées
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-3 pt-0">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-primary-foreground">{stats.approved}</div>
          </CardContent>
        </Card>

        <Card className="modern-card bg-primary text-primary-foreground">
          <CardHeader className="p-2 sm:p-3 md:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-primary-foreground">
              Rejetées
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-3 pt-0">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-primary-foreground">{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader className="p-3 sm:p-4 md:p-6">
          <CardTitle className="text-sm sm:text-base md:text-lg">Filtres</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="text-xs sm:text-sm">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les Statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="approved">Approuvées</SelectItem>
                <SelectItem value="rejected">Rejetées</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger className="text-xs sm:text-sm">
                <SelectValue placeholder="Tous les employés" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les Employés</SelectItem>
                {employees.map(emp => (
                  <SelectItem key={emp.id} value={emp.id.toString()}>
                    {emp.prenom} {emp.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="text-xs sm:text-sm text-muted-foreground flex items-center">
              Résultats: {filteredHolidays.length}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des congés */}
      <Card>
        <CardHeader className="p-3 sm:p-4 md:p-6">
          <CardTitle className="text-sm sm:text-base md:text-lg">{isMobile ? "Demandes" : "Demandes de Congés"}</CardTitle>
        </CardHeader>
        <CardContent className="p-2 sm:p-4 md:p-6 pt-0">
          {isMobile ? (
            <div className="space-y-2">
              {filteredHolidays.map((holiday) => (
                <Card key={holiday.id} className={`border-l-4 ${
                  holiday.status === 'approved' ? 'border-l-green-500' : 
                  holiday.status === 'rejected' ? 'border-l-red-500' : 'border-l-orange-500'
                }`}>
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-semibold text-sm">{getEmployeeName(holiday)}</div>
                        <div className="flex items-center text-xs text-muted-foreground mt-0.5">
                          <CalendarIcon className="h-3 w-3 mr-1" />
                          {new Date(holiday.date).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                      <Badge 
                        variant={
                          holiday.status === 'approved' ? "default" :
                          holiday.status === 'rejected' ? "destructive" : "secondary"
                        }
                        className="text-xs"
                      >
                        {statusLabels[holiday.status]}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex gap-1 flex-wrap">
                        <Badge variant={holiday.half_day === 'FULL' ? "default" : "secondary"} className="text-xs">
                          {holiday.half_day === 'FULL' ? <Plane className="h-3 w-3 mr-0.5" /> : <Clock className="h-3 w-3 mr-0.5" />}
                          {halfDayLabels[holiday.half_day]}
                        </Badge>
                        {getLeaveTypeFromMotif(holiday.motif || '') && (
                          <Badge variant="outline" className="text-xs">
                            {getLeaveTypeFromMotif(holiday.motif || '')}
                          </Badge>
                        )}
                      </div>
                      <div className="text-muted-foreground mt-1">{getCleanMotif(holiday.motif || '')}</div>
                    </div>
                    {holiday.status === 'pending' && (
                      <div className="flex gap-1 pt-2 mt-2 border-t">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="flex-1 h-7 text-xs text-green-600 hover:text-green-700"
                          onClick={() => handleStatusChange(holiday.id, 'approved')}
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Approuver
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="flex-1 h-7 text-xs text-red-600 hover:text-red-700"
                          onClick={() => handleStatusChange(holiday.id, 'rejected')}
                        >
                          <X className="h-3 w-3 mr-1" />
                          Rejeter
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 text-red-600">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmer</AlertDialogTitle>
                              <AlertDialogDescription>
                                Supprimer cette demande ?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteHoliday(holiday)}>
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employé</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Motif</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Demandé le</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHolidays.map((holiday) => {
                const leaveType = getLeaveTypeFromMotif(holiday.motif || '');
                const cleanMotif = getCleanMotif(holiday.motif || '');
                
                return (
                <TableRow key={holiday.id}>
                  <TableCell className="font-medium">
                    {getEmployeeName(holiday)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <CalendarIcon className="h-3 w-3 mr-1" />
                      {new Date(holiday.date).toLocaleDateString('fr-FR')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Badge 
                        variant={holiday.half_day === 'FULL' ? "default" : "secondary"}
                      >
                        {holiday.half_day === 'FULL' ? (
                          <Plane className="h-3 w-3 mr-1" />
                        ) : (
                          <Clock className="h-3 w-3 mr-1" />
                        )}
                        {halfDayLabels[holiday.half_day]}
                      </Badge>
                      {leaveType && (
                        <Badge variant="outline" className="text-xs">
                          {leaveType}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    {cleanMotif}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        holiday.status === 'approved' ? "default" :
                        holiday.status === 'rejected' ? "destructive" : "secondary"
                      }
                    >
                      {holiday.status === 'pending' && <AlertCircle className="h-3 w-3 mr-1" />}
                      {holiday.status === 'approved' && <Check className="h-3 w-3 mr-1" />}
                      {holiday.status === 'rejected' && <X className="h-3 w-3 mr-1" />}
                      {statusLabels[holiday.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(holiday.created_at).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell>
                    {holiday.status === 'pending' && (
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleStatusChange(holiday.id, 'approved')}
                          className="text-green-600 hover:text-green-700"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleStatusChange(holiday.id, 'rejected')}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                              <AlertDialogDescription>
                                Êtes-vous sûr de vouloir supprimer cette demande de congé ?
                                Cette action est irréversible.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteHoliday(holiday)}>
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                    {holiday.status !== 'pending' && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                            <AlertDialogDescription>
                              Êtes-vous sûr de vouloir supprimer cette demande de congé ?
                              Cette action est irréversible.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteHoliday(holiday)}>
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </TableCell>
                </TableRow>
                );
              })}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Conges;