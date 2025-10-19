import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Calendar, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { pointageService, PointageRecord } from "@/utils/pointageService";
import { Employee } from "@/utils/rhService";

interface AbsenceDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee;
  month?: string; // Format: YYYY-MM
}

export const AbsenceDetailsModal = ({ open, onOpenChange, employee, month }: AbsenceDetailsModalProps) => {
  const { toast } = useToast();
  const [absences, setAbsences] = useState<PointageRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [unpaidCount, setUnpaidCount] = useState<number>(0);

  // Load absences
  useEffect(() => {
    const loadAbsences = async () => {
      if (!open) return;
      
      setLoading(true);
      try {
        const records = await pointageService.getPointage({
          employee_id: employee.id,
          month: month
        });

        // Filter for absences (where absent > 0 or leave_type is set)
        const absenceRecords = records.filter(r => 
          (r.absent && r.absent > 0) || r.leave_type
        );

        setAbsences(absenceRecords);
        
        // Count current unpaid absences
        const unpaidDays = absenceRecords.filter(r => !r.is_paid_leave).length;
        setUnpaidCount(unpaidDays);
      } catch (error) {
        console.error('Error loading absences:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les absences",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadAbsences();
  }, [open, employee.id, month]);

  const handleTogglePaidStatus = async (record: PointageRecord) => {
    setUpdating(true);
    try {
      const newPaidStatus = !record.is_paid_leave;
      
      await pointageService.markLeave({
        employee_id: employee.id,
        date: record.date || '',
        leave_type: record.leave_type || 'other',
        leave_duration: record.leave_duration || 'FULL',
        leave_hours: record.leave_hours,
        motif: record.motif,
        is_paid_leave: newPaidStatus
      });

      // Update local state
      setAbsences(prev => prev.map(a => 
        a.id === record.id ? { ...a, is_paid_leave: newPaidStatus } : a
      ));

      toast({
        title: "Succès",
        description: `Absence ${newPaidStatus ? 'payée' : 'non payée'} mise à jour`
      });
    } catch (error) {
      console.error('Error updating paid status:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleBulkUpdate = async () => {
    if (unpaidCount < 0 || unpaidCount > absences.length) {
      toast({
        title: "Erreur",
        description: "Le nombre de jours non payés est invalide",
        variant: "destructive"
      });
      return;
    }

    setUpdating(true);
    try {
      // Mark first N absences as unpaid, rest as paid
      const promises = absences.map(async (absence, index) => {
        const shouldBeUnpaid = index < unpaidCount;
        if (shouldBeUnpaid !== !absence.is_paid_leave) {
          await pointageService.markLeave({
            employee_id: employee.id,
            date: absence.date || '',
            leave_type: absence.leave_type || 'other',
            leave_duration: absence.leave_duration || 'FULL',
            leave_hours: absence.leave_hours,
            motif: absence.motif,
            is_paid_leave: !shouldBeUnpaid
          });
        }
      });

      await Promise.all(promises);

      // Reload absences
      const records = await pointageService.getPointage({
        employee_id: employee.id,
        month: month
      });
      const absenceRecords = records.filter(r => 
        (r.absent && r.absent > 0) || r.leave_type
      );
      setAbsences(absenceRecords);

      toast({
        title: "Succès",
        description: `${unpaidCount} jour(s) marqué(s) comme non payé(s)`
      });
    } catch (error) {
      console.error('Error bulk updating:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les absences",
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  const totalAbsences = absences.length;
  const unpaidAbsences = absences.filter(a => !a.is_paid_leave).length;
  const paidAbsences = totalAbsences - unpaidAbsences;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Détails des absences - {employee.prenom} {employee.nom}
          </DialogTitle>
          {month && (
            <p className="text-sm text-muted-foreground">
              Mois: {format(new Date(month + '-01'), 'MMMM yyyy', { locale: fr })}
            </p>
          )}
        </DialogHeader>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-muted rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Total absences</p>
            <p className="text-2xl font-bold">{totalAbsences}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-xs text-green-700">Payées</p>
            <p className="text-2xl font-bold text-green-700">{paidAbsences}</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-xs text-red-700">Non payées</p>
            <p className="text-2xl font-bold text-red-700">{unpaidAbsences}</p>
          </div>
        </div>

        {/* Bulk update control */}
        <div className="flex items-end gap-3 p-4 bg-muted/50 rounded-lg">
          <div className="flex-1">
            <Label htmlFor="unpaid-count">Nombre de jours non payés</Label>
            <Input
              id="unpaid-count"
              type="number"
              min="0"
              max={totalAbsences}
              value={unpaidCount}
              onChange={(e) => setUnpaidCount(parseInt(e.target.value) || 0)}
              placeholder="Ex: 3"
            />
          </div>
          <Button 
            onClick={handleBulkUpdate}
            disabled={updating || loading}
          >
            Appliquer
          </Button>
        </div>

        {/* Absences list */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Chargement...
            </div>
          ) : absences.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucune absence trouvée
            </div>
          ) : (
            absences.map((absence) => (
              <div
                key={absence.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">
                      {absence.date ? format(new Date(absence.date), 'dd MMMM yyyy', { locale: fr }) : 'Date inconnue'}
                    </p>
                    {absence.leave_type && (
                      <Badge variant="outline" className="text-xs">
                        {absence.leave_type === 'annual' ? 'Congé annuel' :
                         absence.leave_type === 'sick' ? 'Maladie' :
                         absence.leave_type === 'unpaid' ? 'Non payé' :
                         absence.leave_type}
                      </Badge>
                    )}
                    {absence.leave_duration && absence.leave_duration !== 'FULL' && (
                      <Badge variant="secondary" className="text-xs">
                        {absence.leave_duration === 'AM' ? 'Matin' :
                         absence.leave_duration === 'PM' ? 'Après-midi' :
                         `${absence.leave_hours}h`}
                      </Badge>
                    )}
                  </div>
                  {absence.motif && (
                    <p className="text-xs text-muted-foreground mt-1">{absence.motif}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {absence.is_paid_leave ? (
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-200">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Payé
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-700 hover:bg-red-200">
                      <XCircle className="h-3 w-3 mr-1" />
                      Non payé
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleTogglePaidStatus(absence)}
                    disabled={updating}
                  >
                    {absence.is_paid_leave ? 'Marquer non payé' : 'Marquer payé'}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
