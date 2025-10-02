import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Zap } from "lucide-react";

const quickMaterialSchema = z.object({
  nom: z.string().min(1, "Le nom est obligatoire"),
  reference: z.string().min(1, "La référence est obligatoire"),
  category_id: z.number().min(1, "La catégorie est obligatoire"),
  quantity_type_id: z.number().min(1, "Le type de quantité est obligatoire"),
  quantite_stock: z.number().min(0, "La quantité doit être positive"),
  laize: z.string().min(1, "La laize est obligatoire"),
  couleur: z.string().min(1, "La couleur est obligatoire"),
  location: z.enum(["lucci by ey", "spadadibattaglia", "les deux", "extern"]),
});

type QuickMaterialFormData = z.infer<typeof quickMaterialSchema>;

interface QuantityType {
  id: number;
  nom: string;
  unite: string;
}

interface Category {
  id: number;
  nom: string;
}

interface QuickAddMaterialModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function QuickAddMaterialModal({
  open,
  onOpenChange,
  onSuccess,
}: QuickAddMaterialModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quantityTypes, setQuantityTypes] = useState<QuantityType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<QuickMaterialFormData>({
    resolver: zodResolver(quickMaterialSchema),
    defaultValues: {
      nom: "",
      reference: "",
      category_id: 0,
      quantity_type_id: 0,
      quantite_stock: 0,
      laize: "",
      couleur: "",
      location: "lucci by ey",
    },
  });

  const selectedCategory = watch("category_id");
  const selectedQuantityType = watch("quantity_type_id");
  const selectedLocation = watch("location");

  useEffect(() => {
    fetchCategories();
    fetchQuantityTypes();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch(
        "https://luccibyey.com.tn/production/api/matieres_category.php"
      );
      if (response.ok) {
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          const categoryData = result.data.map((cat: any) => ({
            id: parseInt(cat.id),
            nom: cat.nom
          }));
          setCategories(categoryData);
        }
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchQuantityTypes = async () => {
    try {
      const response = await fetch(
        "https://luccibyey.com.tn/production/api/quantity_types.php"
      );
      if (response.ok) {
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          const quantityData = result.data.map((type: any) => ({
            id: parseInt(type.id),
            nom: type.nom,
            unite: type.unite
          }));
          setQuantityTypes(quantityData);
        }
      }
    } catch (error) {
      console.error("Error fetching quantity types:", error);
    }
  };

  const onSubmit = async (data: QuickMaterialFormData) => {
    setIsSubmitting(true);
    
    try {
      const payload = {
        title: data.nom,
        reference: data.reference,
        category_id: data.category_id,
        quantity_type_id: data.quantity_type_id,
        quantity_total: data.quantite_stock,
        lowest_quantity_needed: 3.0, // Default min
        medium_quantity_needed: 3.0, // Default min
        good_quantity_needed: 20.0, // Default max
        laize: data.laize,
        color: data.couleur,
        location: data.location,
        // Send other required fields as null or defaults
        price: null,
        id_fournisseur: null,
        materiere_type: "intern",
        extern_customer_id: null,
        is_replacable: 0,
        replacable_material_id: null,
        other_attributes: null,
        created_user: 1,
        modified_user: 1,
      };

      console.log("📦 Quick add payload:", payload);

      const response = await fetch(
        "https://luccibyey.com.tn/production/api/matieres.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      console.log("📡 API Response status:", response.status);

      const result = await response.json();
      console.log("📦 API Response data:", result);

      if (response.ok && result.success) {
        toast({
          title: "Succès",
          description: "La matière a été ajoutée rapidement avec succès.",
        });
        reset();
        onOpenChange(false);
        onSuccess();
      } else {
        toast({
          title: "Erreur",
          description:
            result.message ||
            "Une erreur est survenue lors de l'ajout de la matière.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("💥 Error submitting material:", error);
      toast({
        title: "Erreur",
        description: "Impossible de communiquer avec le serveur.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Ajout Rapide de Matière
          </DialogTitle>
          <DialogDescription>
            Formulaire simplifié pour ajouter rapidement une nouvelle matière.
            Les quantités min/max sont définies automatiquement (Min: 3, Max: 20).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Nom */}
          <div className="space-y-2">
            <Label htmlFor="nom">
              Nom <span className="text-destructive">*</span>
            </Label>
            <Input
              id="nom"
              placeholder="Ex: Tissu Coton Blanc"
              {...register("nom")}
            />
            {errors.nom && (
              <p className="text-sm text-destructive">{errors.nom.message}</p>
            )}
          </div>

          {/* Reference */}
          <div className="space-y-2">
            <Label htmlFor="reference">
              Référence <span className="text-destructive">*</span>
            </Label>
            <Input
              id="reference"
              placeholder="Ex: TIS-001"
              {...register("reference")}
            />
            {errors.reference && (
              <p className="text-sm text-destructive">
                {errors.reference.message}
              </p>
            )}
          </div>

          {/* Catégorie */}
          <div className="space-y-2">
            <Label htmlFor="category">
              Catégorie <span className="text-destructive">*</span>
            </Label>
            <Select
              onValueChange={(value) =>
                setValue("category_id", parseInt(value), { shouldValidate: true })
              }
              value={selectedCategory > 0 ? selectedCategory.toString() : ""}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner la catégorie" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category_id && (
              <p className="text-sm text-destructive">
                {errors.category_id.message}
              </p>
            )}
          </div>

          {/* Type de Quantité */}
          <div className="space-y-2">
            <Label htmlFor="quantity_type">
              Type de Quantité <span className="text-destructive">*</span>
            </Label>
            <Select
              onValueChange={(value) =>
                setValue("quantity_type_id", parseInt(value), { shouldValidate: true })
              }
              value={selectedQuantityType > 0 ? selectedQuantityType.toString() : ""}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner le type" />
              </SelectTrigger>
              <SelectContent>
                {quantityTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id.toString()}>
                    {type.nom} ({type.unite})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.quantity_type_id && (
              <p className="text-sm text-destructive">
                {errors.quantity_type_id.message}
              </p>
            )}
          </div>

          {/* Quantité en Stock */}
          <div className="space-y-2">
            <Label htmlFor="quantite_stock">
              Quantité en Stock <span className="text-destructive">*</span>
            </Label>
            <Input
              id="quantite_stock"
              type="number"
              step="0.001"
              placeholder="Ex: 150.5"
              {...register("quantite_stock", { valueAsNumber: true })}
            />
            {errors.quantite_stock && (
              <p className="text-sm text-destructive">
                {errors.quantite_stock.message}
              </p>
            )}
          </div>

          {/* Laize */}
          <div className="space-y-2">
            <Label htmlFor="laize">
              Laize <span className="text-destructive">*</span>
            </Label>
            <Input
              id="laize"
              placeholder="Ex: 1.50m"
              {...register("laize")}
            />
            {errors.laize && (
              <p className="text-sm text-destructive">{errors.laize.message}</p>
            )}
          </div>

          {/* Couleur */}
          <div className="space-y-2">
            <Label htmlFor="couleur">
              Couleur <span className="text-destructive">*</span>
            </Label>
            <Input
              id="couleur"
              placeholder="Ex: Blanc, Noir, Bleu Marine"
              {...register("couleur")}
            />
            {errors.couleur && (
              <p className="text-sm text-destructive">
                {errors.couleur.message}
              </p>
            )}
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">
              Emplacement <span className="text-destructive">*</span>
            </Label>
            <Select
              onValueChange={(value: any) => setValue("location", value)}
              value={selectedLocation}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Sélectionner l'emplacement" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                <SelectItem value="lucci by ey">Lucci By Ey</SelectItem>
                <SelectItem value="spadadibattaglia">Spada</SelectItem>
                <SelectItem value="les deux">Les Deux</SelectItem>
                <SelectItem value="extern">Extern</SelectItem>
              </SelectContent>
            </Select>
            {errors.location && (
              <p className="text-sm text-destructive">
                {errors.location.message}
              </p>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-muted/50 p-3 rounded-lg text-sm text-muted-foreground">
            <p className="font-medium mb-1">Valeurs par défaut :</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Quantité Min: 3.0</li>
              <li>Quantité Max: 20.0</li>
              <li>Type: Interne</li>
              <li>Autres champs: Non définis</li>
            </ul>
          </div>

          {/* Submit Button */}
          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Ajout en cours...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Ajouter Rapidement
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
