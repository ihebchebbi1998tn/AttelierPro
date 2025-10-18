import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Package, ShoppingBag, TrendingUp, Phone, Mail, MapPin, Globe, Calendar, Eye, Edit, MoreHorizontal, Building2, Package2, BarChart3, Upload, FileText, Download, Trash2, Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import axios from 'axios';

interface SoustraitanceClient {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  created_date: string;
  updated_date: string;
}

interface SoustraitanceProduct {
  id: string;
  client_id: string;
  boutique_origin: string;
  external_product_id: string;
  reference_product: string;
  nom_product: string;
  img_product: string;
  description_product: string;
  type_product: string;
  category_product: string;
  price_product: number;
  qnty_product: number;
  color_product: string;
  status_product: string;
  created_at: string;
}

interface Material {
  id: string;
  nom: string;
  reference: string;
  description: string;
  quantite_stock: number;
  quantite_min: number;
  quantite_max: number;
  prix_unitaire: number;
  couleur: string;
  taille: string;
  fournisseur: string;
  active: boolean;
}

interface ProductMaterial {
  id: string;
  product_id: string;
  material_id: string;
  quantity_needed: number;
  size_specific: string;
  notes: string;
  material_name: string;
  material_reference: string;
  quantity_type_name: string;
}

interface ClientFile {
  file_id: string;
  client_id: string;
  file_path: string;
  original_filename: string;
  filename: string;
  file_type: string;
  file_size: number;
  mime_type: string;
  uploaded_user: string;
  upload_date: string;
  description: string;
}

const ClientSoustraitanceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState<SoustraitanceClient | null>(null);
  const [products, setProducts] = useState<SoustraitanceProduct[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [productMaterials, setProductMaterials] = useState<{ [key: string]: ProductMaterial[] }>({});
  const [files, setFiles] = useState<ClientFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDescription, setFileDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewFile, setPreviewFile] = useState<ClientFile | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    website: ''
  });
  const [updating, setUpdating] = useState(false);

  const API_BASE_URL = 'https://luccibyey.com.tn/production/api';

  useEffect(() => {
    if (id) {
      fetchClientDetails();
      fetchClientFiles();
    }
  }, [id]);

  const fetchClientDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/soustraitance_client_details.php?client_id=${id}`);
      
      if (response.data.success) {
        setClient(response.data.data.client);
        setProducts(response.data.data.products);
        setMaterials(response.data.data.materials);
        setProductMaterials(response.data.data.product_materials);
      } else {
        toast({
          title: "Erreur",
          description: response.data.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching client details:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la récupération des détails du client",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchClientFiles = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/soustraitance_client_files.php?client_id=${id}`);
      if (response.data.success) {
        setFiles(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching client files:', error);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !id) return;

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('client_id', id);
    formData.append('description', fileDescription);
    formData.append('uploaded_user', 'Admin');

    try {
      setUploading(true);
      const response = await axios.post(`${API_BASE_URL}/soustraitance_client_files.php`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        toast({
          title: "Succès",
          description: "Fichier uploadé avec succès",
        });
        setUploadDialogOpen(false);
        setSelectedFile(null);
        setFileDescription('');
        fetchClientFiles();
      } else {
        toast({
          title: "Erreur",
          description: response.data.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de l'upload du fichier",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/soustraitance_client_files.php`, {
        data: { file_id: fileId },
      });

      if (response.data.success) {
        toast({
          title: "Succès",
          description: "Fichier supprimé avec succès",
        });
        fetchClientFiles();
      } else {
        toast({
          title: "Erreur",
          description: response.data.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression du fichier",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('image')) return '🖼️';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('text')) return '📄';
    return '📁';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const validateFile = (file: File) => {
    const maxSize = 20 * 1024 * 1024; // 20MB
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv'
    ];

    if (file.size > maxSize) {
      toast({
        title: "Erreur",
        description: "Le fichier doit faire moins de 20MB",
        variant: "destructive",
      });
      return false;
    }

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Erreur",
        description: "Type de fichier non supporté. Formats acceptés: PDF, Images, Word, Excel, Text, CSV",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const isImageFile = (mimeType: string) => {
    return mimeType.startsWith('image/');
  };

  const handleFilePreview = (file: ClientFile) => {
    setPreviewFile(file);
    setPreviewModalOpen(true);
  };

  const getFileUrl = (filePath: string) => {
    if (!filePath) return '';
    if (filePath.startsWith('http')) return filePath;
    
    // Clean up the path and ensure proper format
    let path = filePath.replace(/^\/+/, ''); // Remove leading slashes
    
    // Handle different path formats that might come from the API
    if (path.startsWith('production/uploads/uploads/')) {
      // Fix double uploads issue
      path = path.replace('production/uploads/uploads/', '');
    } else if (path.startsWith('production/uploads/')) {
      path = path.replace('production/uploads/', '');
    } else if (path.startsWith('uploads/uploads/')) {
      // Fix double uploads without production prefix
      path = path.replace('uploads/uploads/', '');
    } else if (path.startsWith('uploads/')) {
      path = path.replace('uploads/', '');
    } else if (path.startsWith('../uploads/')) {
      path = path.replace('../uploads/', '');
    }
    
    // Ensure the path starts with client_files/
    if (!path.startsWith('client_files/')) {
      path = `client_files/${path}`;
    }
    
    return `https://luccibyey.com.tn/production/uploads/${path}`;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const handleOpenEditDialog = () => {
    if (client) {
      setEditForm({
        name: client.name,
        email: client.email,
        phone: client.phone,
        address: client.address,
        website: client.website || ''
      });
      setEditDialogOpen(true);
    }
  };

  const handleUpdateClient = async () => {
    if (!client) return;

    try {
      setUpdating(true);
      const response = await axios.put(
        `${API_BASE_URL}/soustraitance_clients.php`,
        {
          id: client.id,
          ...editForm
        }
      );

      if (response.data.success) {
        toast({
          title: "Succès",
          description: "Client mis à jour avec succès",
        });
        setEditDialogOpen(false);
        fetchClientDetails();
      } else {
        toast({
          title: "Erreur",
          description: response.data.message || "Erreur lors de la mise à jour",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating client:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la mise à jour du client",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteClient = async () => {
    try {
      setDeleting(true);
      const response = await axios.delete(`${API_BASE_URL}/soustraitance_clients.php`, {
        data: { id },
      });

      if (response.data.success) {
        toast({
          title: "Succès",
          description: "Client supprimé avec succès",
        });
        navigate('/clients-soustraitance');
      } else {
        toast({
          title: "Erreur",
          description: response.data.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting client:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression du client",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-3 md:space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 md:h-16 md:w-16 border-b-2 border-primary mx-auto"></div>
          <div className="space-y-2">
            <h3 className="text-base md:text-lg font-semibold">Chargement en cours</h3>
            <p className="text-sm md:text-base text-muted-foreground">Récupération des détails du client...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-4 md:space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl md:text-2xl font-bold text-foreground">Client non trouvé</h2>
            <p className="text-sm md:text-base text-muted-foreground">Le client demandé n'existe pas ou a été supprimé.</p>
          </div>
          <Button onClick={() => navigate('/clients-soustraitance')} size="lg" className="w-full sm:w-auto">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux clients
          </Button>
        </div>
      </div>
    );
  }

  const activeProducts = products.filter(p => p.status_product === 'active').length;
  const totalValue = products.reduce((sum, p) => sum + (p.price_product * p.qnty_product), 0);
  const activeMaterials = materials.filter(m => m.active).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-3 md:px-6 py-4 md:py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3 md:gap-4">
              <Button variant="outline" onClick={() => navigate('/clients-soustraitance')} size="sm" className="h-8 md:h-9">
                <ArrowLeft className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Retour</span>
              </Button>
              <Separator orientation="vertical" className="h-6 hidden sm:block" />
              <div className="flex items-center gap-2 md:gap-3">
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-lg md:text-2xl font-bold text-foreground break-words">{client.name}</h1>
                  <p className="text-xs md:text-sm text-muted-foreground">Client sous-traitance</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end md:self-auto">
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs md:text-sm h-8 md:h-9"
                onClick={handleOpenEditDialog}
              >
                <Edit className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Modifier</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 md:h-9 w-8 md:w-9 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => setDeleteDialogOpen(true)}
                title="Supprimer le client"
              >
                <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 md:px-6 py-4 md:py-8 space-y-4 md:space-y-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
          <Card className="relative overflow-hidden shadow-sm">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1 md:space-y-2">
                  <p className="text-xs md:text-sm font-medium text-muted-foreground">Total Produits</p>
                  <p className="text-2xl md:text-3xl font-bold text-foreground">{products.length}</p>
                  <p className="text-xs text-muted-foreground">
                    {activeProducts} actifs
                  </p>
                </div>
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Package className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden shadow-sm">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1 md:space-y-2">
                  <p className="text-xs md:text-sm font-medium text-muted-foreground">Matériaux</p>
                  <p className="text-2xl md:text-3xl font-bold text-foreground">{materials.length}</p>
                  <p className="text-xs text-muted-foreground">
                    {activeMaterials} disponibles
                  </p>
                </div>
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <ShoppingBag className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden shadow-sm sm:col-span-2 lg:col-span-1">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1 md:space-y-2">
                  <p className="text-xs md:text-sm font-medium text-muted-foreground">Depuis</p>
                  <p className="text-xl md:text-2xl font-bold text-foreground">
                    {new Date(client.created_date).toLocaleDateString('fr-FR', { 
                      day: 'numeric', 
                      month: 'short' 
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(client.created_date).getFullYear()}
                  </p>
                </div>
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Client Information */}
        <Card className="shadow-sm">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Building2 className="h-4 w-4 md:h-5 md:w-5" />
              Informations du client
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Coordonnées et informations de contact
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 md:space-y-6 p-4 md:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
              <div className="space-y-4 md:space-y-6">
                <div className="flex items-start gap-3 md:gap-4">
                  <div className="h-9 w-9 md:h-10 md:w-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                  </div>
                  <div className="space-y-1 overflow-hidden">
                    <p className="text-xs md:text-sm font-medium text-muted-foreground">Email</p>
                    <p className="text-sm md:text-base font-medium text-foreground break-all">{client.email}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 md:gap-4">
                  <div className="h-9 w-9 md:h-10 md:w-10 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                    <Phone className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs md:text-sm font-medium text-muted-foreground">Téléphone</p>
                    <p className="text-sm md:text-base font-medium text-foreground">{client.phone}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4 md:space-y-6">
                <div className="flex items-start gap-3 md:gap-4">
                  <div className="h-9 w-9 md:h-10 md:w-10 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-4 w-4 md:h-5 md:w-5 text-amber-600" />
                  </div>
                  <div className="space-y-1 overflow-hidden">
                    <p className="text-xs md:text-sm font-medium text-muted-foreground">Adresse</p>
                    <p className="text-sm md:text-base font-medium text-foreground break-words">{client.address}</p>
                  </div>
                </div>
                
                {client.website && (
                  <div className="flex items-start gap-3 md:gap-4">
                    <div className="h-9 w-9 md:h-10 md:w-10 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                      <Globe className="h-4 w-4 md:h-5 md:w-5 text-purple-600" />
                    </div>
                    <div className="space-y-1 overflow-hidden">
                      <p className="text-xs md:text-sm font-medium text-muted-foreground">Site web</p>
                      <a 
                        href={client.website} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-sm md:text-base font-medium text-primary hover:underline break-all"
                      >
                        {client.website}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products and Materials Tabs */}
        <Tabs defaultValue="products" className="space-y-4 md:space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="products" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
              <Package2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Produits</span> ({products.length})
            </TabsTrigger>
            <TabsTrigger value="materials" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
              <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Matériaux</span> ({materials.length})
            </TabsTrigger>
            <TabsTrigger value="files" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
              <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Fichiers</span> ({files.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-4 md:space-y-6">
            <Card className="shadow-sm">
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-base md:text-lg">Catalogue des produits</CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  Ensemble des produits sous-traitance gérés par ce client
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 md:p-6 md:pt-0">
                {products.length > 0 ? (
                  <>
                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[80px]">Image</TableHead>
                            <TableHead>Produit</TableHead>
                            <TableHead>Référence</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Couleur</TableHead>
                            <TableHead className="text-right">Prix</TableHead>
                            <TableHead className="text-right">Quantité</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead className="w-[100px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {products.map((product) => (
                            <TableRow key={product.id} className="hover:bg-muted/50">
                              <TableCell>
                                {product.img_product ? (
                                  <img 
                                    src={product.img_product} 
                                    alt={product.nom_product}
                                    className="w-12 h-12 object-cover rounded-lg border"
                                  />
                                ) : (
                                  <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center border">
                                    <Package className="h-6 w-6 text-muted-foreground" />
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <p className="font-medium text-foreground">{product.nom_product}</p>
                                  <p className="text-sm text-muted-foreground line-clamp-1">
                                    {product.description_product}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <code className="text-sm bg-muted px-2 py-1 rounded">
                                  {product.reference_product}
                                </code>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{product.type_product}</Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-4 h-4 rounded-full border"
                                    style={{ backgroundColor: product.color_product.toLowerCase() }}
                                  />
                                  <span className="text-sm">{product.color_product}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {product.price_product.toFixed(2)}€
                              </TableCell>
                              <TableCell className="text-right">
                                {product.qnty_product}
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant={product.status_product === 'active' ? 'default' : 'secondary'}
                                  className={product.status_product === 'active' ? 'bg-green-500/10 text-green-700 hover:bg-green-500/20' : ''}
                                >
                                  {product.status_product === 'active' ? 'Actif' : 'Inactif'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => navigate(`/soustraitance-products/${product.id}`)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden px-4 pb-4 space-y-3">
                      {products.map((product) => (
                        <div 
                          key={`mobile-${product.id}`} 
                          className="border rounded-lg p-3 bg-card hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex gap-3 mb-3">
                            {product.img_product ? (
                              <img 
                                src={product.img_product} 
                                alt={product.nom_product}
                                className="w-16 h-16 object-cover rounded-lg border flex-shrink-0"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center border flex-shrink-0">
                                <Package className="h-8 w-8 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm break-words mb-1">{product.nom_product}</h4>
                              <code className="text-xs bg-muted px-2 py-0.5 rounded">{product.reference_product}</code>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className="text-xs">{product.type_product}</Badge>
                                <Badge 
                                  variant={product.status_product === 'active' ? 'default' : 'secondary'}
                                  className={product.status_product === 'active' ? 'bg-green-500/10 text-green-700 text-xs' : 'text-xs'}
                                >
                                  {product.status_product === 'active' ? 'Actif' : 'Inactif'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-2 text-xs">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full border flex-shrink-0"
                                style={{ backgroundColor: product.color_product.toLowerCase() }}
                              />
                              <span className="text-muted-foreground">Couleur:</span>
                              <span className="font-medium">{product.color_product}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <div>
                                <span className="text-muted-foreground">Prix:</span>
                                <span className="font-semibold ml-2">{product.price_product.toFixed(2)}€</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Qté:</span>
                                <span className="font-semibold ml-2">{product.qnty_product}</span>
                              </div>
                            </div>
                            {product.description_product && (
                              <p className="text-muted-foreground line-clamp-2 pt-1">
                                {product.description_product}
                              </p>
                            )}
                          </div>
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate(`/soustraitance-products/${product.id}`)}
                            className="w-full mt-3 text-xs h-8"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Voir détails
                          </Button>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 md:py-12 px-4">
                    <div className="space-y-3 md:space-y-4">
                      <div className="h-12 w-12 md:h-16 md:w-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                        <Package className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-base md:text-lg font-semibold">Aucun produit</h3>
                        <p className="text-sm md:text-base text-muted-foreground">Ce client n'a pas encore de produits associés.</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="materials" className="space-y-4 md:space-y-6">
            <Card className="shadow-sm">
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-base md:text-lg">Matériaux disponibles</CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  Stock de matériaux alloués à ce client sous-traitance
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 md:p-6 md:pt-0">
                {materials.length > 0 ? (
                  <>
                    {/* Desktop Table */}
                    <div className="hidden lg:block overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Matériau</TableHead>
                            <TableHead>Référence</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">Stock</TableHead>
                            <TableHead className="text-right">Seuils</TableHead>
                            <TableHead className="text-right">Prix unitaire</TableHead>
                            <TableHead>Caractéristiques</TableHead>
                            <TableHead>Statut</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {materials.map((material) => (
                            <TableRow key={material.id} className="hover:bg-muted/50">
                              <TableCell>
                                <div className="font-medium text-foreground">{material.nom}</div>
                              </TableCell>
                              <TableCell>
                                <code className="text-sm bg-muted px-2 py-1 rounded">
                                  {material.reference}
                                </code>
                              </TableCell>
                              <TableCell>
                                <p className="text-sm text-muted-foreground max-w-[200px] line-clamp-2">
                                  {material.description}
                                </p>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="space-y-1">
                                  <p className="font-medium">{material.quantite_stock}</p>
                                  <div className="w-full bg-muted rounded-full h-2">
                                    <div 
                                      className={`h-2 rounded-full transition-all ${
                                        material.quantite_stock > material.quantite_max 
                                          ? 'bg-pink-500' 
                                          : material.quantite_stock <= (material.quantite_min || 0)
                                            ? 'bg-destructive'
                                            : material.quantite_stock < material.quantite_max
                                              ? 'bg-warning'
                                              : 'bg-success'
                                      }`} 
                                      style={{ 
                                        width: `${Math.min((material.quantite_stock / material.quantite_max) * 100, 100)}%` 
                                      }}
                                    />
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-right text-sm">
                                <div className="space-y-1">
                                  <p>Min: {material.quantite_min}</p>
                                  <p>Max: {material.quantite_max}</p>
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {(Number(material.prix_unitaire) || 0).toFixed(2)}€
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  {material.couleur && (
                                    <div className="flex items-center gap-2">
                                      <div 
                                        className="w-3 h-3 rounded-full border"
                                        style={{ backgroundColor: material.couleur.toLowerCase() }}
                                      />
                                      <span className="text-sm">{material.couleur}</span>
                                    </div>
                                  )}
                                  {material.taille && (
                                    <Badge variant="outline" className="text-xs">
                                      {material.taille}
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant={material.active ? 'default' : 'secondary'}
                                  className={material.active ? 'bg-green-500/10 text-green-700 hover:bg-green-500/20' : ''}
                                >
                                  {material.active ? 'Disponible' : 'Indisponible'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Mobile/Tablet Cards */}
                    <div className="lg:hidden px-4 pb-4 space-y-3">
                      {materials.map((material) => (
                        <div 
                          key={`mobile-${material.id}`} 
                          className="border rounded-lg p-3 bg-card"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm break-words">{material.nom}</h4>
                              <code className="text-xs bg-muted px-2 py-0.5 rounded">{material.reference}</code>
                            </div>
                            <Badge 
                              variant={material.active ? 'default' : 'secondary'}
                              className={material.active ? 'bg-green-500/10 text-green-700 text-xs ml-2' : 'text-xs ml-2'}
                            >
                              {material.active ? 'Disponible' : 'Indisponible'}
                            </Badge>
                          </div>
                          
                          {material.description && (
                            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{material.description}</p>
                          )}
                          
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Stock:</span>
                              <span className="font-semibold">{material.quantite_stock}</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all ${
                                  material.quantite_stock > material.quantite_max 
                                    ? 'bg-pink-500' 
                                    : material.quantite_stock <= (material.quantite_min || 0)
                                      ? 'bg-destructive'
                                      : material.quantite_stock < material.quantite_max
                                        ? 'bg-warning'
                                        : 'bg-success'
                                }`} 
                                style={{ 
                                  width: `${Math.min((material.quantite_stock / material.quantite_max) * 100, 100)}%` 
                                }}
                              />
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Min/Max:</span>
                              <span className="font-medium">{material.quantite_min} / {material.quantite_max}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Prix unitaire:</span>
                              <span className="font-semibold">{(Number(material.prix_unitaire) || 0).toFixed(2)}€</span>
                            </div>
                            {material.couleur && (
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Couleur:</span>
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-3 h-3 rounded-full border"
                                    style={{ backgroundColor: material.couleur.toLowerCase() }}
                                  />
                                  <span className="font-medium">{material.couleur}</span>
                                </div>
                              </div>
                            )}
                            {material.taille && (
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Taille:</span>
                                <Badge variant="outline" className="text-xs">{material.taille}</Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 md:py-12 px-4">
                    <div className="space-y-3 md:space-y-4">
                      <div className="h-12 w-12 md:h-16 md:w-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                        <ShoppingBag className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-base md:text-lg font-semibold">Aucun matériau</h3>
                        <p className="text-sm md:text-base text-muted-foreground">Aucun matériau n'est associé à ce client.</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="files" className="space-y-4 md:space-y-6">
            <Card className="shadow-sm">
              <CardHeader className="p-4 md:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-base md:text-lg">Documents et fichiers</CardTitle>
                  <CardDescription className="text-xs md:text-sm">
                    Fichiers et documents associés à ce client
                  </CardDescription>
                </div>
                <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2 text-xs md:text-sm h-8 md:h-9 w-full sm:w-auto">
                      <Plus className="h-3.5 w-3.5 md:h-4 md:w-4" />
                      Ajouter
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Uploader un fichier</DialogTitle>
                      <DialogDescription>
                        Ajoutez un document ou fichier pour ce client. Formats supportés: PDF, Images, Word, Excel, Text, CSV (max 20MB)
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      {/* Drag and Drop Zone */}
                      <div className="space-y-2">
                        <Label>Fichier</Label>
                        <div
                          className={`
                            relative border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer
                            ${isDragOver 
                              ? 'border-primary bg-primary/5 border-solid' 
                              : selectedFile 
                                ? 'border-green-500 bg-green-50 dark:bg-green-950/20' 
                                : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
                            }
                          `}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          onClick={() => document.getElementById('file-input')?.click()}
                        >
                          <input
                            id="file-input"
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.xls,.xlsx,.txt,.csv"
                            onChange={handleFileSelect}
                            className="hidden"
                          />
                          
                          {selectedFile ? (
                            <div className="space-y-3">
                              <div className="text-4xl">
                                {getFileIcon(selectedFile.type)}
                              </div>
                              <div className="space-y-1">
                                <p className="font-medium text-foreground">{selectedFile.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {formatFileSize(selectedFile.size)} • {selectedFile.type}
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedFile(null);
                                }}
                              >
                                Changer le fichier
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="space-y-2">
                                <Upload className={`h-12 w-12 mx-auto ${isDragOver ? 'text-primary' : 'text-muted-foreground'}`} />
                                <div className="space-y-1">
                                  <p className={`text-lg font-medium ${isDragOver ? 'text-primary' : 'text-foreground'}`}>
                                    {isDragOver ? 'Déposez votre fichier ici' : 'Glissez-déposez votre fichier'}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    ou cliquez pour parcourir
                                  </p>
                                </div>
                              </div>
                              <div className="text-xs text-muted-foreground space-y-1">
                                <p>Formats supportés: PDF, Images, Word, Excel, Text, CSV</p>
                                <p>Taille maximale: 20MB</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description (optionnel)</Label>
                        <Textarea
                          id="description"
                          placeholder="Description du fichier..."
                          value={fileDescription}
                          onChange={(e) => setFileDescription(e.target.value)}
                          rows={3}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setUploadDialogOpen(false);
                          setSelectedFile(null);
                          setFileDescription('');
                        }}
                      >
                        Annuler
                      </Button>
                      <Button
                        type="button"
                        onClick={handleFileUpload}
                        disabled={!selectedFile || uploading}
                      >
                        {uploading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            Upload...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Uploader
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {files.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]">Type</TableHead>
                          <TableHead>Nom du fichier</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right">Taille</TableHead>
                          <TableHead>Uploadé le</TableHead>
                          <TableHead>Uploadé par</TableHead>
                          <TableHead className="w-[120px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {files.map((file) => (
                          <TableRow key={file.file_id} className="hover:bg-muted/50">
                            <TableCell>
                              {isImageFile(file.mime_type) ? (
                                <img
                                  src={getFileUrl(file.file_path)}
                                  alt={file.original_filename}
                                  className="w-12 h-12 object-cover rounded-lg border cursor-pointer hover:scale-105 transition-transform"
                                  onClick={() => handleFilePreview(file)}
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    target.nextElementSibling?.setAttribute('style', 'display: block');
                                  }}
                                />
                              ) : null}
                              <div 
                                className={`text-2xl ${isImageFile(file.mime_type) ? 'hidden' : ''}`} 
                                title={file.mime_type}
                              >
                                {getFileIcon(file.mime_type)}
                              </div>
                            </TableCell>
                             <TableCell>
                               <div className="space-y-1">
                                 {isImageFile(file.mime_type) ? (
                                   <button
                                     onClick={() => handleFilePreview(file)}
                                     className="font-medium text-primary hover:underline text-left"
                                   >
                                     {file.original_filename}
                                   </button>
                                 ) : (
                                   <p className="font-medium text-foreground">{file.original_filename}</p>
                                 )}
                                 <p className="text-sm text-muted-foreground">{file.file_type.toUpperCase()}</p>
                               </div>
                             </TableCell>
                            <TableCell>
                              <p className="text-sm text-muted-foreground max-w-[200px] line-clamp-2">
                                {file.description || 'Aucune description'}
                              </p>
                            </TableCell>
                            <TableCell className="text-right">
                              <p className="text-sm font-medium">{formatFileSize(file.file_size)}</p>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm text-muted-foreground">
                                {new Date(file.upload_date).toLocaleDateString('fr-FR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm text-muted-foreground">{file.uploaded_user}</p>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(getFileUrl(file.file_path), '_blank')}
                                  className="h-8 w-8 p-0"
                                  title="Télécharger"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteFile(file.file_id)}
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive-foreground"
                                  title="Supprimer"
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
                ) : (
                  <div className="text-center py-12">
                    <div className="space-y-4">
                      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold">Aucun fichier</h3>
                        <p className="text-muted-foreground">Ce client n'a pas encore de fichiers associés.</p>
                      </div>
                      <Button onClick={() => setUploadDialogOpen(true)} className="mt-4">
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter le premier fichier
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

      {/* Edit Client Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier le client</DialogTitle>
            <DialogDescription>
              Mettez à jour les informations du client
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nom *</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Nom du client"
              />
            </div>
            <div>
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>
            <div>
              <Label htmlFor="edit-phone">Téléphone *</Label>
              <Input
                id="edit-phone"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                placeholder="+216 12 345 678"
              />
            </div>
            <div>
              <Label htmlFor="edit-address">Adresse *</Label>
              <Textarea
                id="edit-address"
                value={editForm.address}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                placeholder="Adresse complète"
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="edit-website">Site web</Label>
              <Input
                id="edit-website"
                value={editForm.website}
                onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                placeholder="https://exemple.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={updating}
            >
              Annuler
            </Button>
            <Button
              onClick={handleUpdateClient}
              disabled={updating || !editForm.name || !editForm.email || !editForm.phone || !editForm.address}
            >
              {updating ? "Mise à jour..." : "Mettre à jour"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmer la suppression</DialogTitle>
              <DialogDescription>
                Êtes-vous sûr de vouloir supprimer ce client ? Cette action est irréversible et supprimera également tous les produits, matériaux et fichiers associés.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                disabled={deleting}
              >
                Annuler
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteClient}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Suppression...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* File Preview Modal */}
        <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="text-2xl">
                  {previewFile && getFileIcon(previewFile.mime_type)}
                </div>
                {previewFile?.original_filename}
              </DialogTitle>
              <DialogDescription>
                {previewFile && (
                  <div className="flex items-center gap-4 text-sm">
                    <span>Taille: {formatFileSize(previewFile.file_size)}</span>
                    <span>Type: {previewFile.file_type.toUpperCase()}</span>
                    <span>Uploadé le: {new Date(previewFile.upload_date).toLocaleDateString('fr-FR')}</span>
                  </div>
                )}
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex-1 overflow-auto">
              {previewFile && isImageFile(previewFile.mime_type) ? (
                <div className="flex justify-center items-center p-4">
                  <img
                    src={getFileUrl(previewFile.file_path)}
                    alt={previewFile.original_filename}
                    className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-lg"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder.svg';
                    }}
                  />
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="space-y-4">
                    <div className="text-6xl">
                      {previewFile && getFileIcon(previewFile.mime_type)}
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">Aperçu non disponible</h3>
                      <p className="text-muted-foreground">
                        Ce type de fichier ne peut pas être prévisualisé dans le navigateur.
                      </p>
                      {previewFile?.description && (
                        <div className="mt-4 p-4 bg-muted rounded-lg">
                          <p className="text-sm">
                            <strong>Description:</strong> {previewFile.description}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="flex items-center justify-between">
              <div className="flex-1">
                {previewFile?.description && isImageFile(previewFile.mime_type) && (
                  <p className="text-sm text-muted-foreground">
                    <strong>Description:</strong> {previewFile.description}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => previewFile && window.open(getFileUrl(previewFile.file_path), '_blank')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPreviewModalOpen(false)}
                >
                  Fermer
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ClientSoustraitanceDetails;