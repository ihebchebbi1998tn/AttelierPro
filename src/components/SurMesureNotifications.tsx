import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X, Eye, ExternalLink } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { fetchUnseenSurMesureOrders, markSurMesureOrderAsSeen, SurMesureOrder } from '@/utils/surMesureService';

export function SurMesureNotifications() {
  const [unseenOrders, setUnseenOrders] = useState<SurMesureOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [prevUnseenCount, setPrevUnseenCount] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchUnseenOrders = async () => {
    try {
      setLoading(true);
      const orders = await fetchUnseenSurMesureOrders();
      setUnseenOrders(orders);
    } catch (error) {
      console.error('Error fetching unseen orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch initially
    fetchUnseenOrders();

    // Set up polling every 30 seconds
    const interval = setInterval(fetchUnseenOrders, 30000);

    return () => clearInterval(interval);
  }, []);

  // Auto-open logic: show once per page visit, then hourly if notifications exist
  useEffect(() => {
    const currentCount = unseenOrders.length;
    
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
      
      // Show toast for new orders (not initial load)
      if (prevUnseenCount > 0 && currentCount > prevUnseenCount) {
        toast({
          title: "Nouvelle commande!",
          description: `${currentCount - prevUnseenCount} nouvelle(s) commande(s) reçue(s)`,
          variant: "destructive",
        });
      }
    }
    
    setPrevUnseenCount(currentCount);
  }, [unseenOrders.length, prevUnseenCount, toast]);

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

  const handleDialogClose = (open: boolean) => {
    setIsOpen(open);
    
    // If closing dialog manually, mark as shown this visit to prevent immediate re-opening
    if (!open) {
      sessionStorage.setItem('notificationShownThisVisit', 'true');
    }
  };

  const unseenCount = unseenOrders.length;

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative p-2 text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent"
        >
          <Bell className="h-5 w-5" />
          {unseenCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs font-bold bg-red-500 text-white border-0"
            >
              {unseenCount > 99 ? '99+' : unseenCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold flex items-center gap-2">
            <Bell className="h-5 w-5 text-red-500" />
            Nouvelles commandes
            {unseenCount > 0 && (
              <Badge variant="destructive" className="bg-red-500">
                {unseenCount}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          {loading ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Chargement des notifications...
            </div>
          ) : unseenCount === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                Aucune nouvelle commande
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-96">
              <div className="space-y-3">
                {unseenOrders.map((order) => (
                  <Card key={order.id} className="border border-red-200 bg-red-50">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 border-purple-200">
                              Sur Mesure
                            </Badge>
                          </div>
                          <h4 className="font-medium text-sm truncate">
                            {order.client_name} {order.client_vorname}
                          </h4>
                          <p className="text-xs text-muted-foreground truncate">
                            {order.product_name}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Créée le: {new Date(order.created_at).toLocaleDateString('fr-FR')}
                          </p>
                          <div className="mt-2 flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleVisitOrder(order.id)}
                              className="h-7 text-xs bg-primary hover:bg-primary/90"
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Voir
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkAsSeen(order.id)}
                              className="h-7 text-xs"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Marquer comme vue
                            </Button>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkAsSeen(order.id)}
                          className="h-6 w-6 p-0 ml-2"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {unseenCount > 0 && (
          <div className="mt-4 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                navigate('/commandes');
                setIsOpen(false);
              }}
              className="w-full"
            >
              Voir toutes les commandes
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}