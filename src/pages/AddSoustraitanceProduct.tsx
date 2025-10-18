import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Upload, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import axios from 'axios';
import { uploadSoustraitanceProductImage, getSoustraitanceClients, createSoustraitanceProduct, updateSoustraitanceProduct, getSoustraitanceProduct } from '@/utils/soustraitanceService';
import { authService } from '@/lib/authService';

interface SoustraitanceClient {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}

interface ProductFormData {
  client_id: string;
  boutique_origin: string;
  external_product_id: string;
  reference_product: string;
  nom_product: string;
  description_product: string;
  type_product: string;
  category_product: string;
  itemgroup_product: string;
  price_product: number;
  qnty_product: number;
  color_product: string;
  collection_product: string;
  status_product: string;
  auto_replenishment: boolean;
  auto_replenishment_quantity: number;
  auto_replenishment_quantity_sizes: string;
  sizes_data: string;
  discount_product: number;
  related_products: string;
  // Size fields
  size_xs: number;
  size_s: number;
  size_m: number;
  size_l: number;
  size_xl: number;
  size_xxl: number;
  size_3xl: number;
  size_4xl: number;
  size_30: number;
  size_31: number;
  size_32: number;
  size_33: number;
  size_34: number;
  size_36: number;
  size_38: number;
  size_39: number;
  size_40: number;
  size_41: number;
  size_42: number;
  size_43: number;
  size_44: number;
  size_45: number;
  size_46: number;
  size_47: number;
  size_48: number;
  size_50: number;
  size_52: number;
  size_54: number;
  size_56: number;
  size_58: number;
  size_60: number;
  size_62: number;
  size_64: number;
  size_66: number;
  size_85: number;
  size_90: number;
  size_95: number;
  size_100: number;
  size_105: number;
  size_110: number;
  size_115: number;
  size_120: number;
  size_125: number;
  no_size: number;
  materials_configured: boolean;
}

const AddSoustraitanceProduct = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  
  const [clients, setClients] = useState<SoustraitanceClient[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState<{ [key: string]: boolean }>({});
  const [imageUrls, setImageUrls] = useState<{ [key: string]: string }>({});
  const [clientSelectOpen, setClientSelectOpen] = useState(false);
  const [tempImagePaths, setTempImagePaths] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  
  const [formData, setFormData] = useState<ProductFormData>({
    client_id: '',
    boutique_origin: '',
    external_product_id: '',
    reference_product: '',
    nom_product: '',
    description_product: '',
    type_product: '',
    category_product: '',
    itemgroup_product: '',
    price_product: 0,
    qnty_product: 0,
    color_product: '',
    collection_product: '',
    status_product: 'active',
    auto_replenishment: false,
    auto_replenishment_quantity: 0,
    auto_replenishment_quantity_sizes: '',
    sizes_data: '',
    discount_product: 0,
    related_products: '',
    // Size fields
    size_xs: 0,
    size_s: 0,
    size_m: 0,
    size_l: 0,
    size_xl: 0,
    size_xxl: 0,
    size_3xl: 0,
    size_4xl: 0,
    size_30: 0,
    size_31: 0,
    size_32: 0,
    size_33: 0,
    size_34: 0,
    size_36: 0,
    size_38: 0,
    size_39: 0,
    size_40: 0,
    size_41: 0,
    size_42: 0,
    size_43: 0,
    size_44: 0,
    size_45: 0,
    size_46: 0,
    size_47: 0,
    size_48: 0,
    size_50: 0,
    size_52: 0,
    size_54: 0,
    size_56: 0,
    size_58: 0,
    size_60: 0,
    size_62: 0,
    size_64: 0,
    size_66: 0,
    size_85: 0,
    size_90: 0,
    size_95: 0,
    size_100: 0,
    size_105: 0,
    size_110: 0,
    size_115: 0,
    size_120: 0,
    size_125: 0,
    no_size: 0,
    materials_configured: false,
  });

  const API_BASE_URL = 'https://luccibyey.com.tn/production/api';

  useEffect(() => {
    const loadData = async () => {
      await fetchClients();
      
      if (isEdit) {
        fetchProduct();
      }
    };
    
    loadData();
  }, [id, isEdit]);
  
  // Auto-set client for soustraitance users after clients are loaded
  useEffect(() => {
    if (!isEdit && clients.length > 0 && !formData.client_id) {
      const currentUser = authService.getCurrentUser();
      const isSoustraitanceUser = currentUser?.user_type === 'sous_traitance' || currentUser?.role === 'sous_traitance';
      if (isSoustraitanceUser && currentUser.email) {
        console.log('🔍 Looking for client with email:', currentUser.email);
        console.log('📋 Available clients:', clients);
        const matchingClient = clients.find(c => c.email === currentUser.email);
        console.log('✅ Matching client found:', matchingClient);
        if (matchingClient) {
          setFormData(prev => ({ ...prev, client_id: matchingClient.id }));
        } else {
          // No matching client found - show error
          console.error('❌ No matching client found for email:', currentUser.email);
          toast({
            title: "Erreur de configuration",
            description: "Aucun client trouvé correspondant à votre email. Veuillez contacter l'administrateur.",
            variant: "destructive",
          });
        }
      }
    }
  }, [clients, isEdit, formData.client_id]);

  const fetchClients = async () => {
    try {
      const clientsData = await getSoustraitanceClients();
      setClients(clientsData);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les clients",
        variant: "destructive",
      });
    }
  };

  const fetchProduct = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const product = await getSoustraitanceProduct(id);
      setFormData({
        client_id: product.client_id || '',
        boutique_origin: product.boutique_origin || '',
        external_product_id: product.external_product_id || '',
        reference_product: product.reference_product || '',
        nom_product: product.nom_product || '',
        description_product: product.description_product || '',
        type_product: product.type_product || '',
        category_product: product.category_product || '',
        itemgroup_product: product.itemgroup_product || '',
        price_product: product.price_product || 0,
        qnty_product: product.qnty_product || 0,
        color_product: product.color_product || '',
        collection_product: product.collection_product || '',
        status_product: product.status_product || 'active',
        auto_replenishment: Boolean(product.auto_replenishment),
        auto_replenishment_quantity: product.auto_replenishment_quantity || 0,
        auto_replenishment_quantity_sizes: product.auto_replenishment_quantity_sizes || '',
        sizes_data: product.sizes_data || '',
        discount_product: product.discount_product || 0,
        related_products: product.related_products || '',
        // Size fields - convert to 1/0 for checkboxes
        size_xs: product.size_xs ? 1 : 0,
        size_s: product.size_s ? 1 : 0,
        size_m: product.size_m ? 1 : 0,
        size_l: product.size_l ? 1 : 0,
        size_xl: product.size_xl ? 1 : 0,
        size_xxl: product.size_xxl ? 1 : 0,
        size_3xl: product.size_3xl ? 1 : 0,
        size_4xl: product.size_4xl ? 1 : 0,
        size_30: product.size_30 ? 1 : 0,
        size_31: product.size_31 ? 1 : 0,
        size_32: product.size_32 ? 1 : 0,
        size_33: product.size_33 ? 1 : 0,
        size_34: product.size_34 ? 1 : 0,
        size_36: product.size_36 ? 1 : 0,
        size_38: product.size_38 ? 1 : 0,
        size_39: product.size_39 ? 1 : 0,
        size_40: product.size_40 ? 1 : 0,
        size_41: product.size_41 ? 1 : 0,
        size_42: product.size_42 ? 1 : 0,
        size_43: product.size_43 ? 1 : 0,
        size_44: product.size_44 ? 1 : 0,
        size_45: product.size_45 ? 1 : 0,
        size_46: product.size_46 ? 1 : 0,
        size_47: product.size_47 ? 1 : 0,
        size_48: product.size_48 ? 1 : 0,
        size_50: product.size_50 ? 1 : 0,
        size_52: product.size_52 ? 1 : 0,
        size_54: product.size_54 ? 1 : 0,
        size_56: product.size_56 ? 1 : 0,
        size_58: product.size_58 ? 1 : 0,
        size_60: product.size_60 ? 1 : 0,
        size_62: product.size_62 ? 1 : 0,
        size_64: product.size_64 ? 1 : 0,
        size_66: product.size_66 ? 1 : 0,
        size_85: product.size_85 ? 1 : 0,
        size_90: product.size_90 ? 1 : 0,
        size_95: product.size_95 ? 1 : 0,
        size_100: product.size_100 ? 1 : 0,
        size_105: product.size_105 ? 1 : 0,
        size_110: product.size_110 ? 1 : 0,
        size_115: product.size_115 ? 1 : 0,
        size_120: product.size_120 ? 1 : 0,
        size_125: product.size_125 ? 1 : 0,
        no_size: product.no_size ? 1 : 0,
        materials_configured: Boolean(product.materials_configured),
      });

      // Set image URLs
      const images: { [key: string]: string } = {};
      ['img_product', 'img2_product', 'img3_product', 'img4_product', 'img5_product'].forEach(field => {
        if (product[field]) {
          images[field] = `${API_BASE_URL}/${product[field]}`;
        }
      });
      setImageUrls(images);
    } catch (error) {
      console.error('Error fetching product:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger le produit",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper function to handle no_size toggle
  const handleNoSizeChange = (checked: boolean) => {
    if (checked) {
      // If no_size is checked, uncheck all other sizes
      const sizeFields = [
        'size_xs', 'size_s', 'size_m', 'size_l', 'size_xl', 'size_xxl', 'size_3xl', 'size_4xl',
        'size_30', 'size_31', 'size_32', 'size_33', 'size_34', 'size_36', 'size_38', 'size_39',
        'size_40', 'size_41', 'size_42', 'size_43', 'size_44', 'size_45', 'size_46', 'size_47',
        'size_48', 'size_50', 'size_52', 'size_54', 'size_56', 'size_58', 'size_60', 'size_62',
        'size_64', 'size_66', 'size_85', 'size_90', 'size_95', 'size_100', 'size_105', 'size_110',
        'size_115', 'size_120', 'size_125'
      ];
      const updatedData = { ...formData, no_size: 1 } as ProductFormData;
      sizeFields.forEach(field => {
        (updatedData as any)[field] = 0;
      });
      setFormData(updatedData);
    } else {
      setFormData({ ...formData, no_size: 0 });
    }
  };

  // Helper function to handle individual size changes
  const handleSizeChange = (sizeField: string, checked: boolean) => {
    const updatedData = { ...formData, [sizeField]: checked ? 1 : 0 } as ProductFormData;
    
    // If any size is checked, uncheck no_size
    if (checked) {
      updatedData.no_size = 0;
    }
    
    setFormData(updatedData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate client_id
    if (!formData.client_id) {
      const currentUser = authService.getCurrentUser();
      const isSoustraitanceUser = currentUser?.user_type === 'sous_traitance' || currentUser?.role === 'sous_traitance';
      
      toast({
        title: "Erreur",
        description: isSoustraitanceUser 
          ? "Client non configuré. Veuillez contacter l'administrateur pour créer votre profil client."
          : "Veuillez sélectionner un client",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.nom_product) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir le nom du produit",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      if (isEdit) {
        await updateSoustraitanceProduct(id!, formData);
        toast({
          title: "Succès",
          description: "Produit mis à jour avec succès",
        });
        navigate('/soustraitance-products');
      } else {
        // Create product with images
        const response = await createSoustraitanceProduct(formData, selectedFiles);
        
        toast({
          title: "Succès",
          description: `Produit créé avec succès${selectedFiles.length > 0 ? ` avec ${selectedFiles.length} image(s)` : ''}`,
        });
        navigate('/soustraitance-products');
      }
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la sauvegarde",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getNextAvailableSlot = () => {
    const imageSlots = ['img_product', 'img2_product', 'img3_product', 'img4_product', 'img5_product'];
    for (const slot of imageSlots) {
      if (!imageUrls[slot]) {
        return slot;
      }
    }
    
    if (Object.keys(imageUrls).length >= 5) {
      toast({
        title: "Limite atteinte",
        description: "Vous ne pouvez ajouter que 5 images maximum",
        variant: "destructive",
      });
    }
    return null;
  };

  const removeImage = (imageSlot: string) => {
    // Remove from preview
    setImageUrls(prev => {
      const newUrls = { ...prev };
      delete newUrls[imageSlot];
      return newUrls;
    });
    
    // Remove from selected files
    setSelectedFiles(prev => {
      const newFiles = [...prev];
      const slotIndex = ['img_product', 'img2_product', 'img3_product', 'img4_product', 'img5_product'].indexOf(imageSlot);
      if (slotIndex !== -1) {
        newFiles.splice(slotIndex, 1);
      }
      return newFiles;
    });
    
    toast({
      title: "Image supprimée",
      description: "L'image a été retirée de la liste",
    });
  };

  const handleImageUpload = async (imageSlot: string, file: File) => {
    if (!isEdit) {
      // Store file for upload when creating product
      setSelectedFiles(prev => {
        const newFiles = [...prev];
        const slotIndex = ['img_product', 'img2_product', 'img3_product', 'img4_product', 'img5_product'].indexOf(imageSlot);
        newFiles[slotIndex] = file;
        return newFiles;
      });
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setImageUrls(prev => ({ ...prev, [imageSlot]: previewUrl }));
      
      toast({
        title: "Image ajoutée",
        description: "L'image sera uploadée lors de la création du produit",
      });
    } else {
      // Upload directly for edit mode
      const uploadKey = `${id}-${imageSlot}`;
      setUploadingImages(prev => ({ ...prev, [uploadKey]: true }));

      try {
        await uploadSoustraitanceProductImage(id!, imageSlot, file);
        setImageUrls(prev => ({ 
          ...prev, 
          [imageSlot]: `${API_BASE_URL}/uploads/soustraitance_products/${file.name}?${Date.now()}`
        }));
        
        toast({
          title: "Succès",
          description: "Image uploadée avec succès",
        });
      } catch (error: any) {
        console.error('Error uploading image:', error);
        toast({
          title: "Erreur",
          description: error.message || "Erreur lors de l'upload de l'image",
          variant: "destructive",
        });
      } finally {
        setUploadingImages(prev => ({ ...prev, [uploadKey]: false }));
      }
    }
  };


  const clothingSizes = ['xs', 's', 'm', 'l', 'xl', 'xxl', '3xl', '4xl'];
  const shoeSizes = ['30', '31', '32', '33', '34', '36', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48'];
  const waistSizes = ['50', '52', '54', '56', '58', '60', '62', '64', '66'];
  const otherSizes = ['85', '90', '95', '100', '105', '110', '115', '120', '125'];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" onClick={() => navigate('/soustraitance-products')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {isEdit ? 'Modifier le produit' : 'Ajouter un produit'}
          </h1>
          <p className="text-muted-foreground">
            {isEdit ? 'Modifiez les informations du produit' : 'Créez un nouveau produit sous-traitance'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
            <CardDescription>
              Informations de base du produit
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="client_id">Client *</Label>
              {(() => {
                const currentUser = authService.getCurrentUser();
                const isSoustraitanceUser = currentUser?.user_type === 'sous_traitance' || currentUser?.role === 'sous_traitance';
                
                if (isSoustraitanceUser && !isEdit) {
                  // Auto-filled and disabled for soustraitance clients creating new products
                  const selectedClient = clients.find((client) => client.id === formData.client_id);
                  const displayValue = selectedClient 
                    ? selectedClient.name 
                    : (clients.length === 0 
                      ? "Chargement..." 
                      : "⚠️ Client non configuré - Contactez l'administrateur");
                  
                  return (
                    <Input
                      value={displayValue}
                      disabled
                      className={cn("bg-muted", !selectedClient && clients.length > 0 && "border-destructive text-destructive")}
                    />
                  );
                } else {
                  // Normal dropdown for admin users or when editing
                  return (
                    <Popover open={clientSelectOpen} onOpenChange={setClientSelectOpen}>
...
                    </Popover>
                  );
                }
              })()}
            </div>

            <div>
              <Label htmlFor="reference_product">Référence</Label>
              <Input
                id="reference_product"
                value={formData.reference_product}
                onChange={(e) => setFormData({...formData, reference_product: e.target.value})}
                placeholder="REF-001"
              />
            </div>

            <div>
              <Label htmlFor="nom_product">Nom du produit *</Label>
              <Input
                id="nom_product"
                value={formData.nom_product}
                onChange={(e) => setFormData({...formData, nom_product: e.target.value})}
                placeholder="Nom du produit"
                required
              />
            </div>

            <div>
              <Label htmlFor="description_product">Description</Label>
              <Textarea
                id="description_product"
                value={formData.description_product}
                onChange={(e) => setFormData({...formData, description_product: e.target.value})}
                placeholder="Description du produit"
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Product Details */}
        <Card>
          <CardHeader>
            <CardTitle>Détails du produit</CardTitle>
            <CardDescription>
              Informations détaillées et catégorisation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="type_product">Type</Label>
                <Input
                  id="type_product"
                  value={formData.type_product}
                  onChange={(e) => setFormData({...formData, type_product: e.target.value})}
                  placeholder="Type de produit"
                />
              </div>

              <div>
                <Label htmlFor="category_product">Catégorie</Label>
                <Input
                  id="category_product"
                  value={formData.category_product}
                  onChange={(e) => setFormData({...formData, category_product: e.target.value})}
                  placeholder="Catégorie"
                />
              </div>

              <div>
                <Label htmlFor="itemgroup_product">Groupe d'articles</Label>
                <Input
                  id="itemgroup_product"
                  value={formData.itemgroup_product}
                  onChange={(e) => setFormData({...formData, itemgroup_product: e.target.value})}
                  placeholder="Groupe d'articles"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="color_product">Couleur</Label>
                <Input
                  id="color_product"
                  value={formData.color_product}
                  onChange={(e) => setFormData({...formData, color_product: e.target.value})}
                  placeholder="Couleur"
                />
              </div>

              <div>
                <Label htmlFor="collection_product">Collection</Label>
                <Input
                  id="collection_product"
                  value={formData.collection_product}
                  onChange={(e) => setFormData({...formData, collection_product: e.target.value})}
                  placeholder="Collection"
                />
              </div>

              <div>
                <Label htmlFor="status_product">Statut</Label>
                <Select value={formData.status_product} onValueChange={(value) => setFormData({...formData, status_product: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="inactive">Inactif</SelectItem>
                    <SelectItem value="draft">Brouillon</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sizes - Only show when creating new product */}
        {!isEdit && (
          <Card>
            <CardHeader>
              <CardTitle>Configuration des tailles</CardTitle>
              <CardDescription>
                Cochez les tailles disponibles pour ce produit
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* No Size Option */}
              <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="no_size"
                    checked={formData.no_size === 1}
                    onCheckedChange={handleNoSizeChange}
                    className="w-5 h-5"
                  />
                  <div>
                    <Label htmlFor="no_size" className="text-sm font-semibold cursor-pointer text-blue-700 dark:text-blue-300">
                      Aucune taille spécifique (Accessoires, etc.)
                    </Label>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      Cochez cette option pour les produits sans tailles (accessoires, bijoux, etc.)
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Regular Sizes - Disabled if no_size is checked */}
              <div className={formData.no_size === 1 ? "opacity-50 pointer-events-none" : ""}>
              
              {/* Clothing Sizes */}
              <div>
                <h4 className="font-medium mb-3">Tailles vêtements</h4>
                <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
                  {clothingSizes.map((size) => (
                    <div key={size} className="flex items-center space-x-3">
                      <Checkbox
                        id={`size_${size}`}
                        checked={formData[`size_${size}` as keyof ProductFormData] === 1}
                      onCheckedChange={(checked) => handleSizeChange(`size_${size}`, !!checked)}
                        className="w-5 h-5"
                        disabled={formData.no_size === 1}
                      />
                      <Label htmlFor={`size_${size}`} className="text-sm uppercase cursor-pointer font-medium">{size}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shoe Sizes */}
              <div>
                <h4 className="font-medium mb-3">Pointures chaussures</h4>
                <div className="grid grid-cols-6 md:grid-cols-9 gap-4">
                  {shoeSizes.map((size) => (
                    <div key={size} className="flex items-center space-x-3">
                      <Checkbox
                        id={`size_${size}`}
                        checked={formData[`size_${size}` as keyof ProductFormData] === 1}
                      onCheckedChange={(checked) => handleSizeChange(`size_${size}`, !!checked)}
                        className="w-5 h-5"
                        disabled={formData.no_size === 1}
                      />
                      <Label htmlFor={`size_${size}`} className="text-sm cursor-pointer font-medium">{size}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Waist Sizes */}
              <div>
                <h4 className="font-medium mb-3">Tours de taille</h4>
                <div className="grid grid-cols-5 md:grid-cols-9 gap-4">
                  {waistSizes.map((size) => (
                    <div key={size} className="flex items-center space-x-3">
                      <Checkbox
                        id={`size_${size}`}
                        checked={formData[`size_${size}` as keyof ProductFormData] === 1}
                        onCheckedChange={(checked) => handleSizeChange(`size_${size}`, !!checked)}
                        className="w-5 h-5"
                        disabled={formData.no_size === 1}
                      />
                      <Label htmlFor={`size_${size}`} className="text-sm cursor-pointer font-medium">{size}</Label>
                    </div>
                  ))}
                </div>
              </div>
              
              </div> {/* End of disabled wrapper */}

              {/* Other Sizes */}
              <div>
                <h4 className="font-medium mb-3">Autres tailles</h4>
                <div className="grid grid-cols-5 md:grid-cols-9 gap-4">
                  {otherSizes.map((size) => (
                    <div key={size} className="flex items-center space-x-3">
                      <Checkbox
                        id={`size_${size}`}
                        checked={formData[`size_${size}` as keyof ProductFormData] === 1}
                        onCheckedChange={(checked) => setFormData({...formData, [`size_${size}`]: checked ? 1 : 0})}
                        className="w-5 h-5"
                      />
                      <Label htmlFor={`size_${size}`} className="text-sm cursor-pointer font-medium">{size}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Images */}
        <div className="space-y-4">
          {/* Single Upload Area */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition-colors">
            <label className="cursor-pointer block">
              <div className="space-y-2">
                <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                <div>
                  <p className="text-lg font-medium text-gray-900">Cliquez pour ajouter des images</p>
                  <p className="text-sm text-gray-500">PNG, JPG, GIF, WebP jusqu'à 10MB (max 5 images)</p>
                </div>
              </div>
              <input
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  files.forEach(file => {
                    const nextSlot = getNextAvailableSlot();
                    if (nextSlot) {
                      handleImageUpload(nextSlot, file);
                    }
                  });
                }}
              />
            </label>
          </div>

          {/* Preview Grid */}
          {Object.keys(imageUrls).length > 0 && (
            <div>
              <h4 className="font-medium mb-3">Images ajoutées ({Object.keys(imageUrls).length}/5)</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {['img_product', 'img2_product', 'img3_product', 'img4_product', 'img5_product'].map((imageSlot, index) => {
                  if (!imageUrls[imageSlot]) return null;
                  
                  const uploadKey = isEdit ? `${id}-${imageSlot}` : imageSlot;
                  return (
                    <div key={imageSlot} className="relative group">
                      <div className="w-full h-32 border rounded-lg overflow-hidden">
                        <img
                          src={imageUrls[imageSlot]}
                          alt={`Image ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={() => removeImage(imageSlot)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                      
                      {/* Loading overlay */}
                      {uploadingImages[uploadKey] && (
                        <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>


        {/* Action Buttons */}
        <div className="flex gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/soustraitance-products')}
          >
            Annuler
          </Button>
          <Button type="submit" disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Sauvegarde...' : (isEdit ? 'Mettre à jour' : 'Créer le produit')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddSoustraitanceProduct;
