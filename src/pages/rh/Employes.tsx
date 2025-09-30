import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
import { Textarea } from "@/components/ui/textarea";
import { employeeService, Employee, CreateEmployeeData } from "@/utils/rhService";
import WeeklyPlanningCreator from "@/components/WeeklyPlanningCreator";
import QuickSalaryModal from "@/components/QuickSalaryModal";
import { Checkbox } from "@/components/ui/checkbox";
import { DollarSign, CalendarPlus } from "lucide-react";


const Employes = () => {
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
  const isMobile = useIsMobile();
  const { toast } = useToast();

  const [newEmployee, setNewEmployee] = useState<CreateEmployeeData>({
    nom: "",
    prenom: "",
    telephone: "",
    adresse: "",
    region: "",
    statut_civil: "autre",
    actif: true
  });

  const regions = ["Tunis", "Sousse", "Sfax", "Monastir", "Nabeul", "Bizerte"];
  
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
      setLoading(true);
      const data = await employeeService.getAll({
        region: regionFilter !== "all" ? regionFilter : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        search: searchTerm || undefined
      });
      setEmployees(data);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les employés",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
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
          actif: true
        });
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
        actif: isEditingEmployee.actif
      });
      
      if (result.success) {
        toast({
          title: "Succès",
          description: result.message || "Employé mis à jour avec succès"
        });
        setIsEditingEmployee(null);
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
    
    return matchesSearch && matchesRegion && matchesStatus;
  });


  return (
    <div className="container mx-auto p-2 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
            {isMobile ? "Employés" : "Gestion des Employés"}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">
            {isMobile ? "Gérer les employés" : "Gérer la liste des employés et leurs informations"}
          </p>
        </div>
        <Dialog open={isAddingEmployee} onOpenChange={setIsAddingEmployee}>
          <DialogTrigger asChild>
            <Button size={isMobile ? "sm" : "default"} className="w-full sm:w-auto">
              <UserPlus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="text-xs sm:text-sm">{isMobile ? "Employé" : "Nouvel Employé"}</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nouvel Employé</DialogTitle>
              <DialogDescription>
                Ajouter un nouveau membre à l'équipe
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
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
              <Button type="submit" onClick={handleAddEmployee} disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Créer l'Employé
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
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Liste des Employés</CardTitle>
            {selectedEmployees.length > 0 && (
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
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Chargement des employés...</span>
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
                  <TableHead>Nom Complet</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Région</TableHead>
                  <TableHead>Statut Civil</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date d'embauche</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => (
                  <TableRow key={employee.id} className={selectedEmployees.includes(employee.id) ? "bg-muted/50" : ""}>
                    <TableCell>
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
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(employee.created_at).toLocaleDateString('fr-FR')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
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
                          onClick={() => {
                            setSelectedEmployeeForSalary(employee);
                            setShowSalaryModal(true);
                          }}
                          title="Définir salaire"
                        >
                          <DollarSign className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setIsEditingEmployee(employee)}
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
      <Dialog open={!!isEditingEmployee} onOpenChange={() => setIsEditingEmployee(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier l'Employé</DialogTitle>
            <DialogDescription>
              Modifier les informations de {isEditingEmployee?.prenom} {isEditingEmployee?.nom}
            </DialogDescription>
          </DialogHeader>
          {isEditingEmployee && (
            <div className="grid gap-4 py-4">
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
            <Button type="submit" onClick={handleEditEmployee} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Mettre à jour
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Quick Actions Modals */}
      {showPlanningCreator && selectedEmployeeForPlanning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
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
    </div>
  );
};

export default Employes;