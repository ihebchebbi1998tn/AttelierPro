import React, { useState, useEffect } from "react";
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
import { salaryService, Employee, CreateSalaryData, Salary } from "@/utils/rhService";
import { DollarSign, Loader2, Info, TrendingUp, TrendingDown, Percent } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
  const [loading, setLoading] = useState(true);
  const [currentSalary, setCurrentSalary] = useState<Salary | null>(null);
  const [taxMode, setTaxMode] = useState<'percentage' | 'amount'>('percentage');
  const [taxPercentage, setTaxPercentage] = useState(0);
  const [salaryData, setSalaryData] = useState<CreateSalaryData>({
    employee_id: employee.id,
    net_total: 0,
    brut_total: 0,
    taxes: 0,
    effective_from: new Date().toISOString().split('T')[0],
    note: ""
  });

  useEffect(() => {
    if (isOpen) {
      loadCurrentSalary();
    }
  }, [isOpen, employee.id]);

  const loadCurrentSalary = async () => {
    try {
      setLoading(true);
      const salaries = await salaryService.getAll({ 
        employee_id: employee.id,
        current: true 
      });
      
      if (salaries && salaries.length > 0) {
        const latest = salaries[0];
        setCurrentSalary(latest);
        // Pre-fill form with current values
        setSalaryData({
          employee_id: employee.id,
          net_total: Number(latest.net_total) || 0,
          brut_total: Number(latest.brut_total) || 0,
          taxes: Number(latest.taxes) || 0,
          effective_from: new Date().toISOString().split('T')[0],
          note: ""
        });
      } else {
        setCurrentSalary(null);
      }
    } catch (error) {
      console.error('Error loading current salary:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const calculateBrutFromNetAndTaxes = (netTotal: number, taxes: number) => {
    const brutTotal = netTotal + taxes;
    setSalaryData(prev => ({ ...prev, brut_total: brutTotal, net_total: netTotal, taxes }));
  };

  const calculateTaxesFromPercentage = (percentage: number, netTotal: number) => {
    const taxes = (netTotal * percentage) / 100;
    const brutTotal = netTotal + taxes;
    setSalaryData(prev => ({ ...prev, taxes, brut_total: brutTotal }));
  };

  const handleTaxPercentageChange = (value: number) => {
    setTaxPercentage(value);
    if (salaryData.net_total) {
      calculateTaxesFromPercentage(value, salaryData.net_total);
    }
  };

  const handleNetTotalChange = (value: number) => {
    setSalaryData(prev => ({ ...prev, net_total: value }));
    if (taxMode === 'percentage' && taxPercentage > 0) {
      calculateTaxesFromPercentage(taxPercentage, value);
    } else if (salaryData.taxes > 0) {
      calculateBrutFromNetAndTaxes(value, salaryData.taxes);
    } else {
      setSalaryData(prev => ({ ...prev, net_total: value, brut_total: value }));
    }
  };

  const handleTaxAmountChange = (value: number) => {
    const brutTotal = salaryData.net_total + value;
    setSalaryData(prev => ({ ...prev, taxes: value, brut_total: brutTotal }));
  };

  const calculateDifference = () => {
    if (!currentSalary) return null;
    const currentNet = Number(currentSalary.net_total);
    const diff = salaryData.net_total - currentNet;
    const percentage = ((diff / currentNet) * 100).toFixed(1);
    return { diff, percentage };
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {currentSalary ? 'Modifier le salaire' : 'Définir le salaire'}
          </DialogTitle>
          <DialogDescription>
            {currentSalary ? 'Modifier le salaire de' : 'Définir le salaire pour'} {employee.prenom} {employee.nom}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Current Salary Info */}
            {currentSalary && (
              <Alert className="mb-4 border-primary/20 bg-primary/5">
                <Info className="h-4 w-4" />
                <AlertTitle>Salaire actuel</AlertTitle>
                <AlertDescription className="space-y-1 mt-2">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Salaire Net:</span>
                      <p className="font-semibold">{Number(currentSalary.net_total).toFixed(2)} TND</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Salaire Brut:</span>
                      <p className="font-semibold">{Number(currentSalary.brut_total || 0).toFixed(2)} TND</p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground pt-1">
                    Effectif depuis: {new Date(currentSalary.effective_from).toLocaleDateString('fr-FR')}
                  </div>
                </AlertDescription>
              </Alert>
            )}

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="net_total">Salaire Net (TND)</Label>
              <Input
                id="net_total"
                type="number"
                step="0.01"
                value={salaryData.net_total}
                onChange={(e) => handleNetTotalChange(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
              {currentSalary && salaryData.net_total !== Number(currentSalary.net_total) && (
                <div className={`text-xs mt-1 flex items-center gap-1 ${
                  salaryData.net_total > Number(currentSalary.net_total) ? 'text-green-600' : 'text-red-600'
                }`}>
                  {salaryData.net_total > Number(currentSalary.net_total) ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span>
                    {salaryData.net_total > Number(currentSalary.net_total) ? '+' : ''}
                    {(salaryData.net_total - Number(currentSalary.net_total)).toFixed(2)} TND
                    {calculateDifference() && ` (${calculateDifference()!.percentage}%)`}
                  </span>
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="brut_total">Salaire Brut (TND)</Label>
              <Input
                id="brut_total"
                type="number"
                step="0.01"
                value={salaryData.brut_total.toFixed(2)}
                readOnly
                placeholder="0.00"
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground mt-1">Calculé automatiquement (Net + Charges)</p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="taxes">Charges/Impôts</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setTaxMode(prev => prev === 'percentage' ? 'amount' : 'percentage')}
                className="h-7 text-xs gap-1"
              >
                <Percent className="h-3 w-3" />
                {taxMode === 'percentage' ? 'Passer en TND' : 'Passer en %'}
              </Button>
            </div>
            {taxMode === 'percentage' ? (
              <div className="space-y-2">
                <Input
                  id="tax_percentage"
                  type="number"
                  step="0.1"
                  value={taxPercentage}
                  onChange={(e) => handleTaxPercentageChange(parseFloat(e.target.value) || 0)}
                  placeholder="0.0"
                  className="w-full"
                />
                <div className="text-sm text-muted-foreground">
                  = {salaryData.taxes.toFixed(2)} TND
                </div>
              </div>
            ) : (
              <Input
                id="taxes"
                type="number"
                step="0.01"
                value={salaryData.taxes}
                onChange={(e) => handleTaxAmountChange(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            )}
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
              placeholder={currentSalary ? "Raison du changement de salaire..." : "Remarques ou conditions particulières..."}
              rows={3}
            />
          </div>
        </div>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading || submitting}>
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || submitting || !salaryData.net_total}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              currentSalary ? "Mettre à jour" : "Enregistrer"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QuickSalaryModal;