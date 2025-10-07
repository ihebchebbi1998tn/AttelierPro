import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { salaryService, Employee, CreateSalaryData, Salary } from "@/utils/rhService";
import { calculateTunisianSalary, formatTND } from "@/utils/tunisianSalaryCalculator";
import { ArrowLeft, DollarSign, Loader2, Info, TrendingUp, TrendingDown, Calculator, Save, Settings, CheckCircle2, FileText } from "lucide-react";
import { PaySlipModal } from "@/components/PaySlipModal";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const DefinirSalaire: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const employee = location.state?.employee as Employee | undefined;

  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentSalary, setCurrentSalary] = useState<Salary | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [savedSalaryInfo, setSavedSalaryInfo] = useState<{ net: number; brut: number } | null>(null);
  const [showPaySlip, setShowPaySlip] = useState(false);
  const [salaryData, setSalaryData] = useState<CreateSalaryData>({
    employee_id: employee?.id || 0,
    salaire_brut: 0,
    chef_de_famille: employee?.chef_de_famille || false,
    nombre_enfants: employee?.nombre_enfants || 0,
    effective_from: new Date().toISOString().split('T')[0],
    note: ""
  });

  // Calculate salary breakdown whenever inputs change
  const calculatedSalary = calculateTunisianSalary({
    salaire_brut: salaryData.salaire_brut,
    chef_de_famille: salaryData.chef_de_famille,
    nombre_enfants: salaryData.nombre_enfants
  });

  useEffect(() => {
    if (!employee) {
      toast({
        title: "Erreur",
        description: "Aucun employé sélectionné",
        variant: "destructive"
      });
      navigate('/rh/employes');
      return;
    }
    loadCurrentSalary();
  }, [employee]);

  const loadCurrentSalary = async () => {
    if (!employee) return;
    
    try {
      setLoading(true);
      const salaries = await salaryService.getAll({ 
        employee_id: employee.id,
        current: true 
      });
      
      if (salaries && salaries.length > 0) {
        const latest = salaries[0];
        setCurrentSalary(latest);
        // Pre-fill form with current gross salary
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
    if (!employee) {
      toast({
        title: "Erreur",
        description: "Aucun employé sélectionné",
        variant: "destructive"
      });
      return;
    }

    if (!salaryData.salaire_brut || salaryData.salaire_brut <= 0) {
      toast({
        title: "Erreur",
        description: "Le salaire brut doit être supérieur à 0",
        variant: "destructive"
      });
      return;
    }

    try {
      setSubmitting(true);
      
      console.log("Submitting salary data:", salaryData);
      
      const result = await salaryService.create(salaryData);
      
      console.log("Salary service result:", result);
      
      if (result.success) {
        setSavedSalaryInfo({
          net: calculatedSalary.salaire_net,
          brut: calculatedSalary.salaire_brut
        });
        setShowSuccessDialog(true);
      } else {
        toast({
          title: "Erreur",
          description: result.message || "Erreur lors de la définition du salaire",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error saving salary:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la définition du salaire. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const calculateDifference = () => {
    if (!currentSalary) return null;
    const currentNet = Number(currentSalary.salaire_net || currentSalary.net_total || 0);
    const diff = calculatedSalary.salaire_net - currentNet;
    const percentage = currentNet > 0 ? ((diff / currentNet) * 100).toFixed(1) : '0';
    return { diff, percentage };
  };

  if (!employee) return null;

  return (
    <div className="container mx-auto py-8 max-w-6xl space-y-6">
      {/* Header with Back and Configuration */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => navigate('/rh/employes')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux employés
        </Button>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => setShowPaySlip(true)}
            disabled={!salaryData.salaire_brut || salaryData.salaire_brut <= 0}
          >
            <FileText className="h-4 w-4" />
            Fiche de paie
          </Button>
          <Link to="/rh/salaires/configuration">
            <Button variant="outline" className="gap-2">
              <Settings className="h-4 w-4" />
              Configuration des taux
            </Button>
          </Link>
        </div>
      </div>

      {/* Page Title */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <DollarSign className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {currentSalary ? 'Modifier le salaire' : 'Définir le salaire'}
            </h1>
            <p className="text-base text-muted-foreground">
              {employee.prenom} {employee.nom}
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Left Column - Input Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Informations salariales</CardTitle>
                <CardDescription className="text-sm">Définir le salaire brut et la date d'effet</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Current Salary Info */}
                {currentSalary && (
                  <Alert className="border-primary/20 bg-primary/5">
                    <Info className="h-4 w-4" />
                    <AlertTitle className="text-sm font-semibold">Salaire actuel</AlertTitle>
                    <AlertDescription className="space-y-2 mt-2">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-xs text-muted-foreground">Salaire Net:</span>
                          <p className="text-sm font-semibold">{formatTND(Number(currentSalary.salaire_net || currentSalary.net_total || 0))}</p>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">Salaire Brut:</span>
                          <p className="text-sm font-semibold">{formatTND(Number(currentSalary.salaire_brut || currentSalary.brut_total || 0))}</p>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground pt-1 border-t mt-2">
                        Effectif depuis: {new Date(currentSalary.effective_from).toLocaleDateString('fr-FR')}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Input: Gross Salary */}
                <div className="space-y-2">
                  <Label htmlFor="salaire_brut" className="text-sm font-medium flex items-center gap-2">
                    Salaire Brut (TND)
                    <Calculator className="h-3.5 w-3.5 text-muted-foreground" />
                  </Label>
                  <Input
                    id="salaire_brut"
                    type="number"
                    step="0.001"
                    value={salaryData.salaire_brut}
                    onChange={(e) => setSalaryData(prev => ({ ...prev, salaire_brut: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.000"
                    className="text-xl font-semibold mt-2"
                  />
                  {currentSalary && calculatedSalary.salaire_net !== Number(currentSalary.salaire_net || currentSalary.net_total || 0) && (
                    <div className={`text-sm mt-2 flex items-center gap-1 ${
                      calculatedSalary.salaire_net > Number(currentSalary.salaire_net || currentSalary.net_total || 0) ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {calculatedSalary.salaire_net > Number(currentSalary.salaire_net || currentSalary.net_total || 0) ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      <span>
                        Net: {calculatedSalary.salaire_net > Number(currentSalary.salaire_net || currentSalary.net_total || 0) ? '+' : ''}
                        {(calculatedSalary.salaire_net - Number(currentSalary.salaire_net || currentSalary.net_total || 0)).toFixed(3)} TND
                        {calculateDifference() && ` (${calculateDifference()!.percentage}%)`}
                      </span>
                    </div>
                  )}
                </div>

                {/* Employee Deduction Info (Read-only) */}
                <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                  <h4 className="text-sm font-semibold mb-3">Informations de l'employé</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between py-1.5 px-2 bg-background rounded">
                      <span className="text-xs text-muted-foreground">Chef de famille:</span>
                      <Badge variant={employee.chef_de_famille ? "default" : "secondary"} className="text-xs">
                        {employee.chef_de_famille ? 'Oui (-150 TND)' : 'Non'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between py-1.5 px-2 bg-background rounded">
                      <span className="text-xs text-muted-foreground">Enfants à charge:</span>
                      <Badge variant={employee.nombre_enfants > 0 ? "default" : "secondary"} className="text-xs">
                        {employee.nombre_enfants || 0} (-{(employee.nombre_enfants || 0) * 100} TND)
                      </Badge>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Effective Date */}
                <div className="space-y-2">
                  <Label htmlFor="effective_from" className="text-sm font-medium">Effectif à partir du</Label>
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

                {/* Note */}
                <div className="space-y-2">
                  <Label htmlFor="note" className="text-sm font-medium">Note (optionnel)</Label>
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
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Calculation Breakdown */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Détail du calcul (2025)
                </CardTitle>
                <CardDescription className="text-sm">
                  Calcul automatique selon la loi tunisienne
                  <Link to="/rh/salaires/configuration" className="text-primary hover:underline ml-2 text-xs">
                    Modifier les taux
                  </Link>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-0.5">
                  {/* Gross Salary */}
                  <div className="flex justify-between items-center py-2.5 border-b">
                    <span className="text-sm text-muted-foreground">Salaire Brut:</span>
                    <span className="text-sm font-semibold">{formatTND(calculatedSalary.salaire_brut)}</span>
                  </div>
                  
                  {/* CNSS Deduction */}
                  <div className="flex justify-between items-center py-2.5 text-red-600 border-b">
                    <span className="text-sm">- CNSS (9.68%):</span>
                    <span className="text-sm font-semibold">{formatTND(calculatedSalary.cnss)}</span>
                  </div>
                  
                  {/* Taxable Gross Salary */}
                  <div className="flex justify-between items-center py-2.5 bg-muted/30 px-3 rounded border-b">
                    <span className="text-sm font-medium">Salaire Brut Imposable:</span>
                    <span className="text-sm font-semibold">{formatTND(calculatedSalary.salaire_brut_imposable)}</span>
                  </div>
                  
                  {/* Fiscal Deductions */}
                  <div className="flex justify-between items-center py-2 text-muted-foreground border-b">
                    <span className="text-xs">- Abattement fiscal:</span>
                    <span className="text-xs font-medium">{formatTND(calculatedSalary.deductions_fiscales)}</span>
                  </div>
                  
                  {/* Taxable Base */}
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-xs text-muted-foreground">Base Imposable:</span>
                    <span className="text-xs font-medium">{formatTND(calculatedSalary.base_imposable)}</span>
                  </div>
                  
                  {/* IRPP Tax */}
                  <div className="flex justify-between items-center py-2.5 text-red-600 border-b">
                    <span className="text-sm">- IRPP (impôt):</span>
                    <span className="text-sm font-semibold">{formatTND(calculatedSalary.irpp)}</span>
                  </div>
                  
                  {/* CSS Contribution */}
                  <div className="flex justify-between items-center py-2.5 text-red-600 border-b">
                    <span className="text-sm">- CSS (1%):</span>
                    <span className="text-sm font-semibold">{formatTND(calculatedSalary.css)}</span>
                  </div>
                  
                  {/* Net Salary - Highlighted */}
                  <div className="flex justify-between items-center py-4 mt-2 text-base font-bold text-primary bg-primary/5 px-4 rounded-lg border-2 border-primary/20">
                    <span>Salaire Net:</span>
                    <span className="text-lg">{formatTND(calculatedSalary.salaire_net)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Card className="border-none shadow-none">
              <CardContent className="pt-6 px-0">
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => navigate('/rh/employes')}
                    disabled={submitting}
                    className="flex-1"
                    size="lg"
                  >
                    Annuler
                  </Button>
                  <Button 
                    onClick={handleSubmit} 
                    disabled={submitting || !salaryData.salaire_brut || salaryData.salaire_brut <= 0}
                    className="flex-1"
                    size="lg"
                  >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {currentSalary ? "Mettre à jour" : "Enregistrer"}
                  </>
                )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Success Dialog */}
      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <AlertDialogTitle className="text-center text-xl">
              Salaire enregistré avec succès !
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center space-y-3 pt-2">
              <p className="text-base">
                Le salaire de <span className="font-semibold">{employee?.prenom} {employee?.nom}</span> a été défini.
              </p>
              {savedSalaryInfo && (
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Salaire Brut:</span>
                    <span className="font-semibold">{formatTND(savedSalaryInfo.brut)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Salaire Net:</span>
                    <span className="font-semibold text-primary">{formatTND(savedSalaryInfo.net)}</span>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction 
              onClick={() => {
                setShowSuccessDialog(false);
                navigate('/rh/employes');
              }}
              className="w-full"
            >
              Retour à la liste des employés
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Pay Slip Modal */}
      {employee && (
        <PaySlipModal
          open={showPaySlip}
          onOpenChange={setShowPaySlip}
          employee={employee}
          calculatedSalary={calculatedSalary}
          workDays={26}
        />
      )}
    </div>
  );
};

export default DefinirSalaire;
