import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Eye, Package, Clock, CheckCircle, Truck, Store, X, BarChart3 } from 'lucide-react';

interface ProductionBatch {
  id: number;
  batch_reference: string;
  product_id: number;
  nom_product: string;
  reference_product: string;
  boutique_origin: string;
  product_type?: string;  // Added for soustraitance support
  client_id?: number;     // Added for soustraitance client navigation
  quantity_to_produce: number;
  sizes_breakdown?: string;
  status: 'planifie' | 'en_cours' | 'termine' | 'en_a_collecter' | 'en_magasin' | 'cancelled';
  total_materials_cost: number;
  notification_emails?: string;
  started_by_name?: string;
  started_at?: string;
  completed_at?: string;
  notes?: string;
  created_at: string;
  materials_used?: BatchMaterial[];
}

interface BatchMaterial {
  id: number;
  material_id: number;
  nom_matiere: string;
  quantity_used: number;
  quantity_type_name: string;
  quantity_unit: string;
  unit_cost: number;
  total_cost: number;
}

const Productions = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [batches, setBatches] = useState<ProductionBatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      
      const response = await fetch(`https://luccibyey.com.tn/production/api/production_batches.php?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setBatches(data.data);
      } else {
        toast({
          title: "Erreur",
          description: "Erreur lors du chargement des productions",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors du chargement des productions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBatchDetails = (batchId: number) => {
    navigate(`/productions/${batchId}`);
  };

  const updateStatus = async (batchId: number, newStatus: string) => {
    try {
      const response = await fetch('https://luccibyey.com.tn/production/api/production_batches.php', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: batchId,
          action: 'update_status',
          status: newStatus
        })
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Succès",
          description: "Statut mis à jour avec succès",
        });
        fetchBatches();
      } else {
        toast({
          title: "Erreur",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la mise à jour",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'planifie': return <Clock className="h-4 w-4" />;
      case 'en_cours': return <Package className="h-4 w-4" />;
      case 'termine': return <CheckCircle className="h-4 w-4" />;
      case 'en_a_collecter': return <Truck className="h-4 w-4" />;
      case 'en_magasin': return <Store className="h-4 w-4" />;
      case 'cancelled': return <X className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planifie': return 'bg-gray-500';
      case 'en_cours': return 'bg-blue-500';
      case 'termine': return 'bg-green-500';
      case 'en_a_collecter': return 'bg-orange-500';
      case 'en_magasin': return 'bg-purple-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'planifie': return 'Planifié';
      case 'en_cours': return 'En Cours';
      case 'termine': return 'Terminé';
      case 'en_a_collecter': return 'À Collecter';
      case 'en_magasin': return 'En Magasin';
      case 'cancelled': return 'Annulé';
      default: return status;
    }
  };

  const getProgressPercentage = (status: string) => {
    switch (status) {
      case 'planifie': return 0;
      case 'en_cours': return 25;
      case 'termine': return 50;
      case 'en_a_collecter': return 75;
      case 'en_magasin': return 100;
      case 'cancelled': return 0;
      default: return 0;
    }
  };

  const getBoutiqueColor = (boutique: string | null | undefined) => {
    // Handle null or undefined boutique
    if (!boutique) {
      return 'bg-gray-500';
    }

    // Predefined colors for main boutiques
    const boutiqueColors: { [key: string]: string } = {
      'luccibyey': 'bg-blue-500',
      'spadadibattaglia': 'bg-green-500',
      'Lucci By Ey': 'bg-blue-500',
      'Spada di Battaglia': 'bg-green-500'
    };

    // If it's a known boutique, return its color
    if (boutiqueColors[boutique]) {
      return boutiqueColors[boutique];
    }

    // For soustraitance clients and other boutiques, generate a consistent color based on name
    const colors = [
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-cyan-500',
      'bg-teal-500', 'bg-emerald-500', 'bg-lime-500', 'bg-amber-500',
      'bg-orange-500', 'bg-red-500', 'bg-rose-500', 'bg-violet-500'
    ];

    // Simple hash function to get consistent color for each boutique name
    let hash = 0;
    for (let i = 0; i < boutique.length; i++) {
      hash = boutique.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorIndex = Math.abs(hash) % colors.length;
    
    return colors[colorIndex];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Statistics calculation
  const stats = {
    total: batches.length,
    en_cours: batches.filter(b => b.status === 'en_cours').length,
    termine: batches.filter(b => b.status === 'termine').length,
    en_retard: batches.filter(b => b.status === 'planifie' && new Date(b.created_at) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length
  };

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center md:space-y-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Productions</h1>
          <p className="text-sm md:text-base text-muted-foreground">Suivi des batches de production</p>
        </div>
        <Button 
          onClick={() => navigate('/productions-statistics')}
          variant="default"
          className="w-full md:w-auto"
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          Statistiques
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card className="border-0 shadow-lg bg-primary hover:shadow-xl transition-all duration-300">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-primary-foreground/70">Total</p>
                <p className="text-lg md:text-2xl font-bold text-primary-foreground">{stats.total}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-primary-foreground/10 flex items-center justify-center">
                <Package className="h-4 w-4 md:h-5 md:w-5 text-primary-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg bg-primary hover:shadow-xl transition-all duration-300">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-primary-foreground/70">En Cours</p>
                <p className="text-lg md:text-2xl font-bold text-primary-foreground">{stats.en_cours}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-primary-foreground/10 flex items-center justify-center">
                <Clock className="h-4 w-4 md:h-5 md:w-5 text-primary-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg bg-primary hover:shadow-xl transition-all duration-300">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-primary-foreground/70">Terminées</p>
                <p className="text-lg md:text-2xl font-bold text-primary-foreground">{stats.termine}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-primary-foreground/10 flex items-center justify-center">
                <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-primary-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg bg-primary hover:shadow-xl transition-all duration-300">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-primary-foreground/70">En Retard</p>
                <p className="text-lg md:text-2xl font-bold text-primary-foreground">{stats.en_retard}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-primary-foreground/10 flex items-center justify-center">
                <Clock className="h-4 w-4 md:h-5 md:w-5 text-primary-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col space-y-3 md:flex-row md:space-y-0 md:gap-4">
        <Input
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:max-w-sm"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="planifie">Planifié</SelectItem>
            <SelectItem value="en_cours">En Cours</SelectItem>
            <SelectItem value="termine">Terminé</SelectItem>
            <SelectItem value="en_a_collecter">À Collecter</SelectItem>
            <SelectItem value="en_magasin">En Magasin</SelectItem>
            <SelectItem value="cancelled">Annulé</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={fetchBatches} variant="outline" className="w-full md:w-auto">
          Actualiser
        </Button>
      </div>

      {/* Productions Table - Mobile Responsive */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Productions ({batches.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0 md:p-6">
          {/* Mobile Cards View */}
          <div className="block md:hidden">
            <div className="space-y-3 p-4">
              {batches.map((batch) => (
                <Card 
                  key={batch.id} 
                  className="border-l-4 cursor-pointer hover:bg-muted/20" 
                  style={{borderLeftColor: getBoutiqueColor(batch.boutique_origin).replace('bg-', '#')}}
                  onClick={() => fetchBatchDetails(batch.id)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm">{batch.batch_reference}</h3>
                          <p className="text-xs text-muted-foreground">{batch.nom_product}</p>
                        </div>
                        <Badge className={`text-white text-xs ${getStatusColor(batch.status)}`}>
                          {getStatusLabel(batch.status)}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                          <span className="text-muted-foreground">Boutique:</span>
                          <p className="font-medium">
                            {batch.product_type === 'soustraitance' 
                              ? (batch.boutique_origin || 'N/A')
                              : (batch.boutique_origin === 'luccibyey' ? 'Lucci By Ey' : batch.boutique_origin === 'spadadibattaglia' ? 'Spada di Battaglia' : (batch.boutique_origin || 'N/A'))
                            }
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Quantité:</span>
                          <p className="font-medium">{batch.quantity_to_produce}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Coût:</span>
                          <p className="font-medium">{Number(batch.total_materials_cost || 0).toFixed(2)} TND</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Créé:</span>
                          <p className="font-medium">{new Date(batch.created_at).toLocaleDateString('fr-FR')}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">Progression</span>
                          <span className="text-xs font-medium">{getProgressPercentage(batch.status)}%</span>
                        </div>
                        <Progress value={getProgressPercentage(batch.status)} className="h-2" />
                      </div>
                      
                      <div className="flex gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => fetchBatchDetails(batch.id)}
                          className="flex-1 text-xs"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Détails
                        </Button>
                        <Select
                          value={batch.status}
                          onValueChange={(value) => updateStatus(batch.id, value)}
                        >
                          <SelectTrigger className="flex-1 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="planifie">Planifié</SelectItem>
                            <SelectItem value="en_cours">En Cours</SelectItem>
                            <SelectItem value="termine">Terminé</SelectItem>
                            <SelectItem value="en_a_collecter">À Collecter</SelectItem>
                            <SelectItem value="en_magasin">En Magasin</SelectItem>
                            <SelectItem value="cancelled">Annulé</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Référence Batch</TableHead>
                  <TableHead>Produit</TableHead>
                  <TableHead>Boutique</TableHead>
                  <TableHead>Quantité</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Progression</TableHead>
                  <TableHead>Coût Total</TableHead>
                  <TableHead>Créé le</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((batch) => (
                  <TableRow 
                    key={batch.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => fetchBatchDetails(batch.id)}
                  >
                    <TableCell className="font-medium">{batch.batch_reference}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{batch.nom_product}</div>
                        <div className="text-sm text-muted-foreground">{batch.reference_product}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-white ${getBoutiqueColor(batch.boutique_origin)}`}>
                        {batch.product_type === 'soustraitance' 
                          ? (batch.boutique_origin || 'N/A')
                          : (batch.boutique_origin === 'luccibyey' ? 'Lucci By Ey' : batch.boutique_origin === 'spadadibattaglia' ? 'Spada di Battaglia' : (batch.boutique_origin || 'N/A'))
                        }
                      </Badge>
                    </TableCell>
                    <TableCell>{batch.quantity_to_produce}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`p-1 rounded-full text-white ${getStatusColor(batch.status)}`}>
                          {getStatusIcon(batch.status)}
                        </div>
                        <span className="text-sm">{getStatusLabel(batch.status)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="w-32">
                      <div className="space-y-1">
                        <Progress value={getProgressPercentage(batch.status)} className="h-2" />
                        <span className="text-xs text-muted-foreground">{getProgressPercentage(batch.status)}%</span>
                      </div>
                    </TableCell>
                    <TableCell>{Number(batch.total_materials_cost || 0).toFixed(2)} TND</TableCell>
                    <TableCell>{formatDate(batch.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => fetchBatchDetails(batch.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Select
                          value={batch.status}
                          onValueChange={(value) => updateStatus(batch.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="planifie">Planifié</SelectItem>
                            <SelectItem value="en_cours">En Cours</SelectItem>
                            <SelectItem value="termine">Terminé</SelectItem>
                            <SelectItem value="en_a_collecter">À Collecter</SelectItem>
                            <SelectItem value="en_magasin">En Magasin</SelectItem>
                            <SelectItem value="cancelled">Annulé</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Productions;