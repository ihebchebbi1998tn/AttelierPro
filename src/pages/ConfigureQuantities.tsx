import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

// Quantities configuration screen (replaces the modal)
// Expects navigation state: { product }

const SIZE_CATEGORIES = {
  clothing: ["xs", "s", "m", "l", "xl", "xxl", "3xl", "4xl"],
  numeric_pants: [
    "30",
    "31",
    "32",
    "33",
    "34",
    "36",
    "38",
    "40",
    "42",
    "44",
    "46",
    "48",
    "50",
    "52",
    "54",
    "56",
    "58",
    "60",
    "62",
    "64",
    "66",
  ],
  shoes: ["39", "40", "41", "42", "43", "44", "45", "46", "47"],
  belts: ["85", "90", "95", "100", "105", "110", "115", "120", "125"],
} as const;

export default function ConfigureQuantities() {
  const { boutique, id } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation() as { state?: any };
  const { toast } = useToast();

  const product = state?.product;

  const [quantities, setQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    document.title = `Configurer Quantités | ${product?.nom_product ?? "Produit"}`;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", `Configurer les quantités de production pour ${product?.nom_product ?? "le produit"}.`);
  }, [product]);

  const total = useMemo(() => Object.values(quantities).reduce((s, v) => s + (v || 0), 0), [quantities]);

  const handleChange = (size: string, val: number) => {
    setQuantities((prev) => ({ ...prev, [size]: Math.max(0, val) }));
  };

  const handleContinue = () => {
    if (total === 0) {
      toast({ title: "Erreur", description: "Définissez au moins une quantité", variant: "destructive" });
      return;
    }
    navigate(`/production/transfer/${boutique}/${id}/specifications`, { state: { product, quantities } });
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
    <div className="min-h-screen">
      <header className="border-b bg-card/60 backdrop-blur-sm">
        <div className="container mx-auto p-4">
          <h1 className="text-lg font-bold">Quantités de Production</h1>
          <p className="text-sm text-muted-foreground">{product.nom_product}</p>
          <p className="text-sm text-muted-foreground">Réf: {product.reference_product}</p>
        </div>
      </header>

      <main className="container mx-auto p-4 space-y-4">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Définir les quantités par taille</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(SIZE_CATEGORIES).map(([category, sizes]) => (
                <div key={category} className="space-y-3">
                  <Label className="text-sm font-semibold capitalize">
                    {category === 'clothing' ? 'Vêtements' : category === 'numeric_pants' ? 'Tailles Numériques' : category === 'shoes' ? 'Chaussures' : 'Ceintures'}
                  </Label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {sizes.map((size) => (
                      <div key={size} className="flex flex-col space-y-1">
                        <Label className="text-xs text-center font-medium">{size}</Label>
                        <Input
                          type="number"
                          min={0}
                          value={quantities[size] ?? ''}
                          onChange={(e) => handleChange(size, parseInt(e.target.value) || 0)}
                          className="h-8 text-xs text-center"
                          placeholder="0"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            <div className="flex items-center justify-between">
              <div className="text-sm">Total général</div>
              <Badge variant="default">{total} pièces</Badge>
            </div>

            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={() => navigate(-1)}>Annuler</Button>
              <Button onClick={handleContinue} disabled={total === 0}>Continuer</Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
