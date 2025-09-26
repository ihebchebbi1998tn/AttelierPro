import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Eye, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { fetchSurMesureOrders } from '../utils/surMesureService';
import { useNavigate } from 'react-router-dom';

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

  const handleViewOrder = (order: SurMesureOrder) => {
    navigate(`/commandes/${order.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Commandes sur Mesure</h1>
        <p className="page-description">
          Gérez les commandes sur mesure et suivez leur progression
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-primary hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary-foreground">Total Commandes</CardTitle>
            <div className="h-8 w-8 rounded-full bg-primary-foreground/10 flex items-center justify-center">
              <Package className="h-4 w-4 text-primary-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary-foreground">{orders.length}</div>
            <p className="text-xs text-primary-foreground/70">Commandes sur mesure</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-primary hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary-foreground">En cours</CardTitle>
            <div className="h-8 w-8 rounded-full bg-primary-foreground/10 flex items-center justify-center">
              <Package className="h-4 w-4 text-primary-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary-foreground">
              {orders.filter((o: SurMesureOrder) => o.status === 'in_progress').length}
            </div>
            <p className="text-xs text-primary-foreground/70">En production</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-primary hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary-foreground">Prét magasin</CardTitle>
            <div className="h-8 w-8 rounded-full bg-primary-foreground/10 flex items-center justify-center">
              <Package className="h-4 w-4 text-primary-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary-foreground">
              {orders.filter((o: SurMesureOrder) => o.status === 'ready_for_pickup').length}
            </div>
            <p className="text-xs text-primary-foreground/70">Prêt pour magasin</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-primary hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary-foreground">Terminées</CardTitle>
            <div className="h-8 w-8 rounded-full bg-primary-foreground/10 flex items-center justify-center">
              <Package className="h-4 w-4 text-primary-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary-foreground">
              {orders.filter((o: SurMesureOrder) => o.status === 'completed').length}
            </div>
            <p className="text-xs text-primary-foreground/70">Commandes finalisées</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Rechercher par nom, email, produit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
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
        <CardHeader>
          <CardTitle>Commandes Sur Mesure</CardTitle>
          <CardDescription>
            Liste des commandes sur mesure et leur statut
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                      className="border-b hover:bg-muted/50 cursor-pointer transition-colors"
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
        </CardContent>
      </Card>
    </div>
  );
};

export default Commandes;