
import React, { forwardRef } from 'react';
import { Badge } from "@/components/ui/badge";

interface BatchMaterial {
  id: number;
  material_id: number;
  nom_matiere: string;
  quantity_used: number;
  quantity_type_name: string;
  quantity_unit: string;
  unit_cost: number;
  total_cost: number;
  commentaire?: string;
  couleur?: string;
}

interface ProductionBatch {
  id: number;
  batch_reference: string;
  product_id: number;
  nom_product: string;
  reference_product: string;
  boutique_origin: string;
  quantity_to_produce: number;
  sizes_breakdown?: string;
  production_specifications?: string;
  status: 'planifie' | 'en_cours' | 'termine' | 'en_a_collecter' | 'en_magasin' | 'cancelled';
  total_materials_cost: number;
  notification_emails?: string;
  started_by_name?: string;
  started_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  cancelled_by?: string;
  cancellation_reason?: string;
  notes?: string;
  created_at: string;
  materials_used?: BatchMaterial[];
}

interface BatchReportProps {
  batch: ProductionBatch;
  measurementScale?: {
    measurement_types: string[];
    measurements_data: { [measurementType: string]: { [size: string]: number } };
    tolerance_data: { [measurementType: string]: number };
  };
  productImages?: string[];
  productAttachments?: any[];
}

const BatchReport = forwardRef<HTMLDivElement, BatchReportProps>(
  ({ batch, measurementScale, productImages = [], productAttachments = [] }, ref) => {
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

    const formatDate = (dateString: string | null | undefined) => {
      if (!dateString) return 'Non spécifiée';
      
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Date invalide';
      
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const parseSizesBreakdown = (sizesBreakdownString: string | undefined) => {
      if (!sizesBreakdownString) return [];
      
      try {
        const parsed = JSON.parse(sizesBreakdownString);
        return Object.entries(parsed).map(([size, quantity]) => ({
          size_name: size === 'none' ? 'Sans taille spécifique' : size,
          quantity: Number(quantity) || 0
        }));
      } catch (error) {
        console.error('Error parsing sizes breakdown:', error);
        return [];
      }
    };

    const parsedSizes = parseSizesBreakdown(batch.sizes_breakdown);
    const companyName = batch.boutique_origin === 'luccibyey' ? 'Lucci By Ey' : 'Spada di Battaglia';

    // Debug logging for measurement data
    if (measurementScale && measurementScale.measurement_types.length > 0) {
      console.log('BatchReport Debug:', {
        parsedSizes,
        measurementScale,
        measurementTypes: measurementScale.measurement_types,
        measurementsData: measurementScale.measurements_data
      });
    }

    // Create a comprehensive size mapping function
    const findBestSizeMatch = (batchSize: string, measurementSizes: string[]): string | null => {
      // Direct match first
      if (measurementSizes.includes(batchSize)) return batchSize;
      
      // Case insensitive match
      const caseInsensitiveMatch = measurementSizes.find(size => 
        size.toLowerCase() === batchSize.toLowerCase()
      );
      if (caseInsensitiveMatch) return caseInsensitiveMatch;
      
      // If no direct match, try to find any available size for fallback
      if (measurementSizes.length > 0) {
        console.log(`No size match found for batch size "${batchSize}", available measurement sizes:`, measurementSizes);
        // Return null to show "- cm" rather than wrong data
        return null;
      }
      
      return null;
    };

    return (
      <div ref={ref} className="bg-white text-black p-8 font-mono text-sm leading-tight">
        {/* Header */}
        <div className="border-b-2 border-black pb-4 mb-6">
          <h1 className="text-2xl font-bold text-center mb-2">RAPPORT DE PRODUCTION</h1>
          <div className="text-center text-sm font-medium mb-4">
            <span className="font-bold">Batch:</span> {batch.batch_reference} | <span className="font-bold">Date:</span> {new Date().toLocaleDateString('fr-FR')}
          </div>
        </div>

        {/* Product Image and Information Section */}
        <div className="mb-6 border-2 border-black">
          <div className="grid grid-cols-3 gap-4 p-4">
            {/* Left: First Product Image */}
            <div className="col-span-1">
              {productImages.length > 0 ? (
                <div className="border border-black p-2 bg-gray-50">
                  <div className="text-center mb-2 text-xs font-bold">PRODUIT</div>
                  <img
                    src={productImages[0]}
                    alt={batch.nom_product}
                    className="w-full h-64 object-cover rounded"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = '<div class="h-64 flex items-center justify-center text-xs text-gray-500">Image non disponible</div>';
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="border border-gray-300 border-dashed p-2 bg-gray-50 h-full flex items-center justify-center">
                  <div className="text-xs text-gray-500 text-center">Aucune image disponible</div>
                </div>
              )}
            </div>

            {/* Right: Product Information, Boutique, and Notes */}
            <div className="col-span-2 space-y-3">
              {/* Product Info */}
              <div>
                <h2 className="text-base font-bold border-b border-black pb-1 mb-2">INFORMATIONS PRODUIT</h2>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <div><strong>Nom:</strong> {batch.nom_product}</div>
                  <div><strong>Référence:</strong> {batch.reference_product}</div>
                  <div><strong>Boutique:</strong> {companyName}</div>
                  <div><strong>Statut:</strong> {getStatusLabel(batch.status)}</div>
                  <div><strong>Quantité:</strong> {batch.quantity_to_produce} unités</div>
                  <div><strong>Coût matériaux:</strong> {Number(batch.total_materials_cost || 0).toFixed(2)} TND</div>
                </div>
              </div>

              {/* Production Dates */}
              <div>
                <h2 className="text-base font-bold border-b border-black pb-1 mb-2">DATES</h2>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <div><strong>Création:</strong> {formatDate(batch.created_at)}</div>
                  <div><strong>Démarrage:</strong> {formatDate(batch.started_at)}</div>
                  <div><strong>Fin:</strong> {formatDate(batch.completed_at)}</div>
                  <div><strong>Démarré par:</strong> {batch.started_by_name || 'N/A'}</div>
                </div>
              </div>

              {/* Production Notes - Highlighted if exist */}
              {batch.notes && (
                <div className="bg-yellow-50 border-2 border-yellow-400 p-3">
                  <h2 className="text-sm font-bold mb-2 text-yellow-900">⚠️ NOTES DE PRODUCTION</h2>
                  <div className="text-xs font-medium text-yellow-900">{batch.notes}</div>
                </div>
              )}

              {/* Production Specifications */}
              {batch.production_specifications && 
               batch.production_specifications !== 'null' && 
               batch.production_specifications !== '{}' && (() => {
                 try {
                   const specs = typeof batch.production_specifications === 'string' 
                     ? JSON.parse(batch.production_specifications) 
                     : batch.production_specifications;
                   
                   if (specs && Object.keys(specs).length > 0) {
                     return (
                       <div>
                         <h2 className="text-base font-bold border-b border-black pb-1 mb-2">SPÉCIFICATIONS</h2>
                         <div className="text-xs space-y-1">
                           {Object.entries(specs).map(([key, value], index) => (
                             <div key={index} className="grid grid-cols-2 gap-2">
                               <span className="font-medium">{key}:</span>
                               <span>{String(value)}</span>
                             </div>
                           ))}
                         </div>
                       </div>
                     );
                   }
                 } catch (error) {
                   console.error('Error parsing production specifications:', error);
                 }
                 return null;
               })()}
            </div>
          </div>
        </div>

        {/* Size Breakdown */}
        {parsedSizes.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold border-b-2 border-black pb-1 mb-3">CONFIGURATION DES TAILLES</h2>
            <div className="border-2 border-black">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-black bg-gray-100">
                    <th className="text-left p-3 border-r border-black font-bold">TAILLE</th>
                    <th className="text-left p-3 font-bold">QUANTITÉ</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedSizes.map((size, index) => (
                    <tr key={index} className={index !== parsedSizes.length - 1 ? "border-b border-black" : ""}>
                      <td className="p-3 border-r border-black font-medium">{size.size_name}</td>
                      <td className="p-3">{size.quantity} unités</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 border-t-2 border-black">
                    <td className="p-3 border-r border-black font-bold">TOTAL</td>
                    <td className="p-3 font-bold">{parsedSizes.reduce((sum, size) => sum + size.quantity, 0)} unités</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Materials Used */}
        {batch.materials_used && batch.materials_used.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold border-b-2 border-black pb-1 mb-3">MATÉRIAUX UTILISÉS</h2>
            <div className="border-2 border-black">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b-2 border-black bg-gray-100">
                    <th className="text-left p-2 border-r border-black">MATÉRIAU</th>
                    <th className="text-left p-2 border-r border-black">COULEUR</th>
                    <th className="text-left p-2 border-r border-black">RÉPARTITION PAR TAILLE</th>
                    <th className="text-left p-2 border-r border-black">TOTAL</th>
                    <th className="text-left p-2 border-r border-black">UNITÉ</th>
                    <th className="text-left p-2">COMMENTAIRE</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const groupedMaterials = batch.materials_used?.reduce((acc: any, material) => {
                      const key = `${material.nom_matiere}-${material.couleur || 'N/A'}`;
                      if (!acc[key]) {
                        acc[key] = {
                          ...material,
                          quantity_used: Number(material.quantity_used) || 0
                        };
                      } else {
                        acc[key].quantity_used += Number(material.quantity_used) || 0;
                      }
                      return acc;
                    }, {});

                    return Object.values(groupedMaterials || {}).map((material: any, index: number) => {
                      let sizeBreakdown: { [size: string]: string } = {};
                      try {
                        if (batch.sizes_breakdown) {
                          const parsedSizes: { [key: string]: number } = JSON.parse(batch.sizes_breakdown);
                          const totalQuantity = Number(material.quantity_used) || 0;
                          const totalPieces = Object.values(parsedSizes).reduce((sum: number, qty: number) => sum + qty, 0);
                          
                          if (totalPieces > 0) {
                            Object.entries(parsedSizes).forEach(([size, pieces]) => {
                              const numPieces = Number(pieces) || 0;
                              if (numPieces > 0) {
                                const proportion = numPieces / totalPieces;
                                const materialForSize = (totalQuantity * proportion).toFixed(1);
                                sizeBreakdown[size] = materialForSize;
                              }
                            });
                          }
                        }
                      } catch (e) {
                        sizeBreakdown = {};
                      }

                      return (
                        <tr key={index} className={index !== Object.values(groupedMaterials || {}).length - 1 ? "border-b border-black" : ""}>
                          <td className="p-2 border-r border-black font-medium">{material.nom_matiere}</td>
                          <td className="p-2 border-r border-black">{material.couleur || 'N/A'}</td>
                          <td className="p-2 border-r border-black">
                            {Object.keys(sizeBreakdown).length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {Object.entries(sizeBreakdown).map(([size, quantity]) => (
                                  <div key={size} className="bg-gray-100 px-2 py-1 rounded">
                                    <span className="font-medium">
                                      {size === 'none' ? 'Standard' : size.toUpperCase()}:
                                    </span>
                                    <span className="ml-1">
                                      {quantity} {material.quantity_unit}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-600 italic">Toutes tailles</span>
                            )}
                          </td>
                          <td className="p-2 border-r border-black font-bold">
                            {material.quantity_used} {material.quantity_unit}
                          </td>
                          <td className="p-2 border-r border-black text-center">
                            {material.quantity_type_name}
                          </td>
                          <td className="p-2">
                            {material.commentaire || '-'}
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
            <div className="mt-3 text-right">
              <span className="font-bold">Coût Total Matériaux: {Number(batch.total_materials_cost || 0).toFixed(2)} TND</span>
            </div>
          </div>
        )}

        {/* Cancellation Information - Only if cancelled */}
        {batch.status === 'cancelled' && (
          <div className="mb-6 bg-red-50 border-2 border-red-500 p-4">
            <h2 className="text-lg font-bold text-red-900 border-b border-red-500 pb-2 mb-3">⚠️ BATCH ANNULÉ</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="mb-2"><strong>Date annulation:</strong> {formatDate(batch.cancelled_at)}</div>
                <div className="mb-2"><strong>Annulé par:</strong> {batch.cancelled_by || 'N/A'}</div>
              </div>
              <div>
                <div className="mb-2"><strong>Raison:</strong></div>
                <div className="border border-red-300 p-2 bg-white text-xs">
                  {batch.cancellation_reason || 'Aucune raison spécifiée'}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }
);

BatchReport.displayName = 'BatchReport';

export default BatchReport;