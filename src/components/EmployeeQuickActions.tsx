import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Calendar, 
  Clock,
  DollarSign,
  UserCheck,
  TrendingUp,
  MessageSquare,
  Phone,
  Mail,
  MapPin,
  Award
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Employee, holidayService, salaryService, CreateHolidayData, CreateSalaryData } from "@/utils/rhService";

interface EmployeeQuickActionsProps {
  employee: Employee;
  onRefresh?: () => void;
}

const EmployeeQuickActions: React.FC<EmployeeQuickActionsProps> = ({
  employee,
  onRefresh
}) => {
  const [isAddingHoliday, setIsAddingHoliday] = useState(false);
  const [isAddingSalary, setIsAddingSalary] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const [newHoliday, setNewHoliday] = useState<CreateHolidayData>({
    employee_id: employee.id,
    date: "",
    half_day: "FULL",
    motif: ""
  });

  const [newSalary, setNewSalary] = useState<CreateSalaryData>({
    employee_id: employee.id,
    net_total: 0,
    brut_total: 0,
    effective_from: new Date().toISOString().split('T')[0],
    note: ""
  });

  const handleAddHoliday = async () => {
    if (!newHoliday.date || !newHoliday.motif) {
      toast({
        title: "Erreur",
        description: "Date et motif sont obligatoires",
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
          description: "Demande de congé créée avec succès"
        });
        setNewHoliday({
          employee_id: employee.id,
          date: "",
          half_day: "FULL",
          motif: ""
        });
        setIsAddingHoliday(false);
        onRefresh?.();
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

  const handleAddSalary = async () => {
    if (!newSalary.net_total || newSalary.net_total <= 0) {
      toast({
        title: "Erreur",
        description: "Le salaire net doit être supérieur à 0",
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
          description: "Salaire ajouté avec succès"
        });
        setNewSalary({
          employee_id: employee.id,
          net_total: 0,
          brut_total: 0,
          effective_from: new Date().toISOString().split('T')[0],
          note: ""
        });
        setIsAddingSalary(false);
        onRefresh?.();
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

  const handleContactAction = (type: 'phone' | 'email' | 'address') => {
    switch (type) {
      case 'phone':
        if (employee.telephone) {
          window.open(`tel:${employee.telephone}`, '_self');
        }
        break;
      case 'email':
        // Assuming email might be added later
        toast({
          title: "Email non disponible",
          description: "L'adresse email n'est pas configurée pour cet employé"
        });
        break;
      case 'address':
        if (employee.adresse) {
          window.open(`https://maps.google.com/?q=${encodeURIComponent(employee.adresse)}`, '_blank');
        }
        break;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <UserCheck className="h-5 w-5" />
          <span>Actions Rapides - {employee.prenom} {employee.nom}</span>
          <Badge variant={employee.actif ? "default" : "destructive"}>
            {employee.actif ? "Actif" : "Inactif"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Contact Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleContactAction('phone')}
            disabled={!employee.telephone}
            className="justify-start"
          >
            <Phone className="h-4 w-4 mr-2" />
            Appeler
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleContactAction('email')}
            className="justify-start"
          >
            <Mail className="h-4 w-4 mr-2" />
            Email
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleContactAction('address')}
            disabled={!employee.adresse}
            className="justify-start"
          >
            <MapPin className="h-4 w-4 mr-2" />
            Localiser
          </Button>
        </div>

        {/* HR Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <Dialog open={isAddingHoliday} onOpenChange={setIsAddingHoliday}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                Ajouter Congé
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouveau Congé</DialogTitle>
                <DialogDescription>
                  Ajouter une demande de congé pour {employee.prenom} {employee.nom}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="holiday-date" className="text-right">Date</Label>
                  <Input
                    id="holiday-date"
                    type="date"
                    value={newHoliday.date}
                    onChange={(e) => setNewHoliday({...newHoliday, date: e.target.value})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="holiday-motif" className="text-right">Motif</Label>
                  <Textarea
                    id="holiday-motif"
                    value={newHoliday.motif}
                    onChange={(e) => setNewHoliday({...newHoliday, motif: e.target.value})}
                    className="col-span-3"
                    placeholder="Raison du congé..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" onClick={handleAddHoliday} disabled={submitting}>
                  Créer la Demande
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddingSalary} onOpenChange={setIsAddingSalary}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="justify-start">
                <DollarSign className="h-4 w-4 mr-2" />
                Gérer Salaire
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouveau Salaire</DialogTitle>
                <DialogDescription>
                  Définir le salaire pour {employee.prenom} {employee.nom}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="salary-net" className="text-right">Salaire Net</Label>
                  <Input
                    id="salary-net"
                    type="number"
                    value={newSalary.net_total}
                    onChange={(e) => setNewSalary({...newSalary, net_total: parseFloat(e.target.value) || 0})}
                    className="col-span-3"
                    placeholder="0.00"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="salary-brut" className="text-right">Salaire Brut</Label>
                  <Input
                    id="salary-brut"
                    type="number"
                    value={newSalary.brut_total}
                    onChange={(e) => setNewSalary({...newSalary, brut_total: parseFloat(e.target.value) || 0})}
                    className="col-span-3"
                    placeholder="0.00"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="salary-date" className="text-right">Effectif à partir du</Label>
                  <Input
                    id="salary-date"
                    type="date"
                    value={newSalary.effective_from}
                    onChange={(e) => setNewSalary({...newSalary, effective_from: e.target.value})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="salary-note" className="text-right">Note</Label>
                  <Textarea
                    id="salary-note"
                    value={newSalary.note}
                    onChange={(e) => setNewSalary({...newSalary, note: e.target.value})}
                    className="col-span-3"
                    placeholder="Notes additionnelles..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" onClick={handleAddSalary} disabled={submitting}>
                  Définir le Salaire
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Employee Info Summary */}
        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
          <div className="text-sm font-medium">Informations Résumées</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Région: {employee.region || "Non spécifiée"}</div>
            <div>Statut Civil: {employee.statut_civil}</div>
            <div>Téléphone: {employee.telephone || "Non renseigné"}</div>
            <div>Embauché le: {new Date(employee.created_at).toLocaleDateString('fr-FR')}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmployeeQuickActions;