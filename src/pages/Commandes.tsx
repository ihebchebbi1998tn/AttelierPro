import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Eye, Package, Clock, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchSurMesureOrders, markSurMesureOrderAsSeen } from '../utils/surMesureService';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

export interface SurMesureOrder {
  id: number;
  client_name: string;
  client_vorname: string;
  client_email: string;
  client_phone: string;
  client_address: string;
  client_region: string;
  product_name: string;
  ready_date: string;
  first_try_date: string;
  first_try_scheduled_time?: string;
  first_try_completed_at?: string;
  second_try_date?: string;
  second_try_scheduled_time?: string;
  second_try_completed_at?: string;
  third_try_date?: string;
  third_try_scheduled_time?: string;
  third_try_completed_at?: string;
  status: 'new' | 'in_progress' | 'ready_for_pickup' | 'ready_for_try' | 'first_try' | 'needs_revision' | 'ready_for_second_try' | 'completed';
  measurements: Record<string, number>;
  tolerance: Record<string, number>;
  images: Array<{ id: number; path: string; commentaire?: string }>;
  videos?: Array<{ id: number; path: string; commentaire?: string }>;
  commentaires: Array<{ id: number; commentaire: string; created_by: string; date_creation: string }>;
  created_at: string;
  updated_at: string;
  is_seen: string;
}

const statusColors = {
  new: 'bg-gradient-to-r from-blue-500 to-blue-600',
  in_progress: 'bg-gradient-to-r from-yellow-500 to-yellow-600',
  ready_for_pickup: 'bg-gradient-to-r from-green-500 to-green-600',
  ready_for_try: 'bg-gradient-to-r from-teal-500 to-teal-600',
  first_try: 'bg-gradient-to-r from-purple-500 to-purple-600',
  needs_revision: 'bg-gradient-to-r from-orange-500 to-orange-600',
  ready_for_second_try: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
  completed: 'bg-gradient-to-r from-gray-500 to-gray-600'
};

const statusLabels = {
  new: 'Nouveau',
  in_progress: 'En cours',
  ready_for_pickup: 'Prét pour magasin',
  ready_for_try: 'Prêt pour essai',
  first_try: 'Premier essai',
  needs_revision: 'Révision nécessaire',
  ready_for_second_try: 'Prêt 2ème essai',
  completed: 'Terminé'
};

const Commandes = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ['surMesureOrders'],
    queryFn: fetchSurMesureOrders,
    refetchInterval: 30000,
  });

  const filteredOrders = orders.filter((order: SurMesureOrder) => {
    const matchesSearch = 
      order.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.client_vorname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.client_email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleViewOrder = async (order: SurMesureOrder) => {
    try {
      // Optimistically mark as seen in cache to update UI immediately
      queryClient.setQueryData<SurMesureOrder[] | undefined>(['surMesureOrders'], (old) => {
        if (!old) return old;
        return old.map((o) => (o.id === order.id ? { ...o, is_seen: '1' } : o));
      });

      // Mark on server and refresh in background
      markSurMesureOrderAsSeen(order.id)
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ['surMesureOrders'] });
        })
        .catch((error) => {
          console.error('Error marking order as seen:', error);
        });
    } catch (error) {
      console.error('Error in optimistic update:', error);
    }
    navigate(`/commandes/${order.id}`);
  };

  // Helper function to determine row highlighting
  const isOrderUnseen = (o: SurMesureOrder) =>
    o.is_seen === '0' || (o as any).is_seen === 0 || (o as any).is_seen === false || (o as any).is_seen === 'false';

  const getRowHighlight = (order: SurMesureOrder) => {
    const now = new Date();
    const createdAt = new Date(order.created_at);
    const daysDiff = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    
    // Only highlight UNSEEN orders
    if (isOrderUnseen(order)) {
      // Red if unseen and older than 1 day
      if (daysDiff > 1) {
        return 'bg-red-50 hover:bg-red-100 border-l-4 border-red-400';
      }
      // Yellow if unseen and recent
      return 'bg-yellow-50 hover:bg-yellow-100 border-l-4 border-yellow-400';
    }
    
    return 'hover:bg-muted/50';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-2 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="text-center sm:text-left">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Commandes sur Mesure</h1>
        <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-1">
          Gérez les commandes sur mesure et suivez leur progression
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <Card className="border-0 shadow-lg bg-primary hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-primary-foreground">Total</CardTitle>
            <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-primary-foreground/10 flex items-center justify-center">
              <Package className="h-3 w-3 sm:h-4 sm:w-4 text-primary-foreground" />
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-lg sm:text-2xl font-bold text-primary-foreground">{orders.length}</div>
            <p className="text-xs text-primary-foreground/70">Commandes</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-primary hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-primary-foreground">En cours</CardTitle>
            <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-primary-foreground/10 flex items-center justify-center">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-primary-foreground" />
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-lg sm:text-2xl font-bold text-primary-foreground">
              {orders.filter((o: SurMesureOrder) => o.status === 'in_progress').length}
            </div>
            <p className="text-xs text-primary-foreground/70">En production</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-primary hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-primary-foreground">Prêt</CardTitle>
            <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-primary-foreground/10 flex items-center justify-center">
              <Package className="h-3 w-3 sm:h-4 sm:w-4 text-primary-foreground" />
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-lg sm:text-2xl font-bold text-primary-foreground">
              {orders.filter((o: SurMesureOrder) => o.status === 'ready_for_pickup').length}
            </div>
            <p className="text-xs text-primary-foreground/70">Magasin</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-primary hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-primary-foreground">Terminées</CardTitle>
            <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-primary-foreground/10 flex items-center justify-center">
              <Package className="h-3 w-3 sm:h-4 sm:w-4 text-primary-foreground" />
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-lg sm:text-2xl font-bold text-primary-foreground">
              {orders.filter((o: SurMesureOrder) => o.status === 'completed').length}
            </div>
            <p className="text-xs text-primary-foreground/70">Finalisées</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="p-3 sm:p-4 pb-3 sm:pb-4">
          <CardTitle className="text-base sm:text-lg">Filtres</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0 space-y-3 sm:space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Rechercher par nom, email, produit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48 text-sm">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent className="bg-background border shadow-lg z-50">
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="new">Nouveau</SelectItem>
                <SelectItem value="in_progress">En cours</SelectItem>
                <SelectItem value="ready_for_pickup">Prét pour magasin</SelectItem>
                <SelectItem value="ready_for_try">Prêt pour essai</SelectItem>
                <SelectItem value="first_try">Premier essai</SelectItem>
                <SelectItem value="needs_revision">Révision nécessaire</SelectItem>
                <SelectItem value="ready_for_second_try">Prêt 2ème essai</SelectItem>
                <SelectItem value="completed">Terminé</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <Card>
        <CardHeader className="p-3 sm:p-4 pb-3 sm:pb-4">
          <CardTitle className="text-base sm:text-lg">Commandes Sur Mesure</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Liste des commandes sur mesure et leur statut
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Aucune commande sur mesure trouvée</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              {!isMobile && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Client</th>
                        <th className="text-left p-2">Produit</th>
                        <th className="text-left p-2">Date prête</th>
                        <th className="text-left p-2">Statut</th>
                        <th className="text-left p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map((order: SurMesureOrder) => (
                        <tr 
                          key={order.id} 
                          className={`border-b cursor-pointer transition-colors ${getRowHighlight(order)}`}
                          onClick={() => handleViewOrder(order)}
                        >
                          <td className="p-2">
                            <div>
                              <div className="font-medium">
                                {order.client_name} {order.client_vorname}
                              </div>
                              <div className="text-sm text-muted-foreground">{order.client_email}</div>
                            </div>
                          </td>
                          <td className="p-2">
                            <div className="font-medium">{order.product_name}</div>
                          </td>
                          <td className="p-2">
                            <div className="text-sm">
                              {new Date(order.ready_date).toLocaleDateString('fr-FR')}
                            </div>
                          </td>
                          <td className="p-2">
                            <Badge className={`${statusColors[order.status]} text-white`}>
                              {statusLabels[order.status]}
                            </Badge>
                          </td>
                          <td className="p-2">
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewOrder(order);
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Mobile Card View */}
              {isMobile && (
                <div className="space-y-3">
                  {filteredOrders.map((order: SurMesureOrder) => (
                    <Card 
                      key={order.id} 
                      className={`cursor-pointer transition-all hover:shadow-md ${getRowHighlight(order)}`}
                      onClick={() => handleViewOrder(order)}
                    >
                      <CardContent className="p-3">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <h3 className="font-semibold text-sm truncate">
                                  {order.client_name} {order.client_vorname}
                                </h3>
                              </div>
                              <p className="text-xs text-muted-foreground truncate">{order.client_email}</p>
                            </div>
                            <Badge className={`${statusColors[order.status]} text-white text-xs px-2 py-1 flex-shrink-0`}>
                              {statusLabels[order.status]}
                            </Badge>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <span className="text-sm font-medium truncate">{order.product_name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <span className="text-xs text-muted-foreground">
                                Prêt le {new Date(order.ready_date).toLocaleDateString('fr-FR')}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex justify-end pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewOrder(order);
                              }}
                              className="text-xs px-3 py-1"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              Voir
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Commandes;