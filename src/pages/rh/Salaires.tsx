import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Banknote, 
  Plus, 
  Edit, 
  Trash2,
  TrendingUp,
  TrendingDown,
  Calculator,
  Loader2
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
  const [selectedEmployee, setSelectedEmployee] = useState("all");
  const [selectedYear, setSelectedYear] = useState("2024");
  const [isAddingSalary, setIsAddingSalary] = useState(false);
  const [isEditingSalary, setIsEditingSalary] = useState<Salary | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  
  const [newSalary, setNewSalary] = useState<CreateSalaryData>({
    employee_id: 0,
    net_total: 0,
    brut_total: 0,
    taxes: 0,
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

  const filteredSalaries = salaries.filter(salary => {
    const matchesEmployee = selectedEmployee === "all" || salary.employee_id === parseInt(selectedEmployee);
    const matchesYear = salary.effective_from.startsWith(selectedYear);
    return matchesEmployee && matchesYear;
  });

  const handleAddSalary = async () => {
    if (!newSalary.employee_id || !newSalary.net_total || !newSalary.effective_from) {
      toast({
        title: "Erreur",
        description: "Employé, salaire net et date sont obligatoires",
        variant: "destructive"
      });
      return;
    }

    try {
      setSubmitting(true);
      const result = await salaryService.create(newSalary);
      
      if (result.success) {
        toast({
          title: "Succès",
          description: result.message || "Salaire créé avec succès"
        });
        setNewSalary({
          employee_id: 0,
          net_total: 0,
          brut_total: 0,
          taxes: 0,
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
    if (!isEditingSalary || !isEditingSalary.net_total || !isEditingSalary.effective_from) {
      toast({
        title: "Erreur",
        description: "Salaire net et date sont obligatoires",
        variant: "destructive"
      });
      return;
    }

    try {
      setSubmitting(true);
      const result = await salaryService.update(isEditingSalary.id, {
        net_total: isEditingSalary.net_total,
        brut_total: isEditingSalary.brut_total,
        taxes: isEditingSalary.taxes,
        effective_from: isEditingSalary.effective_from,
        note: isEditingSalary.note
      });
      
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
      totalNetMonthly: currentSalaries.reduce((sum, s) => sum + (s.net_total || 0), 0),
      totalBrutMonthly: currentSalaries.reduce((sum, s) => sum + (s.brut_total || 0), 0),
      totalTaxesMonthly: currentSalaries.reduce((sum, s) => sum + (s.taxes || 0), 0),
      averageNet: currentSalaries.length > 0 ? currentSalaries.reduce((sum, s) => sum + (s.net_total || 0), 0) / currentSalaries.length : 0
    };
  };

  const stats = getStats();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestion des Salaires</h1>
          <p className="text-muted-foreground mt-2">
            Gérer les salaires et historique des rémunérations
          </p>
        </div>
        <Dialog open={isAddingSalary} onOpenChange={setIsAddingSalary}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Salaire
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouveau Salaire</DialogTitle>
              <DialogDescription>
                Enregistrer un nouveau salaire pour un employé
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="employee" className="text-right">
                  Employé
                </Label>
                <div className="col-span-3">
                    <Select 
                      value={newSalary.employee_id.toString()} 
                      onValueChange={(value) => setNewSalary({...newSalary, employee_id: parseInt(value)})}
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
                <Label htmlFor="brut_total" className="text-right">
                  Salaire Brut
                </Label>
                <Input
                  id="brut_total"
                  type="number"
                  step="0.01"
                  value={newSalary.brut_total || ""}
                  onChange={(e) => setNewSalary({...newSalary, brut_total: parseFloat(e.target.value) || 0})}
                  className="col-span-3"
                  placeholder="1500.00"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="taxes" className="text-right">
                  Taxes
                </Label>
                <Input
                  id="taxes"
                  type="number"
                  step="0.01"
                  value={newSalary.taxes || ""}
                  onChange={(e) => setNewSalary({...newSalary, taxes: parseFloat(e.target.value) || 0})}
                  className="col-span-3"
                  placeholder="300.00"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="net_total" className="text-right">
                  Salaire Net
                </Label>
                <Input
                  id="net_total"
                  type="number"
                  step="0.01"
                  value={newSalary.net_total || ""}
                  onChange={(e) => setNewSalary({...newSalary, net_total: parseFloat(e.target.value) || 0})}
                  className="col-span-3"
                  placeholder="1200.00"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="effective_from" className="text-right">
                  Date d'effet
                </Label>
                <Input
                  id="effective_from"
                  type="date"
                  value={newSalary.effective_from}
                  onChange={(e) => setNewSalary({...newSalary, effective_from: e.target.value})}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleAddSalary} disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enregistrer le Salaire
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="modern-card bg-primary text-primary-foreground">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-primary-foreground">
              Employés Actifs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary-foreground">{stats.totalEmployees}</div>
          </CardContent>
        </Card>
        
        <Card className="modern-card bg-primary text-primary-foreground">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-primary-foreground">
              Total Net/Mois
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary-foreground">
              {stats.totalNetMonthly.toLocaleString()} TND
            </div>
          </CardContent>
        </Card>

        <Card className="modern-card bg-primary text-primary-foreground">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-primary-foreground">
              Total Brut/Mois
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary-foreground">
              {stats.totalBrutMonthly.toLocaleString()} TND
            </div>
          </CardContent>
        </Card>

        <Card className="modern-card bg-primary text-primary-foreground">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-primary-foreground">
              Total Taxes/Mois
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary-foreground">
              {stats.totalTaxesMonthly.toLocaleString()} TND
            </div>
          </CardContent>
        </Card>

        <Card className="modern-card bg-primary text-primary-foreground">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-primary-foreground">
              Salaire Moyen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary-foreground">
              {Math.round(stats.averageNet).toLocaleString()} TND
            </div>
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

            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger>
                <SelectValue placeholder="Année" />
              </SelectTrigger>
              <SelectContent>
                {years.map(year => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="text-sm text-muted-foreground flex items-center">
              <Calculator className="h-4 w-4 mr-2" />
              Résultats: {filteredSalaries.length}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des salaires */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des Salaires</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Chargement des salaires...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employé</TableHead>
                  <TableHead>Salaire Brut</TableHead>
                  <TableHead>Taxes</TableHead>
                  <TableHead>Salaire Net</TableHead>
                  <TableHead>Taux Taxes</TableHead>
                  <TableHead>Période</TableHead>
                  <TableHead>Statut</TableHead>
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
                        <Badge variant="outline">
                          {taxRate}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>Du: {new Date(salary.effective_from).toLocaleDateString('fr-FR')}</div>
                          {salary.effective_to && (
                            <div>Au: {new Date(salary.effective_to).toLocaleDateString('fr-FR')}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={isActive ? "default" : "secondary"}>
                          {isActive ? (
                            <>
                              <TrendingUp className="h-3 w-3 mr-1" />
                              Actuel
                            </>
                          ) : (
                            <>
                              <TrendingDown className="h-3 w-3 mr-1" />
                              Archivé
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
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
        <DialogContent>
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