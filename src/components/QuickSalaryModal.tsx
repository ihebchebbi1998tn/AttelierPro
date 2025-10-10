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
import { calculateGrossFromNet, SalaryConfigParams } from "@/utils/tunisianSalaryCalculator";
import { salaryConfigService } from "@/utils/salaryConfigService";
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
  const [netSalaryInput, setNetSalaryInput] = useState(0); // User enters net
  const [salaryConfig, setSalaryConfig] = useState<SalaryConfigParams | undefined>(undefined);
  const [salaryData, setSalaryData] = useState<CreateSalaryData>({
    employee_id: employee.id,
    salaire_brut: 0, // Calculated from net
    chef_de_famille: employee.chef_de_famille || false,
    nombre_enfants: employee.nombre_enfants || 0,
    effective_from: new Date().toISOString().split('T')[0],
    note: ""
  });

  // Load salary configuration
  useEffect(() => {
    loadSalaryConfig();
  }, []);

  const loadSalaryConfig = async () => {
    try {
      const config = await salaryConfigService.getCalculatorConfig();
      setSalaryConfig(config);
    } catch (error) {
      console.error('Error loading salary config, using defaults:', error);
    }
  };

  // Calculate gross from net whenever input changes
  useEffect(() => {
    if (netSalaryInput > 0 && salaryConfig) {
      const calculated = calculateGrossFromNet(
        netSalaryInput,
        salaryData.chef_de_famille,
        salaryData.nombre_enfants,
        salaryConfig
      );
      setSalaryData(prev => ({ ...prev, salaire_brut: calculated.salaire_brut }));
    }
  }, [netSalaryInput, salaryData.chef_de_famille, salaryData.nombre_enfants, salaryConfig]);

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
        // Pre-fill form with current net salary
        const currentNet = Number(latest.salaire_net || latest.net_total || 0);
        setNetSalaryInput(currentNet);
        setSalaryData({
          employee_id: employee.id,
          salaire_brut: Number(latest.salaire_brut) || 0,
          chef_de_famille: employee.chef_de_famille || false,
          nombre_enfants: employee.nombre_enfants || 0,
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
    if (!netSalaryInput || netSalaryInput <= 0) {
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto" onOpenAutoFocus={(e) => e.preventDefault()}>
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
                      <p className="font-semibold">{Number(currentSalary.salaire_net).toFixed(2)} TND</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Salaire Brut:</span>
                      <p className="font-semibold">{Number(currentSalary.salaire_brut).toFixed(2)} TND</p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground pt-1">
                    Effectif depuis: {new Date(currentSalary.effective_from).toLocaleDateString('fr-FR')}
                  </div>
                </AlertDescription>
              </Alert>
            )}

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="salaire_net">Salaire Net (TND)</Label>
            <Input
              id="salaire_net"
              type="number"
              step="0.001"
              value={netSalaryInput}
              onChange={(e) => setNetSalaryInput(parseFloat(e.target.value) || 0)}
              placeholder="0.000"
            />
            {currentSalary && netSalaryInput !== Number(currentSalary.salaire_net || currentSalary.net_total || 0) && (
              <div className={`text-xs mt-1 flex items-center gap-1 ${
                netSalaryInput > Number(currentSalary.salaire_net || currentSalary.net_total || 0) ? 'text-green-600' : 'text-red-600'
              }`}>
                {netSalaryInput > Number(currentSalary.salaire_net || currentSalary.net_total || 0) ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>
                  {netSalaryInput > Number(currentSalary.salaire_net || currentSalary.net_total || 0) ? '+' : ''}
                  {(netSalaryInput - Number(currentSalary.salaire_net || currentSalary.net_total || 0)).toFixed(3)} TND
                </span>
              </div>
            )}
            <div className="text-xs text-muted-foreground mt-1">
              Salaire brut calculé: <span className="font-semibold">{salaryData.salaire_brut.toFixed(3)} TND</span>
            </div>
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
            disabled={loading || submitting || !netSalaryInput}
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