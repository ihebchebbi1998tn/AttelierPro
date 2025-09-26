import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import materialPlaceholder from "@/assets/material-placeholder.png";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { 
  ArrowLeft,
  Package2,
  Save,
  Loader2,
  Plus,
  Trash2,
  Settings,
  Search,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import QuantityTypesModal from "@/components/QuantityTypesModal";
import SupplierSelector from "@/components/SupplierSelector";
import ImageCapture from "@/components/ImageCapture";

const materialSchema = z.object({
  reference: z.string().optional(),
  title: z.string().min(1, "Le titre est obligatoire"),
  color: z.string().optional(),
  price: z.number().min(0, "Le prix doit être positif").optional(),
  quantity_type: z.string().min(1, "Le type de quantité est obligatoire"),
  quantity_total: z.number().min(0, "La quantité doit être positive"),
  lowest_quantity_needed: z.number().min(0, "Le seuil critique doit être positif"),
  medium_quantity_needed: z.number().min(0, "Le seuil moyen doit être positif"),
  good_quantity_needed: z.number().min(0, "Le seuil optimal doit être positif"),
  location: z.enum(["Usine", "Lucci By Ey"]).optional(),
  category_id: z.number().optional(),
  id_fournisseur: z.number().optional(),
  materiere_type: z.enum(["intern", "extern"]).default("intern"),
  extern_customer_id: z.number().optional(),
  is_replacable: z.boolean().default(false),
  replacable_material_id: z.number().optional(),
  other_attributes: z.record(z.string()).optional(),
}).refine((data) => {
  // If material type is extern, extern_customer_id should be provided
  if (data.materiere_type === "extern" && !data.extern_customer_id) {
    return false;
  }
  return true;
}, {
  message: "Veuillez sélectionner un client pour les matières externes",
  path: ["extern_customer_id"],
});

type MaterialFormData = z.infer<typeof materialSchema>;

interface MaterialDetails {
  material_id: number;
  reference?: string;
  title: string;
  color?: string;
  price?: number;
  quantity_type: string;
  quantity_total: number;
  lowest_quantity_needed: number;
  medium_quantity_needed: number;
  good_quantity_needed: number;
  location: "Usine" | "Lucci By Ey";
  category_id?: number;
  id_fournisseur?: number;
  materiere_type?: "intern" | "extern";
  extern_customer_id?: number;
  is_replacable: boolean;
  replacable_material_id?: number;
  other_attributes?: any;
  created_user: number;
  modified_user: number;
  created_date: string;
  modified_date: string;
}

interface QuantityType {
  quantity_type_id: number;
  value: string;
  label: string;
  is_active: boolean;
}

const EditMaterial = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [material, setMaterial] = useState<MaterialDetails | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [existingImage, setExistingImage] = useState<{image_id: number, file_path: string} | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [categories, setCategories] = useState<{category_id: number, name: string}[]>([]);
  const [quantityTypes, setQuantityTypes] = useState<QuantityType[]>([]);
  const [customAttributes, setCustomAttributes] = useState<{key: string, value: string}[]>([]);
  const [availableMaterials, setAvailableMaterials] = useState<{id: number, title: string, reference?: string, color?: string, category_name?: string}[]>([]);
  const [availableCustomers, setAvailableCustomers] = useState<{id: number, nom: string}[]>([]);
  const [quantityTypesModalOpen, setQuantityTypesModalOpen] = useState(false);
  const [customerPopoverOpen, setCustomerPopoverOpen] = useState(false);
  const [materialPopoverOpen, setMaterialPopoverOpen] = useState(false);

  const form = useForm<MaterialFormData>({
    resolver: zodResolver(materialSchema),
    defaultValues: {
      quantity_total: 0,
      lowest_quantity_needed: 0,
      medium_quantity_needed: 0,
      good_quantity_needed: 0,
      materiere_type: "intern",
      is_replacable: false,
    },
  });

  useEffect(() => {
    if (id) {
      fetchMaterialDetails(parseInt(id));
    }
    fetchCategories();
    fetchQuantityTypes();
    fetchAvailableMaterials();
    fetchAvailableCustomers();
  }, [id]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('https://luccibyey.com.tn/production/api/matieres_category.php?active_only=true');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        const categoryData = data.data.map((cat: any) => ({
          category_id: parseInt(cat.id),
          name: cat.nom
        }));
        setCategories(categoryData);
      } else {
        console.warn('No categories found or API error');
        setCategories([]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
      toast({
        title: "Erreur",
        description: "Impossible de charger les catégories",
        variant: "destructive",
      });
    }
  };

  const fetchQuantityTypes = async () => {
    try {
      const response = await fetch('https://luccibyey.com.tn/production/api/quantity_types.php');
      if (response.ok) {
        const data = await response.json();
        const sourceArray = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : null);
        if (sourceArray) {
          const formattedTypes = sourceArray.map((type: any) => ({
            quantity_type_id: parseInt(type.id ?? type.quantity_type_id),
            value: String(type.id ?? type.quantity_type_id),
            label: type.nom ?? type.label ?? type.unite ?? `Type ${type.id ?? ''}`,
            is_active: (type.active === "1" || type.active === 1) || (type.is_active === "1" || type.is_active === 1)
          }));
          setQuantityTypes(formattedTypes);
          return;
        }
      }
    } catch (error) {
      console.error("Error fetching quantity types:", error);
    }
    
    // Fallback quantity types
    setQuantityTypes([
      { quantity_type_id: 1, value: "1", label: "Mètres", is_active: true },
      { quantity_type_id: 2, value: "2", label: "Kilogrammes", is_active: true },
      { quantity_type_id: 3, value: "3", label: "Pièces", is_active: true },
    ]);
  };

  const fetchAvailableMaterials = async () => {
    try {
      const response = await fetch('https://luccibyey.com.tn/production/api/matieres.php');
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          const materials = data.data.map((material: any) => ({
            id: parseInt(material.id),
            title: material.nom,
            reference: material.reference,
            color: material.couleur,
            category_name: material.category_name
          }));
          setAvailableMaterials(materials);
        }
      }
    } catch (error) {
      console.error("Error fetching materials:", error);
    }
  };

  const fetchAvailableCustomers = async () => {
    try {
      const response = await fetch('https://luccibyey.com.tn/production/api/soustraitance_clients.php');
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          const customers = data.data.map((customer: any) => ({
            id: parseInt(customer.id),
            nom: customer.name || customer.nom || `Client ${customer.id}`
          }));
          setAvailableCustomers(customers);
        }
      }
    } catch (error) {
      console.error("Error fetching soustraitance customers:", error);
    }
  };

  const fetchMaterialDetails = async (materialId: number) => {
    try {
      setIsLoading(true);
      const response = await fetch(`https://luccibyey.com.tn/production/api/matieres.php?id=${materialId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        const materialData = result.data;
        
        const parsedMaterial: MaterialDetails = {
          material_id: parseInt(materialData.material_id),
          reference: materialData.reference || "",
          title: materialData.title,
          color: materialData.color || "",
          price: materialData.price ? parseFloat(materialData.price) : undefined,
          quantity_type: materialData.quantity_type,
          quantity_total: parseFloat(materialData.quantity_total) || 0,
          lowest_quantity_needed: parseFloat(materialData.lowest_quantity_needed) || 0,
          medium_quantity_needed: parseFloat(materialData.medium_quantity_needed) || 0,
          good_quantity_needed: parseFloat(materialData.good_quantity_needed) || 0,
          location: materialData.location as "Usine" | "Lucci By Ey",
          category_id: materialData.category_id ? parseInt(materialData.category_id) : undefined,
          id_fournisseur: materialData.id_fournisseur ? parseInt(materialData.id_fournisseur) : undefined,
          materiere_type: materialData.materiere_type || 'intern',
          extern_customer_id: materialData.extern_customer_id ? parseInt(materialData.extern_customer_id) : undefined,
          is_replacable: materialData.is_replacable === "1" || materialData.is_replacable === 1,
          replacable_material_id: materialData.replacable_material_id ? parseInt(materialData.replacable_material_id) : undefined,
          other_attributes: materialData.other_attributes ? 
            (typeof materialData.other_attributes === 'string' ? 
              JSON.parse(materialData.other_attributes) : 
              materialData.other_attributes) : {},
          created_user: parseInt(materialData.created_user),
          modified_user: parseInt(materialData.modified_user),
          created_date: materialData.created_date,
          modified_date: materialData.modified_date
        };
        
        setMaterial(parsedMaterial);
        
        // Set existing image if it exists
        if (materialData.images && Array.isArray(materialData.images) && materialData.images.length > 0) {
          setExistingImage(materialData.images[0]);
        }
        
        // Populate form with existing data
        form.reset({
          reference: parsedMaterial.reference || "",
          title: parsedMaterial.title || "",
          color: parsedMaterial.color || "",
          price: parsedMaterial.price,
          quantity_type: materialData.quantity_type_id ? String(materialData.quantity_type_id) : "",
          quantity_total: parsedMaterial.quantity_total || 0,
          lowest_quantity_needed: parsedMaterial.lowest_quantity_needed || 0,
          medium_quantity_needed: parsedMaterial.medium_quantity_needed || 0,
          good_quantity_needed: parsedMaterial.good_quantity_needed || 0,
          location: parsedMaterial.location,
          category_id: parsedMaterial.category_id,
          id_fournisseur: parsedMaterial.id_fournisseur,
          materiere_type: parsedMaterial.materiere_type || 'intern',
          extern_customer_id: parsedMaterial.extern_customer_id,
          is_replacable: parsedMaterial.is_replacable || false,
          replacable_material_id: parsedMaterial.replacable_material_id,
          other_attributes: parsedMaterial.other_attributes || {},
        });
        
        // Set custom attributes if they exist
        if (parsedMaterial.other_attributes && typeof parsedMaterial.other_attributes === 'object') {
          const attrs = Object.entries(parsedMaterial.other_attributes).map(([key, value]) => ({
            key,
            value: String(value)
          }));
          setCustomAttributes(attrs);
          if (attrs.length > 0) {
            setShowAdvanced(true);
          }
        }
      } else {
        throw new Error(result.message || "Failed to fetch material details");
      }
    } catch (error) {
      console.error("Error fetching material details:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de charger les détails du matériau",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addCustomAttribute = () => {
    setCustomAttributes([...customAttributes, { key: "", value: "" }]);
  };

  const removeCustomAttribute = (index: number) => {
    const newAttributes = customAttributes.filter((_, i) => i !== index);
    setCustomAttributes(newAttributes);
    updateFormAttributes(newAttributes);
  };

  const updateCustomAttribute = (index: number, field: "key" | "value", value: string) => {
    const newAttributes = [...customAttributes];
    newAttributes[index][field] = value;
    setCustomAttributes(newAttributes);
    updateFormAttributes(newAttributes);
  };

  const updateFormAttributes = (attributes: {key: string, value: string}[]) => {
    const attributesObject: Record<string, string> = {};
    attributes.forEach(attr => {
      if (attr.key.trim() && attr.value.trim()) {
        attributesObject[attr.key.trim()] = attr.value.trim();
      }
    });
    form.setValue("other_attributes", attributesObject);
  };

  const onSubmit = async (data: MaterialFormData) => {
    if (!material) return;
    
    setIsSubmitting(true);
    try {
      const payload = {
        material_id: material.material_id,
        reference: data.reference,
        title: data.title,
        color: data.color,
        price: data.price,
        quantity_type_id: parseInt(data.quantity_type),
        // quantity_total removed - stock can only be adjusted via transactions
        lowest_quantity_needed: data.lowest_quantity_needed || 0,
        medium_quantity_needed: data.medium_quantity_needed || 0,
        good_quantity_needed: data.good_quantity_needed || 0,
        location: data.location,
        category_id: data.category_id,
        id_fournisseur: data.id_fournisseur,
        materiere_type: data.materiere_type || 'intern',
        extern_customer_id: data.materiere_type === 'extern' && data.extern_customer_id ? data.extern_customer_id : null,
        other_attributes: customAttributes.length > 0 ? 
          customAttributes.reduce((acc, attr) => {
            if (attr.key && attr.value) {
              acc[attr.key] = attr.value;
            }
            return acc;
          }, {} as Record<string, string>) : null,
        modified_user: 1
      };

      let response;
      if (selectedImage) {
        const formData = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
          formData.append(key, value != null ? String(value) : '');
        });
        formData.append('image1', selectedImage);
        
        response = await fetch('https://luccibyey.com.tn/production/api/matieres.php', {
          method: 'PUT',
          body: formData,
        });
      } else {
        response = await fetch('https://luccibyey.com.tn/production/api/matieres.php', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      }

      const result = await response.json();
      
      if (response.ok && result.success) {
        toast({
          title: "Succès",
          description: "Le matériau a été mis à jour avec succès.",
        });
        navigate(`/material-details/${id}`);
      } else {
        toast({
          title: "Erreur",
          description: result.message || "Une erreur est survenue lors de la mise à jour du matériau.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating material:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour du matériau.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!material) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Matériau introuvable</h2>
          <p className="text-muted-foreground mb-4">Le matériau demandé n'existe pas ou n'est plus disponible.</p>
          <Button onClick={() => navigate('/stock')}>
            Retour au stock
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Button 
            variant="ghost" 
            onClick={() => navigate(`/material-details/${id}`)}
            className="mb-2 -ml-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux détails
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Modifier le matériau</h1>
          <p className="text-muted-foreground">
            Mettez à jour les informations de votre matériau
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Image Upload */}
            <ImageCapture
              onImageSelect={(file) => {
                setSelectedImage(file);
                const reader = new FileReader();
                reader.onload = (e) => {
                  setImagePreview(e.target?.result as string);
                };
                reader.readAsDataURL(file);
              }}
              currentImage={imagePreview || (existingImage ? `https://luccibyey.com.tn/production/${existingImage.file_path}` : undefined)}
              onRemoveImage={() => {
                setSelectedImage(null);
                setImagePreview('');
              }}
              maxSize={5}
            />

            {/* Basic Information */}
            <Card className="modern-card lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package2 className="h-5 w-5" />
                  Informations de base
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Titre *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Tissu Coton Premium" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="reference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Référence</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: TIS-COT-001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Couleur</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Bleu Marine" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prix unitaire (TND)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder="Ex: 15.50"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Material Type and External Customer */}
                <div className="space-y-4 mt-4 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800">
                  <h3 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">Type de matière</h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-4">
                    Spécifiez si cette matière vous appartient ou si elle appartient à un client externe
                  </p>
                  
                  <FormField
                    control={form.control}
                    name="materiere_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type *</FormLabel>
                        <Select value={field.value || "intern"} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner le type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="intern">Interne (Notre matière)</SelectItem>
                            <SelectItem value="extern">Externe (Matière client)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch("materiere_type") === "extern" && (
                    <FormField
                      control={form.control}
                      name="extern_customer_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Client propriétaire *</FormLabel>
                          <Popover open={customerPopoverOpen} onOpenChange={setCustomerPopoverOpen}>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  aria-expanded={customerPopoverOpen}
                                  className="w-full justify-between"
                                >
                                  {field.value 
                                    ? availableCustomers.find((customer) => customer.id === field.value)?.nom 
                                    : "Sélectionner un client..."}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0 z-50 bg-popover" align="start">
                              <Command className="w-full">
                                <CommandInput 
                                  placeholder="Rechercher un client..." 
                                  className="h-9 text-sm border-0 focus:ring-0 focus:outline-none"
                                />
                                <CommandEmpty>
                                  {availableCustomers.length === 0 ? "Aucun client disponible" : "Aucun client trouvé"}
                                </CommandEmpty>
                                <CommandGroup className="max-h-64 overflow-y-auto">
                                  {availableCustomers.map((customer) => (
                                    <CommandItem
                                      key={customer.id}
                                      value={customer.nom}
                                      onSelect={() => {
                                        field.onChange(customer.id);
                                        setCustomerPopoverOpen(false);
                                      }}
                                      className="cursor-pointer"
                                    >
                                      <div className="flex items-center justify-between w-full">
                                        <span className="font-medium text-sm">{customer.nom}</span>
                                        <Check
                                          className={`ml-auto h-4 w-4 ${
                                            field.value === customer.id ? "opacity-100" : "opacity-0"
                                          }`}
                                        />
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stock Management */}
          <Card className="modern-card">
            <CardHeader>
              <CardTitle>Gestion des stocks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <div className="lg:col-span-4">
                  <FormField
                    control={form.control}
                    name="quantity_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type de quantité *</FormLabel>
                        <div className="flex gap-2">
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Choisir le type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {quantityTypes.filter(type => type.is_active).map((type) => (
                                <SelectItem key={type.quantity_type_id} value={type.quantity_type_id.toString()}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            type="button"
                            variant="outline"
                            className="shrink-0"
                            onClick={() => setQuantityTypesModalOpen(true)}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="quantity_total"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock total (protégé)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type="number" 
                            step="0.01" 
                            {...field}
                            disabled
                            className="bg-muted/50 text-muted-foreground cursor-not-allowed"
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </FormControl>
                      <p className="text-xs text-muted-foreground mt-1">
                        ⚠️ Stock protégé - Utilisez "Ajuster Stock" sur la page de détails
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lowest_quantity_needed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Seuil critique</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="Niveau rouge"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="medium_quantity_needed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Seuil moyen</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="Niveau orange"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="good_quantity_needed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Seuil optimal</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="Niveau vert"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex gap-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate(`/material-details/${id}`)}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mise à jour...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Sauvegarder
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>

      <QuantityTypesModal 
        open={quantityTypesModalOpen}
        onOpenChange={setQuantityTypesModalOpen}
        onQuantityTypesUpdate={fetchQuantityTypes}
      />
    </div>
  );
};

export default EditMaterial;