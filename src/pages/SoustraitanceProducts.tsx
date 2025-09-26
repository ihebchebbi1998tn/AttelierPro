import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadSoustraitanceProductImageAuto, deleteSoustraitanceProductImage } from '@/utils/soustraitanceService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { Plus, Search, Edit, Trash2, Upload, Image as ImageIcon, Package, Users, ShoppingCart, Eye } from 'lucide-react';
import axios from 'axios';

interface SoustraitanceClient {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}

interface SoustraitanceProduct {
  id: string;
  client_id: string;
  client_name: string;
  reference_product: string;
  nom_product: string;
  description_product: string;
  type_product: string;
  category_product: string;
  price_product: number;
  qnty_product: number;
  color_product: string;
  status_product: string;
  img_product?: string;
  img2_product?: string;
  img3_product?: string;
  img4_product?: string;
  img5_product?: string;
  created_at: string;
}

const SoustraitanceProducts = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<SoustraitanceProduct[]>([]);
  const [clients, setClients] = useState<SoustraitanceClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<SoustraitanceProduct | null>(null);
  const [uploadingImages, setUploadingImages] = useState<{ [key: string]: boolean }>({});
  
  const [formData, setFormData] = useState({
    client_id: '',
    reference_product: '',
    nom_product: '',
    description_product: '',
    type_product: '',
    category_product: '',
    price_product: 0,
    qnty_product: 0,
    color_product: '',
    status_product: 'active'
  });

  const API_BASE_URL = 'https://luccibyey.com.tn/production/api';

  useEffect(() => {
    fetchProducts();
    fetchClients();
  }, [selectedClient]); // Add selectedClient as dependency and remove the separate effect

  // Refresh products when returning to this page
  useEffect(() => {
    const handleFocus = () => {
      console.log('Page focused, refreshing products...');
      fetchProducts();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const fetchProducts = async () => {
    try {
      const params = selectedClient && selectedClient !== 'all' ? { client_id: selectedClient } : {};
      console.log('Fetching products with params:', params);
      
      const response = await axios.get(`${API_BASE_URL}/soustraitance_products.php`, { 
        params,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Full API Response:', {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data
      });
      
      if (response.data.success) {
        // Try different response structures to handle the API response correctly
        const products = response.data.data?.products || response.data.data || response.data.products || [];
        console.log('Products found:', products);
        setProducts(Array.isArray(products) ? products : []);
      } else {
        console.error('API Error:', response.data);
        toast({
          title: "Erreur API",
          description: `Erreur serveur: ${response.data.error || 'Erreur inconnue'}. Vérifiez les logs PHP.`,
          variant: "destructive",
        });
        // Try without params if filtered request fails
        if (Object.keys(params).length > 0) {
          console.log('Retrying without filters...');
          const fallbackResponse = await axios.get(`${API_BASE_URL}/soustraitance_products.php`);
          if (fallbackResponse.data.success) {
            const products = fallbackResponse.data.data?.products || fallbackResponse.data.data || fallbackResponse.data.products || [];
            setProducts(Array.isArray(products) ? products : []);
          }
        }
      }
    } catch (error) {
      console.error('Network/Request Error:', error);
      if (axios.isAxiosError(error)) {
        console.error('Axios Error Details:', {
          message: error.message,
          code: error.code,
          response: error.response?.data,
          status: error.response?.status
        });
      }
      toast({
        title: "Erreur de connexion",
        description: "Impossible de se connecter à l'API. Vérifiez la connexion réseau.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/soustraitance_clients.php`);
      if (response.data.success) {
        setClients(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.client_id || !formData.nom_product) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingProduct) {
        const response = await axios.put(`${API_BASE_URL}/soustraitance_products.php?id=${editingProduct.id}`, formData);
        if (response.data.success) {
          toast({
            title: "Succès",
            description: "Produit mis à jour avec succès",
          });
        }
      } else {
        const response = await axios.post(`${API_BASE_URL}/soustraitance_products.php`, formData);
        if (response.data.success) {
          toast({
            title: "Succès",
            description: "Produit créé avec succès",
          });
        }
      }
      
      setIsDialogOpen(false);
      resetForm();
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la sauvegarde",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      return;
    }

    try {
      const response = await axios.delete(`${API_BASE_URL}/soustraitance_products.php?id=${productId}`);
      if (response.data.success) {
        toast({
          title: "Succès",
          description: "Produit supprimé avec succès",
        });
        fetchProducts();
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression",
        variant: "destructive",
      });
    }
  };

  const findNextAvailableImageSlot = (product: SoustraitanceProduct): string | null => {
    const imageSlots = ['img_product', 'img2_product', 'img3_product', 'img4_product', 'img5_product'];
    
    for (const slot of imageSlots) {
      const imageUrl = product[slot as keyof SoustraitanceProduct] as string;
      if (!imageUrl) {
        return slot;
      }
    }
    return null; // All slots are filled
  };

  const handleImageUpload = async (productId: string, file: File) => {
    const uploadKey = `${productId}-upload`;
    setUploadingImages(prev => ({ ...prev, [uploadKey]: true }));

    try {
      const result = await uploadSoustraitanceProductImageAuto(productId, file);
      
      toast({
        title: "Succès",
        description: `Image uploadée avec succès dans ${result.image_slot}`,
      });
      fetchProducts();
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
  };

  const handleImageDelete = async (productId: string, imageSlot: string) => {
    try {
      await deleteSoustraitanceProductImage(productId, imageSlot);
      
      toast({
        title: "Succès",
        description: "Image supprimée avec succès",
      });
      fetchProducts();
    } catch (error: any) {
      console.error('Error deleting image:', error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la suppression de l'image",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      client_id: '',
      reference_product: '',
      nom_product: '',
      description_product: '',
      type_product: '',
      category_product: '',
      price_product: 0,
      qnty_product: 0,
      color_product: '',
      status_product: 'active'
    });
    setEditingProduct(null);
  };

  const handleEdit = (product: SoustraitanceProduct) => {
    setFormData({
      client_id: product.client_id,
      reference_product: product.reference_product || '',
      nom_product: product.nom_product,
      description_product: product.description_product || '',
      type_product: product.type_product || '',
      category_product: product.category_product || '',
      price_product: product.price_product || 0,
      qnty_product: product.qnty_product || 0,
      color_product: product.color_product || '',
      status_product: product.status_product || 'active'
    });
    setEditingProduct(product);
    setIsDialogOpen(true);
  };

  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return '';
    return `${API_BASE_URL}/${imagePath}`;
  };

  const filteredProducts = products.filter(product =>
    product.nom_product.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.reference_product && product.reference_product.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const stats = {
    total: products.length,
    active: products.filter(p => p.status_product === 'active').length,
    clients: new Set(products.map(p => p.client_id)).size
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Chargement des produits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Produits Sous-traitance</h1>
          <p className="text-muted-foreground">Gérez les produits des clients sous-traitants</p>
        </div>
        <Button onClick={() => navigate('/soustraitance-products/add')} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Ajouter Produit
        </Button>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button style={{ display: 'none' }}>Hidden</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'Modifier le produit' : 'Ajouter un nouveau produit'}
              </DialogTitle>
              <DialogDescription>
                Remplissez les informations du produit sous-traitance
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="client_id">Client *</Label>
                  <Select value={formData.client_id} onValueChange={(value) => setFormData({...formData, client_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="type_product">Type</Label>
                  <Input
                    id="type_product"
                    value={formData.type_product}
                    onChange={(e) => setFormData({...formData, type_product: e.target.value})}
                    placeholder="Type"
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
                  <Label htmlFor="color_product">Couleur</Label>
                  <Input
                    id="color_product"
                    value={formData.color_product}
                    onChange={(e) => setFormData({...formData, color_product: e.target.value})}
                    placeholder="Couleur"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="price_product">Prix</Label>
                  <Input
                    id="price_product"
                    type="number"
                    step="0.01"
                    value={formData.price_product}
                    onChange={(e) => setFormData({...formData, price_product: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label htmlFor="qnty_product">Quantité</Label>
                  <Input
                    id="qnty_product"
                    type="number"
                    value={formData.qnty_product}
                    onChange={(e) => setFormData({...formData, qnty_product: parseInt(e.target.value) || 0})}
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
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit">
                  {editingProduct ? 'Mettre à jour' : 'Créer'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-primary text-primary-foreground border-primary">
          <CardContent className="flex items-center p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary-foreground/20">
                <Package className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-primary-foreground">{stats.total}</p>
                <p className="text-sm text-primary-foreground/80">Total Produits</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-primary text-primary-foreground border-primary">
          <CardContent className="flex items-center p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary-foreground/20">
                <ShoppingCart className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-primary-foreground">{stats.active}</p>
                <p className="text-sm text-primary-foreground/80">Produits Actifs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-primary text-primary-foreground border-primary">
          <CardContent className="flex items-center p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary-foreground/20">
                <Users className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-primary-foreground">{stats.clients}</p>
                <p className="text-sm text-primary-foreground/80">Clients Actifs</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products Table */}
      <Card className="modern-card">
        <CardHeader className="pb-4">
          <CardTitle>Liste des Produits</CardTitle>
          <CardDescription>
            Produits des clients sous-traitants avec leurs informations
          </CardDescription>
        </CardHeader>
        
        {/* Search and Filter */}
        <div className="px-6 pb-4 space-y-4">
          <div className="flex gap-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un produit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 rounded-xl"
              />
            </div>
            <Select value={selectedClient} onValueChange={(value) => {
              setSelectedClient(value);
              setTimeout(fetchProducts, 100);
            }}>
              <SelectTrigger className="max-w-xs">
                <SelectValue placeholder="Filtrer par client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les clients</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Images</TableHead>
                  <TableHead>Produit</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow 
                    key={product.id} 
                    className="cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => navigate(`/soustraitance-products/${product.id}`)}
                  >
                    <TableCell>
                      <div className="flex gap-1">
                        {['img_product', 'img2_product', 'img3_product', 'img4_product', 'img5_product'].map((imageSlot, index) => {
                          const imageUrl = product[imageSlot as keyof SoustraitanceProduct] as string;
                          const uploadKey = `${product.id}-upload`;
                          const isUploading = uploadingImages[uploadKey];
                          
                          return (
                            <div key={imageSlot} className="relative group">
                              <div className="w-12 h-12 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary transition-colors overflow-hidden">
                                {imageUrl ? (
                                  <>
                                    <img
                                      src={getImageUrl(imageUrl)}
                                      alt={`${product.nom_product} ${index + 1}`}
                                      className="w-full h-full object-cover"
                                    />
                                    {/* Delete overlay */}
                                    <div 
                                      className="absolute inset-0 bg-red-500/80 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleImageDelete(product.id, imageSlot);
                                      }}
                                    >
                                      <Trash2 className="h-3 w-3 text-white" />
                                    </div>
                                  </>
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    {isUploading ? (
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                    ) : (
                                      <ImageIcon className="h-4 w-4 text-gray-400" />
                                    )}
                                  </div>
                                )}
                              </div>
                              
                              {/* Upload overlay for empty slots */}
                              {!imageUrl && !isUploading && (
                                <label 
                                  className="absolute inset-0 cursor-pointer bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Upload className="h-3 w-3 text-white" />
                                  <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/gif,image/webp"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        handleImageUpload(product.id, file);
                                      }
                                    }}
                                  />
                                </label>
                              )}
                            </div>
                          );
                        })}
                        
                        {/* Add button for quick upload to next available slot */}
                        <div className="relative">
                          <label className="cursor-pointer block w-12 h-12 border-2 border-dashed border-primary/40 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors flex items-center justify-center group"
                            onClick={(e) => e.stopPropagation()}>
                            {uploadingImages[`${product.id}-upload`] ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                            ) : (
                              <Plus className="h-4 w-4 text-primary/60 group-hover:text-primary" />
                            )}
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/gif,image/webp"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleImageUpload(product.id, file);
                                }
                              }}
                              disabled={uploadingImages[`${product.id}-upload`]}
                            />
                          </label>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{product.nom_product}</p>
                        <p className="text-sm text-muted-foreground">{product.reference_product}</p>
                      </div>
                    </TableCell>
                    <TableCell>{product.client_name}</TableCell>
                    <TableCell>{product.category_product || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={product.status_product === 'active' ? 'default' : 'secondary'}>
                        {product.status_product}
                      </Badge>
                    </TableCell>
                    <TableCell>
                       <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/soustraitance-products/edit/${product.id}`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SoustraitanceProducts;