import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Upload,
  X,
  Save,
  Plus,
  Trash2,
  Search,
  Check,
  ChevronsUpDown,
  Settings
} from "lucide-react";
import QuantityTypesModal from "@/components/QuantityTypesModal";
import SupplierSelector from "@/components/SupplierSelector";
import ImageCapture from "@/components/ImageCapture";

    const materialSchema = z.object({
      reference: z.string().optional(),
      title: z.string().min(1, "Le titre est obligatoire"),
      color: z.string().optional(),
      price: z.number().min(0, "Le prix doit être positif").optional(),
      quantity_type: z.number().min(1, "Le type de quantité est obligatoire"),
      quantity_total: z.number().min(0, "La quantité doit être positive"),
      lowest_quantity_needed: z.number().min(0, "Le seuil critique doit être positif"),
      medium_quantity_needed: z.number().min(0, "Le seuil moyen doit être positif"),
      good_quantity_needed: z.number().min(0, "Le seuil optimal doit être positif"),
      location: z.enum(["Usine", "Lucci By Ey"]).default("Usine"),
      category_id: z.number().optional(),
      id_fournisseur: z.number().optional(),
      materiere_type: z.enum(["intern", "extern"]).default("intern"),
      extern_customer_id: z.number().optional(),
      is_replacable: z.boolean().default(false),
      replacable_material_id: z.number().optional(),
      other_attributes: z.record(z.string()).optional(),
    }).refine((data) => {
      if (data.is_replacable && !data.replacable_material_id) {
        return false;
      }
      return true;
    }, {
      message: "Veuillez sélectionner un matériau de remplacement",
      path: ["replacable_material_id"],
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

interface QuantityType {
  quantity_type_id: number;
  value: string;
  label: string;
  is_active: boolean;
}

const AddMaterial = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(materialPlaceholder);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [categories, setCategories] = useState<{category_id: number, name: string}[]>([]);
  const [quantityTypes, setQuantityTypes] = useState<QuantityType[]>([
    { quantity_type_id: 1, value: "mètres", label: "Mètres", is_active: true },
    { quantity_type_id: 2, value: "kg", label: "Kilogrammes", is_active: true },
    { quantity_type_id: 3, value: "pièces", label: "Pièces", is_active: true },
    { quantity_type_id: 4, value: "bobines", label: "Bobines", is_active: true },
    { quantity_type_id: 5, value: "rouleaux", label: "Rouleaux", is_active: true },
    { quantity_type_id: 6, value: "litres", label: "Litres", is_active: true },
  ]);
  const [customAttributes, setCustomAttributes] = useState<{key: string, value: string}[]>([]);
  const [quantityTypesModalOpen, setQuantityTypesModalOpen] = useState(false);
  const [availableMaterials, setAvailableMaterials] = useState<{id: number, title: string, reference?: string, color?: string, category_name?: string}[]>([]);
  const [materialSearchQuery, setMaterialSearchQuery] = useState("");
  const [replacementPopoverOpen, setReplacementPopoverOpen] = useState(false);
  const [availableCustomers, setAvailableCustomers] = useState<{id: number, nom: string}[]>([]);
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [customerPopoverOpen, setCustomerPopoverOpen] = useState(false);

  const form = useForm<MaterialFormData>({
    resolver: zodResolver(materialSchema),
    defaultValues: {
      reference: "",
      title: "",
      color: "",
      price: undefined,
      quantity_type: undefined,
      quantity_total: undefined,
      lowest_quantity_needed: undefined,
      medium_quantity_needed: undefined,
      good_quantity_needed: undefined,
      location: "Usine",
      category_id: undefined,
      id_fournisseur: undefined,
      materiere_type: "intern",
      extern_customer_id: undefined,
      is_replacable: false,
      replacable_material_id: undefined,
      other_attributes: {}
    },
  });

  useEffect(() => {
    fetchCategories();
    fetchQuantityTypes();
    fetchAvailableMaterials();
    fetchAvailableCustomers();
  }, []);

  const fetchCategories = async () => {
    try {
      // Mock data - replace with actual API call
      const mockCategories = [
        { category_id: 1, name: "Tissus" },
        { category_id: 2, name: "Fils" },
        { category_id: 3, name: "Accessoires" },
        { category_id: 4, name: "Doublures" },
      ];
      setCategories(mockCategories);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchQuantityTypes = async () => {
    try {
      const response = await fetch('https://luccibyey.com.tn/production/api/quantity_types.php');
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          if (Array.isArray(data)) {
            setQuantityTypes(data);
            return;
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des types de quantité:', error);
    }
    
    // If we reach here, the API failed or returned invalid data
    console.log('Utilisation des types de quantité par défaut');
  };

  const fetchAvailableMaterials = async () => {
    console.log("🔄 Starting to fetch available materials...");
    try {
      const response = await fetch('https://luccibyey.com.tn/production/api/matieres.php');
      console.log("📡 API Response status:", response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log("📦 Raw API data:", data);
        
        // Check if response has success and data properties
        if (data.success && Array.isArray(data.data)) {
          console.log("✅ Found materials array with", data.data.length, "items");
          
          // Transform the data using the correct field names from API
          const materials = data.data.map((material: any) => ({
            id: parseInt(material.id), // Use 'id' directly from API
            title: material.nom, // Use 'nom' as title
            reference: material.reference,
            color: material.couleur, // Use 'couleur' for color
            category_name: material.category_name
          }));
          
          console.log("🔄 Transformed materials:", materials);
          setAvailableMaterials(materials);
          return;
        } else {
          console.warn("⚠️ Unexpected API response structure:", data);
        }
      } else {
        console.error("❌ API request failed with status:", response.status);
      }
    } catch (error) {
      console.error("💥 Error fetching materials:", error);
    }
    
    // Fallback to empty array if API fails
    console.log("🔄 Setting empty materials array as fallback");
    setAvailableMaterials([]);
  };

  const fetchAvailableCustomers = async () => {
    console.log("🔄 Starting to fetch available soustraitance customers...");
    try {
      const response = await fetch('https://luccibyey.com.tn/production/api/soustraitance_clients.php');
      console.log("📡 Soustraitance clients API Response status:", response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log("📦 Raw soustraitance clients API data:", data);
        
        if (data.success && Array.isArray(data.data)) {
          console.log("✅ Found soustraitance clients array with", data.data.length, "items");
          
          const customers = data.data.map((customer: any) => ({
            id: parseInt(customer.id),
            nom: customer.name || customer.nom || `Client ${customer.id}`
          }));
          
          console.log("🔄 Transformed soustraitance customers:", customers);
          setAvailableCustomers(customers);
          return;
        } else {
          console.warn("⚠️ Unexpected soustraitance clients API response structure:", data);
        }
      } else {
        console.error("❌ Soustraitance clients API request failed with status:", response.status);
      }
    } catch (error) {
      console.error("💥 Error fetching soustraitance customers:", error);
    }
    
    // Fallback to empty array if API fails
    console.log("🔄 Setting empty soustraitance customers array as fallback");
    setAvailableCustomers([]);
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(materialPlaceholder);
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
    console.log("🚀 Starting material submission...");
    console.log("📋 Form data received:", data);
    
    setIsSubmitting(true);
    try {
      // Check if we have images to upload
      const hasImages = selectedImage !== null;
      
      let response;
      
      if (hasImages) {
        // Use FormData for image uploads
        console.log("📸 Images detected, using FormData...");
        const formData = new FormData();
        
        // Add form fields
        formData.append('reference', data.reference || '');
        formData.append('title', data.title);
        formData.append('color', data.color || '');
        formData.append('price', data.price?.toString() || '0');
        formData.append('quantity_type_id', data.quantity_type?.toString() || '');
        formData.append('quantity_total', (data.quantity_total || 0).toString());
        formData.append('lowest_quantity_needed', (data.lowest_quantity_needed || 0).toString());
        formData.append('medium_quantity_needed', (data.medium_quantity_needed || 0).toString());
        formData.append('good_quantity_needed', (data.good_quantity_needed || 0).toString());
        formData.append('location', data.location || '');
        formData.append('category_id', data.category_id?.toString() || '');
        formData.append('id_fournisseur', data.id_fournisseur?.toString() || '');
        formData.append('materiere_type', data.materiere_type || 'intern');
        formData.append('extern_customer_id', (data.materiere_type === 'extern' && data.extern_customer_id ? data.extern_customer_id : '').toString());
        formData.append('is_replacable', data.is_replacable ? '1' : '0');
        formData.append('replacable_material_id', (data.is_replacable && data.replacable_material_id ? data.replacable_material_id : '').toString());
        formData.append('created_user', '1');
        formData.append('modified_user', '1');
        
        // Add custom attributes as JSON string
        if (customAttributes.length > 0) {
          const attributesObject = customAttributes.reduce((acc, attr) => {
            if (attr.key && attr.value) {
              acc[attr.key] = attr.value;
            }
            return acc;
          }, {} as Record<string, string>);
          formData.append('other_attributes', JSON.stringify(attributesObject));
        }
        
        // Add image file
        if (selectedImage) {
          formData.append('image1', selectedImage);
        }
        
        console.log("📦 Sending FormData with image...");
        
        response = await fetch('https://luccibyey.com.tn/production/api/matieres.php', {
          method: 'POST',
          body: formData, // No Content-Type header - browser will set it automatically for FormData
        });
      } else {
        // Use JSON for submissions without images
        console.log("📦 No images, using JSON...");
        const payload = {
          reference: data.reference,
          title: data.title,
          color: data.color,
          price: data.price,
          quantity_type_id: data.quantity_type,
          quantity_total: data.quantity_total || 0,
          lowest_quantity_needed: data.lowest_quantity_needed || 0,
          medium_quantity_needed: data.medium_quantity_needed || 0,
          good_quantity_needed: data.good_quantity_needed || 0,
          location: data.location,
          category_id: data.category_id,
          id_fournisseur: data.id_fournisseur,
          materiere_type: data.materiere_type || 'intern',
          extern_customer_id: data.materiere_type === 'extern' && data.extern_customer_id ? data.extern_customer_id : null,
          is_replacable: data.is_replacable ? 1 : 0,
          replacable_material_id: data.is_replacable && data.replacable_material_id ? data.replacable_material_id : null,
          other_attributes: customAttributes.length > 0 ? 
            customAttributes.reduce((acc, attr) => {
              if (attr.key && attr.value) {
                acc[attr.key] = attr.value;
              }
              return acc;
            }, {} as Record<string, string>) : null,
          created_user: 1,
          modified_user: 1
        };

        console.log("📦 Sending JSON payload:", payload);

        response = await fetch('https://luccibyey.com.tn/production/api/matieres.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      }

      console.log("📡 API Response status:", response.status);
      
      let result;
      try {
        result = await response.json();
        console.log("📦 API Response data:", result);
      } catch (jsonError) {
        console.error("❌ Failed to parse JSON response:", jsonError);
        const textResponse = await response.text();
        console.error("📄 Raw response:", textResponse);
        throw new Error(`Server returned invalid JSON. Status: ${response.status}`);
      }

      if (response.ok && result.success) {
        console.log("✅ Material created successfully!");
        toast({
          title: "Succès",
          description: "Le matériau a été ajouté avec succès.",
        });
        navigate('/stock');
      } else {
        console.error("❌ API returned error:", result);
        toast({
          title: "Erreur",
          description: result.message || "Une erreur est survenue lors de l'ajout du matériau.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("💥 Error submitting material:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de l'ajout du matériau.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/stock')}
            className="mb-2 -ml-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour au stock
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Ajouter un matériau</h1>
          <p className="text-muted-foreground">
            Créez un nouveau matériau dans votre inventaire
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
              currentImage={imagePreview !== materialPlaceholder ? imagePreview : undefined}
              onRemoveImage={() => {
                setSelectedImage(null);
                setImagePreview(materialPlaceholder);
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
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Emplacement</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value || "Usine"}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Choisir l'emplacement" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-background border z-50">
                            <SelectItem value="Usine">Usine</SelectItem>
                            <SelectItem value="Lucci By Ey">Lucci By Ey</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Catégorie</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Choisir une catégorie" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.category_id} value={category.category_id.toString()}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="id_fournisseur"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fournisseur</FormLabel>
                        <FormControl>
                          <SupplierSelector
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder="Sélectionner un fournisseur"
                          />
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

                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Vous ne trouvez pas la bonne catégorie ?
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/categories')}
                  >
                    Gérer les catégories
                  </Button>
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
                        <Select value={field.value} onValueChange={field.onChange}>
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
                          <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Choisir le type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {quantityTypes && quantityTypes.length > 0 ? (
                                quantityTypes
                                  .filter(type => type.is_active)
                                  .map((type) => (
                                    <SelectItem key={type.quantity_type_id} value={type.quantity_type_id.toString()}>
                                      {type.label}
                                    </SelectItem>
                                  ))
                              ) : (
                                <SelectItem value="loading" disabled>
                                  Chargement...
                                </SelectItem>
                              )}
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
                      <FormLabel>Stock initial</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
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

              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                <p className="text-sm text-blue-700 dark:text-blue-300 font-medium mb-2">
                  💡 Comment fonctionnent les seuils de stock ?
                </p>
                <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                  <li>🔴 <strong>Critique</strong>: Stock très bas, réapprovisionnement urgent</li>
                  <li>🟠 <strong>Moyen</strong>: Stock faible, planifier un réapprovisionnement</li>
                  <li>🟢 <strong>Optimal</strong>: Stock suffisant pour la production</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Advanced Options */}
          <Card className="modern-card">
            <CardHeader>
              <CardTitle 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                Options avancées
                <Button variant="ghost" size="sm" type="button">
                  {showAdvanced ? "Masquer" : "Afficher"}
                </Button>
              </CardTitle>
            </CardHeader>
            {showAdvanced && (
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="is_replacable"
                  render={({ field }) => (
                     <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border bg-card p-4">
                       <div className="space-y-0.5">
                         <FormLabel className="text-base font-medium">Matériau remplaçable</FormLabel>
                         <div className="text-sm text-muted-foreground">
                           Ce matériau peut être substitué par un autre en cas de rupture
                         </div>
                       </div>
                       <FormControl>
                         <Switch
                           checked={field.value}
                           onCheckedChange={field.onChange}
                           className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-input"
                         />
                       </FormControl>
                     </FormItem>
                  )}
                />

                {form.watch("is_replacable") && (
                  <FormField
                    control={form.control}
                    name="replacable_material_id"
                    render={({ field }) => {
                      const selectedMaterial = availableMaterials.find(
                        material => material.id === field.value
                      );

                      return (
                        <FormItem>
                          <FormLabel>Matériau de remplacement *</FormLabel>
                          
                           <Popover open={replacementPopoverOpen} onOpenChange={setReplacementPopoverOpen}>
                             <PopoverTrigger asChild>
                               <FormControl>
                                 <Button
                                   variant="outline"
                                   role="combobox"
                                   className={`w-full justify-between ${!field.value && "text-muted-foreground"}`}
                                 >
                                   {selectedMaterial ? (
                                     <div className="flex flex-col items-start">
                                       <span className="font-medium">{selectedMaterial.title}</span>
                                       <div className="flex gap-2 text-xs text-muted-foreground">
                                         {selectedMaterial.reference && <span>Réf: {selectedMaterial.reference}</span>}
                                         {selectedMaterial.color && <span>• {selectedMaterial.color}</span>}
                                         {selectedMaterial.category_name && <span>• {selectedMaterial.category_name}</span>}
                                       </div>
                                     </div>
                                   ) : (
                                     "Sélectionner un matériau de remplacement"
                                   )}
                                   <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                 </Button>
                               </FormControl>
                             </PopoverTrigger>
                             <PopoverContent className="w-full p-0 z-50 bg-popover" align="start">
                               <Command className="w-full">
                                 <CommandInput 
                                   placeholder="Rechercher un matériau..." 
                                   className="h-9 text-sm border-0 focus:ring-0 focus:outline-none"
                                 />
                                 <CommandEmpty>
                                   {availableMaterials.length === 0 ? "Aucun matériau disponible" : "Aucun matériau trouvé"}
                                 </CommandEmpty>
                                 <CommandGroup className="max-h-64 overflow-y-auto">
                                   {availableMaterials.map((material) => (
                                     <CommandItem
                                       key={material.id}
                                       value={`${material.title} ${material.reference || ''} ${material.color || ''} ${material.category_name || ''}`}
                                       onSelect={() => {
                                         field.onChange(material.id);
                                         setReplacementPopoverOpen(false);
                                       }}
                                       className="cursor-pointer"
                                     >
                                       <div className="flex items-center justify-between w-full">
                                         <div className="flex flex-col">
                                           <span className="font-medium text-sm">{material.title}</span>
                                           <div className="flex gap-2 text-xs text-muted-foreground">
                                             {material.reference && <span>Réf: {material.reference}</span>}
                                             {material.color && <span>• Couleur: {material.color}</span>}
                                             {material.category_name && <span>• {material.category_name}</span>}
                                           </div>
                                         </div>
                                         <Check
                                           className={`ml-auto h-4 w-4 ${
                                             field.value === material.id ? "opacity-100" : "opacity-0"
                                           }`}
                                         />
                                       </div>
                                     </CommandItem>
                                   ))}
                                 </CommandGroup>
                               </Command>
                             </PopoverContent>
                           </Popover>
                          
                          <div className="text-xs text-muted-foreground">
                            Ce matériau sera utilisé automatiquement si le stock principal est épuisé
                          </div>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">Attributs personnalisés</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addCustomAttribute}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Ajouter
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {customAttributes.map((attribute, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 border border-border rounded-lg bg-card">
                        <div className="flex-1 grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-sm text-muted-foreground">Nom</Label>
                            <Input
                              placeholder="ex: origine"
                              value={attribute.key}
                              onChange={(e) => updateCustomAttribute(index, "key", e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-sm text-muted-foreground">Valeur</Label>
                            <Input
                              placeholder="ex: France"
                              value={attribute.value}
                              onChange={(e) => updateCustomAttribute(index, "value", e.target.value)}
                              className="mt-1"
                            />
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCustomAttribute(index)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    
                    {customAttributes.length === 0 && (
                      <div className="text-center py-6 text-muted-foreground border border-dashed border-border rounded-lg">
                        <Package2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Aucun attribut personnalisé</p>
                        <p className="text-xs">Cliquez sur "Ajouter" pour créer des attributs</p>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    Les attributs seront sauvegardés au format JSON
                  </p>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/stock')}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Création...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Créer le matériau
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

export default AddMaterial;