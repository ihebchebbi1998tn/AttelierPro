import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw, Settings, Play, Plus, Eye, Edit, ShoppingCart, Package, Ruler } from 'lucide-react';
import { getProductImageUrl, getProductImages } from "@/utils/imageUtils";
import MaterialsConfigurationModal from "@/components/MaterialsConfigurationModal";
import { useIsMobile } from "@/hooks/use-mobile";
const Produits = () => {
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showMaterialsModal, setShowMaterialsModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showSizesModal, setShowSizesModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<any>(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [productSizes, setProductSizes] = useState<{
    clothing?: {
      [size: string]: boolean;
    };
    numeric_pants?: {
      [size: string]: boolean;
    };
    shoes?: {
      [size: string]: boolean;
    };
    belts?: {
      [size: string]: boolean;
    };
  }>({});
  const [hasNoSizes, setHasNoSizes] = useState(false);
  const handleDeleteProduct = async (productId: number) => {
    try {
      const response = await fetch(`https://luccibyey.com.tn/production/api/production_ready_products.php?id=${productId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Produit supprimé",
          description: "Le produit et toutes ses données associées ont été supprimés avec succès"
        });
        setShowDeleteModal(false);
        setProductToDelete(null);
        await loadProducts();
      } else {
        throw new Error(data.message || 'Erreur lors de la suppression');
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de supprimer le produit",
        variant: "destructive"
      });
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://luccibyey.com.tn/production/api/production_ready_products.php');
      const data = await response.json();
      if (data.success) {
        setProducts(data.data || []);
      } else {
        throw new Error(data.message || 'Erreur lors du chargement');
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les produits",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const handleViewImages = product => {
    const images = getProductImages(product);
    if (images.length > 0) {
      setSelectedImages(images);
      setCurrentImageIndex(0);
      setShowImageModal(true);
    }
  };
  const syncBoutique = async (boutique: string) => {
    setLoading(true);
    try {
      let url = '';
      if (boutique === 'luccibyey') {
        url = 'https://luccibyey.com.tn/production/api/sync_luccibyey.php';
      } else if (boutique === 'spadadibattaglia') {
        url = 'https://luccibyey.com.tn/production/api/sync_spadadibattaglia.php';
      } else if (boutique === 'all') {
        url = 'https://luccibyey.com.tn/production/api/sync_all.php';
      }
      const response = await fetch(url, {
        method: 'POST'
      });
      const data = await response.json();
      if (data.success) {
        toast({
          title: "Synchronisation réussie",
          description: data.message || `Synchronisation ${boutique} terminée`
        });
        await loadProducts();
      } else {
        throw new Error(data.message || 'Erreur lors de la synchronisation');
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: `Erreur lors de la synchronisation ${boutique}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const markAsSeen = async productId => {
    try {
      const response = await fetch('https://luccibyey.com.tn/production/api/mark_product_as_seen.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productId
        })
      });
      const data = await response.json();
      if (data.success) {
        // Refresh products list to update the highlighting
        loadProducts();
      }
    } catch (error) {
      console.error('Error marking product as seen:', error);
    }
  };
  const getRowHighlightClass = product => {
    if (!product.transfer_date || product.is_seen === "1" || product.is_seen === 1) {
      return "";
    }
    const today = new Date();
    const transferDate = new Date(product.transfer_date);

    // Reset time parts for accurate date comparison
    today.setHours(0, 0, 0, 0);
    transferDate.setHours(0, 0, 0, 0);
    if (transferDate.getTime() === today.getTime()) {
      return "bg-yellow-100 dark:bg-yellow-900/20 hover:bg-yellow-200 dark:hover:bg-yellow-900/30";
    } else if (transferDate < today) {
      return "bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/30";
    }
    return "";
  };
  const handleStartProduction = product => {
    if (product.materials_configured == 1 || product.materials_configured === "1") {
      // Navigate to production planning page if materials are configured
      navigate(`/produits/${product.id}/production-planning`);
    } else {
      // Navigate to materials configuration page
      navigate(`/produits/${product.id}/configurer-materiaux`);
    }
  };
  const handleConfigure = product => {
    setSelectedProduct(product);
    setShowConfigModal(true);
  };
  const handleConfigureMaterials = () => {
    if (selectedProduct) {
      setShowConfigModal(false);
      navigate(`/produits/${selectedProduct.id}/configurer-materiaux`);
    }
  };
  const handleConfigureSizes = async () => {
    if (selectedProduct) {
      setShowConfigModal(false);
      try {
        // Load current sizes configuration from API
        const response = await fetch(`https://luccibyey.com.tn/production/api/product_sizes.php?product_id=${selectedProduct.id}`);
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
        setShowSizesModal(true);
      } catch (error) {
        console.error('Error loading sizes:', error);
        // Initialize sizes on error
        await initializeProductSizes();
        setShowSizesModal(true);
      }
    }
  };
  const initializeProductSizes = async () => {
    try {
      const response = await fetch('https://luccibyey.com.tn/production/api/init_product_sizes.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          product_id: selectedProduct.id
        })
      });
      const data = await response.json();
      if (data.success) {
        // Set default sizes (all unchecked)
        setHasNoSizes(false);
        setProductSizes({
          clothing: {
            xs: false,
            s: false,
            m: false,
            l: false,
            xl: false,
            xxl: false,
            '3xl': false,
            '4xl': false
          },
          numeric_pants: {
            '30': false,
            '31': false,
            '32': false,
            '33': false,
            '34': false,
            '36': false,
            '38': false,
            '40': false,
            '42': false,
            '44': false,
            '46': false,
            '48': false,
            '50': false,
            '52': false,
            '54': false,
            '56': false,
            '58': false,
            '60': false,
            '62': false,
            '64': false,
            '66': false
          },
          shoes: {
            '39': false,
            '40': false,
            '41': false,
            '42': false,
            '43': false,
            '44': false,
            '45': false,
            '46': false,
            '47': false
          },
          belts: {
            '85': false,
            '90': false,
            '95': false,
            '100': false,
            '105': false,
            '110': false,
            '115': false,
            '120': false,
            '125': false
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
  const saveSizesConfiguration = async () => {
    if (!selectedProduct) return;
    try {
      let requestBody;
      if (hasNoSizes) {
        // Product has no sizes
        requestBody = {
          product_id: selectedProduct.id,
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
          product_id: selectedProduct.id,
          sizes: sizesData
        };
      }
      const response = await fetch('https://luccibyey.com.tn/production/api/product_sizes.php', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      const data = await response.json();
      if (data.success) {
        toast({
          title: "Succès",
          description: "Configuration des tailles sauvegardée"
        });
        setShowSizesModal(false);
        loadProducts(); // Reload to get updated data
      } else {
        throw new Error(data.message || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Error saving sizes:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la configuration des tailles",
        variant: "destructive"
      });
    }
  };
  const handleMaterialsConfigurationSave = () => {
    // Refresh the products list after saving materials configuration
    loadProducts();
  };
  useEffect(() => {
    loadProducts();
  }, [location.state?.refresh]);

  // Remove the window focus listener as we're using location state instead

  const filteredProducts = products.filter(product => (product.nom_product?.toLowerCase().includes(search.toLowerCase()) || product.reference_product?.toLowerCase().includes(search.toLowerCase())) && (!product.is_in_production || product.is_in_production === "0" || product.is_in_production === 0));
  return <div className="space-y-4 md:space-y-6 p-4 md:p-6">
      <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center md:space-y-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Produits Prêt à Porter Production</h1>
          <p className="text-sm md:text-base text-muted-foreground">Liste d'attente - Produits sélectionnés pour être mis en production</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
            <CardTitle className="text-lg md:text-xl">Liste des Produits ({products.length})</CardTitle>
            <div className="flex gap-2">
              <Input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="w-full md:w-64" />
              <Button onClick={loadProducts} variant="outline" size="sm" disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs md:text-sm">Image</TableHead>
                  <TableHead className="text-xs md:text-sm">Référence</TableHead>
                  <TableHead className="text-xs md:text-sm">Nom</TableHead>
                  <TableHead className="text-xs md:text-sm hidden md:table-cell">Type</TableHead>
                  <TableHead className="text-xs md:text-sm hidden lg:table-cell">Quantités</TableHead>
                  <TableHead className="text-xs md:text-sm hidden lg:table-cell">Matériaux</TableHead>
                  <TableHead className="text-xs md:text-sm">Boutique</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map(product => {
                const mainImage = getProductImageUrl(product.img_product, product.boutique_origin);
                const allImages = getProductImages(product);
                return <TableRow key={product.id} className={`text-xs md:text-sm cursor-pointer hover:bg-muted/50 ${getRowHighlightClass(product)}`} onClick={() => {
                  // Mark as seen if not already seen
                  if (product.is_seen === "0" || product.is_seen === 0) {
                    markAsSeen(product.id);
                  }
                  // Always navigate to product details
                  navigate(`/produits/${product.id}`);
                }}>
                      <TableCell>
                        <div className="relative w-12 h-12 md:w-16 md:h-16 cursor-pointer group" onClick={e => {
                      e.stopPropagation();
                      handleViewImages(product);
                    }}>
                          {mainImage ? <>
                              <img src={mainImage} alt={product.nom_product} className="w-full h-full object-cover rounded-md transition-transform group-hover:scale-105" onError={e => {
                          e.currentTarget.src = '/placeholder.svg';
                        }} />
                              
                            </> : <div className="w-full h-full bg-muted rounded-md flex items-center justify-center">
                              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                            </div>}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{product.reference_product}</TableCell>
                      <TableCell className="max-w-[150px] md:max-w-none truncate">{product.nom_product}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className="text-xs">{product.type_product}</Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {product.production_quantities ? <Badge variant="default" className="text-xs">
                            {Object.values(JSON.parse(product.production_quantities) as Record<string, number>).reduce((sum: number, qty: number) => sum + (qty || 0), 0)} pièces
                          </Badge> : <Badge variant="secondary" className="text-xs">Non défini</Badge>}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant={product.materials_configured == 1 || product.materials_configured === "1" ? 'default' : 'destructive'} className="text-xs">
                          {product.materials_configured == 1 || product.materials_configured === "1" ? 'Configurés' : 'Non configurés'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.boutique_origin === 'luccibyey' ? 'default' : 'secondary'} className="text-xs">
                          {product.boutique_origin === 'luccibyey' ? 'Lucci By Ey' : 'Spada di Battaglia'}
                        </Badge>
                      </TableCell>
                    </TableRow>;
              })}
                {filteredProducts.length === 0 && <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {loading ? 'Chargement...' : 'Aucun produit en attente de production'}
                    </TableCell>
                  </TableRow>}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Cards View */}
      {isMobile && <div className="grid grid-cols-1 gap-4 md:hidden">
          {filteredProducts.map(product => {
        const mainImage = getProductImageUrl(product.img_product, product.boutique_origin);
        const allImages = getProductImages(product);
        return <Card key={product.id} className={`overflow-hidden ${getRowHighlightClass(product)}`}>
                <CardContent className="p-2">
                  <div className="flex gap-3">
                    <div className="relative w-20 h-20 flex-shrink-0 cursor-pointer" onClick={() => navigate(`/produits/${product.id}`)}>
                      {mainImage ? <img src={mainImage} alt={product.nom_product} className="w-full h-full object-cover rounded-md" onError={e => {
                  e.currentTarget.src = '/placeholder.svg';
                }} /> : <div className="w-full h-full bg-muted rounded-md flex items-center justify-center">
                          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                        </div>}
                    </div>
                    <div className="flex-1 min-w-0" onClick={() => {
                // Mark as seen if not already seen
                if (product.is_seen === "0" || product.is_seen === 0) {
                  markAsSeen(product.id);
                }
                // Always navigate to product details
                navigate(`/produits/${product.id}`);
              }}>
                      <h3 className="font-semibold text-xs break-words line-clamp-3">{product.nom_product}</h3>
                      <p className="text-xs text-muted-foreground mb-2">Ref: {product.reference_product}</p>
                      <div className="flex flex-wrap gap-1 mb-2">
                        <Badge variant={product.boutique_origin === 'luccibyey' ? 'default' : 'secondary'} className="text-xs">
                          {product.boutique_origin === 'luccibyey' ? 'Lucci By Ey' : 'Spada di Battaglia'}
                        </Badge>
                        {product.type_product && <Badge variant="outline" className="text-xs">{product.type_product}</Badge>}
                        <Badge variant={product.materials_configured == 1 || product.materials_configured === "1" ? 'default' : 'destructive'} className="text-xs">
                          {product.materials_configured == 1 || product.materials_configured === "1" ? 'Configurés' : 'Non configurés'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-end">
                        <Button
                          variant="destructive"
                          size="sm"
                          className="text-xs h-7 bg-red-600 hover:bg-red-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            setProductToDelete(product);
                            setShowDeleteModal(true);
                          }}
                        >
                          Annuler
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>;
      })}
        </div>}

      {loading && <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>}
      
      {!loading && filteredProducts.length === 0 && <div className="text-center py-8 text-muted-foreground md:hidden">
          <p>Aucun produit trouvé</p>
        </div>}

      {/* Modals */}

      {/* Image Gallery Modal */}
      {showImageModal && <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] p-0">
            <div className="relative">
              {selectedImages.length > 0 && <>
                  <img src={selectedImages[currentImageIndex]} alt={`Image ${currentImageIndex + 1}`} className="w-full max-h-[80vh] object-contain" onError={e => {
              e.currentTarget.src = '/placeholder.svg';
            }} />
                  {selectedImages.length > 1 && <>
                      <Button variant="outline" size="sm" className="absolute left-2 top-1/2 transform -translate-y-1/2" onClick={() => setCurrentImageIndex(prev => prev === 0 ? selectedImages.length - 1 : prev - 1)}>
                        ←
                      </Button>
                      <Button variant="outline" size="sm" className="absolute right-2 top-1/2 transform -translate-y-1/2" onClick={() => setCurrentImageIndex(prev => prev === selectedImages.length - 1 ? 0 : prev + 1)}>
                        →
                      </Button>
                      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-2 py-1 rounded text-sm">
                        {currentImageIndex + 1} / {selectedImages.length}
                      </div>
                    </>}
                </>}
            </div>
          </DialogContent>
        </Dialog>}

      {/* Configuration Modal */}
      <Dialog open={showConfigModal} onOpenChange={setShowConfigModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Configuration du produit</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Choisissez le type de configuration pour {selectedProduct?.nom_product}
            </p>
            
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start h-12" onClick={handleConfigureMaterials}>
                <Package className="h-4 w-4 mr-3" />
                <div className="text-left">
                  <div className="font-medium">Configurer Matériaux</div>
                  <div className="text-xs text-muted-foreground">Définir les matériaux nécessaires</div>
                </div>
              </Button>
              
              <Button variant="outline" className="w-full justify-start h-12" onClick={handleConfigureSizes}>
                <Ruler className="h-4 w-4 mr-3" />
                <div className="text-left">
                  <div className="font-medium">Configurer Tailles</div>
                  <div className="text-xs text-muted-foreground">Définir les tailles disponibles</div>
                </div>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sizes Configuration Modal */}
      <Dialog open={showSizesModal} onOpenChange={setShowSizesModal}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configuration des tailles</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Configurez les tailles pour {selectedProduct?.nom_product}
            </p>
            
            {/* No Sizes Option */}
            <div className="p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center space-x-3">
                <Checkbox id="no_sizes" checked={hasNoSizes} onCheckedChange={checked => {
                setHasNoSizes(!!checked);
                if (checked) {
                  // Clear all sizes when "no sizes" is selected
                  setProductSizes({
                    clothing: {},
                    numeric_pants: {},
                    shoes: {},
                    belts: {}
                  });
                }
              }} />
                <div>
                  <label htmlFor="no_sizes" className="text-sm font-medium">
                    Ce produit n'a pas de tailles
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Pour les produits comme portefeuilles, accessoires, gadgets, etc.
                  </p>
                </div>
              </div>
            </div>

            {!hasNoSizes && <div className="space-y-6" style={{
            opacity: hasNoSizes ? 0.5 : 1,
            pointerEvents: hasNoSizes ? 'none' : 'auto'
          }}>
            
            {/* Clothing Sizes */}
            <div>
              <h3 className="font-medium mb-3">Tailles Vêtements</h3>
              <div className="grid grid-cols-4 gap-3">
                {['xs', 's', 'm', 'l', 'xl', 'xxl', '3xl', '4xl'].map(size => <div key={size} className="flex items-center space-x-2">
                    <Checkbox id={`clothing_${size}`} checked={productSizes.clothing?.[size] || false} onCheckedChange={checked => setProductSizes(prev => ({
                    ...prev,
                    clothing: {
                      ...prev.clothing,
                      [size]: !!checked
                    }
                  }))} />
                    <label htmlFor={`clothing_${size}`} className="text-sm font-medium">
                      {size.toUpperCase()}
                    </label>
                  </div>)}
              </div>
            </div>

            <Separator />

            {/* Numeric Sizes (Pants/Formal) */}
            <div>
              <h3 className="font-medium mb-3">Tailles Numériques (Pantalons/Formel)</h3>
              <div className="grid grid-cols-6 gap-3">
                {['30', '31', '32', '33', '34', '36', '38', '40', '42', '44', '46', '48', '50', '52', '54', '56', '58', '60', '62', '64', '66'].map(size => <div key={size} className="flex items-center space-x-2">
                    <Checkbox id={`numeric_${size}`} checked={productSizes.numeric_pants?.[size] || false} onCheckedChange={checked => setProductSizes(prev => ({
                    ...prev,
                    numeric_pants: {
                      ...prev.numeric_pants,
                      [size]: !!checked
                    }
                  }))} />
                    <label htmlFor={`numeric_${size}`} className="text-sm font-medium">
                      {size}
                    </label>
                  </div>)}
              </div>
            </div>

            <Separator />

            {/* Shoe Sizes */}
            <div>
              <h3 className="font-medium mb-3">Pointures Chaussures</h3>
              <div className="grid grid-cols-6 gap-3">
                {['39', '40', '41', '42', '43', '44', '45', '46', '47'].map(size => <div key={size} className="flex items-center space-x-2">
                    <Checkbox id={`shoes_${size}`} checked={productSizes.shoes?.[size] || false} onCheckedChange={checked => setProductSizes(prev => ({
                    ...prev,
                    shoes: {
                      ...prev.shoes,
                      [size]: !!checked
                    }
                  }))} />
                    <label htmlFor={`shoes_${size}`} className="text-sm font-medium">
                      {size}
                    </label>
                  </div>)}
              </div>
            </div>

            <Separator />

            {/* Belt/Waist Sizes */}
            <div>
              <h3 className="font-medium mb-3">Tailles Ceintures/Tour de Taille</h3>
              <div className="grid grid-cols-5 gap-3">
                {['85', '90', '95', '100', '105', '110', '115', '120', '125'].map(size => <div key={size} className="flex items-center space-x-2">
                    <Checkbox id={`belts_${size}`} checked={productSizes.belts?.[size] || false} onCheckedChange={checked => setProductSizes(prev => ({
                    ...prev,
                    belts: {
                      ...prev.belts,
                      [size]: !!checked
                    }
                  }))} />
                    <label htmlFor={`belts_${size}`} className="text-sm font-medium">
                      {size}
                    </label>
                  </div>)}
              </div>
            </div>
            </div>}

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setShowSizesModal(false)}>
                Annuler
              </Button>
              <Button onClick={saveSizesConfiguration}>
                Sauvegarder
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Annuler cette commande de produit ?</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {productToDelete && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="font-semibold text-sm mb-2">{productToDelete.nom_product}</h3>
                <p className="text-sm text-muted-foreground">Réf: {productToDelete.reference_product}</p>
              </div>
            )}
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-destructive">
                ⚠️ Cette action est irréversible
              </p>
              <p className="text-sm text-muted-foreground">
                Les éléments suivants seront définitivement supprimés :
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                <li>Le produit de la liste de production</li>
                <li>Tous les matériaux configurés pour ce produit</li>
                <li>Les mesures et spécifications de production</li>
                <li>L'historique des tailles configurées</li>
              </ul>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowDeleteModal(false);
                setProductToDelete(null);
              }}
            >
              Annuler
            </Button>
            <Button 
              variant="destructive"
              className="bg-red-600 hover:bg-red-700"
              onClick={() => productToDelete && handleDeleteProduct(productToDelete.id)}
            >
              Confirmer la suppression
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Materials Configuration Modal */}
      <MaterialsConfigurationModal isOpen={showMaterialsModal} onClose={() => setShowMaterialsModal(false)} product={selectedProduct} onSave={handleMaterialsConfigurationSave} />
    </div>;
};
export default Produits;
