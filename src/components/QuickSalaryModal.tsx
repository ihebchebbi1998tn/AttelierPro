import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { salaryService, Employee, CreateSalaryData } from "@/utils/rhService";
import { DollarSign, Loader2 } from "lucide-react";

interface QuickSalaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
  onSuccess?: () => void;
}

const QuickSalaryModal: React.FC<QuickSalaryModalProps> = ({
  isOpen,
  onClose,
  employee,
  onSuccess
}) => {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [salaryData, setSalaryData] = useState<CreateSalaryData>({
    employee_id: employee.id,
    net_total: 0,
    brut_total: 0,
    taxes: 0,
    effective_from: new Date().toISOString().split('T')[0],
    note: ""
  });

  const handleSubmit = async () => {
    if (!salaryData.net_total || salaryData.net_total <= 0) {
      toast({
        title: "Erreur",
        description: "Le salaire net doit être supérieur à 0",
        variant: "destructive"
      });
      return;
    }

    try {
      setSubmitting(true);
      const result = await salaryService.create(salaryData);
      
      if (result.success) {
        toast({
          title: "Succès",
          description: `Salaire défini pour ${employee.prenom} ${employee.nom}`,
        });
        onSuccess?.();
        onClose();
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la définition du salaire",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const calculateTaxes = () => {
    if (salaryData.brut_total && salaryData.net_total) {
      const taxes = salaryData.brut_total - salaryData.net_total;
      setSalaryData(prev => ({ ...prev, taxes }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Définir le salaire
          </DialogTitle>
          <DialogDescription>
            Définir le salaire pour {employee.prenom} {employee.nom}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="net_total">Salaire Net (TND)</Label>
              <Input
                id="net_total"
                type="number"
                step="0.01"
                value={salaryData.net_total}
                onChange={(e) => setSalaryData(prev => ({ 
                  ...prev, 
                  net_total: parseFloat(e.target.value) || 0 
                }))}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="brut_total">Salaire Brut (TND)</Label>
              <Input
                id="brut_total"
                type="number"
                step="0.01"
                value={salaryData.brut_total}
                onChange={(e) => setSalaryData(prev => ({ 
                  ...prev, 
                  brut_total: parseFloat(e.target.value) || 0 
                }))}
                onBlur={calculateTaxes}
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="taxes">Charges/Impôts (TND)</Label>
            <Input
              id="taxes"
              type="number"
              step="0.01"
              value={salaryData.taxes}
              onChange={(e) => setSalaryData(prev => ({ 
                ...prev, 
                taxes: parseFloat(e.target.value) || 0 
              }))}
              placeholder="0.00"
            />
          </div>

          <div>
            <Label htmlFor="effective_from">Effectif à partir du</Label>
            <Input
              id="effective_from"
              type="date"
              value={salaryData.effective_from}
              onChange={(e) => setSalaryData(prev => ({ 
                ...prev, 
                effective_from: e.target.value 
              }))}
            />
          </div>

          <div>
            <Label htmlFor="note">Note (optionnel)</Label>
            <Textarea
              id="note"
              value={salaryData.note}
              onChange={(e) => setSalaryData(prev => ({ 
                ...prev, 
                note: e.target.value 
              }))}
              placeholder="Remarques ou conditions particulières..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={submitting || !salaryData.net_total}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              "Enregistrer"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QuickSalaryModal;