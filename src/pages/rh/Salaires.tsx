import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  Banknote, 
  Plus, 
  Edit, 
  Trash2,
  TrendingUp,
  TrendingDown,
  Calculator,
  Loader2,
  ArrowLeft,
  Settings,
  UserCog
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
import { 
  employeeService, 
  salaryService, 
  Employee, 
  Salary, 
  CreateSalaryData 
} from "@/utils/rhService";

const Salaires = () => {
  const navigate = useNavigate();
  const [selectedEmployee, setSelectedEmployee] = useState("all");
  const [selectedYear, setSelectedYear] = useState("2024");
  const [isAddingSalary, setIsAddingSalary] = useState(false);
  const [isEditingSalary, setIsEditingSalary] = useState<Salary | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const isMobile = useIsMobile();
  const { toast } = useToast();
  
  const [newSalary, setNewSalary] = useState<CreateSalaryData>({
    employee_id: 0,
    salaire_brut: 0,
    chef_de_famille: false,
    nombre_enfants: 0,
    effective_from: new Date().toISOString().split('T')[0],
    note: ""
  });

  const years = ["2024", "2023", "2022"];

  // Load data on component mount
  useEffect(() => {
    loadEmployees();
    loadSalaries();
  }, []);

  // Reload when filters change
  useEffect(() => {
    if (!loading) {
      loadSalaries();
    }
  }, [selectedEmployee]);

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

  const loadSalaries = async () => {
    try {
      setLoading(true);
      // Always fetch all salaries without API-level filtering for employee
      // We'll filter in the frontend for better performance and control
      const data = await salaryService.getAll({});
      setSalaries(data);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les salaires",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredSalaries = salaries
    .filter(salary => {
      // Only show current/active salaries
      const isActive = !salary.effective_to || new Date(salary.effective_to) >= new Date();
      if (!isActive) return false;
      
      const matchesEmployee = selectedEmployee === "all" || salary.employee_id === parseInt(selectedEmployee);
      return matchesEmployee;
    });

  const handleAddSalary = async () => {
    if (!newSalary.employee_id || !newSalary.salaire_brut || !newSalary.effective_from) {
      toast({
        title: "Erreur",
        description: "Employé, salaire brut et date sont obligatoires",
        variant: "destructive"
      });
      return;
    }

    // Get employee data for the form
    const selectedEmp = employees.find(e => e.id === newSalary.employee_id);
    if (!selectedEmp) {
      toast({
        title: "Erreur",
        description: "Employé non trouvé",
        variant: "destructive"
      });
      return;
    }

    // Update with employee's data
    const salaryWithEmployeeData = {
      ...newSalary,
      chef_de_famille: selectedEmp.chef_de_famille || false,
      nombre_enfants: selectedEmp.nombre_enfants || 0
    };

    try {
      setSubmitting(true);
      const result = await salaryService.create(salaryWithEmployeeData);
      
      if (result.success) {
        toast({
          title: "Succès",
          description: result.message || "Salaire créé avec succès"
        });
        setNewSalary({
          employee_id: 0,
          salaire_brut: 0,
          chef_de_famille: false,
          nombre_enfants: 0,
          effective_from: new Date().toISOString().split('T')[0],
          note: ""
        });
        setIsAddingSalary(false);
        loadSalaries();
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

  const handleEditSalary = async () => {
    if (!isEditingSalary || !isEditingSalary.salaire_brut || !isEditingSalary.effective_from) {
      toast({
        title: "Erreur",
        description: "Salaire brut et date sont obligatoires",
        variant: "destructive"
      });
      return;
    }

    // Get employee data
    const employee = employees.find(e => e.id === isEditingSalary.employee_id);
    if (!employee) {
      toast({
        title: "Erreur",
        description: "Employé non trouvé",
        variant: "destructive"
      });
      return;
    }

    try {
      setSubmitting(true);
      const updateData: CreateSalaryData = {
        employee_id: isEditingSalary.employee_id,
        salaire_brut: isEditingSalary.salaire_brut,
        chef_de_famille: employee.chef_de_famille || false,
        nombre_enfants: employee.nombre_enfants || 0,
        effective_from: isEditingSalary.effective_from,
        note: isEditingSalary.note || ""
      };
      const result = await salaryService.update(isEditingSalary.id, updateData);
      
      if (result.success) {
        toast({
          title: "Succès",
          description: result.message || "Salaire mis à jour avec succès"
        });
        setIsEditingSalary(null);
        loadSalaries();
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

  const handleDeleteSalary = async (salary: Salary) => {
    try {
      const result = await salaryService.delete(salary.id);
      
      if (result.success) {
        toast({
          title: "Succès",
          description: result.message || "Salaire supprimé avec succès"
        });
        loadSalaries();
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

  const calculateTaxRate = (brut: number, taxes: number) => {
    return brut > 0 ? ((taxes / brut) * 100).toFixed(1) : "0";
  };

  const getStats = () => {
    // Get all current salaries (not filtered by year for statistics)
    const currentSalaries = salaries.filter(s => !s.effective_to || new Date(s.effective_to) >= new Date());
    
    return {
      totalEmployees: new Set(currentSalaries.map(s => s.employee_id)).size,
      totalNetMonthly: Math.round(currentSalaries.reduce((sum, s) => sum + (s.net_total || 0), 0)),
      totalBrutMonthly: Math.round(currentSalaries.reduce((sum, s) => sum + (s.brut_total || 0), 0)),
      totalTaxesMonthly: Math.round(currentSalaries.reduce((sum, s) => sum + (s.taxes || 0), 0)),
      averageNet: currentSalaries.length > 0 ? Math.round(currentSalaries.reduce((sum, s) => sum + (s.net_total || 0), 0) / currentSalaries.length) : 0
    };
  };

  const stats = getStats();

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
              {isMobile ? "Salaires" : "Gestion des Salaires"}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">
              {isMobile ? "Salaires actuels" : "Vue des salaires actuels des employés"}
            </p>
          </div>
        </div>
        <Button asChild variant="outline" size={isMobile ? "sm" : "default"}>
          <Link to="/rh/salaires/configuration">
            <Settings className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="text-xs sm:text-sm">{isMobile ? "Config" : "Configuration"}</span>
          </Link>
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
        <Card className="modern-card bg-primary text-primary-foreground">
          <CardHeader className="p-2 sm:p-3 md:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-primary-foreground">
              {isMobile ? "Employés" : "Employés Actifs"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-3 pt-0">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-primary-foreground">{stats.totalEmployees}</div>
          </CardContent>
        </Card>
        
        <Card className="modern-card bg-primary text-primary-foreground">
          <CardHeader className="p-2 sm:p-3 md:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-primary-foreground">
              {isMobile ? "Net/Mois" : "Total Net/Mois"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-3 pt-0">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-primary-foreground">
              {isMobile ? `${Math.round(stats.totalNetMonthly / 1000)}K` : `${stats.totalNetMonthly.toLocaleString('fr-FR')} TND`}
            </div>
          </CardContent>
        </Card>

        <Card className="modern-card bg-primary text-primary-foreground">
          <CardHeader className="p-2 sm:p-3 md:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-primary-foreground">
              {isMobile ? "Brut/Mois" : "Total Brut/Mois"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-3 pt-0">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-primary-foreground">
              {isMobile ? `${Math.round(stats.totalBrutMonthly / 1000)}K` : `${stats.totalBrutMonthly.toLocaleString('fr-FR')} TND`}
            </div>
          </CardContent>
        </Card>

        <Card className="modern-card bg-primary text-primary-foreground">
          <CardHeader className="p-2 sm:p-3 md:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-primary-foreground">
              {isMobile ? "Taxes/Mois" : "Total Taxes/Mois"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-3 pt-0">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-primary-foreground">
              {isMobile ? `${Math.round(stats.totalTaxesMonthly / 1000)}K` : `${stats.totalTaxesMonthly.toLocaleString('fr-FR')} TND`}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader className="p-3 sm:p-4 md:p-6">
          <CardTitle className="text-sm sm:text-base md:text-lg">Filtres</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
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
              <Calculator className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Salaires actifs: {filteredSalaries.length}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Salaires actuels */}
      <Card>
        <CardHeader className="p-3 sm:p-4 md:p-6">
          <CardTitle className="text-sm sm:text-base md:text-lg">{isMobile ? "Salaires" : "Salaires Actuels"}</CardTitle>
        </CardHeader>
        <CardContent className="p-2 sm:p-4 md:p-6 pt-0">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2 text-sm">Chargement...</span>
            </div>
          ) : isMobile ? (
            <div className="space-y-2">
              {filteredSalaries.map((salary) => {
                const isActive = !salary.effective_to || new Date(salary.effective_to) >= new Date();
                const taxRate = calculateTaxRate(salary.brut_total || 0, salary.taxes || 0);
                const employeeName = salary.nom && salary.prenom ? `${salary.prenom} ${salary.nom}` : `Employé ${salary.employee_id}`;
                
                return (
                  <Card key={salary.id} className={`border-l-4 ${isActive ? 'border-l-green-500' : 'border-l-gray-400'}`}>
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-semibold text-sm">{employeeName}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            Du: {new Date(salary.effective_from).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                        <Badge variant={isActive ? "default" : "secondary"} className="text-xs">
                          {isActive ? "Actuel" : "Archivé"}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <div className="text-muted-foreground">Net</div>
                          <div className="font-semibold text-green-600">
                            {(salary.net_total || 0).toLocaleString()} TND
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Taxes</div>
                          <div className="text-red-600">
                            {(salary.taxes || 0).toLocaleString()} TND
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1 pt-2 mt-2 border-t">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="flex-1 h-7 text-xs"
                          onClick={() => navigate(`/rh/salaires/definir/${salary.employee_id}`)}
                        >
                          <UserCog className="h-3 w-3 mr-1" />
                          Configurer
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => setIsEditingSalary(salary)}
                        >
                          <Edit className="h-3 w-3" />
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
                                Supprimer cette entrée de salaire ?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteSalary(salary)}>
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
                  <TableHead>Employé</TableHead>
                  <TableHead>Salaire Brut</TableHead>
                  <TableHead>Taxes</TableHead>
                  <TableHead>Salaire Net</TableHead>
                  <TableHead>Date d'effet</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSalaries.map((salary) => {
                  const isActive = !salary.effective_to || new Date(salary.effective_to) >= new Date();
                  const taxRate = calculateTaxRate(salary.brut_total || 0, salary.taxes || 0);
                  const employeeName = salary.nom && salary.prenom ? `${salary.prenom} ${salary.nom}` : `Employé ${salary.employee_id}`;
                  
                  return (
                    <TableRow key={salary.id}>
                      <TableCell className="font-medium">
                        {employeeName}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Banknote className="h-3 w-3 mr-1" />
                          {(salary.brut_total || 0).toLocaleString()} TND
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-red-600">
                          {(salary.taxes || 0).toLocaleString()} TND
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-green-600">
                          {(salary.net_total || 0).toLocaleString()} TND
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(salary.effective_from).toLocaleDateString('fr-FR')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => navigate(`/rh/salaires/definir/${salary.employee_id}`)}
                          >
                            <UserCog className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setIsEditingSalary(salary)}
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
                                  Êtes-vous sûr de vouloir supprimer cette entrée de salaire ?
                                  Cette action est irréversible.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteSalary(salary)}>
                                  Supprimer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                );
              })}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Salary Dialog */}
      <Dialog open={!!isEditingSalary} onOpenChange={() => setIsEditingSalary(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier le Salaire</DialogTitle>
            <DialogDescription>
              Modifier les informations de salaire
            </DialogDescription>
          </DialogHeader>
          {isEditingSalary && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-brut" className="text-right">Salaire Brut</Label>
                <Input
                  id="edit-brut"
                  type="number"
                  step="0.01"
                  value={isEditingSalary.brut_total || ""}
                  onChange={(e) => setIsEditingSalary({...isEditingSalary, brut_total: parseFloat(e.target.value) || 0})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-taxes" className="text-right">Taxes</Label>
                <Input
                  id="edit-taxes"
                  type="number"
                  step="0.01"
                  value={isEditingSalary.taxes || ""}
                  onChange={(e) => setIsEditingSalary({...isEditingSalary, taxes: parseFloat(e.target.value) || 0})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-net" className="text-right">Salaire Net</Label>
                <Input
                  id="edit-net"
                  type="number"
                  step="0.01"
                  value={isEditingSalary.net_total || ""}
                  onChange={(e) => setIsEditingSalary({...isEditingSalary, net_total: parseFloat(e.target.value) || 0})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-from" className="text-right">Date d'effet</Label>
                <Input
                  id="edit-from"
                  type="date"
                  value={isEditingSalary.effective_from}
                  onChange={(e) => setIsEditingSalary({...isEditingSalary, effective_from: e.target.value})}
                  className="col-span-3"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="submit" onClick={handleEditSalary} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Mettre à jour
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Salaires;