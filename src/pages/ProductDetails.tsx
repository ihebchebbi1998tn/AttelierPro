import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Play, Eye, Settings, Plus, Trash2, Edit, Image, Cog, Ruler, Package, FileText, FileOutput } from 'lucide-react';
import { getProductImageUrl, getProductImages } from "@/utils/imageUtils";
import { formatNumber } from "@/lib/utils";
import SizeBreakdown from "@/components/SizeBreakdown";
import ProductAttachments from '@/components/ProductAttachments';
import MeasurementScaleTable from '@/components/MeasurementScaleTable';
import ProductReport from '@/components/ProductReport';
import ProductMeasurementScaleBySizes from '@/components/ProductMeasurementScaleBySizes';
import ProductionSpecifications from '@/components/ProductionSpecifications';

interface Product {
  id: number;
  boutique_origin: string;
  external_product_id: string;
  reference_product: string;
  nom_product: string;
  img_product?: string;
  img2_product?: string;
  img3_product?: string;
  img4_product?: string;
  img5_product?: string;
  description_product?: string;
  type_product?: string;
  category_product?: string;
  itemgroup_product?: string;
  price_product: number;
  qnty_product: number;
  color_product?: string;
  collection_product?: string;
  status_product: string;
  auto_replenishment: boolean;
  auto_replenishment_quantity: number;
  auto_replenishment_quantity_sizes?: string;
  sizes_data?: string;
  discount_product?: number;
  related_products?: string;
  createdate_product?: string;
  // All size fields
  s_size?: number;
  m_size?: number;
  l_size?: number;
  xl_size?: number;
  xxl_size?: number;
  '3xl_size'?: number;
  '4xl_size'?: number;
  xs_size?: number;
  '30_size'?: number;
  '31_size'?: number;
  '32_size'?: number;
  '33_size'?: number;
  '34_size'?: number;
  '36_size'?: number;
  '38_size'?: number;
  '39_size'?: number;
  '40_size'?: number;
  '41_size'?: number;
  '42_size'?: number;
  '43_size'?: number;
  '44_size'?: number;
  '45_size'?: number;
  '46_size'?: number;
  '47_size'?: number;
  '48_size'?: number;
  '50_size'?: number;
  '52_size'?: number;
  '54_size'?: number;
  '56_size'?: number;
  '58_size'?: number;
  '60_size'?: number;
  '62_size'?: number;
  '64_size'?: number;
  '66_size'?: number;
  '85_size'?: number;
  '90_size'?: number;
  '95_size'?: number;
  '100_size'?: number;
  '105_size'?: number;
  '110_size'?: number;
  '115_size'?: number;
  '120_size'?: number;
  '125_size'?: number;
  materials_configured: number | string;
  sync_date: string;
  created_at: string;
  updated_at: string;
  production_quantities?: string;
  production_specifications?: string;
}

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [sizeConfigured, setSizeConfigured] = useState(false);
  const [configuredSizes, setConfiguredSizes] = useState<any>({});
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [productSizes, setProductSizes] = useState<{
    clothing?: { [size: string]: boolean };
    numeric_pants?: { [size: string]: boolean };
    shoes?: { [size: string]: boolean };
    belts?: { [size: string]: boolean };
  }>({});
  const [hasNoSizes, setHasNoSizes] = useState(false);
  const [configuredMaterials, setConfiguredMaterials] = useState<any[]>([]);
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [measurementScale, setMeasurementScale] = useState<any>(null);
  const [sizesLocked, setSizesLocked] = useState(false);

  const markProductAsSeen = async (productId: string) => {
    try {
      await fetch('https://luccibyey.com.tn/production/api/mark_product_as_seen.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId: parseInt(productId) })
      });
    } catch (error) {
      console.error('Error marking product as seen:', error);
    }
  };

  const loadProduct = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const response = await fetch(`https://luccibyey.com.tn/production/api/production_ready_products.php?id=${id}`);
      const data = await response.json();
      if (data.success && data.data) {
        setProduct(data.data);
        // Mark product as seen when entering details page
        await markProductAsSeen(id);
        // Load size configuration and materials if configured
        await loadSizeConfiguration(id);
        await loadMeasurementScale(id);
        if (data.data.materials_configured == 1 || data.data.materials_configured === "1") {
          await loadConfiguredMaterials(id);
        }
      } else {
        throw new Error(data.message || 'Produit non trouvé');
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les détails du produit",
        variant: "destructive",
      });
      navigate('/produits');
    } finally {
      setLoading(false);
    }
  };

  const loadConfiguredMaterials = async (productId: string) => {
    setMaterialsLoading(true);
    try {
      const response = await fetch(`https://luccibyey.com.tn/production/api/production_product_materials.php?product_id=${productId}`);
      const data = await response.json();
      if (data.success) {
        // Group materials by material_id to show size breakdown
        const groupedMaterials = {};
        
        // First pass: group materials
        (data.data || []).forEach(material => {
          const materialId = material.material_id;
          if (!groupedMaterials[materialId]) {
            groupedMaterials[materialId] = {
              ...material,
              sizes: []
            };
          }
          groupedMaterials[materialId].sizes.push({
            size: material.size_specific,
            quantity: material.quantity_needed,
            unit: material.quantity_unit
          });
        });
        
        // Second pass: fetch complete material details including color for each unique material
        const materialIds = Object.keys(groupedMaterials);
        const enrichedMaterials = await Promise.all(
          materialIds.map(async (materialId) => {
            try {
              // Fetch complete material details from the matieres API
              const materialResponse = await fetch(`https://luccibyey.com.tn/production/api/matieres.php?id=${materialId}`);
              const materialData = await materialResponse.json();
              
              if (materialData.success && materialData.data) {
                // Merge the complete material data (including color) with our grouped material
                return {
                  ...groupedMaterials[materialId],
                  color: materialData.data.couleur || materialData.data.color, // Handle both field names
                  material_description: materialData.data.description,
                  material_reference: materialData.data.reference,
                  material_image: materialData.data.image_url
                };
              }
            } catch (error) {
              console.error(`Error fetching material details for ID ${materialId}:`, error);
            }
            
            // Return original material if fetch fails
            return groupedMaterials[materialId];
          })
        );
        
        setConfiguredMaterials(enrichedMaterials);
      }
    } catch (error) {
      console.error('Error loading configured materials:', error);
    } finally {
      setMaterialsLoading(false);
    }
  };

  const loadSizeConfiguration = async (productId: string) => {
    try {
      const response = await fetch(`https://luccibyey.com.tn/production/api/product_sizes.php?product_id=${productId}`);
      const data = await response.json();
      if (data.success) {
        // Consider both configured sizes and "no sizes" flag as valid configuration
        const hasConfiguredSizes = Object.keys(data.data || {}).length > 0 || data.no_sizes;
        setSizeConfigured(hasConfiguredSizes);
        setConfiguredSizes(data.data || {});
      } else {
        setSizeConfigured(false);
        setConfiguredSizes({});
      }
    } catch (error) {
      setSizeConfigured(false);
      setConfiguredSizes({});
    }
  };

  const loadMeasurementScale = async (productId: string) => {
    try {
      const response = await fetch(`https://luccibyey.com.tn/production/api/product_measurement_scales.php?product_id=${productId}`);
      const data = await response.json();
      if (data.success && data.data) {
        setMeasurementScale({
          measurement_types: data.data.measurement_types || [],
          measurements_data: data.data.measurements_data || {},
          tolerance_data: data.data.tolerance_data || {}
        });
      }
    } catch (error) {
      console.error('Error loading measurement scale:', error);
      setMeasurementScale(null);
    }
  };

  // Helper functions for material configuration restrictions
  const hasSizeSpecificMaterials = () => {
    return configuredMaterials.some(material => 
      material.sizes && material.sizes.some(size => size.size && size.size !== 'general')
    );
  };

  // Check if measurements are configured for specific sizes
  const hasSizeSpecificMeasurements = async () => {
    try {
      const response = await fetch(`https://luccibyey.com.tn/production/api/production_ready_products_mesure_by_size.php?product_id=${product?.id}`);
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

  const hasMaterialsConfigured = () => {
    return configuredMaterials && configuredMaterials.length > 0;
  };

  const handleViewImages = (product: Product) => {
    const images = getProductImages(product);
    if (images.length > 0) {
      setSelectedImages(images);
      setCurrentImageIndex(0);
      setShowImageModal(true);
    }
  };

  const handleStartProduction = () => {
    if (product) {
      if ((product.materials_configured == 1 || product.materials_configured === "1")) {
        // Navigate to production planning page if materials are configured
        navigate(`/produits/${id}/production-planning`);
      } else {
        // Navigate to materials configuration page
        navigate(`/produits/${id}/configurer-materiaux`);
      }
    }
  };

  const handleConfigureMaterials = () => {
    navigate(`/produits/${id}/configurer-materiaux`);
  };

  const handleMaterialsConfigurationSave = () => {
    // Reload product data and configured materials
    loadProduct();
  };

  const handleConfigureSizes = async () => {
    try {
      // Load current sizes configuration from API
      const response = await fetch(`https://luccibyey.com.tn/production/api/product_sizes.php?product_id=${id}`);
      const data = await response.json();
      
      if (data.success) {
        // Check if product has no sizes
        if (data.no_sizes) {
          setHasNoSizes(true);
          setProductSizes({});
        } else {
          setHasNoSizes(false);
          // Convert API data to our format
          const currentSizes = {};
          Object.keys(data.data || {}).forEach(sizeType => {
            currentSizes[sizeType] = {};
            data.data[sizeType].forEach(size => {
              currentSizes[sizeType][size.size_value] = size.is_active === '1';
            });
          });
          
          setProductSizes(currentSizes);
        }
      } else {
        // Initialize sizes if no configuration exists
        await initializeProductSizes();
      }
      
      setShowSizeModal(true);
    } catch (error) {
      console.error('Error loading sizes:', error);
      // Initialize sizes on error
      await initializeProductSizes();
      setShowSizeModal(true);
    }
  };

  const initializeProductSizes = async () => {
    try {
      const response = await fetch('https://luccibyey.com.tn/production/api/init_product_sizes.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ product_id: id })
      });
      
      const data = await response.json();
      if (data.success) {
        // Set default sizes (all unchecked)
        setHasNoSizes(false);
        setProductSizes({
          clothing: {
            xs: false, s: false, m: false, l: false, xl: false, xxl: false, '3xl': false, '4xl': false
          },
          numeric_pants: {
            '30': false, '31': false, '32': false, '33': false, '34': false, '36': false, '38': false, '40': false,
            '42': false, '44': false, '46': false, '48': false, '50': false, '52': false, '54': false, '56': false,
            '58': false, '60': false, '62': false, '64': false, '66': false
          },
          shoes: {
            '39': false, '40': false, '41': false, '42': false, '43': false, '44': false, '45': false, '46': false, '47': false
          },
          belts: {
            '85': false, '90': false, '95': false, '100': false, '105': false, '110': false, '115': false, '120': false, '125': false
          }
        });
      }
    } catch (error) {
      console.error('Error initializing sizes:', error);
      // Set default empty sizes
      setHasNoSizes(false);
      setProductSizes({
        clothing: {},
        numeric_pants: {},
        shoes: {},
        belts: {}
      });
    }
  };

  const handlePrintReport = () => {
    const reportElement = document.getElementById('product-report-content');
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
              
              /* Header section */
              .text-center {
                text-align: center;
              }
              
              .border-b-2 {
                border-bottom: 1.5px solid #000;
              }
              
              .pb-4 {
                padding-bottom: 12px;
              }
              
              .mb-6 {
                margin-bottom: 18px;
              }
              
              .mb-2 {
                margin-bottom: 6px;
              }
              
              .mb-3 {
                margin-bottom: 8px;
              }
              
              /* Grid layouts */
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
              
              .bg-gray-50 {
                background-color: #fbfcfd !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              
              /* Borders */
              .border {
                border: 1px solid #000;
              }
              
              .border-black {
                border-color: #000;
              }
              
              .border-b {
                border-bottom: 1px solid #000;
              }
              
              .border-r {
                border-right: 1px solid #000;
              }
              
              .border-gray-300 {
                border: 1px solid #d1d5db;
              }
              
              /* Padding and margins */
              .p-1 {
                padding: 3px;
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
              
              /* Text styles */
              .text-xs {
                font-size: 8px;
              }
              
              .text-sm {
                font-size: 9px;
              }
              
              .text-lg {
                font-size: 12px;
              }
              
              .text-2xl {
                font-size: 18px;
              }
              
              .font-bold {
                font-weight: 600;
              }
              
              .font-medium {
                font-weight: 500;
              }
              
              .text-center {
                text-align: center;
              }
              
              .text-left {
                text-align: left;
              }
              
              /* Size boxes */
              .inline-block {
                display: inline-block;
              }
              
              .mr-2 {
                margin-right: 6px;
              }
              
              /* Page breaks */
              .break-inside-avoid {
                break-inside: avoid;
                page-break-inside: avoid;
              }
              
              /* Ensure content doesn't break awkwardly */
              table, .grid, .mb-6 {
                break-inside: avoid;
                page-break-inside: avoid;
              }
              
              /* Strong text */
              strong {
                font-weight: 600;
                font-size: 10px;
              }
              
              /* Measurement scale specific styles */
              .w-full {
                width: 100%;
              }
              
              /* Hide any unwanted elements during print */
              button, .cursor-pointer {
                display: none !important;
              }
              
              /* Ensure all content is visible */
              * {
                color: #000 !important;
              }
              
              /* Size grid styling */
              .grid-cols-8 > div {
                border: 1px solid #d1d5db;
                padding: 3px;
                text-align: center;
                font-size: 8px;
                min-height: 18px;
                display: flex;
                align-items: center;
                justify-content: center;
              }
              
              /* Material table responsive text */
              .material-sizes span {
                display: inline-block;
                margin-right: 6px;
                font-size: 8px;
              }
              
              /* Ensure HTML content in description is properly styled */
              div[dangerouslySetInnerHTML] p {
                margin-bottom: 6px;
              }
              
              div[dangerouslySetInnerHTML] ul {
                margin-left: 16px;
                margin-bottom: 6px;
              }
              
              div[dangerouslySetInnerHTML] li {
                margin-bottom: 3px;
              }
              
              /* Professional spacing adjustments */
              .text-sm div {
                font-size: 9px;
                line-height: 1.2;
              }
              
              /* Compact layout for better space utilization */
              .grid-cols-2 > div {
                padding-right: 8px;
              }
              
              /* Professional header styling */
              .text-center .text-sm {
                font-size: 9px;
                color: #333;
                font-weight: 400;
              }
              
              /* Ensure consistent font sizing throughout */
              div {
                font-size: inherit;
              }
              
              /* Table header improvements */
              thead tr {
                background-color: #f8f9fa !important;
              }
              
              /* Subtle improvements for readability */
              table {
                font-variant-numeric: tabular-nums;
              }
              
              /* Status badges and indicators */
              .badge {
                display: inline-block;
                padding: 2px 4px;
                border: 1px solid #000;
                font-size: 8px;
                font-weight: 500;
              }
              
              /* Ensure proper table cell alignment */
              td.text-center {
                text-align: center;
              }
              
              td.text-left {
                text-align: left;
              }
            </style>
            <script>
              window.onload = function() {
                setTimeout(() => {
                  window.print();
                }, 500);
              };
            </script>
          </head>
          <body>
            ${reportElement.innerHTML}
          </body>
        </html>
      `;

      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    }
  };

  const saveSizesConfiguration = async () => {
    if (!product) return;

    try {
      let requestBody;
      
      if (hasNoSizes) {
        // Product has no sizes
        requestBody = {
          product_id: product.id,
          no_sizes: true
        };
      } else {
        // Convert productSizes to API format
        const sizesData = {};
        Object.keys(productSizes).forEach(sizeType => {
          sizesData[sizeType] = [];
          Object.keys(productSizes[sizeType]).forEach(sizeValue => {
            if (productSizes[sizeType][sizeValue]) {
              sizesData[sizeType].push(sizeValue);
            }
          });
        });

        requestBody = {
          product_id: product.id,
          sizes: sizesData
        };
      }

      const response = await fetch('https://luccibyey.com.tn/production/api/product_sizes.php', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Succès",
          description: "Configuration des tailles sauvegardée",
        });
        setShowSizeModal(false);
        loadProduct(); // Reload to get updated data
      } else {
        throw new Error(data.message || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Error saving sizes:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la configuration des tailles",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadProduct();
  }, [id, location.state?.refresh]);

  useEffect(() => {
    if (product) {
      updateSizesLockedState();
    }
  }, [configuredMaterials, product]);

  // Remove the window focus listener as we're using location state instead

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Produit non trouvé</p>
          <Button onClick={() => navigate('/produits')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux produits
          </Button>
        </div>
      </div>
    );
  }

  const images = getProductImages(product);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 pb-6 md:pb-0">
      {/* Header */}
      <div className="bg-card/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-3 md:px-6 py-2 md:py-4">
          <div className="flex flex-col gap-2 md:gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 md:gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/produits')}
                className="hover:bg-muted/50 flex-shrink-0 h-8 w-8 md:h-9 md:w-auto p-0 md:px-4"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden md:inline ml-2">Retour</span>
              </Button>
              <div className="hidden sm:block h-6 md:h-8 w-px bg-border" />
              <div className="min-w-0 flex-1">
                <h1 className="text-sm md:text-2xl font-bold text-foreground truncate">{product.nom_product}</h1>
                <p className="text-xs text-muted-foreground truncate">Ref: {product.reference_product}</p>
              </div>
            </div>
            <div className="flex gap-1 md:gap-3 flex-wrap">
              {(product.materials_configured !== 1 && product.materials_configured !== "1") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleConfigureMaterials}
                  className="flex items-center gap-1 md:gap-2 flex-1 sm:flex-initial text-xs h-8 md:h-9"
                >
                  <Settings className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="truncate hidden md:inline">Configurer Matériaux</span>
                  <span className="truncate md:hidden">Config</span>
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowReportModal(true)}
                className="flex items-center gap-1 md:gap-2 flex-1 sm:flex-initial text-xs h-8 md:h-9"
              >
                <FileOutput className="h-3 w-3 md:h-4 md:w-4" />
                <span className="truncate">Rapport</span>
              </Button>
              <Button
                onClick={handleStartProduction}
                size="sm"
                className="flex items-center gap-1 md:gap-2 flex-1 sm:flex-initial text-xs h-8 md:h-9"
                disabled={(product.materials_configured !== 1 && product.materials_configured !== "1")}
              >
                <Play className="h-3 w-3 md:h-4 md:w-4" />
                <span className="truncate hidden md:inline">
                  {(product.materials_configured == 1 || product.materials_configured === "1") ? 'Démarrer Production' : 'Configuration requise'}
                </span>
                <span className="truncate md:hidden">
                  {(product.materials_configured == 1 || product.materials_configured === "1") ? 'Production' : 'Config'}
                </span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 md:px-6 py-4 md:py-8">
        {/* Main Tabbed Content */}
        <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 bg-muted p-1 gap-1">
              <TabsTrigger value="overview" className="flex items-center gap-1 md:gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs md:text-sm">
                <Image className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Aperçu</span>
              </TabsTrigger>
              <TabsTrigger value="materials" className="flex items-center gap-1 md:gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs md:text-sm">
                <Cog className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Matériaux</span>
              </TabsTrigger>
              <TabsTrigger value="sizes" className="flex items-center gap-1 md:gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs md:text-sm">
                <Ruler className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Tailles</span>
              </TabsTrigger>
              <TabsTrigger value="measurements" className="flex items-center gap-1 md:gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs md:text-sm">
                <Ruler className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Mesures</span>
              </TabsTrigger>
              <TabsTrigger value="stock" className="flex items-center gap-1 md:gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs md:text-sm">
                <Package className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Stock</span>
              </TabsTrigger>
              <TabsTrigger value="attachments" className="flex items-center gap-1 md:gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs md:text-sm">
                <FileText className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Fichiers</span>
              </TabsTrigger>
            </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
              {/* Images Section */}
              <div className="lg:col-span-1">
                <Card className="overflow-hidden shadow-sm">
                  <CardContent className="p-0">
                    {images.length > 0 ? (
                      <div className="space-y-3">
                        {/* Main Image */}
                        <div className="relative aspect-square md:aspect-square bg-muted max-h-64 md:max-h-none">
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
                            className="absolute top-2 right-2 md:top-3 md:right-3 bg-background/90 backdrop-blur-sm text-xs px-2 py-1 md:px-3 md:py-2 shadow-md"
                            onClick={() => handleViewImages(product)}
                          >
                            <Eye className="h-3 w-3 md:h-4 md:w-4 mr-1" />
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
                  <CardHeader className="pb-3 md:pb-4 px-3 md:px-6 pt-3 md:pt-6">
                    <div className="flex flex-col gap-2 md:gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <CardTitle className="text-base md:text-xl">Informations Générales</CardTitle>
                      <div className="flex gap-1 md:gap-2 flex-wrap">
                        <Badge variant={product.status_product === 'active' ? 'default' : 'secondary'} className="text-xs">
                          {product.status_product === 'active' ? '✓ Actif' : '○ Inactif'}
                        </Badge>
                        <Badge variant={product.boutique_origin === 'luccibyey' ? 'default' : 'secondary'} className="text-xs">
                          {product.boutique_origin === 'luccibyey' ? 'Lucci By Ey' : 'Spada di Battaglia'}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Type</Label>
                        <p className="text-sm font-medium">{product.type_product || 'Non spécifié'}</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Prix</Label>
                        <p className="text-lg font-bold text-primary">{product.price_product} TND</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Stock à produire</Label>
                        {product.production_quantities ? (
                          <div className="space-y-1">
                            {Object.entries(JSON.parse(product.production_quantities) as Record<string, number>).map(([size, qty]) => (
                              <p key={size} className="text-sm font-medium">
                                <span className="text-primary font-bold">{size}</span>: {qty} pièce{qty > 1 ? 's' : ''}
                              </p>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm font-medium">{product.qnty_product} pièces</p>
                        )}
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
                      {product.collection_product && (
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Collection</Label>
                          <p className="text-sm">{product.collection_product}</p>
                        </div>
                      )}
                      {product.discount_product && product.discount_product > 0 && (
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Remise</Label>
                          <p className="text-sm font-medium text-destructive">{product.discount_product} TND</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Production Specifications */}
            {product.production_specifications && 
             product.production_specifications !== 'null' && 
             product.production_specifications !== '{}' && (
              <ProductionSpecifications
                specifications={typeof product.production_specifications === 'string' 
                  ? JSON.parse(product.production_specifications) 
                  : product.production_specifications}
                editable={false}
                productName={product.nom_product}
              />
            )}

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
                    Produit créé le {new Date(product.createdate_product || product.created_at).toLocaleDateString('fr-FR', {
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
          <TabsContent value="materials" className="space-y-4 md:space-y-6">
            <Card>
              <CardContent className="p-3 md:p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0 mb-3 md:mb-4">
                  <div className="flex-1">
                    <Label className="text-base md:text-lg font-semibold">Configuration des Matériaux</Label>
                    <div className="mt-1 md:mt-2">
                      <Badge variant={(product.materials_configured == 1 || product.materials_configured === "1") ? 'default' : 'destructive'} className="text-xs">
                        {(product.materials_configured == 1 || product.materials_configured === "1") ? 'Configurés' : 'Non configurés'}
                      </Badge>
                    </div>
                  </div>
                  {(product.materials_configured == 1 || product.materials_configured === "1") ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleConfigureMaterials}
                      className="w-full md:w-auto text-xs md:text-sm"
                    >
                      <Edit className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                      <span className="hidden md:inline">Modifier la configuration</span>
                      <span className="md:hidden">Modifier</span>
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={handleConfigureMaterials}
                      className="w-full md:w-auto text-xs md:text-sm"
                    >
                      <Plus className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                      Configurer
                    </Button>
                  )}
                </div>
                
                {/* Display configured materials */}
                {(product.materials_configured == 1 || product.materials_configured === "1") ? (
                  <div className="space-y-4">
                    {materialsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
                        <p className="text-sm text-muted-foreground">Chargement des matériaux...</p>
                      </div>
                    ) : configuredMaterials.length > 0 ? (
                      <div className="grid gap-4">
                        {configuredMaterials.map((material, index) => {
                          // Calculate total quantity needed across all sizes
                          const totalQuantityNeeded = material.sizes.reduce((total, size) => total + parseFloat(size.quantity), 0);
                          const stockPercentage = (parseFloat(material.material_stock) / totalQuantityNeeded) * 100;
                          const stockLevel = stockPercentage >= 100 ? 'sufficient' : stockPercentage >= 50 ? 'warning' : 'critical';
                          
                          return (
                            <Card 
                              key={material.material_id} 
                              className="cursor-pointer hover:shadow-md transition-all duration-200 border-l-4"
                              style={{ borderLeftColor: material.color || '#6B7280' }}
                              onClick={() => {
                                setSelectedMaterial(material);
                                setShowMaterialModal(true);
                              }}
                            >
                              <CardContent className="p-3 md:p-4">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
                                  <div className="flex items-start gap-2 md:gap-3 flex-1 min-w-0">
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-semibold text-sm md:text-base text-foreground truncate">
                                        {material.material_name}
                                      </h4>
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs font-medium text-muted-foreground">Couleur:</span>
                                        <span className="text-xs text-muted-foreground truncate">{material.color || 'Non définie'}</span>
                                      </div>
                                      <p className="text-xs md:text-sm text-muted-foreground mt-1">
                                        {material.quantity_type_name}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-left md:text-right flex-shrink-0">
                                    <div className="text-xs md:text-sm font-medium">
                                      Requis: {formatNumber(totalQuantityNeeded)} {material.quantity_unit}
                                    </div>
                                    <div className="text-xs md:text-sm text-muted-foreground">
                                      Stock: {formatNumber(material.material_stock)} {material.quantity_unit}
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Size breakdown */}
                                <div className="flex flex-wrap gap-2 mb-3">
                                  {material.sizes.map((size, sizeIndex) => (
                                     <Badge key={sizeIndex} variant="secondary" className="text-xs">
                                       {size.size ? `${size.size.toUpperCase()}: ` : 'Sans taille: '}{formatNumber(size.quantity)} {size.unit}
                                     </Badge>
                                  ))}
                                </div>

                                {/* Stock level indicator */}
                                <div className="space-y-1 md:space-y-2">
                                  <div className="flex items-center justify-between text-xs md:text-sm">
                                    <span>Niveau de stock</span>
                                    <span className={`font-medium ${
                                      stockLevel === 'sufficient' ? 'text-green-600' : 
                                      stockLevel === 'warning' ? 'text-orange-500' : 
                                      'text-red-600'
                                    }`}>
                                      {stockPercentage.toFixed(0)}%
                                    </span>
                                  </div>
                                  <div className="w-full bg-muted rounded-full h-2">
                                    <div 
                                      className={`h-2 rounded-full transition-all ${
                                        stockLevel === 'sufficient' ? 'bg-green-500' : 
                                        stockLevel === 'warning' ? 'bg-orange-500' : 
                                        'bg-red-500'
                                      }`}
                                      style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                                    />
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    ) : (
                      <Card>
                        <CardContent className="flex flex-col items-center justify-center py-8 md:py-12 px-3 md:px-6">
                          <Cog className="h-8 w-8 md:h-12 md:w-12 text-muted-foreground mb-3 md:mb-4" />
                          <h3 className="text-sm md:text-lg font-semibold mb-2">Aucun matériau configuré</h3>
                          <p className="text-xs md:text-sm text-muted-foreground text-center mb-3 md:mb-4">
                            Configurez les matériaux nécessaires pour ce produit
                          </p>
                          <Button onClick={handleConfigureMaterials} size="sm" className="text-xs md:text-sm">
                            <Plus className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                            Configurer les matériaux
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-8 md:py-12 px-3 md:px-6">
                      <Cog className="h-8 w-8 md:h-12 md:w-12 text-muted-foreground mb-3 md:mb-4" />
                      <h3 className="text-sm md:text-lg font-semibold mb-2">Matériaux non configurés</h3>
                      <p className="text-xs md:text-sm text-muted-foreground text-center mb-3 md:mb-4">
                        Ce produit n'a pas encore de matériaux configurés. Configurez-les pour pouvoir démarrer la production.
                      </p>
                      <Button onClick={handleConfigureMaterials} size="sm" className="text-xs md:text-sm">
                        <Plus className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                        Configurer maintenant
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sizes & Measurements Tab */}
          <TabsContent value="sizes" className="space-y-4 md:space-y-6">
            {/* Size Configuration */}
            <Card>
              <CardContent className="p-3 md:p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0 mb-3 md:mb-4">
                  <div className="flex-1">
                    <Label className="text-base md:text-lg font-semibold">Configuration des Tailles</Label>
                    <div className="mt-1 md:mt-2 flex items-center gap-1 md:gap-2 flex-wrap">
                      <Badge variant={sizeConfigured ? 'default' : 'destructive'} className="text-xs">
                        {sizeConfigured ? 'Configurées' : 'Non configurées'}
                      </Badge>
                      {sizeConfigured && Object.keys(configuredSizes).length === 0 && (
                        <Badge variant="secondary" className="text-xs">
                          Sans tailles
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={handleConfigureSizes}
                    variant={sizeConfigured ? "outline" : "default"}
                    size="sm"
                    className="w-full md:w-auto text-xs md:text-sm"
                  >
                    <Settings className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                    {sizeConfigured ? 'Modifier' : 'Configurer'}
                  </Button>
                </div>
                
                {sizeConfigured && Object.keys(configuredSizes).length > 0 && (
                  <div className="space-y-3 md:space-y-4">
                    <div>
                      <Label className="text-xs md:text-sm font-medium mb-2 block">Tailles configurées:</Label>
                      <div className="flex flex-wrap gap-1 md:gap-2">
                        {Object.entries(configuredSizes).map(([sizeType, sizes]: [string, any]) => 
                          sizes.map((size: any, index: number) => (
                            <Badge key={`${sizeType}-${size.size_value}`} variant="outline" className="text-xs md:text-sm">
                              {size.size_value}
                            </Badge>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {!sizeConfigured && (
                  <div className="text-center py-6 md:py-8">
                    <Ruler className="h-8 w-8 md:h-12 md:w-12 text-muted-foreground mx-auto mb-3 md:mb-4" />
                    <h3 className="text-sm md:text-lg font-semibold mb-2">Aucune taille configurée</h3>
                    <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4">
                      Configurez les tailles disponibles pour ce produit
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Size Breakdown */}
            <SizeBreakdown product={product} />
          </TabsContent>

          {/* Stock Tab */}
          <TabsContent value="stock" className="space-y-4 md:space-y-6">
            {/* Auto Replenishment */}
            <Card>
              <CardHeader className="pb-2 md:pb-3 px-3 md:px-6 pt-3 md:pt-6">
                <CardTitle className="text-base md:text-lg">Réapprovisionnement Automatique</CardTitle>
              </CardHeader>
              <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
                <div className="space-y-3 md:space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant={product.auto_replenishment ? 'default' : 'outline'} className="text-xs">
                      {product.auto_replenishment ? 'Activé' : 'Désactivé'}
                    </Badge>
                  </div>
                  {product.auto_replenishment && (
                    <div className="space-y-2 md:space-y-3">
                      {product.auto_replenishment_quantity_sizes ? (
                        <div>
                          <Label className="text-xs md:text-sm font-medium">Quantités par taille:</Label>
                          <div className="flex flex-wrap gap-1 md:gap-2 mt-1 md:mt-2">
                            {(() => {
                              try {
                                const sizeQuantities = JSON.parse(product.auto_replenishment_quantity_sizes);
                                return sizeQuantities.map((item: any, index: number) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {item.size}: {formatNumber(item.quantity)}
                                  </Badge>
                                ));
                              } catch (e) {
                                return <span className="text-xs text-muted-foreground">Données invalides</span>;
                              }
                            })()}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <Label className="text-xs md:text-sm font-medium">Quantité totale:</Label>
                          <Badge variant="secondary" className="text-xs md:text-sm ml-2">
                            {product.auto_replenishment_quantity} pièces
                          </Badge>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Stock Details */}
            {(product.sizes_data || (product.qnty_product && parseInt(String(product.qnty_product)) > 0)) && (
              <Card>
                <CardHeader className="pb-2 md:pb-3 px-3 md:px-6 pt-3 md:pt-6">
                  <CardTitle className="text-base md:text-lg">Stock en Ligne Actuel</CardTitle>
                </CardHeader>
                <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
                  <div className="flex flex-wrap gap-1 md:gap-2">
                    {(() => {
                      try {
                        const stockData = JSON.parse(product.sizes_data || '{}');
                        const sizeEntries = Object.entries(stockData)
                          .filter(([_, quantity]) => parseInt(quantity as string) > 0);
                        
                        if (sizeEntries.length > 0) {
                          return sizeEntries.map(([size, quantity]) => (
                            <Badge key={size} variant="outline" className="text-xs md:text-sm">
                              {size}: {quantity as string}
                            </Badge>
                          ));
                        } else if (product.qnty_product && parseInt(String(product.qnty_product)) > 0) {
                          return (
                            <Badge variant="outline" className="text-xs md:text-sm">
                              {String(product.qnty_product)} pièces (total)
                            </Badge>
                          );
                        }
                        return <span className="text-xs md:text-sm text-muted-foreground">Aucun stock</span>;
                      } catch (e) {
                        if (product.qnty_product && parseInt(String(product.qnty_product)) > 0) {
                          return (
                            <Badge variant="outline" className="text-xs md:text-sm">
                              {String(product.qnty_product)} pièces (total)
                            </Badge>
                          );
                        }
                        return <span className="text-xs md:text-sm text-muted-foreground">Données invalides</span>;
                      }
                    })()}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Measurements Tab */}
          <TabsContent value="measurements" className="space-y-6">
            <ProductMeasurementScaleBySizes 
              productId={id!}
              productType="regular"
              productName={product.nom_product}
              configuredSizes={configuredSizes}
            />
          </TabsContent>

          {/* Attachments Tab */}
          <TabsContent value="attachments" className="space-y-6">
            <ProductAttachments productId={id!} />
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

      {/* Size Configuration Modal */}
      <Dialog open={showSizeModal} onOpenChange={setShowSizeModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configuration des tailles - {product.nom_product}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Warning banner for material configuration conflicts */}
            {sizesLocked && (
              <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-orange-800">
                      Configuration des tailles verrouillée
                    </h3>
                    <div className="mt-2 text-sm text-orange-700">
                      <p>
                        Vous ne pouvez pas modifier la configuration des tailles car des matériaux 
                        ou des mesures sont déjà configurés pour des tailles spécifiques. 
                        Supprimez d'abord ces configurations pour modifier les tailles.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* No sizes option */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="no-sizes"
                checked={hasNoSizes}
                disabled={sizesLocked}
                onCheckedChange={(checked) => {
                  if (!sizesLocked) {
                    setHasNoSizes(!!checked);
                    if (checked) {
                      setProductSizes({});
                    }
                  }
                }}
              />
              <Label htmlFor="no-sizes" className={`text-sm font-medium ${sizesLocked ? 'text-muted-foreground' : ''}`}>
                Ce produit n'a pas de tailles spécifiques
              </Label>
              {sizesLocked && (
                <span className="text-xs text-muted-foreground">(Verrouillé par configuration matériaux/mesures)</span>
              )}
            </div>

            {!hasNoSizes && (
              <>
                {/* Clothing sizes */}
                <div className={sizesLocked ? 'opacity-50' : ''}>
                  <Label className="text-base font-semibold mb-3 block">Vêtements (XS, S, M, L, XL, etc.)</Label>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                    {['xs', 's', 'm', 'l', 'xl', 'xxl', '3xl', '4xl'].map(size => (
                      <div key={size} className="flex items-center space-x-2">
                        <Checkbox
                          id={`clothing-${size}`}
                          checked={productSizes.clothing?.[size] || false}
                          disabled={sizesLocked}
                          onCheckedChange={(checked) => {
                            if (!sizesLocked) {
                              setProductSizes(prev => ({
                                ...prev,
                                clothing: {
                                  ...prev.clothing,
                                  [size]: !!checked
                                }
                              }));
                            }
                          }}
                        />
                        <Label htmlFor={`clothing-${size}`} className={`text-sm ${sizesLocked ? 'text-muted-foreground' : ''}`}>
                          {size.toUpperCase()}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Numeric pants sizes */}
                <div className={sizesLocked ? 'opacity-50' : ''}>
                  <Label className="text-base font-semibold mb-3 block">Pantalons (30-66)</Label>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                    {['30', '31', '32', '33', '34', '36', '38', '40', '42', '44', '46', '48', '50', '52', '54', '56', '58', '60', '62', '64', '66'].map(size => (
                      <div key={size} className="flex items-center space-x-2">
                        <Checkbox
                          id={`pants-${size}`}
                          checked={productSizes.numeric_pants?.[size] || false}
                          disabled={sizesLocked}
                          onCheckedChange={(checked) => {
                            if (!sizesLocked) {
                              setProductSizes(prev => ({
                                ...prev,
                                numeric_pants: {
                                  ...prev.numeric_pants,
                                  [size]: !!checked
                                }
                              }));
                            }
                          }}
                        />
                        <Label htmlFor={`pants-${size}`} className={`text-sm ${sizesLocked ? 'text-muted-foreground' : ''}`}>
                          {size}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shoe sizes */}
                <div className={sizesLocked ? 'opacity-50' : ''}>
                  <Label className="text-base font-semibold mb-3 block">Chaussures (39-47)</Label>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                    {['39', '40', '41', '42', '43', '44', '45', '46', '47'].map(size => (
                      <div key={size} className="flex items-center space-x-2">
                        <Checkbox
                          id={`shoes-${size}`}
                          checked={productSizes.shoes?.[size] || false}
                          disabled={sizesLocked}
                          onCheckedChange={(checked) => {
                            if (!sizesLocked) {
                              setProductSizes(prev => ({
                                ...prev,
                                shoes: {
                                  ...prev.shoes,
                                  [size]: !!checked
                                }
                              }));
                            }
                          }}
                        />
                        <Label htmlFor={`shoes-${size}`} className={`text-sm ${sizesLocked ? 'text-muted-foreground' : ''}`}>
                          {size}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Belt sizes */}
                <div className={sizesLocked ? 'opacity-50' : ''}>
                  <Label className="text-base font-semibold mb-3 block">Ceintures (85-125)</Label>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                    {['85', '90', '95', '100', '105', '110', '115', '120', '125'].map(size => (
                      <div key={size} className="flex items-center space-x-2">
                        <Checkbox
                          id={`belts-${size}`}
                          checked={productSizes.belts?.[size] || false}
                          disabled={sizesLocked}
                          onCheckedChange={(checked) => {
                            if (!sizesLocked) {
                              setProductSizes(prev => ({
                                ...prev,
                                belts: {
                                  ...prev.belts,
                                  [size]: !!checked
                                }
                              }));
                            }
                          }}
                        />
                        <Label htmlFor={`belts-${size}`} className={`text-sm ${sizesLocked ? 'text-muted-foreground' : ''}`}>
                          {size}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSizeModal(false)}>
              Annuler
            </Button>
            <Button 
              onClick={saveSizesConfiguration}
              disabled={sizesLocked}
              className={sizesLocked ? 'opacity-50 cursor-not-allowed' : ''}
            >
              {sizesLocked ? 'Verrouillé' : 'Sauvegarder'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Material Details Modal */}
      <Dialog open={showMaterialModal} onOpenChange={setShowMaterialModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Détails du matériau</DialogTitle>
          </DialogHeader>
          {selectedMaterial && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Couleur:</span>
                  <span className="text-sm text-muted-foreground">{selectedMaterial.color || 'Non définie'}</span>
                </div>
                <div>
                  <h3 className="font-semibold">{selectedMaterial.material_name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Stock disponible: {formatNumber(selectedMaterial.material_stock)} {selectedMaterial.quantity_unit}
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-medium mb-2">Quantités requises par taille:</h4>
                <div className="space-y-2">
                  {selectedMaterial.sizes.map((size, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-muted/30 rounded">
                      <span className="font-medium">
                        {size.size ? size.size.toUpperCase() : 'Sans taille'}
                      </span>
                      <span>
                        {formatNumber(size.quantity)} {size.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mt-4">
                <div className="flex justify-between text-sm">
                  <span>Total requis:</span>
                  <span className="font-semibold">
                    {formatNumber(selectedMaterial.sizes.reduce((total, size) => total + parseFloat(size.quantity), 0))} {selectedMaterial.quantity_unit}
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Product Report Modal */}
      <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileOutput className="h-5 w-5" />
              Rapport de produit - {product.nom_product}
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
              <div id="product-report-content">
                <ProductReport
                  product={product}
                  configuredMaterials={configuredMaterials}
                  configuredSizes={configuredSizes}
                  sizeConfigured={sizeConfigured}
                  measurementScale={measurementScale}
                />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductDetails;