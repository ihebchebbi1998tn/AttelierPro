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
          <h1 className="text-2xl font-bold text-center mb-4">RAPPORT DE PRODUCTION</h1>
          <div className="flex justify-between items-center text-sm font-medium">
            <div>
              <span className="font-bold">Batch:</span> {batch.batch_reference}
            </div>
            <div>
              <span className="font-bold">Date:</span> {new Date().toLocaleDateString('fr-FR')}
            </div>
          </div>
        </div>

        {/* Notes - Highlighted at Top */}
        {batch.notes && (
          <div className="mb-6 bg-yellow-50 border-2 border-yellow-400">
            <h2 className="text-lg font-bold bg-yellow-400 px-3 py-2 mb-0">⚠️ NOTES DE PRODUCTION</h2>
            <div className="p-3 font-medium">
              <div>{batch.notes}</div>
            </div>
          </div>
        )}

        {/* Batch Information */}
        <div className="mb-6">
          <h2 className="text-lg font-bold border-b border-black pb-1 mb-3">INFORMATIONS BATCH</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="mb-2"><strong>Référence Batch:</strong> {batch.batch_reference}</div>
              <div className="mb-2"><strong>Statut:</strong> {getStatusLabel(batch.status)}</div>
              <div className="mb-2"><strong>Boutique:</strong> {companyName}</div>
              <div className="mb-2"><strong>Quantité à produire:</strong> {batch.quantity_to_produce} unités</div>
            </div>
            <div>
              <div className="mb-2"><strong>Date création:</strong> {formatDate(batch.created_at)}</div>
              <div className="mb-2"><strong>Date démarrage:</strong> {formatDate(batch.started_at)}</div>
              <div className="mb-2"><strong>Date fin:</strong> {formatDate(batch.completed_at)}</div>
              <div className="mb-2"><strong>Coût total matériaux:</strong> {Number(batch.total_materials_cost || 0).toFixed(2)} TND</div>
            </div>
          </div>
        </div>

        {/* Product Information with Specifications */}
        <div className="mb-6">
          <h2 className="text-lg font-bold border-b border-black pb-1 mb-3">INFORMATIONS PRODUIT</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="mb-2"><strong>Nom du produit:</strong> {batch.nom_product}</div>
              <div className="mb-2"><strong>Référence:</strong> {batch.reference_product}</div>
            </div>
            <div>
              <div className="mb-2"><strong>ID Produit:</strong> {batch.product_id}</div>
            </div>
          </div>
          
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
                   <div className="mt-4">
                     <div className="border border-black">
                       <table className="w-full">
                         <thead>
                           <tr className="border-b border-black bg-gray-100">
                             <th className="text-left p-2 border-r border-black">SPÉCIFICATION</th>
                             <th className="text-left p-2">VALEUR</th>
                           </tr>
                         </thead>
                         <tbody>
                           {Object.entries(specs).map(([key, value], index) => (
                             <tr key={index} className="border-b border-black">
                               <td className="p-2 border-r border-black font-medium">{key}</td>
                               <td className="p-2">{String(value)}</td>
                             </tr>
                           ))}
                         </tbody>
                       </table>
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

        {/* Size Breakdown */}
        {parsedSizes.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold border-b border-black pb-1 mb-3">RÉPARTITION DES TAILLES</h2>
            <div className="border border-black mb-4">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-black bg-gray-100">
                    <th className="text-left p-2 border-r border-black">TAILLE</th>
                    <th className="text-left p-2">QUANTITÉ</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedSizes.map((size, index) => (
                    <tr key={index} className="border-b border-black">
                      <td className="p-2 border-r border-black">{size.size_name}</td>
                      <td className="p-2">{size.quantity} unités</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Materials Used */}
        {batch.materials_used && batch.materials_used.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold border-b border-black pb-1 mb-3">MATÉRIAUX UTILISÉS</h2>
            <div className="border border-black">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-black bg-gray-100">
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
                    // Group materials by name and color to avoid duplicates
                    const groupedMaterials = batch.materials_used?.reduce((acc: any, material) => {
                      const key = `${material.nom_matiere}-${material.couleur || 'N/A'}`;
                      if (!acc[key]) {
                        acc[key] = {
                          ...material,
                          quantity_used: Number(material.quantity_used) || 0
                        };
                      } else {
                        // Aggregate quantities if duplicate materials exist
                        acc[key].quantity_used += Number(material.quantity_used) || 0;
                      }
                      return acc;
                    }, {});

                    return Object.values(groupedMaterials || {}).map((material: any, index: number) => {
                      // Parse size breakdown if available (from batch.sizes_breakdown)
                      let sizeBreakdown: { [size: string]: string } = {};
                      try {
                        if (batch.sizes_breakdown) {
                          const parsedSizes: { [key: string]: number } = JSON.parse(batch.sizes_breakdown);
                          // Simulate material usage per size based on proportions
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
                        // If parsing fails, show total quantity without size breakdown
                        sizeBreakdown = {};
                      }

                      return (
                        <tr key={index} className="border-b border-black">
                          <td className="p-2 border-r border-black font-medium">{material.nom_matiere}</td>
                          <td className="p-2 border-r border-black">{material.couleur || 'N/A'}</td>
                          <td className="p-2 border-r border-black">
                            {Object.keys(sizeBreakdown).length > 0 ? (
                              <div className="space-y-1">
                                {Object.entries(sizeBreakdown).map(([size, quantity]) => (
                                  <div key={size} className="inline-block mr-3 mb-1">
                                    <span className="font-medium text-xs">
                                      {size === 'none' ? 'Standard' : size.toUpperCase()}: 
                                    </span>
                                    <span className="ml-1 text-xs">
                                      {quantity} {material.quantity_unit}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-600 italic">
                                Toutes tailles confondues
                              </span>
                            )}
                          </td>
                          <td className="p-2 border-r border-black font-medium">
                            {material.quantity_used} {material.quantity_unit}
                          </td>
                          <td className="p-2 border-r border-black text-center">
                            {material.quantity_type_name}
                          </td>
                          <td className="p-2 text-xs">
                            {material.commentaire || '-'}
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}


        {/* Production Summary */}
        <div className="mb-6">
          <h2 className="text-lg font-bold border-b border-black pb-1 mb-3">RÉSUMÉ PRODUCTION</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="mb-2"><strong>Matériaux utilisés:</strong> {batch.materials_used?.length || 0} types</div>
              <div className="mb-2"><strong>Coût total matériaux:</strong> {Number(batch.total_materials_cost || 0).toFixed(2)} TND</div>
            </div>
            <div>
              <div className="mb-2"><strong>Coût moyen/matériau:</strong> {batch.materials_used?.length ? (Number(batch.total_materials_cost || 0) / batch.materials_used.length).toFixed(2) : '0.00'} TND</div>
              <div className="mb-2"><strong>Démarré par:</strong> {batch.started_by_name || 'N/A'}</div>
            </div>
          </div>
        </div>


        {/* Cancellation Information */}
        {batch.status === 'cancelled' && (
          <div className="mb-6">
            <h2 className="text-lg font-bold border-b border-black pb-1 mb-3">INFORMATIONS ANNULATION</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="mb-2"><strong>Date annulation:</strong> {formatDate(batch.cancelled_at)}</div>
                <div className="mb-2"><strong>Annulé par:</strong> {batch.cancelled_by || 'N/A'}</div>
              </div>
              <div>
                <div className="mb-2"><strong>Raison:</strong></div>
                <div className="border border-black p-2 bg-gray-50 text-xs">
                  {batch.cancellation_reason || 'Aucune raison spécifiée'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Technical Information */}
        <div className="mb-6">
          <h2 className="text-lg font-bold border-b border-black pb-1 mb-3">INFORMATIONS TECHNIQUES</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="mb-2"><strong>ID Batch:</strong> {batch.id}</div>
              <div className="mb-2"><strong>Emails notification:</strong> {batch.notification_emails || 'N/A'}</div>
            </div>
            <div>
              <div className="mb-2"><strong>Date création système:</strong> {formatDate(batch.created_at)}</div>
              <div className="mb-2"><strong>Référence système:</strong> {batch.batch_reference}</div>
            </div>
          </div>
        </div>

        {/* Page break before images and attachments */}
        <div className="print:break-before-page"></div>

        {/* Product Images - Last Pages */}
        {productImages.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold border-b border-black pb-1 mb-3">IMAGES PRODUIT</h2>
            {(() => {
              const imageChunks = [];
              for (let i = 0; i < productImages.length; i += 4) {
                imageChunks.push(productImages.slice(i, i + 4));
              }
              
              return imageChunks.map((chunk, chunkIndex) => (
                <div key={chunkIndex} className={chunkIndex > 0 ? "print:break-before-page image-grid" : "image-grid"}>
                  <div className="grid grid-cols-2 gap-2 mb-4 image-grid-page">
                    {chunk.map((imageUrl, index) => {
                      const imageNumber = chunkIndex * 4 + index + 1;
                      return (
                        <div key={index} className="border border-black p-1">
                          <div className="text-center mb-1 text-xs font-bold">
                            Image {imageNumber}
                          </div>
                          <div className="image-card">
                            <img
                              src={imageUrl}
                              alt={`${batch.nom_product} - Image ${imageNumber}`}
                              className="w-full h-full object-cover rounded-sm"
                              style={{ minHeight: '90%', minWidth: '90%', maxHeight: '95%', maxWidth: '95%' }}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = '<div class="text-xs text-gray-500 text-center">Image non disponible</div>';
                                }
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                    {/* Fill empty slots if less than 4 images in chunk */}
                    {chunk.length < 4 && Array.from({ length: 4 - chunk.length }).map((_, emptyIndex) => (
                      <div key={`empty-${emptyIndex}`} className="border border-gray-300 border-dashed p-1">
                        <div className="text-center mb-1 text-xs text-gray-400">
                          -
                        </div>
                        <div className="image-card border border-gray-200 border-dashed bg-gray-100">
                          <div className="text-xs text-gray-400">Vide</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ));
            })()}
          </div>
        )}

        {/* Technical Attachments - Last Pages */}
        {productAttachments.length > 0 && (
          <div className={productImages.length > 0 ? "print:break-before-page mb-6" : "mb-6"}>
            <h2 className="text-lg font-bold border-b border-black pb-1 mb-3">PIÈCES JOINTES TECHNIQUES</h2>
            <div className="border border-black">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-black bg-gray-100">
                    <th className="text-left p-2 border-r border-black">FICHIER</th>
                    <th className="text-left p-2 border-r border-black">TYPE</th>
                    <th className="text-left p-2 border-r border-black">TAILLE</th>
                    <th className="text-left p-2">DESCRIPTION</th>
                  </tr>
                </thead>
                <tbody>
                  {productAttachments.map((attachment, index) => (
                    <tr key={index} className="border-b border-black">
                      <td className="p-2 border-r border-black font-medium text-xs">
                        {attachment.original_filename || attachment.filename || 'Fichier sans nom'}
                      </td>
                      <td className="p-2 border-r border-black text-xs">
                        {attachment.file_type || 'N/A'}
                      </td>
                      <td className="p-2 border-r border-black text-xs">
                        {attachment.file_size ? `${(parseInt(attachment.file_size) / 1024).toFixed(1)} KB` : 'N/A'}
                      </td>
                      <td className="p-2 text-xs">
                        {attachment.description || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    );
  }
);

BatchReport.displayName = 'BatchReport';

export default BatchReport;