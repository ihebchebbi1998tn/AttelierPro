import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Eye, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { getProductImageUrl, getProductImages } from "@/utils/imageUtils";
import SizeBreakdown from "@/components/SizeBreakdown";

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
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/lucci-by-ey')}
                className="hover:bg-muted/50"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              <div className="h-8 w-px bg-border" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">{product.nom_product}</h1>
                <p className="text-sm text-muted-foreground">Ref: {product.reference_product}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Main Product Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Images Section - Compact */}
          <div className="lg:col-span-1">
            <Card className="overflow-hidden">
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
                        className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm"
                        onClick={() => handleViewImages(product)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Voir toutes ({images.length})
                      </Button>
                    </div>
                    
                    {/* Thumbnail Grid */}
                    {images.length > 1 && (
                      <div className="grid grid-cols-4 gap-2 p-3">
                        {images.slice(1, 5).map((imageUrl, index) => (
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
                    <p className="text-muted-foreground">Aucune image disponible</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Product Information - Two Column Layout */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">Informations Générales</CardTitle>
                  <div className="flex gap-2">
                    <Badge variant={product.status_product === 'active' ? 'default' : 'secondary'}>
                      {product.status_product === 'active' ? 'Actif' : 'Inactif'}
                    </Badge>
                    <Badge variant="default">
                      Lucci By Ey
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground">TYPE</Label>
                    <p className="text-sm font-medium">{product.type_product || 'Non spécifié'}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground">PRIX</Label>
                    <p className="text-sm font-semibold text-primary">{product.price_product} TND</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground">STOCK</Label>
                    <p className="text-sm font-medium">{product.qnty_product} pièces</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground">COULEUR</Label>
                    <p className="text-sm">{product.color_product || 'Non spécifiée'}</p>
                  </div>
                  {product.collection_product && (
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-muted-foreground">COLLECTION</Label>
                      <p className="text-sm">{product.collection_product}</p>
                    </div>
                  )}
                  {product.discount_product && product.discount_product > 0 && (
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-muted-foreground">REMISE</Label>
                      <p className="text-sm font-medium text-destructive">{product.discount_product} TND</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Configuration Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Matériaux</Label>
                      <div className="mt-1">
                        <Badge variant="destructive">
                          Non configurés
                        </Badge>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                    >
                      Configurer
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Tailles</Label>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge variant="destructive">
                          Non configurées
                        </Badge>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                    >
                      Modifier
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Auto Replenishment */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Réapprovisionnement Automatique</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant={Number(product.AutoReapprovisionnement) === 1 ? 'default' : 'outline'}>
                      {Number(product.AutoReapprovisionnement) === 1 ? 'Activé' : 'Désactivé'}
                    </Badge>
                  </div>
                  {Number(product.AutoReapprovisionnement) === 1 && (
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium">Quantité totale:</Label>
                        <Badge variant="secondary" className="text-sm ml-2">
                          {product.AutoReapprovisionnement_quantity || 0} pièces
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Stock Details */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Stock en Ligne Actuel</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-sm">
                    {product.qnty_product} pièces (total)
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Description */}
        {product.description_product && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="prose prose-sm max-w-none text-foreground"
                dangerouslySetInnerHTML={{ __html: product.description_product }}
              />
            </CardContent>
          </Card>
        )}

        {/* Additional Information */}
        {product.createdate_product && (
          <Card>
            <CardContent className="p-4">
              <div className="text-center text-sm text-muted-foreground">
                Produit créé le {new Date(product.createdate_product).toLocaleDateString('fr-FR')}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Image Gallery Modal */}
      {showImageModal && (
        <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] p-0">
            <div className="relative">
              {selectedImages.length > 0 && (
                <>
                  <img 
                    src={selectedImages[currentImageIndex]} 
                    alt={`Image ${currentImageIndex + 1}`}
                    className="w-full max-h-[80vh] object-contain"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder.svg';
                    }}
                  />
                  {selectedImages.length > 1 && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute left-2 top-1/2 transform -translate-y-1/2"
                        onClick={() => setCurrentImageIndex(prev => 
                          prev === 0 ? selectedImages.length - 1 : prev - 1
                        )}
                      >
                        ←
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2"
                        onClick={() => setCurrentImageIndex(prev => 
                          prev === selectedImages.length - 1 ? 0 : prev + 1
                        )}
                      >
                        →
                      </Button>
                      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-2 py-1 rounded text-sm">
                        {currentImageIndex + 1} / {selectedImages.length}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default LucciProductDetails;