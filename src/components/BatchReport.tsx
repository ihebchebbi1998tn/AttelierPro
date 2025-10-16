
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
      <div ref={ref} className="batch-report-root bg-white text-black p-8 font-mono leading-tight print:p-6 print:font-mono print-exact print-a4">
        {/* Component-scoped print overrides to ensure exact match between screen and print */}
        <style>{`
          @media print {
            /* Global print settings */
            body { 
              -webkit-print-color-adjust: exact !important; 
              print-color-adjust: exact !important; 
            }
            
            /* Ensure only the batch report is visible when printing */
            body > *:not(.batch-report-root) {
              display: none !important;
            }
            
            /* Root container */
            .batch-report-root { 
              -webkit-print-color-adjust: exact !important; 
              print-color-adjust: exact !important; 
              color: #000 !important; 
              background: #fff !important;
              display: block !important;
              position: relative !important;
              padding: 20px !important;
              margin: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
            }
            
            /* Layout fixes */
            .batch-report-root .batch-right-col { 
              overflow: visible !important; 
              height: auto !important; 
            }
            .batch-report-root .batch-image-container { 
              height: auto !important; 
              min-height: 0 !important; 
            }
            
            /* Images */
            .batch-report-root img { 
              object-fit: contain !important; 
              max-height: 260mm !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            /* Hide elements */
            .batch-report-root .no-print { 
              display: none !important; 
            }
            
            /* Tables */
            .batch-report-root table { 
              page-break-inside: avoid !important;
              border-collapse: collapse !important;
              width: 100% !important;
            }
            .batch-report-root .print-force-border th, 
            .batch-report-root .print-force-border td { 
              border: 1px solid #000 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            /* Force exact colors for backgrounds */
            .batch-report-root .bg-black {
              background-color: #000 !important;
              color: #fff !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .batch-report-root .text-white {
              color: #fff !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .batch-report-root .bg-gray-100 {
              background-color: #f3f4f6 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .batch-report-root .bg-gray-50 {
              background-color: #f9fafb !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            /* Force exact borders */
            .batch-report-root .border-black,
            .batch-report-root .border-b-2.border-black,
            .batch-report-root .border-2.border-black,
            .batch-report-root .border-b.border-black {
              border-color: #000 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            /* Text colors */
            .batch-report-root .text-blue-600 {
              color: #2563eb !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            /* Page breaks */
            .batch-report-root .print-no-break {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            
            /* Font weights and styles */
            .batch-report-root .font-bold {
              font-weight: 700 !important;
            }
            .batch-report-root .font-semibold {
              font-weight: 600 !important;
            }
            .batch-report-root .font-medium {
              font-weight: 500 !important;
            }
            
            /* Ensure proper sizing */
            @page {
              size: A4;
              margin: 1cm;
            }
          }
        `}</style>
        {/* Header */}
        <div className="border-b-4 border-black pb-4 mb-8 print:border-b-4 print:pb-3 print:mb-6 print-no-break">
          <h1 className="text-4xl font-bold text-center mb-2 tracking-tight print:text-3xl print:font-bold print:mb-2">RAPPORT DE PRODUCTION</h1>
          <div className="text-center text-sm font-bold print:text-xs print:font-bold">
            <span>BATCH: {batch.batch_reference}</span>
            <span className="mx-4">|</span>
            <span>DATE: {new Date().toLocaleDateString('fr-FR')}</span>
          </div>
        </div>

        {/* Product Image and Information Section - Side by Side */}
        <div className="mb-8 border-2 border-black print:mb-6 print:border-2 print:border-black print:break-inside-avoid print-no-break">
          <div className="flex items-stretch gap-0 print:flex print:items-stretch print:gap-0">
            {/* Left: Product Image - Fixed Width */}
            <div className="w-1/3 border-r-2 border-black print:w-1/3 print:border-r-2 print:border-black">
              {productImages.length > 0 ? (
                <div className="h-[400px] flex flex-col print-h-auto print-flex batch-image-container" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                  <div className="text-center py-2 text-xs font-bold border-b-2 border-black bg-black text-white print:text-center print:py-2 print:text-xs print:font-bold print:border-b-2 print:border-black print:bg-black print:text-white">PRODUIT</div>
                  <img
                    src={productImages[0]}
                    alt={batch.nom_product}
                    className="w-full flex-1 object-contain print-w-full print-flex print-object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = '<div class="flex-1 flex items-center justify-center text-xs">Image non disponible</div>';
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="h-[400px] flex flex-col print-h-auto print-flex batch-image-container" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                  <div className="text-center py-2 text-xs font-bold border-b-2 border-black bg-black text-white print:text-center print:py-2 print:text-xs print:font-bold print:border-b-2 print:border-black print:bg-black print:text-white">PRODUIT</div>
                  <div className="flex-1 flex items-center justify-center text-xs print:text-xs">
                    Aucune image
                  </div>
                </div>
              )}
            </div>

            {/* Right: Product Information - Takes remaining space */}
            <div className="w-2/3 flex flex-col print-w-full print-flex print-h-auto batch-right-col" style={{ overflow: 'visible' }}>
              {/* Product Info Section */}
              <div className="border-b-2 border-black p-4 print:border-b-2 print:border-black print:p-3">
                <h2 className="text-sm font-bold mb-3 pb-1 border-b border-black print:text-xs print:font-bold print:mb-2 print:pb-1 print:border-b print:border-black">INFORMATIONS PRODUIT</h2>
                <div className="space-y-1.5 text-xs print:space-y-1 print:text-[10px]">
                  <div className="flex">
                    <span className="w-32 font-bold">Nom:</span>
                    <span className="flex-1 font-bold">{batch.nom_product}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 font-bold">Référence:</span>
                    <span className="flex-1">{batch.reference_product}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 font-bold">Boutique:</span>
                    <span className="flex-1">{companyName}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 font-bold">Statut:</span>
                    <span className="flex-1">{getStatusLabel(batch.status)}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 font-bold">Quantité:</span>
                    <span className="flex-1 font-bold">{batch.quantity_to_produce} unités</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 font-bold">Coût matériaux:</span>
                    <span className="flex-1 font-bold">{Number(batch.total_materials_cost || 0).toFixed(2)} TND</span>
                  </div>
                </div>
              </div>

              {/* Production Dates Section */}
              <div className="border-b-2 border-black p-4 print:border-b-2 print:border-black print:p-3">
                <h2 className="text-sm font-bold mb-3 pb-1 border-b border-black print:text-xs print:font-bold print:mb-2 print:pb-1 print:border-b print:border-black">DATES DE PRODUCTION</h2>
                <div className="space-y-1.5 text-xs print:space-y-1 print:text-[10px]">
                  <div className="flex">
                    <span className="w-32 font-bold">Création:</span>
                    <span className="flex-1">{formatDate(batch.created_at)}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 font-bold">Démarrage:</span>
                    <span className="flex-1">{formatDate(batch.started_at)}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 font-bold">Fin:</span>
                    <span className="flex-1">{formatDate(batch.completed_at) !== 'Non spécifiée' ? formatDate(batch.completed_at) : '-'}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 font-bold">Démarré par:</span>
                    <span className="flex-1">{batch.started_by_name || 'Admin Production'}</span>
                  </div>
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
                       <div className="flex-1 p-4 print:flex-1 print:p-3">
                         <h2 className="text-sm font-bold mb-3 pb-1 border-b border-black print:text-xs print:font-bold print:mb-2 print:pb-1 print:border-b print:border-black">SPÉCIFICATIONS</h2>
                         <div className="space-y-1.5 text-xs print:space-y-1 print:text-[10px]">
                           {Object.entries(specs).map(([key, value], index) => (
                             <div key={index} className="flex">
                               <span className="w-32 font-bold">{key}:</span>
                               <span className="flex-1">{String(value)}</span>
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
          <div className="mb-6 print:mb-4">
            <h2 className="text-xl font-bold border-b-2 border-black pb-2 mb-3 print:text-lg print:pb-1.5 print:mb-2">CONFIGURATION DES TAILLES</h2>
              <div className="border-2 border-black">
              <table className="w-full text-sm print:text-xs print-force-border">
                <thead>
                  <tr className="border-b-2 border-black bg-gray-100">
                    <th className="text-left p-3 border-r border-black font-bold print:p-2">TAILLE</th>
                    <th className="text-left p-3 font-bold print:p-2">QUANTITÉ</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedSizes.map((size, index) => (
                    <tr key={index} className={index !== parsedSizes.length - 1 ? "border-b border-black" : ""}>
                      <td className="p-3 border-r border-black font-semibold print:p-2">{size.size_name}</td>
                      <td className="p-3 font-medium print:p-2">{size.quantity} unités</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 border-t-2 border-black">
                    <td className="p-3 border-r border-black font-bold print:p-2">TOTAL</td>
                    <td className="p-3 font-bold text-blue-600 print:p-2">{parsedSizes.reduce((sum, size) => sum + size.quantity, 0)} unités</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Materials Used */}
        {batch.materials_used && batch.materials_used.length > 0 && (
          <div className="mb-6 print:mb-4">
            <h2 className="text-xl font-bold border-b-2 border-black pb-2 mb-3 print:text-lg print:pb-1.5 print:mb-2">MATÉRIAUX UTILISÉS</h2>
            <div className="border-2 border-black">
              <table className="w-full text-sm print:text-xs print-force-border">
                <thead>
                  <tr className="border-b-2 border-black bg-gray-100">
                    <th className="text-left p-3 border-r border-black font-bold print:p-2">MATÉRIAU</th>
                    <th className="text-left p-3 border-r border-black font-bold print:p-2">COULEUR</th>
                    <th className="text-left p-3 border-r border-black font-bold print:p-2">RÉPARTITION</th>
                    <th className="text-left p-3 border-r border-black font-bold print:p-2">TOTAL</th>
                    <th className="text-left p-3 border-r border-black font-bold print:p-2">UNITÉ</th>
                    <th className="text-left p-3 font-bold print:p-2">COMMENTAIRE</th>
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
                          <td className="p-3 border-r border-black font-semibold print:p-2">{material.nom_matiere}</td>
                          <td className="p-3 border-r border-black font-medium print:p-2">{material.couleur || 'N/A'}</td>
                          <td className="p-3 border-r border-black print:p-2">
                            {Object.keys(sizeBreakdown).length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {Object.entries(sizeBreakdown).map(([size, quantity]) => (
                                  <div key={size} className="bg-gray-100 px-2 py-1 rounded text-xs">
                                    <span className="font-semibold">
                                      {size === 'none' ? 'STD' : size.toUpperCase()}:
                                    </span>
                                    <span className="ml-1 font-medium">
                                      {quantity} {material.quantity_unit}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-600 italic text-xs">Toutes tailles</span>
                            )}
                          </td>
                          <td className="p-3 border-r border-black font-bold text-blue-600 print:p-2">
                            {material.quantity_used} {material.quantity_unit}
                          </td>
                          <td className="p-3 border-r border-black text-center font-medium print:p-2">
                            {material.quantity_type_name}
                          </td>
                          <td className="p-3 text-xs print:p-2">
                            {material.commentaire || '-'}
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
            <div className="mt-3 text-right print:mt-2">
              <span className="text-base font-bold print:text-sm">Coût Total Matériaux: <span className="text-red-600">{Number(batch.total_materials_cost || 0).toFixed(2)} TND</span></span>
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
