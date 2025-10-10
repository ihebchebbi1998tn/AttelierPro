import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Eye, Settings, ChevronLeft, ChevronRight, Send } from 'lucide-react';
import { getProductImageUrl, getProductImages } from "@/utils/imageUtils";
import SizeBreakdown from "@/components/SizeBreakdown";
import { useIsMobile } from '@/hooks/use-mobile';

interface Product {
  id: number;
  external_product_id: string;
  reference_product: string;
  nom_product: string;
  img_product: string;
  img2_product: string;
  img3_product: string;
  img4_product: string;
  img5_product: string;
  description_product: string;
  type_product: string;
  category_product: string;
  itemgroup_product: string;
  price_product: string;
  qnty_product: number;
  color_product: string;
  collection_product: string;
  status_product: string;
  discount_product: string;
  AutoReapprovisionnement: number;
  AutoReapprovisionnement_quantity: number;
  AutoReapprovisionnement_quantity_sizes: string;
  createdate_product: string;
  boutique_origin: string;
  [key: string]: any;
}

const LucciProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const formatStockDisplay = (product: Product) => {
    if (!product) return "0 pièce";

    // Define all possible size fields
    const sizeFields = [
      'xs_size', 's_size', 'm_size', 'l_size', 'xl_size', 'xxl_size', '3xl_size', '4xl_size',
      '30_size', '31_size', '32_size', '33_size', '34_size', '36_size', '38_size', '39_size',
      '40_size', '41_size', '42_size', '43_size', '44_size', '45_size', '46_size', '47_size',
      '48_size', '50_size', '52_size', '54_size', '56_size', '58_size', '60_size', '62_size',
      '64_size', '66_size', '85_size', '90_size', '95_size', '100_size', '105_size', '110_size',
      '115_size', '120_size', '125_size'
    ];

    // Check if any size has quantity > 0
    const sizesWithStock = sizeFields
      .map(field => ({
        size: field.replace('_size', '').toUpperCase(),
        quantity: parseInt(String(product[field] || '0'))
      }))
      .filter(item => item.quantity > 0);

    // If we have size-specific stock, display it
    if (sizesWithStock.length > 0) {
      return sizesWithStock
        .map(item => `${item.quantity} ${item.size}`)
        .join(', ');
    }

    // Otherwise, display total quantity
    const totalQty = parseInt(String(product.qnty_product || '0'));
    return `${totalQty} pièce${totalQty > 1 ? 's' : ''}`;
  };

  const loadProduct = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const response = await fetch(`https://luccibyey.com.tn/production/api/product_lucci_details.php?id=${id}`);
      const data = await response.json();
      if (data.success && data.data) {
        setProduct(data.data);
      } else {
        throw new Error(data.message || 'Produit non trouvé');
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les détails du produit",
        variant: "destructive",
      });
      navigate('/lucci-by-ey');
    } finally {
      setLoading(false);
    }
  };

  const handleViewImages = (product) => {
    const images = getProductImages(product);
    if (images.length > 0) {
      setSelectedImages(images);
      setCurrentImageIndex(0);
      setShowImageModal(true);
    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % selectedImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + selectedImages.length) % selectedImages.length);
  };

  const handleTransferProduct = () => {
    if (!product) return;
    navigate(`/production/transfer/luccibyey/${product.id}/quantities`, { state: { product } });
  };

  const handleTransferComplete = () => {
    toast({ title: "Transfert réussi", description: "Le produit a été transféré vers la production avec succès" });
  };

  useEffect(() => {
    loadProduct();
  }, [id]);

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
          <Button onClick={() => navigate('/lucci-by-ey')}>
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
        <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/lucci-by-ey')}
              className="hover:bg-muted/50 flex-shrink-0 p-1 sm:p-2"
            >
              <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            
            <div className="flex-1 min-w-0">
              <h1 className="text-sm sm:text-lg md:text-xl font-bold text-foreground truncate">
                {product.nom_product}
              </h1>
              <p className="text-xs text-muted-foreground truncate">
                Ref: {product.reference_product}
              </p>
            </div>
          </div>
          
          {/* Transfer Button on new line */}
          <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t">
            <Button 
              onClick={handleTransferProduct}
              className="w-full sm:w-auto"
              size="sm"
            >
              <Send className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              Transférer vers la production
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-4 md:py-6">
        {/* Main Product Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 lg:gap-8 mb-4 sm:mb-6 md:mb-8">
          {/* Images Section - Compact */}
          <div className="lg:col-span-1">
            <Card className="overflow-hidden shadow-sm">
              <CardContent className="p-0">
                {images.length > 0 ? (
                  <div className="space-y-2 sm:space-y-3">
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
                        className="absolute top-2 sm:top-3 right-2 sm:right-3 bg-background/80 backdrop-blur-sm text-xs px-2 py-1"
                        onClick={() => handleViewImages(product)}
                      >
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Voir toutes</span> ({images.length})
                      </Button>
                    </div>
                    
                    {/* Thumbnail Grid - Mobile Optimized */}
                    {images.length > 1 && (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-1 sm:gap-2 p-2 sm:p-3">
                        {images.slice(1, isMobile ? 3 : 4).map((imageUrl, index) => (
                          <div 
                            key={index + 1}
                            className="aspect-square cursor-pointer rounded overflow-hidden group"
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
                    <p className="text-muted-foreground text-xs sm:text-sm">Aucune image disponible</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Product Information - Mobile Optimized */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4 md:space-y-6">
            {/* Basic Information */}
            <Card className="shadow-sm">
              <CardHeader className="p-3 sm:p-4 md:p-6 pb-2 sm:pb-3 md:pb-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="text-sm sm:text-lg md:text-xl">
                    {isMobile ? "Infos" : "Informations Générales"}
                  </CardTitle>
                  <div className="flex gap-1 sm:gap-2 flex-wrap">
                    <Badge 
                      variant={product.status_product === 'active' ? 'default' : 'secondary'}
                      className="text-xs px-2 py-1"
                    >
                      {product.status_product === 'active' ? 'Actif' : 'Inactif'}
                    </Badge>
                    <Badge variant="default" className="text-xs px-2 py-1">
                      Lucci By Ey
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground">TYPE</Label>
                    <p className="text-xs sm:text-sm font-medium">{product.type_product || 'Non spécifié'}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground">PRIX</Label>
                    <p className="text-xs sm:text-sm font-semibold text-primary">{product.price_product} TND</p>
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-xs font-semibold text-muted-foreground">STOCK EN LIGNE ACTUEL</Label>
                    <div className="bg-muted/30 rounded-lg p-2 sm:p-3 border">
                      {(() => {
                        const sizeFields = [
                          'xs_size', 's_size', 'm_size', 'l_size', 'xl_size', 'xxl_size', '3xl_size', '4xl_size',
                          '30_size', '31_size', '32_size', '33_size', '34_size', '36_size', '38_size', '39_size',
                          '40_size', '41_size', '42_size', '43_size', '44_size', '45_size', '46_size', '47_size',
                          '48_size', '50_size', '52_size', '54_size', '56_size', '58_size', '60_size', '62_size',
                          '64_size', '66_size', '85_size', '90_size', '95_size', '100_size', '105_size', '110_size',
                          '115_size', '120_size', '125_size'
                        ];
                        
                        const sizesWithStock = sizeFields
                          .map(field => ({
                            size: field.replace('_size', '').toUpperCase(),
                            quantity: parseInt(String(product[field] || '0'))
                          }))
                          .filter(item => item.quantity > 0);

                        if (sizesWithStock.length > 0) {
                          return (
                            <div className="space-y-2">
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                {sizesWithStock.map((item, index) => (
                                  <div key={index} className="flex items-center justify-between bg-background rounded p-2 border">
                                    <span className="text-xs font-medium text-muted-foreground">Taille {item.size}</span>
                                    <Badge variant="default" className="text-xs font-bold">
                                      {item.quantity}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                              <div className="text-xs text-muted-foreground text-center pt-1 border-t">
                                Total: {product.qnty_product} pièces
                              </div>
                            </div>
                          );
                        } else {
                          const totalQty = parseInt(String(product.qnty_product || '0'));
                          return (
                            <div className="text-center py-2">
                              <Badge variant="secondary" className="text-sm px-3 py-2">
                                {totalQty} pièce{totalQty > 1 ? 's' : ''} (sans détail par taille)
                              </Badge>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground">COULEUR</Label>
                    <p className="text-xs sm:text-sm">{product.color_product || 'Non spécifiée'}</p>
                  </div>
                  {product.collection_product && (
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-muted-foreground">COLLECTION</Label>
                      <p className="text-xs sm:text-sm">{product.collection_product}</p>
                    </div>
                  )}
                  {product.discount_product && product.discount_product > 0 && (
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-muted-foreground">REMISE</Label>
                      <p className="text-xs sm:text-sm font-medium text-destructive">{product.discount_product} TND</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>


            {/* Auto Replenishment */}
            <Card className="shadow-sm">
              <CardHeader className="p-3 sm:p-4 md:p-6 pb-2 sm:pb-3">
                <CardTitle className="text-sm sm:text-base md:text-lg">
                  {isMobile ? "Réappro. Auto" : "Réapprovisionnement Automatique"}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={Number(product.AutoReapprovisionnement) === 1 ? 'default' : 'outline'}
                      className="text-xs px-2 py-1"
                    >
                      {Number(product.AutoReapprovisionnement) === 1 ? 'Activé' : 'Désactivé'}
                    </Badge>
                  </div>
                  {Number(product.AutoReapprovisionnement) === 1 && (
                    <div className="space-y-2 sm:space-y-3">
                      <div>
                        <Label className="text-xs sm:text-sm font-medium">Quantité totale:</Label>
                        <Badge variant="secondary" className="text-xs ml-2 px-2 py-1">
                          {product.AutoReapprovisionnement_quantity || 0} pièces
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

          </div>
        </div>

        {/* Description */}
        {product.description_product && (
          <Card className="mt-3 sm:mt-4 md:mt-6 shadow-sm">
            <CardHeader className="p-3 sm:p-4 md:p-6">
              <CardTitle className="text-sm sm:text-base md:text-xl">Description</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
              <div 
                className="prose prose-sm max-w-none text-foreground text-xs sm:text-sm md:text-base"
                dangerouslySetInnerHTML={{ __html: product.description_product }}
              />
            </CardContent>
          </Card>
        )}

        {/* Additional Information */}
        {product.createdate_product && (
          <Card className="mt-3 sm:mt-4 shadow-sm">
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="text-xs text-muted-foreground">
                Produit créé le {new Date(product.createdate_product).toLocaleDateString('fr-FR')}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Image Gallery Modal */}
      {showImageModal && (
        <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
          <DialogContent className={`${isMobile ? 'max-w-[95vw] h-[90vh]' : 'max-w-4xl'} max-h-[90vh] p-2 sm:p-4`}>
            <div className="relative h-full flex flex-col">
              {selectedImages.length > 0 && (
                <>
                  <DialogHeader className="pb-2">
                    <DialogTitle className="text-sm sm:text-base">
                      Image {currentImageIndex + 1} sur {selectedImages.length}
                    </DialogTitle>
                  </DialogHeader>
                  
                  <div className="relative flex-1 min-h-0">
                    <img 
                      src={selectedImages[currentImageIndex]} 
                      alt={`Image ${currentImageIndex + 1}`}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                    {selectedImages.length > 1 && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className={`absolute ${isMobile ? 'left-1 w-8 h-8 p-0' : 'left-2 h-8 w-8 p-0'} top-1/2 transform -translate-y-1/2 bg-background/80 backdrop-blur-sm`}
                          onClick={() => setCurrentImageIndex(prev => 
                            prev === 0 ? selectedImages.length - 1 : prev - 1
                          )}
                        >
                          <ChevronLeft className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className={`absolute ${isMobile ? 'right-1 w-8 h-8 p-0' : 'right-2 h-8 w-8 p-0'} top-1/2 transform -translate-y-1/2 bg-background/80 backdrop-blur-sm`}
                          onClick={() => setCurrentImageIndex(prev => 
                            prev === selectedImages.length - 1 ? 0 : prev + 1
                          )}
                        >
                          <ChevronRight className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
                        </Button>
                        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-2 sm:px-3 py-1 rounded text-xs">
                          {currentImageIndex + 1} / {selectedImages.length}
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Transfer Flow now uses dedicated pages; no inline modal */}
    </div>
  );
};

export default LucciProductDetails;