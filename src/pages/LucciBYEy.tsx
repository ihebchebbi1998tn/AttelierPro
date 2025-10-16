import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw, Eye, ShoppingCart } from 'lucide-react';
import { getProductImageUrl, getProductImages } from "@/utils/imageUtils";
import { useIsMobile } from "@/hooks/use-mobile";

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
  status_product: string;
  AutoReapprovisionnement: number;
  boutique_origin: string;
}

const LucciBYEy = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [searchTerm, setSearchTerm] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const isMobile = useIsMobile();

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://luccibyey.com.tn/production/api/products_lucci.php');
      const data = await response.json();
      if (data.success) {
        setProducts(data.data || []);
        setTotalPages(1); // Since we're loading all products
      } else {
        throw new Error(data.message || 'Erreur lors du chargement');
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les produits",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewImages = (product) => {
    // You can implement image modal here if needed
  };

  const syncProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://luccibyey.com.tn/production/api/sync_all_lucci.php', {
        method: 'GET',
      });
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Synchronisation réussie",
          description: `${data.data.added} produits ajoutés, ${data.data.updated} mis à jour`,
        });
        await loadProducts();
      } else {
        toast({
          title: "Erreur de synchronisation",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la synchronisation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadProducts();
  }, []);

  const filteredProducts = products.filter(product => 
    product.nom_product?.toLowerCase().includes(search.toLowerCase()) ||
    product.reference_product?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-2 sm:p-4 md:p-6 pb-20 md:pb-6">
      <div className="flex flex-col space-y-3 sm:space-y-4 md:flex-row md:justify-between md:items-center md:space-y-0">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Lucci By Ey</h1>
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground">Gestion des produits Lucci By Ey</p>
        </div>
        
        <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:gap-2">
          <Button
            onClick={syncProducts} 
            variant="outline" 
            size="sm" 
            className="w-full sm:w-auto text-xs sm:text-sm"
            disabled={loading}
          >
            <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Synchroniser
          </Button>
        </div>
      </div>

      <Card className="mt-4 sm:mt-6">
        <CardHeader className="p-3 sm:p-4 pb-3 sm:pb-4">
          <div className="flex flex-col space-y-3 sm:space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
            <CardTitle className="text-base sm:text-lg md:text-xl">Liste des Produits ({products.length})</CardTitle>
            <div className="flex gap-2">
              <Input
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-48 md:w-64 text-sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0">
          <div className="overflow-x-auto hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs md:text-sm">Image</TableHead>
                  <TableHead className="text-xs md:text-sm">Référence</TableHead>
                  <TableHead className="text-xs md:text-sm">Nom</TableHead>
                  <TableHead className="text-xs md:text-sm hidden md:table-cell">Type</TableHead>
                  <TableHead className="text-xs md:text-sm">Boutique</TableHead>
                  <TableHead className="text-xs md:text-sm hidden md:table-cell">Prix</TableHead>
                  <TableHead className="text-xs md:text-sm">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const mainImage = getProductImageUrl(product.img_product, product.boutique_origin);
                  const allImages = getProductImages(product);
                  
                  return (
                    <TableRow 
                      key={product.id} 
                      className="text-xs md:text-sm cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/lucci-by-ey/${product.id}`)}
                    >
                      <TableCell>
                        <div 
                          className="relative w-12 h-12 md:w-16 md:h-16 cursor-pointer group"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewImages(product);
                          }}
                        >
                          {mainImage ? (
                            <>
                              <img 
                                src={mainImage} 
                                alt={product.nom_product}
                                className="w-full h-full object-cover rounded-md transition-transform group-hover:scale-105"
                                onError={(e) => {
                                  e.currentTarget.src = '/placeholder.svg';
                                }}
                              />
                            </>
                          ) : (
                            <div className="w-full h-full bg-muted rounded-md flex items-center justify-center">
                              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{product.reference_product}</TableCell>
                      <TableCell className="max-w-[150px] md:max-w-none truncate">{product.nom_product}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className="text-xs">{product.type_product}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default" className="text-xs">
                          Lucci By Ey
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{product.price_product} TND</TableCell>
                      <TableCell>
                        <div className="flex flex-col sm:flex-row gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/lucci-by-ey/${product.id}`)}
                            className="text-xs px-2 py-1"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Voir
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          
          {loading && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}
          
          {!loading && filteredProducts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>Aucun produit trouvé</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mobile Cards View */}
      {isMobile && (
        <div className="grid grid-cols-1 gap-3 mt-4">
          {filteredProducts.map((product) => {
            const mainImage = getProductImageUrl(product.img_product, product.boutique_origin);
            const allImages = getProductImages(product);
            
            return (
              <Card key={product.id} className="overflow-hidden" onClick={() => navigate(`/lucci-by-ey/${product.id}`)}>
                <CardContent className="p-3">
                  <div className="flex gap-3">
                    <div
                      className="relative w-16 h-16 flex-shrink-0 cursor-pointer"
                      onClick={() => navigate(`/lucci-by-ey/${product.id}`)}
                    >
                      {mainImage ? (
                        <img 
                          src={mainImage} 
                          alt={product.nom_product}
                          className="w-full h-full object-cover rounded-md"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder.svg';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-muted rounded-md flex items-center justify-center">
                          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm leading-tight line-clamp-2 mb-1">{product.nom_product}</h3>
                      <p className="text-xs text-muted-foreground mb-2">Ref: {product.reference_product}</p>
                      <div className="flex flex-wrap gap-1 mb-2">
                        <Badge variant="default" className="text-xs px-2 py-0.5">Lucci By Ey</Badge>
                        {product.type_product && (
                          <Badge variant="outline" className="text-xs px-2 py-0.5">{product.type_product}</Badge>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-primary">{product.price_product} TND</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default LucciBYEy;