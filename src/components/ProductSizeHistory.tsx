import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, History, Package, BarChart3, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface SizeChange {
  id: number;
  size_type: string;
  size_value: string;
  quantity: number;
  action_type: 'initial' | 'added' | 'updated' | 'preserved';
  previous_quantity: number;
  configured_at: string;
}

interface TransferBatch {
  batch_info: {
    id: number;
    boutique_origin: string;
    transfer_date: string;
    total_quantity: number;
    notes: string;
  };
  size_changes: SizeChange[];
}

interface ProductSizeHistoryProps {
  productId: number;
  productName?: string;
}

const ProductSizeHistory: React.FC<ProductSizeHistoryProps> = ({ productId, productName }) => {
  const [history, setHistory] = useState<TransferBatch[]>([]);
  const [currentConfig, setCurrentConfig] = useState<any>(null);
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedBatches, setExpandedBatches] = useState<Set<number>>(new Set());

  const loadData = async () => {
    setLoading(true);
    try {
      const [historyRes, configRes, statsRes] = await Promise.all([
        fetch(`/production/api/product_size_history.php?product_id=${productId}&action=history`),
        fetch(`/production/api/product_size_history.php?product_id=${productId}&action=current_config`),
        fetch(`/production/api/product_size_history.php?product_id=${productId}&action=statistics`)
      ]);

      const [historyData, configData, statsData] = await Promise.all([
        historyRes.json(),
        configRes.json(),
        statsRes.json()
      ]);

      if (historyData.success) setHistory(historyData.history);
      if (configData.success) setCurrentConfig(configData.product);
      if (statsData.success) setStatistics(statsData.statistics);
    } catch (error) {
      console.error('Error loading size history data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [productId]);

  const toggleBatch = (batchId: number) => {
    const newExpanded = new Set(expandedBatches);
    if (newExpanded.has(batchId)) {
      newExpanded.delete(batchId);
    } else {
      newExpanded.add(batchId);
    }
    setExpandedBatches(newExpanded);
  };

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case 'initial': return 'default';
      case 'added': return 'success';
      case 'updated': return 'warning';
      case 'preserved': return 'secondary';
      default: return 'outline';
    }
  };

  const getQuantityChange = (current: number, previous: number, action: string) => {
    if (action === 'initial' || action === 'added') return `+${current}`;
    if (action === 'updated') return `${previous} → ${current}`;
    if (action === 'preserved') return `=${current}`;
    return current.toString();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Size Configuration History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Size Configuration History
        </CardTitle>
        <CardDescription>
          Track size configuration changes for {productName || 'this product'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="current" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="current" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Current
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="statistics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Stats
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Timeline
            </TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="space-y-4">
            {currentConfig && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">{currentConfig.total_configured_quantity || 0}</div>
                      <p className="text-xs text-muted-foreground">Total Quantity</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">{currentConfig.size_configuration_version || 1}</div>
                      <p className="text-xs text-muted-foreground">Version</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">
                        {Object.keys(currentConfig.production_quantities || {}).length}
                      </div>
                      <p className="text-xs text-muted-foreground">Active Sizes</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-sm font-medium">{currentConfig.boutique_origin}</div>
                      <p className="text-xs text-muted-foreground">Source</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Current Size Configuration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Size</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(currentConfig.production_quantities || {}).map(([size, quantity]) => (
                          <TableRow key={size}>
                            <TableCell className="font-medium">{size}</TableCell>
                            <TableCell>{quantity as number}</TableCell>
                            <TableCell>
                              <Badge variant="success">Active</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {history.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No transfer history available for this product.
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((batch, index) => (
                  <Card key={batch.batch_info.id || index}>
                    <Collapsible>
                      <CollapsibleTrigger asChild>
                        <CardHeader 
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => toggleBatch(batch.batch_info.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {expandedBatches.has(batch.batch_info.id) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                              <div>
                                <CardTitle className="text-lg">
                                  Transfer #{batch.batch_info.id}
                                </CardTitle>
                                <CardDescription>
                                  {format(new Date(batch.batch_info.transfer_date), 'PPp')} • 
                                  {batch.batch_info.boutique_origin} • 
                                  {batch.size_changes.length} size changes
                                </CardDescription>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">{batch.batch_info.total_quantity} items</div>
                              <div className="text-sm text-muted-foreground">{batch.batch_info.notes}</div>
                            </div>
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Size</TableHead>
                                <TableHead>Action</TableHead>
                                <TableHead>Quantity Change</TableHead>
                                <TableHead>Time</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {batch.size_changes.map((change) => (
                                <TableRow key={change.id}>
                                  <TableCell className="font-medium">{change.size_value}</TableCell>
                                  <TableCell>
                                    <Badge variant={getActionBadgeVariant(change.action_type)}>
                                      {change.action_type}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    {getQuantityChange(change.quantity, change.previous_quantity, change.action_type)}
                                  </TableCell>
                                  <TableCell className="text-sm text-muted-foreground">
                                    {format(new Date(change.configured_at), 'HH:mm:ss')}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="statistics" className="space-y-4">
            {statistics && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Transfer Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total Transfers:</span>
                      <span className="font-medium">{statistics.total_transfers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Size Changes:</span>
                      <span className="font-medium">{statistics.total_size_changes}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Current Quantity:</span>
                      <span className="font-medium">{statistics.current_total_quantity}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Action Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span>Sizes Added:</span>
                      <Badge variant="success">{statistics.sizes_added}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Sizes Updated:</span>
                      <Badge variant="warning">{statistics.sizes_updated}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Sizes Preserved:</span>
                      <Badge variant="secondary">{statistics.sizes_preserved}</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-lg">Timeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between text-sm">
                      <div>
                        <span className="text-muted-foreground">First Configuration:</span>
                        <div className="font-medium">
                          {statistics.first_configuration ? 
                            format(new Date(statistics.first_configuration), 'PPp') : 
                            'N/A'
                          }
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-muted-foreground">Last Configuration:</span>
                        <div className="font-medium">
                          {statistics.last_configuration ? 
                            format(new Date(statistics.last_configuration), 'PPp') : 
                            'N/A'
                          }
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="timeline" className="space-y-4">
            <div className="relative">
              {history.map((batch, index) => (
                <div key={batch.batch_info.id} className="relative pl-8 pb-8">
                  <div className="absolute left-0 top-0 h-full w-px bg-border"></div>
                  <div className="absolute left-0 top-2 h-2 w-2 rounded-full bg-primary -translate-x-1/2"></div>
                  
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          {format(new Date(batch.batch_info.transfer_date), 'MMM d, yyyy HH:mm')}
                        </CardTitle>
                        <Badge variant="outline">{batch.batch_info.boutique_origin}</Badge>
                      </div>
                      <CardDescription>{batch.batch_info.notes}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm space-y-1">
                        {batch.size_changes.map((change) => (
                          <div key={change.id} className="flex items-center justify-between">
                            <span>Size {change.size_value}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant={getActionBadgeVariant(change.action_type)} className="text-xs">
                                {change.action_type}
                              </Badge>
                              <span className="text-muted-foreground">
                                {getQuantityChange(change.quantity, change.previous_quantity, change.action_type)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ProductSizeHistory;