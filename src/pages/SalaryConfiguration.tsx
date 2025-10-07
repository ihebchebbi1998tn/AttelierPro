import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { salaryConfigService, SalaryConfig, TaxBracket } from "@/utils/salaryConfigService";
import { Settings, Percent, DollarSign, Save, RefreshCw, Trash2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const SalaryConfiguration = () => {
  const [config, setConfig] = useState<SalaryConfig[]>([]);
  const [taxBrackets, setTaxBrackets] = useState<TaxBracket[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const data = await salaryConfigService.getFullConfig();
      setConfig(data.config);
      setTaxBrackets(data.tax_brackets);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger la configuration",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateConfig = async (key: string, value: number) => {
    try {
      setSaving(true);
      const configItem = config.find(c => c.config_key === key);
      const result = await salaryConfigService.updateConfig(key, value, configItem?.description);
      
      if (result.success) {
        toast({
          title: "Succès",
          description: "Configuration mise à jour"
        });
        loadConfig();
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la mise à jour",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateBracket = async (bracket: TaxBracket) => {
    try {
      setSaving(true);
      const result = await salaryConfigService.updateBracket(bracket.id, {
        min_amount: bracket.min_amount,
        max_amount: bracket.max_amount,
        tax_rate: bracket.tax_rate,
        description: bracket.description
      });
      
      if (result.success) {
        toast({
          title: "Succès",
          description: "Tranche fiscale mise à jour"
        });
        loadConfig();
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la mise à jour",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const getConfigValue = (key: string): number => {
    return config.find(c => c.config_key === key)?.config_value || 0;
  };

  const updateLocalConfig = (key: string, value: number) => {
    setConfig(prev => prev.map(c => 
      c.config_key === key ? { ...c, config_value: value } : c
    ));
  };

  const updateLocalBracket = (id: number, field: keyof TaxBracket, value: any) => {
    setTaxBrackets(prev => prev.map(b =>
      b.id === id ? { ...b, [field]: value } : b
    ));
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Configuration Salaires
          </h1>
          <p className="text-muted-foreground mt-2">
            Gérer les paramètres de calcul des salaires (2025)
          </p>
        </div>
        <Button onClick={loadConfig} variant="outline" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* General Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5" />
            Paramètres Généraux
          </CardTitle>
          <CardDescription>
            Taux de cotisations et déductions fiscales
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CNSS Rate */}
            <div className="space-y-2">
              <Label htmlFor="cnss_rate">Taux CNSS (%)</Label>
              <div className="flex gap-2">
                <Input
                  id="cnss_rate"
                  type="number"
                  step="0.0001"
                  value={getConfigValue('cnss_rate') * 100}
                  onChange={(e) => updateLocalConfig('cnss_rate', parseFloat(e.target.value) / 100 || 0)}
                  className="flex-1"
                />
                <Button 
                  onClick={() => handleUpdateConfig('cnss_rate', getConfigValue('cnss_rate'))}
                  disabled={saving}
                  size="icon"
                >
                  <Save className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Actuellement: {(getConfigValue('cnss_rate') * 100).toFixed(2)}% (9.18% + 0.5% FOPROLOS)
              </p>
            </div>

            {/* CSS Rate */}
            <div className="space-y-2">
              <Label htmlFor="css_rate">Taux CSS (%)</Label>
              <div className="flex gap-2">
                <Input
                  id="css_rate"
                  type="number"
                  step="0.01"
                  value={getConfigValue('css_rate') * 100}
                  onChange={(e) => updateLocalConfig('css_rate', parseFloat(e.target.value) / 100 || 0)}
                  className="flex-1"
                />
                <Button 
                  onClick={() => handleUpdateConfig('css_rate', getConfigValue('css_rate'))}
                  disabled={saving}
                  size="icon"
                >
                  <Save className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Contribution Sociale de Solidarité: {(getConfigValue('css_rate') * 100).toFixed(2)}%
              </p>
            </div>

            {/* Chef de Famille Deduction */}
            <div className="space-y-2">
              <Label htmlFor="deduction_chef">Abattement Chef de Famille (TND)</Label>
              <div className="flex gap-2">
                <Input
                  id="deduction_chef"
                  type="number"
                  step="1"
                  value={getConfigValue('deduction_chef_famille')}
                  onChange={(e) => updateLocalConfig('deduction_chef_famille', parseFloat(e.target.value) || 0)}
                  className="flex-1"
                />
                <Button 
                  onClick={() => handleUpdateConfig('deduction_chef_famille', getConfigValue('deduction_chef_famille'))}
                  disabled={saving}
                  size="icon"
                >
                  <Save className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Déduction mensuelle pour chef de famille
              </p>
            </div>

            {/* Per Child Deduction */}
            <div className="space-y-2">
              <Label htmlFor="deduction_child">Abattement par Enfant (TND)</Label>
              <div className="flex gap-2">
                <Input
                  id="deduction_child"
                  type="number"
                  step="1"
                  value={getConfigValue('deduction_per_child')}
                  onChange={(e) => updateLocalConfig('deduction_per_child', parseFloat(e.target.value) || 0)}
                  className="flex-1"
                />
                <Button 
                  onClick={() => handleUpdateConfig('deduction_per_child', getConfigValue('deduction_per_child'))}
                  disabled={saving}
                  size="icon"
                >
                  <Save className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Déduction mensuelle par enfant à charge
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Tax Brackets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Barème d'Imposition (IRPP)
          </CardTitle>
          <CardDescription>
            Tranches de l'impôt sur le revenu progressif (mensuel)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ordre</TableHead>
                <TableHead>Montant Min (TND)</TableHead>
                <TableHead>Montant Max (TND)</TableHead>
                <TableHead>Taux (%)</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {taxBrackets.map((bracket) => (
                <TableRow key={bracket.id}>
                  <TableCell className="font-medium">{bracket.bracket_order}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.001"
                      value={bracket.min_amount}
                      onChange={(e) => updateLocalBracket(bracket.id, 'min_amount', parseFloat(e.target.value) || 0)}
                      className="w-32"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.001"
                      value={bracket.max_amount || ''}
                      onChange={(e) => updateLocalBracket(bracket.id, 'max_amount', e.target.value ? parseFloat(e.target.value) : null)}
                      placeholder="Illimité"
                      className="w-32"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      value={bracket.tax_rate * 100}
                      onChange={(e) => updateLocalBracket(bracket.id, 'tax_rate', (parseFloat(e.target.value) || 0) / 100)}
                      className="w-24"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="text"
                      value={bracket.description || ''}
                      onChange={(e) => updateLocalBracket(bracket.id, 'description', e.target.value)}
                      className="min-w-[200px]"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      onClick={() => handleUpdateBracket(bracket)}
                      disabled={saving}
                      size="sm"
                      variant="outline"
                    >
                      <Save className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default SalaryConfiguration;
