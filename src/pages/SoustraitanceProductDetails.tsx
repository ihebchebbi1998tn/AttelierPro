import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Eye, Image, Cog, Ruler, Package, FileText, Save, Settings, FileOutput, Play } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import SoustraitanceProductFilesUpload from "@/components/SoustraitanceProductFilesUpload";
import SoustraitanceProductReport from "@/components/SoustraitanceProductReport";
import SoustraitanceStockManager from "@/components/SoustraitanceStockManager";
import ProductMeasurementScaleBySizes from '@/components/ProductMeasurementScaleBySizes';

interface SoustraitanceProduct {
  id: string;
  client_id: string;
  client_name: string;
  client_email?: string;
  client_phone?: string;
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
  // Size fields
  size_xs?: string;
  size_s?: string;
  size_m?: string;
  size_l?: string;
  size_xl?: string;
  size_xxl?: string;
  size_3xl?: string;
  size_4xl?: string;
  size_30?: string;
  size_31?: string;
  size_32?: string;
  size_33?: string;
  size_34?: string;
  size_36?: string;
  size_38?: string;
  size_39?: string;
  size_40?: string;
  size_41?: string;
  size_42?: string;
  size_43?: string;
  size_44?: string;
  size_45?: string;
  size_46?: string;
  size_47?: string;
  size_48?: string;
  size_50?: string;
  size_52?: string;
  size_54?: string;
  size_56?: string;
  size_58?: string;
  size_60?: string;
  size_62?: string;
  size_64?: string;
  size_66?: string;
  size_85?: string;
  size_90?: string;
  size_95?: string;
  size_100?: string;
  size_105?: string;
  size_110?: string;
  size_115?: string;
  size_120?: string;
  size_125?: string;
  no_size?: string;
  materials_configured?: string;
}

const SoustraitanceProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [product, setProduct] = useState<SoustraitanceProduct | null>(null);
  const [materials, setMaterials] = useState<any[]>([]);
  const [sizesLocked, setSizesLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [productSizes, setProductSizes] = useState<{
    clothing?: { [size: string]: boolean };
    numeric_pants?: { [size: string]: boolean };
    shoes?: { [size: string]: boolean };
    belts?: { [size: string]: boolean };
    no_size?: boolean;
  }>({});
  const [sizesLoading, setSizesLoading] = useState(false);
  const [savingSizes, setSavingSizes] = useState(false);
  const [productFiles, setProductFiles] = useState<any[]>([]);
  const [showReportModal, setShowReportModal] = useState(false);

  const API_BASE_URL = 'https://luccibyey.com.tn/production/api';

  useEffect(() => {
    loadProduct();
  }, [id]);

  useEffect(() => {
    if (product) {
      updateSizesLockedState();
    }
  }, [materials, product]);

  const loadProduct = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/soustraitance_products.php?id=${id}`);
      const data = await response.json();
      if (data.success && data.data) {
        const productData = data.data;
        
        // Load client details to get email and phone
        if (productData.client_id) {
          const clientDetails = await loadClientDetails(productData.client_id);
          if (clientDetails) {
            productData.client_email = clientDetails.email;
            productData.client_phone = clientDetails.phone;
          }
        }
        
        setProduct(productData);
        // Load materials configuration and files
        await loadMaterials(id);
        await loadProductFiles(id);
      } else {
        throw new Error(data.message || 'Produit non trouvé');
      }
    } catch (error) {
      console.error('Error loading product:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les détails du produit",
        variant: "destructive",
      });
      navigate('/soustraitance-products');
    } finally {
      setLoading(false);
    }
  };

  const loadMaterials = async (productId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/soustraitance_product_materials.php?product_id=${productId}`);
      const data = await response.json();
      if (data.success && data.data) {
        setMaterials(data.data);
      }
    } catch (error) {
      console.error('Error loading materials:', error);
    }
  };

  const loadProductFiles = async (productId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/soustraitance_product_files.php?product_id=${productId}`);
      const data = await response.json();
      if (data.success && data.data) {
        setProductFiles(data.data);
      }
    } catch (error) {
      console.error('Error loading product files:', error);
    }
  };

  const loadClientDetails = async (clientId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/soustraitance_clients.php?id=${clientId}`);
      const data = await response.json();
      if (data.success && data.data) {
        return data.data;
      }
    } catch (error) {
      console.error('Error loading client details:', error);
    }
    return null;
  };

  const loadProductSizes = async (productId: string) => {
    // Sizes are now loaded directly from product data, no separate API call needed
    setSizesLoading(false);
  };

  const handleSaveSizes = async () => {
    if (!id || !product) return;
    
    setSavingSizes(true);
    try {
      // Convert size selections to the database format
      const sizeFields = ['xs', 's', 'm', 'l', 'xl', 'xxl', '3xl', '4xl', '30', '31', '32', '33', '34', '36', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48', '50', '52', '54', '56', '58', '60', '62', '64', '66', '85', '90', '95', '100', '105', '110', '115', '120', '125'];
      
      const sizeUpdates: any = {};
      sizeFields.forEach(size => {
        const sizeKey = `size_${size}`;
        if (productSizes.clothing?.[size] || productSizes.numeric_pants?.[size] || productSizes.shoes?.[size] || productSizes.belts?.[size]) {
          sizeUpdates[sizeKey] = 1;
        } else {
          sizeUpdates[sizeKey] = 0;
        }
      });

      const response = await fetch(`${API_BASE_URL}/soustraitance_products.php?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sizeUpdates)
      });
      
      const data = await response.json();
      if (data.success) {
        toast({
          title: "Succès",
          description: "Configuration des tailles mise à jour avec succès",
        });
        // Reload product to get updated data
        loadProduct();
      } else {
        throw new Error(data.error || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Error saving sizes:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la sauvegarde des tailles",
        variant: "destructive",
      });
    } finally {
      setSavingSizes(false);
    }
  };

  const handleStartProduction = () => {
    if (product) {
      if (product.materials_configured == "1" || product.materials_configured === "1") {
        // Navigate to production planning page if materials are configured
        navigate(`/soustraitance-products/${id}/production-planning`);
      } else {
        // Navigate to materials configuration page
        navigate(`/soustraitance-products/${id}/configurer-materiaux`);
      }
    }
  };

  const handlePrintReport = () => {
    const reportElement = document.getElementById('soustraitance-product-report-content');
    if (reportElement) {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Rapport - ${product?.nom_product}</title>
            <meta charset="UTF-8">
            <style>
              /* Reset and base styles */
              * {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
              }
              
              body {
                font-family: "Segoe UI", "Arial", "Helvetica", sans-serif;
                font-size: 10px;
                line-height: 1.3;
                color: #000;
                background: white;
                padding: 18px;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              
              /* Print-specific styles */
              @media print {
                body {
                  padding: 12px;
                  margin: 0;
                }
                @page {
                  margin: 0.8cm;
                  size: A4;
                }
              }
              
              /* Typography */
              h1 {
                font-size: 18px;
                font-weight: 600;
                text-align: center;
                margin-bottom: 6px;
                letter-spacing: 0.5px;
              }
              
              h2 {
                font-size: 12px;
                font-weight: 600;
                border-bottom: 1.5px solid #000;
                padding-bottom: 3px;
                margin-bottom: 8px;
                margin-top: 16px;
                letter-spacing: 0.3px;
              }
              
              /* Tables */
              table {
                width: 100%;
                border-collapse: collapse;
                border: 1.5px solid #000;
                margin-bottom: 12px;
                font-size: 9px;
              }
              
              th, td {
                border: 1px solid #000;
                padding: 5px 6px;
                text-align: left;
                vertical-align: top;
              }
              
              th {
                background-color: #f8f9fa !important;
                font-weight: 600;
                font-size: 9px;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              
              .bg-gray-100 {
                background-color: #f8f9fa !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              
              .border-b-2 {
                border-bottom: 1.5px solid #000;
              }
              
              .border-b {
                border-bottom: 1px solid #000;
              }
              
              .border {
                border: 1px solid #000;
              }
              
              .border-black {
                border-color: #000;
              }
              
              .grid {
                display: grid;
              }
              
              .grid-cols-2 {
                grid-template-columns: 1fr 1fr;
              }
              
              .grid-cols-8 {
                grid-template-columns: repeat(8, 1fr);
              }
              
              .gap-2 {
                gap: 6px;
              }
              
              .gap-4 {
                gap: 12px;
              }
              
              .text-center {
                text-align: center;
              }
              
              .text-xs {
                font-size: 8px;
              }
              
              .text-sm {
                font-size: 9px;
              }
              
              .text-lg {
                font-size: 11px;
              }
              
              .font-bold {
                font-weight: 600;
              }
              
              .mb-2 {
                margin-bottom: 6px;
              }
              
              .mb-3 {
                margin-bottom: 8px;
              }
              
              .mb-4 {
                margin-bottom: 12px;
              }
              
              .mb-6 {
                margin-bottom: 18px;
              }
              
              .p-2 {
                padding: 6px;
              }
              
              .p-8 {
                padding: 24px;
              }
              
              .pb-1 {
                padding-bottom: 3px;
              }
              
              .pb-4 {
                padding-bottom: 12px;
              }
              
              .border-r {
                border-right: 1px solid #000;
              }
              
              /* Image grid styles */
              .image-card {
                width: 100%;
                height: 140px;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 1px solid #ddd;
                background-color: #f8f9fa;
              }
              
              .image-grid-page {
                min-height: 350px;
              }
              
              .image-grid .image-card img {
                width: 100% !important;
                height: 100% !important;
                object-fit: contain !important;
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              
              @media print {
                .image-card {
                  height: 110mm !important;
                  max-height: 110mm !important;
                  width: 100% !important;
                  border: 1px solid #000 !important;
                  background: #fbfcfd !important;
                  display: flex !important;
                  align-items: center !important;
                  justify-content: center !important;
                  padding: 3mm !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                
                .image-grid-page {
                  min-height: 300px;
                  page-break-inside: avoid !important;
                  break-inside: avoid !important;
                  display: grid !important;
                  grid-template-columns: 1fr 1fr !important;
                  gap: 6mm !important;
                }
                
                .image-grid {
                  page-break-inside: avoid !important;
                  break-inside: avoid !important;
                }
                
                .image-card img {
                  max-width: 95% !important;
                  max-height: 95% !important;
                  width: auto !important;
                  height: auto !important;
                  object-fit: contain !important;
                  min-height: 85mm !important;
                  display: block !important;
                  visibility: visible !important;
                  opacity: 1 !important;
                  -webkit-print-color-adjust: exact !important;
                  color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
              }
            </style>
          </head>
          <body>
            ${reportElement.innerHTML}
          </body>
        </html>
      `;
      
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        
        // Wait for images to load before printing
        printWindow.addEventListener('load', () => {
          const images = printWindow.document.querySelectorAll('img');
          let loadedImages = 0;
          const totalImages = images.length;
          
          console.log('Print window loaded, found', totalImages, 'images');
          
          if (totalImages === 0) {
            setTimeout(() => printWindow.print(), 500);
            return;
          }
          
          images.forEach((img, index) => {
            if (img.complete && img.naturalWidth > 0) {
              loadedImages++;
            } else {
              img.onload = () => {
                loadedImages++;
                console.log('Image', index + 1, 'loaded');
                if (loadedImages === totalImages) {
                  setTimeout(() => printWindow.print(), 1000);
                }
              };
              img.onerror = () => {
                loadedImages++;
                console.warn('Image', index + 1, 'failed to load');
                if (loadedImages === totalImages) {
                  setTimeout(() => printWindow.print(), 1000);
                }
              };
            }
          });
          
          if (loadedImages === totalImages) {
            setTimeout(() => printWindow.print(), 1000);
          }
          
          // Fallback: print after 10 seconds
          setTimeout(() => printWindow.print(), 10000);
        });
      }
    }
  };

  const getConfiguredSizes = (product: SoustraitanceProduct) => {
    // Check if no_size is set
    if (product.no_size === '1') {
      return ['Aucune taille spécifique (Accessoires)'];
    }
    
    const configuredSizes = [];
    
    // Clothing sizes
    const clothingSizes = ['xs', 's', 'm', 'l', 'xl', 'xxl', '3xl', '4xl'];
    clothingSizes.forEach(size => {
      const fieldName = `size_${size}` as keyof SoustraitanceProduct;
      if (product[fieldName] === '1') {
        configuredSizes.push(size.toUpperCase());
      }
    });
    
    // Numeric sizes (pants, shoes, belts)
    const numericSizes = ['30', '31', '32', '33', '34', '36', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48', '50', '52', '54', '56', '58', '60', '62', '64', '66', '85', '90', '95', '100', '105', '110', '115', '120', '125'];
    numericSizes.forEach(size => {
      const fieldName = `size_${size}` as keyof SoustraitanceProduct;
      if (product[fieldName] === '1') {
        configuredSizes.push(size);
      }
    });
    
    return configuredSizes;
  };

  // Check if materials are configured for specific sizes
  const hasSizeSpecificMaterials = () => {
    return materials.some(material => 
      material.size_specific && 
      material.size_specific !== 'Sans taille' && 
      material.size_specific !== 'Taille unique' &&
      material.size_specific !== null &&
      material.size_specific !== ''
    );
  };

  // Check if measurements are configured for specific sizes  
  const hasSizeSpecificMeasurements = async () => {
    try {
      const response = await fetch(`https://luccibyey.com.tn/production/api/production_soustraitance_products_mesure_by_size.php?product_id=${product?.id}`);
      const data = await response.json();
      return data.success && data.measurements && data.measurements.length > 0;
    } catch (error) {
      console.error('Error checking measurements:', error);
      return false;
    }
  };

  // Combined function to check if sizes are locked
  const areSizesLocked = async () => {
    const hasMaterials = hasSizeSpecificMaterials();
    const hasMeasurements = await hasSizeSpecificMeasurements();
    return hasMaterials || hasMeasurements;
  };

  // Update sizes locked state
  const updateSizesLockedState = async () => {
    const locked = await areSizesLocked();
    setSizesLocked(locked);
  };

  // Check if any materials are configured
  const hasMaterialsConfigured = () => {
    return materials.length > 0;
  };

  const getProductImages = (product: SoustraitanceProduct): string[] => {
    const images: string[] = [];
    const imageFields = ['img_product', 'img2_product', 'img3_product', 'img4_product', 'img5_product'];
    
    imageFields.forEach(field => {
      const imagePath = product[field as keyof SoustraitanceProduct] as string;
      if (imagePath) {
        images.push(`${API_BASE_URL}/${imagePath}`);
      }
    });
    
    return images;
  };

  const handleViewImages = (product: SoustraitanceProduct) => {
    const images = getProductImages(product);
    if (images.length > 0) {
      setSelectedImages(images);
      setCurrentImageIndex(0);
      setShowImageModal(true);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Chargement du produit...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Produit non trouvé</p>
          <Button onClick={() => navigate('/soustraitance-products')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux produits
          </Button>
        </div>
      </div>
    );
  }

  const images = getProductImages(product);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <div className="bg-card/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/soustraitance-products')}
                className="hover:bg-muted/50 flex-shrink-0"
              >
                <ArrowLeft className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Retour</span>
              </Button>
              <div className="hidden sm:block h-8 w-px bg-border" />
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-2xl font-bold text-foreground truncate">{product.nom_product}</h1>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Ref: {product.reference_product}</p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Client: {product.client_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowReportModal(true)}
                className="flex items-center gap-2 flex-1 sm:flex-initial"
              >
                <FileOutput className="h-4 w-4" />
                <span className="hidden sm:inline">Rapport</span>
              </Button>
              <Button
                onClick={handleStartProduction}
                size="sm"
                className="flex items-center gap-2 flex-1 sm:flex-initial"
                disabled={product.materials_configured !== "1"}
              >
                <Play className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {product.materials_configured == "1" ? 'Démarrer Production' : 'Configuration requise'}
                </span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Main Tabbed Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-muted p-1">
            <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Image className="h-4 w-4" />
              <span className="hidden sm:inline">Aperçu</span>
            </TabsTrigger>
            <TabsTrigger value="materials" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Cog className="h-4 w-4" />
              <span className="hidden sm:inline">Matériaux</span>
            </TabsTrigger>
            <TabsTrigger value="sizes" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Ruler className="h-4 w-4" />
              <span className="hidden sm:inline">Tailles</span>
            </TabsTrigger>
            <TabsTrigger value="measurements" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Ruler className="h-4 w-4" />
              <span className="hidden sm:inline">Mesures</span>
            </TabsTrigger>
            <TabsTrigger value="stock" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Stock</span>
            </TabsTrigger>
            <TabsTrigger value="files" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Fichiers</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* Images Section */}
              <div className="lg:col-span-1">
                <Card className="overflow-hidden shadow-sm">
                  <CardContent className="p-0">
                    {images.length > 0 ? (
                      <div className="space-y-3">
                        {/* Main Image */}
                        <div className="relative aspect-square bg-muted">
                          <img 
                            src={images[0]} 
                            alt={product.nom_product}
                            className="w-full h-full object-cover cursor-pointer transition-transform hover:scale-105"
                            onClick={() => handleViewImages(product)}
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder.svg';
                            }}
                          />
                          <Button
                            variant="secondary"
                            size="sm"
                            className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm text-xs sm:text-sm px-3 py-2 shadow-md"
                            onClick={() => handleViewImages(product)}
                          >
                            <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                            <span className="hidden sm:inline">Voir toutes</span> ({images.length})
                          </Button>
                        </div>
                        
                        {/* Thumbnail Grid */}
                        {images.length > 1 && (
                          <div className="grid grid-cols-4 gap-2 p-3">
                            {images.slice(1, 5).map((imageUrl, index) => (
                              <div 
                                key={index + 1}
                                className="aspect-square cursor-pointer rounded-md overflow-hidden group border-2 border-transparent hover:border-primary/20"
                                onClick={() => handleViewImages(product)}
                              >
                                <img 
                                  src={imageUrl} 
                                  alt={`${product.nom_product} ${index + 2}`}
                                  className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                  onError={(e) => {
                                    e.currentTarget.src = '/placeholder.svg';
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="aspect-square flex items-center justify-center bg-muted">
                        <div className="text-center">
                          <Image className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                          <p className="text-muted-foreground">Aucune image disponible</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Basic Information */}
              <div className="lg:col-span-2">
                <Card className="shadow-sm">
                  <CardHeader className="pb-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <CardTitle className="text-xl">Informations Générales</CardTitle>
                      <div className="flex gap-2 flex-wrap">
                        <Badge variant={product.status_product === 'active' ? 'default' : 'secondary'} className="text-xs">
                          {product.status_product === 'active' ? '✓ Actif' : '○ Inactif'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Sous-traitance
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Client</Label>
                        <p className="text-sm font-medium">{product.client_name}</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Type</Label>
                        <p className="text-sm font-medium">{product.type_product || 'Non spécifié'}</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Catégorie</Label>
                        <p className="text-sm font-medium">{product.category_product || 'Non spécifiée'}</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Quantité</Label>
                        <p className="text-sm font-medium">{product.qnty_product} pièces</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Couleur</Label>
                        <div className="flex items-center gap-2">
                          {product.color_product && (
                            <div 
                              className="w-4 h-4 rounded border border-border"
                              style={{ backgroundColor: product.color_product }}
                              title={product.color_product}
                            />
                          )}
                          <p className="text-sm">{product.color_product || 'Non spécifiée'}</p>
                        </div>
                      </div>
                      {product.price_product > 0 && (
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Prix</Label>
                          <p className="text-lg font-bold text-primary">{product.price_product} TND</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Description */}
            {product.description_product && (
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl">Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <div 
                    className="prose prose-sm max-w-none text-foreground leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: product.description_product }}
                  />
                </CardContent>
              </Card>
            )}

            {/* Creation Date */}
            <Card className="shadow-sm border">
              <CardContent className="pt-6">
                <div className="text-center text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/40"></div>
                    Produit créé le {new Date(product.created_at).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Materials Tab */}
          <TabsContent value="materials" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Matériaux</CardTitle>
                <Button 
                  onClick={() => navigate(`/soustraitance-products/${id}/configurer-materiaux`)}
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Configurer
                </Button>
              </CardHeader>
              <CardContent>
                {materials.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid gap-4">
                      {(() => {
                        // Group materials by material_id
                        const groupedMaterials = materials.reduce((acc, material) => {
                          const materialId = material.material_id || material.material_name;
                          if (!acc[materialId]) {
                            acc[materialId] = {
                              material_name: material.material_name,
                              material_description: material.material_description,
                              material_stock: material.material_stock,
                              quantity_unit: material.quantity_unit,
                              commentaire: material.commentaire,
                              sizes: []
                            };
                          }
                          acc[materialId].sizes.push({
                            size_specific: material.size_specific || 'Taille unique',
                            quantity_needed: material.quantity_needed
                          });
                          return acc;
                        }, {} as Record<string, any>);

                        return Object.values(groupedMaterials).map((material: any, index) => (
                          <div key={index} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <h4 className="font-semibold text-lg">{material.material_name}</h4>
                                <p className="text-sm text-muted-foreground">{material.material_description}</p>
                              </div>
                              <div className="text-right">
                                <div className="text-xs text-muted-foreground mb-1">Stock disponible</div>
                                <Badge variant="outline" className="text-sm">
                                  {parseFloat(material.material_stock).toString()}
                                </Badge>
                              </div>
                            </div>
                            
                            {/* Size breakdown */}
                            <div className="space-y-2">
                              <h5 className="font-medium text-sm text-muted-foreground">Quantités par taille:</h5>
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                {material.sizes.map((sizeData: any, sizeIndex: number) => (
                                  <div key={sizeIndex} className="flex items-center justify-between bg-muted rounded-md px-3 py-2">
                                    <span className="text-sm font-medium">{sizeData.size_specific}</span>
                                    <span className="text-sm text-muted-foreground">
                                      {sizeData.quantity_needed} {material.quantity_unit}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Total quantity */}
                            <div className="mt-3 pt-3 border-t border-border">
                              <div className="flex justify-between items-center">
                                <span className="font-medium text-sm">Total nécessaire:</span>
                                <Badge variant="secondary" className="text-sm">
                                  {material.sizes.reduce((total: number, size: any) => total + parseFloat(size.quantity_needed), 0)} {material.quantity_unit}
                                </Badge>
                              </div>
                            </div>

                            {material.commentaire && (
                              <div className="mt-3 pt-3 border-t border-border">
                                <p className="text-sm text-muted-foreground">
                                  <span className="font-medium">Commentaire:</span> {material.commentaire}
                                </p>
                              </div>
                            )}
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Aucun matériau configuré</h3>
                    <p className="text-muted-foreground mb-4">
                      Ce produit n'a pas encore de matériaux configurés
                    </p>
                    <Button 
                      onClick={() => navigate(`/soustraitance-products/${id}/configurer-materiaux`)}
                      className="flex items-center gap-2"
                    >
                      <Settings className="h-4 w-4" />
                      Configurer les matériaux
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sizes Tab */}
          <TabsContent value="sizes" className="space-y-6">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Configuration des Tailles</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Sélectionnez les tailles disponibles pour ce produit
                    </p>
                  </div>
                  <Button
                    onClick={handleSaveSizes}
                    disabled={savingSizes || sizesLocked}
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {savingSizes ? 'Sauvegarde...' : sizesLocked ? 'Verrouillé' : 'Sauvegarder'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {sizesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
                    <p className="text-sm text-muted-foreground">Chargement des tailles...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Warning if materials are configured */}
                    {hasMaterialsConfigured() && (
                      <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-amber-600 dark:text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                              Configuration verrouillée
                            </h4>
                            <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                              {sizesLocked 
                                ? "Des matériaux ou mesures sont configurés pour des tailles spécifiques. Supprimez d'abord ces configurations pour modifier les tailles." 
                                : "Des matériaux sont configurés pour ce produit. Vous pouvez modifier les tailles car aucun matériau n'est lié à des tailles spécifiques."
                              }
                            </p>
                            {sizesLocked && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/soustraitance-products/${id}/configurer-materiaux`)}
                                className="mt-2 text-xs h-7 bg-amber-100 dark:bg-amber-900/50 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 hover:bg-amber-200 dark:hover:bg-amber-900"
                              >
                                Gérer les matériaux
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* No Size Option */}
                    <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id="no_size" 
                          checked={productSizes.no_size || false}
                          disabled={sizesLocked}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              // If no_size is checked, uncheck all other sizes
                              setProductSizes({
                                clothing: {},
                                numeric_pants: {},
                                shoes: {},
                                belts: {},
                                no_size: true
                              });
                            } else {
                              setProductSizes(prev => ({
                                ...prev,
                                no_size: false
                              }));
                            }
                          }}
                        />
                        <div>
                          <Label htmlFor="no_size" className={`text-sm font-semibold cursor-pointer ${hasSizeSpecificMaterials() ? 'text-muted-foreground' : 'text-blue-700 dark:text-blue-300'}`}>
                            Aucune taille spécifique (Accessoires, etc.)
                          </Label>
                          <p className={`text-xs mt-1 ${hasSizeSpecificMaterials() ? 'text-muted-foreground' : 'text-blue-600 dark:text-blue-400'}`}>
                            Cochez cette option pour les produits sans tailles (accessoires, bijoux, etc.)
                          </p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Regular Sizes - Disabled if no_size is checked OR if size-specific materials exist */}
                    <div className={productSizes.no_size || sizesLocked ? "opacity-50 pointer-events-none" : ""}>
                    
                    {/* Currently Configured Sizes Display */}
                    {product && (
                      <div className="mb-6">
                        <Label className="text-base font-semibold mb-3 block">Tailles actuellement configurées</Label>
                        <div className="flex flex-wrap gap-2">
                          {getConfiguredSizes(product).length > 0 ? (
                            getConfiguredSizes(product).map(size => (
                              <Badge key={size} variant="default" className="text-sm">
                                {size}
                              </Badge>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground">Aucune taille configurée</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Clothing sizes */}
                    <div>
                      <Label className="text-base font-semibold mb-3 block">Vêtements (XS, S, M, L, XL, etc.)</Label>
                      <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                        {['xs', 's', 'm', 'l', 'xl', 'xxl', '3xl', '4xl'].map(size => (
                          <div key={size} className="flex items-center space-x-2">
                            <Checkbox
                              id={`clothing-${size}`}
                              checked={productSizes.clothing?.[size] || false}
                              disabled={productSizes.no_size || sizesLocked}
                              onCheckedChange={(checked) => {
                                setProductSizes(prev => ({
                                  ...prev,
                                  clothing: {
                                    ...prev.clothing,
                                    [size]: !!checked
                                  },
                                  no_size: false // Uncheck no_size if any size is selected
                                }));
                              }}
                            />
                            <Label htmlFor={`clothing-${size}`} className="text-sm">
                              {size.toUpperCase()}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Numeric pants sizes */}
                    <div>
                      <Label className="text-base font-semibold mb-3 block">Pantalons (30, 31, 32, etc.)</Label>
                      <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                        {['30', '31', '32', '33', '34', '36', '38', '40', '42', '44', '46', '48', '50', '52', '54', '56', '58', '60', '62', '64', '66'].map(size => (
                          <div key={size} className="flex items-center space-x-2">
                            <Checkbox
                              id={`pants-${size}`}
                              checked={productSizes.numeric_pants?.[size] || false}
                              disabled={productSizes.no_size || sizesLocked}
                              onCheckedChange={(checked) => {
                                setProductSizes(prev => ({
                                  ...prev,
                                  numeric_pants: {
                                    ...prev.numeric_pants,
                                    [size]: !!checked
                                  },
                                  no_size: false // Uncheck no_size if any size is selected
                                }));
                              }}
                            />
                            <Label htmlFor={`pants-${size}`} className="text-sm">
                              {size}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Shoes sizes */}
                    <div>
                      <Label className="text-base font-semibold mb-3 block">Chaussures (39, 40, 41, etc.)</Label>
                      <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                        {['39', '40', '41', '42', '43', '44', '45', '46', '47'].map(size => (
                          <div key={size} className="flex items-center space-x-2">
                            <Checkbox
                              id={`shoes-${size}`}
                              checked={productSizes.shoes?.[size] || false}
                              disabled={productSizes.no_size || sizesLocked}
                              onCheckedChange={(checked) => {
                                setProductSizes(prev => ({
                                  ...prev,
                                  shoes: {
                                    ...prev.shoes,
                                    [size]: !!checked
                                  },
                                  no_size: false // Uncheck no_size if any size is selected
                                }));
                              }}
                            />
                            <Label htmlFor={`shoes-${size}`} className="text-sm">
                              {size}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Belts sizes */}
                    <div>
                      <Label className="text-base font-semibold mb-3 block">Ceintures (85, 90, 95, etc.)</Label>
                      <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                        {['85', '90', '95', '100', '105', '110', '115', '120', '125'].map(size => (
                          <div key={size} className="flex items-center space-x-2">
                            <Checkbox
                              id={`belts-${size}`}
                              checked={productSizes.belts?.[size] || false}
                              disabled={productSizes.no_size || sizesLocked}
                              onCheckedChange={(checked) => {
                                setProductSizes(prev => ({
                                  ...prev,
                                  belts: {
                                    ...prev.belts,
                                    [size]: !!checked
                                  },
                                  no_size: false // Uncheck no_size if any size is selected
                                }));
                              }}
                            />
                            <Label htmlFor={`belts-${size}`} className="text-sm">
                              {size}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    </div> {/* End of disabled wrapper */}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Measurements Tab */}
          <TabsContent value="measurements" className="space-y-6">
            {product && (
              <ProductMeasurementScaleBySizes 
                productId={id!}
                productType="soustraitance"
                productName={product.nom_product}
                configuredSizes={getConfiguredSizes(product)}
              />
            )}
          </TabsContent>

          {/* Stock Tab */}
          <TabsContent value="stock" className="space-y-6">
            <SoustraitanceStockManager 
              productId={parseInt(product.id)} 
              productName={product.nom_product} 
            />
          </TabsContent>

          {/* Files Tab */}
          <TabsContent value="files" className="space-y-6">
            {product && (
              <SoustraitanceProductFilesUpload
                productId={parseInt(product.id)}
                files={productFiles}
                onFilesUpdate={() => loadProductFiles(product.id)}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Image Gallery Modal */}
      <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Images du produit - {product.nom_product}</DialogTitle>
          </DialogHeader>
          <div className="relative">
            {selectedImages.length > 0 && (
              <>
                <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
                  <img 
                    src={selectedImages[currentImageIndex]} 
                    alt={`${product.nom_product} ${currentImageIndex + 1}`}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder.svg';
                    }}
                  />
                </div>
                {selectedImages.length > 1 && (
                  <div className="flex justify-center items-center gap-4 mt-4">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentImageIndex(prev => prev > 0 ? prev - 1 : selectedImages.length - 1)}
                    >
                      Précédent
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {currentImageIndex + 1} / {selectedImages.length}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentImageIndex(prev => prev < selectedImages.length - 1 ? prev + 1 : 0)}
                    >
                      Suivant
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Product Report Modal */}
      <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileOutput className="h-5 w-5" />
              Rapport Produit Sous-traitance - {product.nom_product}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex gap-2 justify-end">
              <Button onClick={handlePrintReport} className="flex items-center gap-2">
                <FileOutput className="h-4 w-4" />
                Imprimer / Exporter PDF
              </Button>
            </div>
            <div className="border rounded-lg overflow-auto max-h-[70vh] bg-white">
              <div id="soustraitance-product-report-content">
                <SoustraitanceProductReport
                  product={product}
                  materials={materials}
                  productFiles={productFiles}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReportModal(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SoustraitanceProductDetails;