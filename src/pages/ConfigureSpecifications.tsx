import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Settings, Search } from "lucide-react";
import SpecificationTemplateManager from "@/components/SpecificationTemplateManager";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Specifications screen (replaces the modal) and performs the transfer API call
// Navigation state from ConfigureQuantities: { product, quantities }

interface SpecTemplate {
  id: number;
  name: string;
  input_type: "input" | "select" | "checkbox";
  options?: string[];
}

interface Material {
  id: number;
  nom: string;
  location?: string;
  reference?: string;
  categorie?: string;
  couleur?: string;
  laize?: string;
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
  const [transferredProductId, setTransferredProductId] = useState<number | null>(null);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [templates, setTemplates] = useState<SpecTemplate[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [materialSearchOpen, setMaterialSearchOpen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    document.title = `Spécifications | ${product?.nom_product ?? "Produit"}`;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", `Définir les spécifications de production pour ${product?.nom_product ?? "le produit"}.`);
    fetchTemplates();
    fetchMaterials();
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

  const fetchMaterials = async () => {
    try {
      const resp = await fetch("https://luccibyey.com.tn/production/api/matieres.php");
      const data = await resp.json();
      if (data.success) {
        setMaterials(data.matieres || []);
      }
    } catch (e) {
      console.error("Error loading materials:", e);
    }
  };

  // Filter materials based on boutique location
  const getFilteredMaterials = () => {
    let locationFilter = "";
    if (boutique?.toLowerCase().includes("luccibyey")) {
      locationFilter = "Lucci By Ey";
    } else if (boutique?.toLowerCase().includes("spadadibattaglia") || boutique?.toLowerCase().includes("spada")) {
      locationFilter = "Spada";
    }

    if (!locationFilter) return materials;
    
    return materials.filter((m) => 
      m.location?.toLowerCase().includes(locationFilter.toLowerCase())
    );
  };

  const total = useMemo(() => Object.values(quantities).reduce((s, v) => s + (v || 0), 0), [quantities]);

  const handleUpdateValue = (fieldName: string, value: string) => {
    setSpecs((prev) => ({ ...prev, [fieldName]: value }));
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
        // Get all products from production_ready_products that match this external_product_id
        const fetchResp = await fetch(`https://luccibyey.com.tn/production/api/production_ready_products.php?search=${product.reference_product}&boutique=${boutique}`);
        const fetchData = await fetchResp.json();
        if (fetchData.success && fetchData.data && fetchData.data.length > 0) {
          const transferredProduct = fetchData.data[0];
          setTransferredProductId(transferredProduct.id);
        }
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
    if (transferredProductId) {
      navigate(`/produits/${transferredProductId}`);
    } else {
      navigate("/produits");
    }
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
            {/* Simple specification inputs */}
            {templates.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm font-medium">Spécifications</Label>
                {templates.map((template) => {
                  const templateValue = specs[template.name] || "";
                  const isMaterialSpec = template.name.toLowerCase().includes("matériau") || template.name.toLowerCase().includes("tissue");
                  const filteredMaterials = getFilteredMaterials();

                  return (
                    <div key={template.id} className="space-y-1">
                      <Label className="text-xs font-normal text-muted-foreground">
                        {template.name}
                      </Label>
                      
                      {/* Material selector */}
                      {isMaterialSpec ? (
                        <Popover 
                          open={materialSearchOpen[template.name] || false}
                          onOpenChange={(open) => setMaterialSearchOpen((prev) => ({ ...prev, [template.name]: open }))}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              className="w-full justify-start text-xs sm:text-sm h-9"
                            >
                              <span className="flex-1 text-left truncate">
                                {templateValue || "Sélectionner un matériau..."}
                              </span>
                              <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[300px] p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Rechercher..." className="h-9" />
                              <CommandEmpty>Aucun matériau trouvé.</CommandEmpty>
                              <CommandGroup className="max-h-64 overflow-auto">
                                {filteredMaterials.map((material) => {
                                  const displayParts = [
                                    material.nom,
                                    material.couleur && `Couleur: ${material.couleur}`,
                                    material.location && `📍 ${material.location}`
                                  ].filter(Boolean);
                                  const displayValue = displayParts.join(" • ");

                                  return (
                                    <CommandItem
                                      key={material.id}
                                      value={material.nom}
                                      onSelect={() => {
                                        handleUpdateValue(template.name, displayValue);
                                        setMaterialSearchOpen((prev) => ({ ...prev, [template.name]: false }));
                                      }}
                                      className="cursor-pointer"
                                    >
                                      <div className="flex flex-col w-full">
                                        <span className="font-medium text-sm">{material.nom}</span>
                                        <div className="flex flex-wrap gap-1 mt-1 text-xs text-muted-foreground">
                                          {material.couleur && (
                                            <Badge variant="secondary" className="text-xs">
                                              {material.couleur}
                                            </Badge>
                                          )}
                                          {material.location && (
                                            <Badge variant="outline" className="text-xs">
                                              📍 {material.location}
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                    </CommandItem>
                                  );
                                })}
                              </CommandGroup>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      ) : (
                        <Input
                          value={templateValue}
                          onChange={(e) => handleUpdateValue(template.name, e.target.value)}
                          className="text-xs sm:text-sm h-9"
                          placeholder={`Entrer ${template.name.toLowerCase()}...`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex flex-col gap-2.5 pt-4 w-full">
              <Badge variant="secondary" className="text-xs sm:text-sm w-fit">Total: {total} pièces</Badge>
              <div className="flex gap-2 w-full">
                <Button variant="outline" onClick={() => navigate(-1)} className="flex-1 text-xs sm:text-sm h-9 min-w-0">
                  Retour
                </Button>
                <Button onClick={performTransfer} className="flex-1 text-xs sm:text-sm h-9 min-w-0">
                  Transférer
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
