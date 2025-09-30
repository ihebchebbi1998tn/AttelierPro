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
  Calendar, 
  Plus, 
  Check, 
  X, 
  Clock,
  Plane,
  AlertCircle,
  Loader2,
  Trash2
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
import { employeeService, holidayService, Employee, Holiday, CreateHolidayData } from "@/utils/rhService";

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
  
  const [newHoliday, setNewHoliday] = useState<CreateHolidayData>({
    employee_id: 0,
    date: "",
    half_day: "FULL",
    motif: ""
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
      const filters = {
        employee_id: selectedEmployee !== "all" ? parseInt(selectedEmployee) : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined
      };
      const data = await holidayService.getAll(filters);
      setHolidays(data);
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
    if (!newHoliday.employee_id || !newHoliday.date || !newHoliday.motif) {
      toast({
        title: "Erreur",
        description: "Employé, date et motif sont obligatoires",
        variant: "destructive"
      });
      return;
    }

    try {
      setSubmitting(true);
      const result = await holidayService.create(newHoliday);
      
      if (result.success) {
        toast({
          title: "Succès",
          description: result.message || "Demande de congé créée avec succès"
        });
        setNewHoliday({
          employee_id: 0,
          date: "",
          half_day: "FULL",
          motif: ""
        });
        setIsAddingHoliday(false);
        loadHolidays();
      }
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
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
            {isMobile ? "Congés" : "Congés & Absences"}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">
            {isMobile ? "Gérer les congés" : "Gérer les demandes de congés et absences des employés"}
          </p>
        </div>
        <Dialog open={isAddingHoliday} onOpenChange={setIsAddingHoliday}>
          <DialogTrigger asChild>
            <Button size={isMobile ? "sm" : "default"} className="w-full sm:w-auto">
              <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="text-xs sm:text-sm">{isMobile ? "Demande" : "Nouvelle Demande"}</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouvelle Demande de Congé</DialogTitle>
              <DialogDescription>
                Ajouter une nouvelle demande de congé ou absence
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="employee" className="text-right">
                  Employé
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
                <Label htmlFor="date" className="text-right">
                  Date
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={newHoliday.date}
                  onChange={(e) => setNewHoliday({...newHoliday, date: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="half_day" className="text-right">
                  Type
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
                <Label htmlFor="motif" className="text-right">
                  Motif
                </Label>
                <Textarea
                  id="motif"
                  value={newHoliday.motif}
                  onChange={(e) => setNewHoliday({...newHoliday, motif: e.target.value})}
                  className="col-span-3"
                  placeholder="Raison de la demande de congé..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleAddHoliday}>
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
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
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
              <SelectTrigger>
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

            <div className="text-sm text-muted-foreground flex items-center">
              Résultats: {filteredHolidays.length}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des congés */}
      <Card>
        <CardHeader>
          <CardTitle>Demandes de Congés</CardTitle>
        </CardHeader>
        <CardContent>
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
              {filteredHolidays.map((holiday) => (
                <TableRow key={holiday.id}>
                  <TableCell className="font-medium">
                    {holiday.employee_name}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(holiday.date).toLocaleDateString('fr-FR')}
                    </div>
                  </TableCell>
                  <TableCell>
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
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {holiday.motif}
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Conges;