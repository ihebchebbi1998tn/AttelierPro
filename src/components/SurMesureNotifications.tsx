import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X, Eye, ExternalLink, Package, ShirtIcon, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { fetchUnseenSurMesureOrders, markSurMesureOrderAsSeen, SurMesureOrder } from '@/utils/surMesureService';

interface ProductionReadyProduct {
  id: number;
  nom_product: string;
  reference_product: string;
  boutique_origin: string;
  transfer_date: string | null;
  total_configured_quantity?: number | null;
  production_quantities?: string | null;
}

// Helper: compute total quantity from fields
const getProductTotalQty = (p: ProductionReadyProduct): number => {
  if (p && typeof p.total_configured_quantity === 'number' && p.total_configured_quantity > 0) {
    return p.total_configured_quantity;
  }
  if (p && p.production_quantities) {
    try {
      const obj: Record<string, number> = typeof p.production_quantities === 'string'
        ? (JSON.parse(p.production_quantities) as Record<string, number>)
        : ((p.production_quantities as unknown) as Record<string, number>);
      const total = Object.values(obj || {}).reduce((sum, val) => {
        const n = typeof val === 'number' ? val : parseInt(String(val), 10) || 0;
        return sum + (isNaN(n) ? 0 : n);
      }, 0);
      return total;
    } catch {
      return 0;
    }
  }
  return 0;
};

// Fetch unseen production ready products
const fetchUnseenProductionProducts = async (): Promise<ProductionReadyProduct[]> => {
  try {
    const response = await fetch('https://luccibyey.com.tn/production/api/production_ready_products.php?unseen_only=1');
    const data = await response.json();
    
    if (data.success) {
      return data.data || [];
    }
    return [];
  } catch (error) {
    console.error('Error fetching unseen production products:', error);
    return [];
  }
};

// Mark production product as seen
const markProductionProductAsSeen = async (productId: number): Promise<void> => {
  try {
    const response = await fetch('https://luccibyey.com.tn/production/api/mark_product_as_seen.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: productId }),
    });
    
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to mark product as seen');
    }
  } catch (error) {
    console.error('Error marking product as seen:', error);
    throw error;
  }
};

export function SurMesureNotifications() {
  const [unseenOrders, setUnseenOrders] = useState<SurMesureOrder[]>([]);
  const [unseenProducts, setUnseenProducts] = useState<ProductionReadyProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [prevUnseenCount, setPrevUnseenCount] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();


  const fetchUnseenData = async () => {
    try {
      setLoading(true);
      const [orders, products] = await Promise.all([
        fetchUnseenSurMesureOrders(),
        fetchUnseenProductionProducts()
      ]);
      
      // Additional client-side filtering to ensure only unseen items
      const unseenOrdersFiltered = orders.filter(order => {
        const isSeen = String(order.is_seen);
        return isSeen === '0' || isSeen === 'false';
      });
      
      const unseenProductsFiltered = products.filter(product => {
        const isSeen = String((product as any).is_seen);
        return isSeen === '0' || isSeen === 'false' || isSeen === 'undefined';
      });
      
      setUnseenOrders(unseenOrdersFiltered);
      setUnseenProducts(unseenProductsFiltered);
    } catch (error) {
      console.error('Error fetching unseen data:', error);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    // Fetch initially
    fetchUnseenData();

    // Set up polling every 30 seconds
    const interval = setInterval(fetchUnseenData, 30000);

    return () => clearInterval(interval);
  }, []);


  // Auto-open logic: show once per page visit, then hourly if notifications exist
  useEffect(() => {
    const currentCount = unseenOrders.length + unseenProducts.length;
    
    // Don't show if no notifications
    if (currentCount === 0) {
      setPrevUnseenCount(currentCount);
      return;
    }
    
    const now = Date.now();
    const lastShownKey = 'notificationLastShown';
    const pageVisitKey = 'notificationShownThisVisit';
    const lastShown = localStorage.getItem(lastShownKey);
    const shownThisVisit = sessionStorage.getItem(pageVisitKey);
    
    const shouldShow = () => {
      // First time or no previous record - show immediately
      if (!lastShown) return true;
      
      // Already shown this page visit - don't show again until next visit
      if (shownThisVisit) return false;
      
      // Check if an hour has passed since last shown
      const hourInMs = 60 * 60 * 1000;
      const timeSinceLastShown = now - parseInt(lastShown);
      
      return timeSinceLastShown >= hourInMs;
    };
    
    if (shouldShow()) {
      setIsOpen(true);
      localStorage.setItem(lastShownKey, now.toString());
      sessionStorage.setItem(pageVisitKey, 'true');
      
      // Show toast for new items (not initial load)
      if (prevUnseenCount > 0 && currentCount > prevUnseenCount) {
        const newCount = currentCount - prevUnseenCount;
        toast({
          title: "Nouveaux éléments à traiter",
          description: `${newCount} nouveau(x) élément(s) nécessitant votre attention`,
          variant: "default",
        });
      }
    }
    
    setPrevUnseenCount(currentCount);
  }, [unseenOrders.length, unseenProducts.length, prevUnseenCount, toast]);

  const handleMarkAsSeen = async (orderId: number) => {
    try {
      await markSurMesureOrderAsSeen(orderId);
      
      // Remove from unseen orders list
      setUnseenOrders(prev => prev.filter(order => order.id !== orderId));
      
      toast({
        title: "Commande marquée comme vue",
        description: "La notification a été supprimée.",
      });
    } catch (error) {
      console.error('Error marking order as seen:', error);
      toast({
        title: "Erreur",
        description: "Impossible de marquer la commande comme vue.",
        variant: "destructive",
      });
    }
  };

  const handleVisitOrder = async (orderId: number) => {
    try {
      // Mark as seen when visiting
      await markSurMesureOrderAsSeen(orderId);
      
      // Remove from unseen orders list
      setUnseenOrders(prev => prev.filter(order => order.id !== orderId));
      
      // Navigate to order details - corrected URL
      navigate(`/commandes/${orderId}`);
      
      // Close dialog
      setIsOpen(false);
    } catch (error) {
      console.error('Error visiting order:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'accéder à la commande.",
        variant: "destructive",
      });
    }
  };

  const handleMarkProductAsSeen = async (productId: number) => {
    try {
      await markProductionProductAsSeen(productId);
      
      // Remove from unseen products list
      setUnseenProducts(prev => prev.filter(p => p.id !== productId));
      
      toast({
        title: "Produit marqué comme vu",
        description: "La notification a été supprimée.",
      });
    } catch (error) {
      console.error('Error marking product as seen:', error);
      toast({
        title: "Erreur",
        description: "Impossible de marquer le produit comme vu.",
        variant: "destructive",
      });
    }
  };

  const handleVisitProduct = async (productId: number, boutiqueOrigin: string) => {
    try {
      // Mark as seen when visiting
      await markProductionProductAsSeen(productId);
      
      // Remove from unseen products list
      setUnseenProducts(prev => prev.filter(p => p.id !== productId));
    } catch (error) {
      console.error('Error visiting product:', error);
      toast({
        title: "Erreur",
        description: "Impossible de marquer le produit comme vu.",
        variant: "destructive",
      });
    } finally {
      // Navigate to product details regardless
      navigate(`/produits/${productId}`);
      setIsOpen(false);
    }
  };

  const handleDialogClose = (open: boolean) => {
    setIsOpen(open);
    
    // If closing dialog manually, mark as shown this visit to prevent immediate re-opening
    if (!open) {
      sessionStorage.setItem('notificationShownThisVisit', 'true');
    }
  };

  const unseenCount = unseenOrders.length + unseenProducts.length;


  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative p-2 text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent transition-colors"
        >
          <Bell className="h-5 w-5" />
          {unseenCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs font-bold bg-gradient-to-br from-red-500 to-red-600 text-white border-2 border-background shadow-lg animate-pulse"
            >
              {unseenCount > 99 ? '99+' : unseenCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-[98vw] sm:max-w-2xl max-h-[92vh] p-3 sm:p-6 overflow-hidden flex flex-col">
        <DialogHeader className="pb-2 sm:pb-3">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base sm:text-xl font-bold flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span className="text-sm sm:text-base">Notifications</span>
                  {unseenCount > 0 && (
                    <Badge variant="default" className="bg-gradient-to-r from-primary to-primary/80 shadow-md text-[10px] sm:text-xs px-1.5 sm:px-2">
                      {unseenCount}
                    </Badge>
                  )}
                </div>
                <p className="text-[10px] sm:text-xs font-normal text-muted-foreground mt-0.5 sm:mt-1 hidden sm:block">
                  Éléments nécessitant votre attention
                </p>
              </div>
            </DialogTitle>
          </div>
        </DialogHeader>


        <div className="mt-2">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
              <p className="text-sm text-muted-foreground mt-3">Chargement des notifications...</p>
            </div>
          ) : unseenCount === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-4">
                <Bell className="h-8 w-8 text-primary" />
              </div>
              <p className="font-medium text-foreground">Tout est à jour !</p>
              <p className="text-sm text-muted-foreground mt-1">
                Aucune nouvelle notification pour le moment
              </p>
            </div>
          ) : (
            <Tabs defaultValue="all" className="w-full">
              <TabsList className={`grid w-full ${unseenOrders.length > 0 && unseenProducts.length > 0 ? 'grid-cols-3' : unseenOrders.length > 0 || unseenProducts.length > 0 ? 'grid-cols-2' : 'grid-cols-1'} mb-2 sm:mb-4 h-8 sm:h-10`}>
                <TabsTrigger value="all" className="text-[10px] sm:text-sm px-1 sm:px-3">
                  Tout ({unseenCount})
                </TabsTrigger>
                {unseenProducts.length > 0 && (
                  <TabsTrigger value="production" className="text-[10px] sm:text-sm px-1 sm:px-3">
                    <Package className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                    <span className="hidden sm:inline">Production</span> ({unseenProducts.length})
                  </TabsTrigger>
                )}
                {unseenOrders.length > 0 && (
                  <TabsTrigger value="surmesure" className="text-[10px] sm:text-sm px-1 sm:px-3">
                    <ShirtIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                    <span className="hidden sm:inline">Sur Mesure</span> ({unseenOrders.length})
                  </TabsTrigger>
                )}
              </TabsList>

              {/* All Tab */}
              <TabsContent value="all" className="mt-0">
                <ScrollArea className="h-[60vh] sm:h-[65vh] overflow-y-auto">
                  <div className="space-y-2 sm:space-y-3 pr-2 sm:pr-4 pb-4">
                    {/* Production Products Section */}
                    {unseenProducts.length > 0 && (
                      <>
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                          <Package className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                          <h3 className="font-semibold text-xs sm:text-sm text-foreground">Produits Prêts</h3>
                          <Badge variant="secondary" className="text-[10px] sm:text-xs px-1 sm:px-2">{unseenProducts.length}</Badge>
                        </div>
                        {unseenProducts.map((product) => (
                          <Card key={`prod-${product.id}`} className="border-l-2 sm:border-l-4 border-l-primary bg-gradient-to-r from-primary/5 to-transparent hover:shadow-md transition-shadow">
                            <CardContent className="p-2.5 sm:p-4">
                              <div className="flex items-start justify-between gap-2 sm:gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1 sm:gap-2 mb-1.5 sm:mb-2 flex-wrap">
                                    <Badge variant="default" className="text-[9px] sm:text-xs bg-primary/10 text-primary border-primary/20 px-1 sm:px-2">
                                      Production
                                    </Badge>
                                    <Badge variant="outline" className="text-[9px] sm:text-xs px-1 sm:px-2">
                                      {product.boutique_origin === 'luccibyey' ? 'Lucci' : 'Spada'}
                                    </Badge>
                                  </div>
                                  <h4 className="font-semibold text-xs sm:text-sm truncate text-foreground mb-0.5 sm:mb-1">
                                    {product.nom_product}
                                  </h4>
                                  <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5">
                                    Réf: {product.reference_product}
                                  </p>
                                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                                    <span className="font-medium">Qté:</span> {getProductTotalQty(product)} pcs
                                  </p>
                                  <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">
                                    {new Date(product.transfer_date).toLocaleDateString('fr-FR', { 
                                      day: '2-digit', 
                                      month: 'short', 
                                      year: 'numeric' 
                                    })}
                                  </p>
                                  <div className="mt-2 sm:mt-3 flex gap-1.5 sm:gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() => handleVisitProduct(product.id, product.boutique_origin)}
                                      className="h-7 sm:h-8 text-[10px] sm:text-xs bg-primary hover:bg-primary/90 shadow-md px-2 sm:px-3"
                                    >
                                      <ExternalLink className="h-2.5 w-2.5 sm:h-3 sm:w-3 sm:mr-1" />
                                      <span className="hidden sm:inline">Voir</span>
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleMarkProductAsSeen(product.id)}
                                      className="h-7 sm:h-8 text-[10px] sm:text-xs px-2 sm:px-3"
                                    >
                                      <Eye className="h-2.5 w-2.5 sm:h-3 sm:w-3 sm:mr-1" />
                                      <span className="hidden sm:inline">Vu</span>
                                    </Button>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleMarkProductAsSeen(product.id)}
                                  className="h-6 w-6 sm:h-7 sm:w-7 p-0 hover:bg-destructive/10"
                                >
                                  <X className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground hover:text-destructive" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </>
                    )}

                    {/* Separator if both sections exist */}
                    {unseenProducts.length > 0 && unseenOrders.length > 0 && (
                      <Separator className="my-4" />
                    )}

                    {/* Sur Mesure Orders Section */}
                    {unseenOrders.length > 0 && (
                      <>
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                          <ShirtIcon className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
                          <h3 className="font-semibold text-xs sm:text-sm text-foreground">Sur Mesure</h3>
                          <Badge variant="secondary" className="text-[10px] sm:text-xs px-1 sm:px-2">{unseenOrders.length}</Badge>
                        </div>
                        {unseenOrders.map((order) => (
                          <Card key={`order-${order.id}`} className="border-l-2 sm:border-l-4 border-l-purple-600 bg-gradient-to-r from-purple-50 to-transparent hover:shadow-md transition-shadow">
                            <CardContent className="p-2.5 sm:p-4">
                              <div className="flex items-start justify-between gap-2 sm:gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1 sm:gap-2 mb-1.5 sm:mb-2">
                                    <Badge variant="secondary" className="text-[9px] sm:text-xs bg-purple-100 text-purple-700 border-purple-200 px-1 sm:px-2">
                                      Sur Mesure
                                    </Badge>
                                  </div>
                                  <h4 className="font-semibold text-xs sm:text-sm truncate text-foreground mb-0.5 sm:mb-1">
                                    {order.client_name} {order.client_vorname}
                                  </h4>
                                  <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5">
                                    {order.product_name}
                                  </p>
                                  <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">
                                    {new Date(order.created_at).toLocaleDateString('fr-FR', { 
                                      day: '2-digit', 
                                      month: 'short', 
                                      year: 'numeric' 
                                    })}
                                  </p>
                                  <div className="mt-2 sm:mt-3 flex gap-1.5 sm:gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() => handleVisitOrder(order.id)}
                                      className="h-7 sm:h-8 text-[10px] sm:text-xs bg-purple-600 hover:bg-purple-700 text-white shadow-md px-2 sm:px-3"
                                    >
                                      <ExternalLink className="h-2.5 w-2.5 sm:h-3 sm:w-3 sm:mr-1" />
                                      <span className="hidden sm:inline">Voir</span>
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleMarkAsSeen(order.id)}
                                      className="h-7 sm:h-8 text-[10px] sm:text-xs px-2 sm:px-3"
                                    >
                                      <Eye className="h-2.5 w-2.5 sm:h-3 sm:w-3 sm:mr-1" />
                                      <span className="hidden sm:inline">Vu</span>
                                    </Button>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleMarkAsSeen(order.id)}
                                  className="h-6 w-6 sm:h-7 sm:w-7 p-0 hover:bg-destructive/10"
                                >
                                  <X className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground hover:text-destructive" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* Production Tab */}
              <TabsContent value="production" className="mt-0">
                <ScrollArea className="h-[60vh] sm:h-[65vh] overflow-y-auto">
                  <div className="space-y-2 sm:space-y-3 pr-2 sm:pr-4 pb-4">
                    {unseenProducts.map((product) => (
                      <Card key={product.id} className="border-l-2 sm:border-l-4 border-l-primary bg-gradient-to-r from-primary/5 to-transparent hover:shadow-md transition-shadow">
                        <CardContent className="p-2.5 sm:p-4">
                          <div className="flex items-start justify-between gap-2 sm:gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1 sm:gap-2 mb-1.5 sm:mb-2 flex-wrap">
                                <Badge variant="default" className="text-[9px] sm:text-xs bg-primary/10 text-primary border-primary/20 px-1 sm:px-2">
                                  Production
                                </Badge>
                                <Badge variant="outline" className="text-[9px] sm:text-xs px-1 sm:px-2">
                                  {product.boutique_origin === 'luccibyey' ? 'Lucci' : 'Spada'}
                                </Badge>
                              </div>
                              <h4 className="font-semibold text-xs sm:text-sm truncate text-foreground mb-0.5 sm:mb-1">
                                {product.nom_product}
                              </h4>
                              <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5">
                                Réf: {product.reference_product}
                              </p>
                              <p className="text-[10px] sm:text-xs text-muted-foreground">
                                <span className="font-medium">Qté:</span> {getProductTotalQty(product)} pcs
                              </p>
                              <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">
                                {new Date(product.transfer_date).toLocaleDateString('fr-FR', { 
                                  day: '2-digit', 
                                  month: 'short', 
                                  year: 'numeric' 
                                })}
                              </p>
                              <div className="mt-2 sm:mt-3 flex gap-1.5 sm:gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleVisitProduct(product.id, product.boutique_origin)}
                                  className="h-7 sm:h-8 text-[10px] sm:text-xs bg-primary hover:bg-primary/90 shadow-md px-2 sm:px-3"
                                >
                                  <ExternalLink className="h-2.5 w-2.5 sm:h-3 sm:w-3 sm:mr-1" />
                                  <span className="hidden sm:inline">Voir</span>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleMarkProductAsSeen(product.id)}
                                  className="h-7 sm:h-8 text-[10px] sm:text-xs px-2 sm:px-3"
                                >
                                  <Eye className="h-2.5 w-2.5 sm:h-3 sm:w-3 sm:mr-1" />
                                  <span className="hidden sm:inline">Vu</span>
                                </Button>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkProductAsSeen(product.id)}
                              className="h-6 w-6 sm:h-7 sm:w-7 p-0 hover:bg-destructive/10"
                            >
                              <X className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground hover:text-destructive" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* Sur Mesure Tab */}
              <TabsContent value="surmesure" className="mt-0">
                <ScrollArea className="h-[60vh] sm:h-[65vh] overflow-y-auto">
                  <div className="space-y-2 sm:space-y-3 pr-2 sm:pr-4 pb-4">
                    {unseenOrders.map((order) => (
                      <Card key={order.id} className="border-l-2 sm:border-l-4 border-l-purple-600 bg-gradient-to-r from-purple-50 to-transparent hover:shadow-md transition-shadow">
                        <CardContent className="p-2.5 sm:p-4">
                          <div className="flex items-start justify-between gap-2 sm:gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1 sm:gap-2 mb-1.5 sm:mb-2">
                                <Badge variant="secondary" className="text-[9px] sm:text-xs bg-purple-100 text-purple-700 border-purple-200 px-1 sm:px-2">
                                  Sur Mesure
                                </Badge>
                              </div>
                              <h4 className="font-semibold text-xs sm:text-sm truncate text-foreground mb-0.5 sm:mb-1">
                                {order.client_name} {order.client_vorname}
                              </h4>
                              <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5">
                                {order.product_name}
                              </p>
                              <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">
                                {new Date(order.created_at).toLocaleDateString('fr-FR', { 
                                  day: '2-digit', 
                                  month: 'short', 
                                  year: 'numeric' 
                                })}
                              </p>
                              <div className="mt-2 sm:mt-3 flex gap-1.5 sm:gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleVisitOrder(order.id)}
                                  className="h-7 sm:h-8 text-[10px] sm:text-xs bg-purple-600 hover:bg-purple-700 text-white shadow-md px-2 sm:px-3"
                                >
                                  <ExternalLink className="h-2.5 w-2.5 sm:h-3 sm:w-3 sm:mr-1" />
                                  <span className="hidden sm:inline">Voir</span>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleMarkAsSeen(order.id)}
                                  className="h-7 sm:h-8 text-[10px] sm:text-xs px-2 sm:px-3"
                                >
                                  <Eye className="h-2.5 w-2.5 sm:h-3 sm:w-3 sm:mr-1" />
                                  <span className="hidden sm:inline">Vu</span>
                                </Button>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkAsSeen(order.id)}
                              className="h-6 w-6 sm:h-7 sm:w-7 p-0 hover:bg-destructive/10"
                            >
                              <X className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground hover:text-destructive" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          )}
        </div>


        {unseenCount > 0 && (
          <div className="sticky bottom-0 z-10 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75 flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                navigate('/production-planning');
                setIsOpen(false);
              }}
              className="flex-1 h-8 sm:h-10 text-[10px] sm:text-sm"
            >
              <Package className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Planifier </span>Production
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                navigate('/commandes');
                setIsOpen(false);
              }}
              className="flex-1 h-8 sm:h-10 text-[10px] sm:text-sm"
            >
              <ShirtIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Toutes </span>Commandes
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}