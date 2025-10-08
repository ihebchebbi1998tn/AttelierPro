import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { salaryService, Employee, CreateSalaryData, Salary } from "@/utils/rhService";
import { calculateTunisianSalary, calculateGrossFromNet, formatTND } from "@/utils/tunisianSalaryCalculator";
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
  const [netSalaryInput, setNetSalaryInput] = useState(0); // User enters this
  const [salaryData, setSalaryData] = useState<CreateSalaryData>({
    employee_id: employee?.id || 0,
    salaire_brut: 0, // Calculated from net
    chef_de_famille: employee?.chef_de_famille || false,
    nombre_enfants: employee?.nombre_enfants || 0,
    effective_from: new Date().toISOString().split('T')[0],
    note: ""
  });

  // Calculate gross from net salary whenever net input changes
  const calculatedSalary = calculateGrossFromNet(
    netSalaryInput,
    salaryData.chef_de_famille,
    salaryData.nombre_enfants
  );

  // Update gross salary in salaryData when calculated
  useEffect(() => {
    if (netSalaryInput > 0) {
      setSalaryData(prev => ({ ...prev, salaire_brut: calculatedSalary.salaire_brut }));
    }
  }, [calculatedSalary.salaire_brut, netSalaryInput]);

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

                {/* Input: Net Salary */}
                <div className="space-y-2">
                  <Label htmlFor="salaire_net" className="text-sm font-medium flex items-center gap-2">
                    Salaire Net (TND)
                    <Calculator className="h-3.5 w-3.5 text-muted-foreground" />
                  </Label>
                  <Input
                    id="salaire_net"
                    type="number"
                    step="0.001"
                    value={netSalaryInput}
                    onChange={(e) => setNetSalaryInput(parseFloat(e.target.value) || 0)}
                    placeholder="0.000"
                    className="text-xl font-semibold mt-2"
                  />
                  {currentSalary && netSalaryInput !== Number(currentSalary.salaire_net || currentSalary.net_total || 0) && (
                    <div className={`text-sm mt-2 flex items-center gap-1 ${
                      netSalaryInput > Number(currentSalary.salaire_net || currentSalary.net_total || 0) ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {netSalaryInput > Number(currentSalary.salaire_net || currentSalary.net_total || 0) ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      <span>
                        {netSalaryInput > Number(currentSalary.salaire_net || currentSalary.net_total || 0) ? '+' : ''}
                        {(netSalaryInput - Number(currentSalary.salaire_net || currentSalary.net_total || 0)).toFixed(3)} TND
                        {calculateDifference() && ` (${calculateDifference()!.percentage}%)`}
                      </span>
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground mt-2">
                    Salaire brut calculé: <span className="font-semibold">{calculatedSalary.salaire_brut.toFixed(3)} TND</span>
                  </div>
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

            {/* Calculation Methodology Card */}
            <Card className="border-blue-200 bg-blue-50/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-600" />
                  Méthodologie de Calcul
                </CardTitle>
                <CardDescription className="text-xs">
                  Détail des formules appliquées selon la loi tunisienne 2025
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                {/* CNSS */}
                <div className="space-y-1.5 pb-3 border-b">
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-blue-700 min-w-[60px]">1. CNSS:</span>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Cotisation sociale obligatoire</p>
                      <p className="font-mono bg-white px-2 py-1 rounded border">CNSS = Salaire Brut × 9.68%</p>
                      <p className="text-xs text-muted-foreground italic">
                        Exemple: {calculatedSalary.salaire_brut.toFixed(3)} × 0.0968 = {calculatedSalary.cnss.toFixed(3)} TND
                      </p>
                    </div>
                  </div>
                </div>

                {/* Abattement Fiscal */}
                <div className="space-y-1.5 pb-3 border-b">
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-blue-700 min-w-[60px]">2. Abattement:</span>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Déductions fiscales</p>
                      <div className="space-y-1 font-mono bg-white px-2 py-1 rounded border">
                        <p>• Chef de famille: 150 TND/mois</p>
                        <p>• Par enfant: 100 TND/mois</p>
                      </div>
                      <p className="text-xs text-muted-foreground italic">
                        Total abattement: {calculatedSalary.breakdown.deduction_chef_famille.toFixed(3)} + {calculatedSalary.breakdown.deduction_enfants.toFixed(3)} = {calculatedSalary.deductions_fiscales.toFixed(3)} TND
                      </p>
                    </div>
                  </div>
                </div>

                {/* IRPP */}
                <div className="space-y-1.5 pb-3 border-b">
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-blue-700 min-w-[60px]">3. IRPP:</span>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Impôt <strong>progressif</strong> sur le revenu (par tranches)</p>
                      <div className="font-mono bg-white px-2 py-1.5 rounded border space-y-0.5 text-[10px]">
                        <p>Base = Salaire Imposable - Abattement</p>
                        <p className="text-muted-foreground">= {calculatedSalary.salaire_brut_imposable.toFixed(3)} - {calculatedSalary.deductions_fiscales.toFixed(3)}</p>
                        <p className="font-semibold">= {calculatedSalary.base_imposable.toFixed(3)} TND</p>
                        <div className="mt-2 pt-2 border-t space-y-0.5">
                          <p className="font-semibold text-blue-700">Tranches progressives 2025 (mensuel):</p>
                          <div className="bg-yellow-50 border border-yellow-200 p-1.5 rounded mt-1 mb-1">
                            <p className="text-orange-700 font-semibold">⚠️ Taxation PROGRESSIVE:</p>
                            <p className="text-[9px] text-orange-600">Chaque tranche taxe uniquement la portion du revenu dans cette tranche</p>
                          </div>
                          <p>• <strong>1ère tranche (0-5,000 DT/an):</strong> 0-416.67 TND → 0%</p>
                          <p className="text-[9px] text-muted-foreground ml-2">Les premiers 416.67 TND sont EXONÉRÉS</p>
                          <p>• <strong>2ème tranche (5,000-10,000 DT/an):</strong> 416.67-833.33 TND → 15%</p>
                          <p className="text-[9px] text-muted-foreground ml-2">Seulement la partie entre 416.67 et 833.33</p>
                          <p>• <strong>3ème tranche (10,000-20,000 DT/an):</strong> 833.33-1,666.67 TND → 25%</p>
                          <p>• <strong>4ème tranche (20,000-30,000 DT/an):</strong> 1,666.67-2,500 TND → 30%</p>
                          <p>• <strong>5ème tranche (30,000-40,000 DT/an):</strong> 2,500-3,333.33 TND → 33%</p>
                          <p>• <strong>6ème tranche (40,000-50,000 DT/an):</strong> 3,333.33-4,166.67 TND → 36%</p>
                          <p>• <strong>7ème tranche (50,000-70,000 DT/an):</strong> 4,166.67-5,833.33 TND → 38%</p>
                          <p>• <strong>8ème tranche (&gt;70,000 DT/an):</strong> &gt; 5,833.33 TND → 40%</p>
                          <div className="bg-blue-50 border border-blue-200 p-1.5 rounded mt-1.5">
                            <p className="font-semibold text-blue-800 text-[9px]">Exemple avec 1,000 TND:</p>
                            <p className="text-[9px] text-blue-700">• 0-416.67 TND: 416.67 × 0% = 0.000</p>
                            <p className="text-[9px] text-blue-700">• 416.67-833.33: 416.66 × 15% = 62.500</p>
                            <p className="text-[9px] text-blue-700">• 833.33-1,000: 166.67 × 25% = 41.667</p>
                            <p className="text-[9px] text-blue-800 font-semibold">Total IRPP = 104.167 TND</p>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground italic">
                        IRPP calculé: {calculatedSalary.irpp.toFixed(3)} TND
                      </p>
                    </div>
                  </div>
                </div>

                {/* CSS */}
                <div className="space-y-1.5">
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-blue-700 min-w-[60px]">4. CSS:</span>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Contribution Sociale de Solidarité</p>
                      <p className="font-mono bg-white px-2 py-1 rounded border">CSS = Salaire Imposable × 1%</p>
                      <p className="text-xs text-muted-foreground italic">
                        Exemple: {calculatedSalary.salaire_brut_imposable.toFixed(3)} × 0.01 = {calculatedSalary.css.toFixed(3)} TND
                      </p>
                    </div>
                  </div>
                </div>

                {/* Final Formula */}
                <div className="mt-4 pt-4 border-t bg-gradient-to-r from-blue-50 to-blue-100 p-3 rounded-lg">
                  <p className="font-semibold text-blue-900 mb-2 text-sm">Formule finale:</p>
                  <p className="font-mono text-xs bg-white px-3 py-2 rounded border-2 border-blue-200">
                    Net = Brut - CNSS - IRPP - CSS
                  </p>
                  <p className="font-mono text-xs mt-2 text-muted-foreground">
                    = {calculatedSalary.salaire_brut.toFixed(3)} - {calculatedSalary.cnss.toFixed(3)} - {calculatedSalary.irpp.toFixed(3)} - {calculatedSalary.css.toFixed(3)}
                  </p>
                  <p className="font-mono text-sm mt-1 font-bold text-blue-900">
                    = {calculatedSalary.salaire_net.toFixed(3)} TND
                  </p>
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
