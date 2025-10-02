import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, ClipboardList, CheckCircle2, Settings } from "lucide-react";
import SpecificationTemplateManager from "@/components/SpecificationTemplateManager";

// Specifications screen (replaces the modal) and performs the transfer API call
// Navigation state from ConfigureQuantities: { product, quantities }

interface SpecTemplate {
  id: number;
  name: string;
  input_type: "input" | "select" | "checkbox";
  options?: string[];
}

export default function ConfigureSpecifications() {
  const { boutique, id } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation() as { state?: any };
  const { toast } = useToast();

  const product = state?.product;
  const quantities: Record<string, number> = state?.quantities || {};
  const [specs, setSpecs] = useState<Record<string, string>>({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [templates, setTemplates] = useState<SpecTemplate[]>([]);
  const [selectedCheckboxes, setSelectedCheckboxes] = useState<Record<string, string[]>>({});

  useEffect(() => {
    document.title = `Spécifications | ${product?.nom_product ?? "Produit"}`;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", `Définir les spécifications de production pour ${product?.nom_product ?? "le produit"}.`);
    fetchTemplates();
  }, [product]);

  const fetchTemplates = async () => {
    try {
      const resp = await fetch("https://luccibyey.com.tn/production/api/specification_templates.php");
      const data = await resp.json();
      if (data.success) {
        setTemplates(data.templates || []);
      }
    } catch (e) {
      console.error("Error loading templates:", e);
    }
  };

  const total = useMemo(() => Object.values(quantities).reduce((s, v) => s + (v || 0), 0), [quantities]);

  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldValue, setNewFieldValue] = useState("");

  const handleAddField = () => {
    if (!newFieldName.trim()) {
      toast({ title: "Erreur", description: "Le nom du champ est requis", variant: "destructive" });
      return;
    }
    setSpecs((prev) => ({ ...prev, [newFieldName.trim()]: newFieldValue.trim() }));
    setNewFieldName("");
    setNewFieldValue("");
  };

  const handleRemoveField = (fieldName: string) => {
    const updated = { ...specs };
    delete updated[fieldName];
    setSpecs(updated);
  };

  const handleUpdateValue = (fieldName: string, value: string) => {
    setSpecs((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleCheckboxToggle = (fieldName: string, option: string) => {
    const current = selectedCheckboxes[fieldName] || [];
    const updated = current.includes(option)
      ? current.filter((o) => o !== option)
      : [...current, option];
    
    setSelectedCheckboxes((prev) => ({ ...prev, [fieldName]: updated }));
    setSpecs((prev) => ({ ...prev, [fieldName]: updated.join(", ") }));
  };

  const handleTemplateManagerClose = () => {
    setShowTemplateManager(false);
    fetchTemplates();
  };

  const performTransfer = async () => {
    try {
      const payload = {
        products: [
          {
            ...product,
            size_quantities: quantities,
            production_specifications: specs,
          },
        ],
        boutique,
      };

      const resp = await fetch(
        "https://luccibyey.com.tn/production/api/transfer_products_with_quantities.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await resp.json();
      if (data.success) {
        setShowSuccessModal(true);
      } else {
        toast({ title: "Erreur de transfert", description: data.message || "Erreur lors du transfert", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Erreur", description: "Erreur lors du transfert", variant: "destructive" });
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    navigate("/boutiques");
  };

  if (!product) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-xl font-bold">Produit introuvable</h1>
        <p className="text-muted-foreground mt-2">Revenez au produit et relancez le transfert.</p>
        <Button className="mt-4" onClick={() => navigate(-1)}>Retour</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden">
      <header className="border-b bg-card/60 backdrop-blur-sm sticky top-0 z-10">
        <div className="w-full px-3 py-2 sm:p-4 max-w-full flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h1 className="text-sm sm:text-lg font-bold mb-1">Spécifications de Production</h1>
            <div className="flex flex-col gap-0.5 text-xs sm:text-sm text-muted-foreground">
              <span className="break-words line-clamp-2">{product.nom_product}</span>
              <span className="break-words">Réf: {product.reference_product}</span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTemplateManager(true)}
            className="flex-shrink-0 h-8 w-8 p-0"
            title="Gérer les modèles"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="w-full px-3 py-3 sm:p-4 space-y-3 sm:space-y-4 pb-20 sm:pb-4 max-w-full overflow-x-hidden">
        <Card className="shadow-sm max-w-full">
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-sm sm:text-base break-words">Définir les spécifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6">
            {/* Template-based specifications */}
            {templates.length > 0 && (
              <div className="space-y-3">
                <Label className="text-xs sm:text-sm font-semibold">Spécifications pré-configurées</Label>
                {templates.map((template) => {
                  const templateValue = specs[template.name] || "";
                  const isAdded = template.name in specs;

                  return (
                    <div key={template.id} className="border rounded-lg p-2.5 sm:p-3 bg-card w-full">
                      <div className="flex items-start justify-between mb-2 gap-2">
                        <Label className="font-semibold text-xs sm:text-sm break-words flex-1 min-w-0">
                          {template.name}
                        </Label>
                        {isAdded && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              handleRemoveField(template.name);
                              setSelectedCheckboxes((prev) => {
                                const updated = { ...prev };
                                delete updated[template.name];
                                return updated;
                              });
                            }}
                            className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive flex-shrink-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>

                      {template.input_type === "input" && (
                        <Input
                          value={templateValue}
                          onChange={(e) => handleUpdateValue(template.name, e.target.value)}
                          className="text-xs sm:text-sm h-9 w-full"
                          placeholder="Entrez la valeur..."
                        />
                      )}

                      {template.input_type === "select" && template.options && (
                        <Select
                          value={templateValue}
                          onValueChange={(val) => handleUpdateValue(template.name, val)}
                        >
                          <SelectTrigger className="text-xs sm:text-sm h-9 w-full">
                            <SelectValue placeholder="Sélectionnez..." />
                          </SelectTrigger>
                          <SelectContent>
                            {template.options.map((opt, i) => (
                              <SelectItem key={i} value={opt} className="text-xs sm:text-sm">
                                {opt}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}

                      {template.input_type === "checkbox" && template.options && (
                        <div className="space-y-2">
                          {template.options.map((opt, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <Checkbox
                                id={`${template.name}-${i}`}
                                checked={(selectedCheckboxes[template.name] || []).includes(opt)}
                                onCheckedChange={() => handleCheckboxToggle(template.name, opt)}
                              />
                              <label
                                htmlFor={`${template.name}-${i}`}
                                className="text-xs sm:text-sm cursor-pointer flex-1"
                              >
                                {opt}
                              </label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Manual specification addition */}
            <div className="border-2 border-dashed border-border rounded-lg p-2.5 sm:p-3 bg-muted/30">
              <Label className="text-xs sm:text-sm font-semibold mb-2 block">Ajouter une spécification personnalisée</Label>
              <div className="grid grid-cols-1 gap-2 sm:gap-3 w-full">
                <div className="w-full">
                  <Label className="text-xs mb-1 block">Nom de la spécification</Label>
                  <Input
                    placeholder="Ex: Matériau..."
                    value={newFieldName}
                    onChange={(e) => setNewFieldName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newFieldName.trim()) {
                        e.preventDefault();
                        handleAddField();
                      }
                    }}
                    autoComplete="off"
                    className="text-xs sm:text-sm h-9 w-full"
                  />
                </div>
                <div className="w-full">
                  <Label className="text-xs mb-1 block">Valeur</Label>
                  <div className="flex gap-1.5 w-full">
                    <Input
                      placeholder="Ex: Coton 100%..."
                      value={newFieldValue}
                      onChange={(e) => setNewFieldValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newFieldName.trim()) {
                          e.preventDefault();
                          handleAddField();
                        }
                      }}
                      autoComplete="off"
                      className="text-xs sm:text-sm h-9 flex-1 min-w-0"
                    />
                    <Button onClick={handleAddField} size="sm" disabled={!newFieldName.trim()} className="h-9 w-9 flex-shrink-0 p-0">
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Custom added specifications */}
            {Object.entries(specs).filter(([name]) => !templates.some((t) => t.name === name)).length > 0 && (
              <div className="space-y-2 sm:space-y-3 w-full">
                <Label className="text-xs sm:text-sm font-semibold">Spécifications personnalisées</Label>
                {Object.entries(specs)
                  .filter(([name]) => !templates.some((t) => t.name === name))
                  .map(([fieldName, fieldValue]) => (
                    <div key={fieldName} className="border rounded-lg p-2.5 sm:p-3 bg-card w-full">
                      <div className="flex items-start justify-between mb-1.5 gap-2">
                        <Label className="font-semibold text-xs sm:text-sm break-words flex-1 min-w-0 pr-1">{fieldName}</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveField(fieldName)}
                          className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive flex-shrink-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <Input
                        value={fieldValue}
                        onChange={(e) => handleUpdateValue(fieldName, e.target.value)}
                        className="text-xs sm:text-sm h-9 w-full"
                        placeholder="Entrez la valeur..."
                      />
                    </div>
                  ))}
              </div>
            )}

            <div className="flex flex-col gap-2.5 pt-2 w-full">
              <Badge variant="secondary" className="text-xs sm:text-sm w-fit">Total: {total} pièces</Badge>
              <div className="flex gap-2 w-full">
                <Button variant="outline" onClick={() => navigate(-1)} className="flex-1 text-xs sm:text-sm h-9 min-w-0">
                  Retour
                </Button>
                <Button onClick={performTransfer} className="flex-1 text-xs sm:text-sm h-9 min-w-0">
                  Envoyer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md border-green-500/50 w-[calc(100%-2rem)] mx-auto">
          <DialogHeader>
            <div className="flex items-center justify-center mb-3 sm:mb-4">
              <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 sm:h-10 sm:w-10 text-green-500" />
              </div>
            </div>
            <DialogTitle className="text-center text-lg sm:text-xl">Transfert réussi !</DialogTitle>
            <DialogDescription className="text-center text-xs sm:text-sm px-2">
              Le produit <span className="font-semibold">{product.nom_product}</span> a été envoyé en production avec succès.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center pt-3 sm:pt-4">
            <Button onClick={handleSuccessClose} className="bg-green-500 hover:bg-green-600 w-full sm:w-auto text-xs sm:text-sm h-9">
              Retour au produit
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <SpecificationTemplateManager
        open={showTemplateManager}
        onClose={handleTemplateManagerClose}
      />
    </div>
  );
}
