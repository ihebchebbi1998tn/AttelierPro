
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
      <div ref={ref} className="batch-report-root bg-white text-black p-8 font-mono leading-tight">
        {/* Comprehensive print styles for perfect output matching modal */}
        <style>{`
      @page {
        size: A4;
        margin: 15mm 15mm 15mm 15mm;
      }
      
      @page {
        margin-top: 0;
        margin-bottom: 0;
      }
          
          @media print {
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              box-sizing: border-box !important;
            }
            
            html, body {
              background: white !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            
            .batch-report-root {
              color: #000 !important;
              background: #fff !important;
              padding: 20px !important;
              margin: 0 !important;
              font-family: monospace !important;
              width: 100% !important;
            }
            
            /* Headers - bold and clear */
            .batch-report-root h1 {
              font-size: 24pt !important;
              font-weight: bold !important;
              color: #000 !important;
              text-align: center !important;
              margin-bottom: 8px !important;
              page-break-after: avoid !important;
            }
            
            .batch-report-root h2 {
              font-size: 14pt !important;
              font-weight: bold !important;
              color: #000 !important;
              page-break-after: avoid !important;
            }
            
            /* All borders must be solid black */
            .batch-report-root [class*="border"] {
              border-color: #000 !important;
            }
            
            .batch-report-root .border-4 {
              border-width: 4px !important;
            }
            
            .batch-report-root .border-2 {
              border-width: 2px !important;
            }
            
            .batch-report-root .border {
              border-width: 1px !important;
            }
            
            .batch-report-root .border-b-4 {
              border-bottom-width: 4px !important;
            }
            
            .batch-report-root .border-b-2 {
              border-bottom-width: 2px !important;
            }
            
            .batch-report-root .border-b {
              border-bottom-width: 1px !important;
            }
            
            .batch-report-root .border-r-2 {
              border-right-width: 2px !important;
            }
            
            /* Background colors must show */
            .batch-report-root .bg-black {
              background-color: #000 !important;
              color: #fff !important;
            }
            
            .batch-report-root .bg-gray-50 {
              background-color: #f9fafb !important;
            }
            
            .batch-report-root .bg-gray-100 {
              background-color: #f3f4f6 !important;
            }
            
            .batch-report-root .bg-yellow-50 {
              background-color: #fefce8 !important;
              border: 2px solid #000 !important;
            }
            
            /* Text colors */
            .batch-report-root .text-white {
              color: #fff !important;
            }
            
            .batch-report-root .text-blue-600 {
              color: #2563eb !important;
            }
            
            .batch-report-root .text-red-600 {
              color: #dc2626 !important;
            }
            
            /* CRITICAL: Maintain flex layout for image + info section */
            .batch-report-root .print-product-section {
              display: flex !important;
              flex-direction: row !important;
              align-items: stretch !important;
              gap: 0 !important;
              border: 2px solid #000 !important;
              page-break-inside: avoid !important;
              margin-bottom: 20px !important;
            }
            
            /* Left side: Image column - FIXED WIDTH */
            .batch-report-root .print-image-column {
              width: 33.333% !important;
              min-width: 33.333% !important;
              max-width: 33.333% !important;
              flex-shrink: 0 !important;
              border-right: 2px solid #000 !important;
              display: flex !important;
              flex-direction: column !important;
              overflow: hidden !important;
            }
            
            .batch-report-root .batch-image-container {
              display: flex !important;
              flex-direction: column !important;
              height: 400px !important;
              min-height: 400px !important;
              max-height: 400px !important;
              width: 100% !important;
            }
            
            .batch-report-root .batch-image-container img {
              width: 100% !important;
              height: 100% !important;
              object-fit: contain !important;
              max-height: 360px !important;
            }
            
            /* Right side: Info column - STACK VERTICALLY */
            .batch-report-root .batch-right-col {
              width: 66.667% !important;
              flex: 1 !important;
              display: flex !important;
              flex-direction: column !important;
              overflow: visible !important;
            }
            
            /* Info sections stacked vertically with borders */
            .batch-report-root .batch-info-section {
              border-bottom: 2px solid #000 !important;
              padding: 12px !important;
            }
            
            .batch-report-root .batch-info-section:last-child {
              border-bottom: none !important;
            }
            
            /* Product info grid layout for better structure */
            .batch-report-root .batch-info-section .product-info-grid {
              display: grid !important;
              grid-template-columns: 1fr 1fr !important;
              gap: 8px 16px !important;
            }
            
            .batch-report-root .batch-info-section .product-info-grid > div {
              display: flex !important;
            }
            
            /* Size configuration - more compact */
            .batch-report-root .size-config-section {
              margin-bottom: 15px !important;
            }
            
            .batch-report-root .size-config-section h2 {
              margin-bottom: 8px !important;
              padding-bottom: 6px !important;
            }
            
            .batch-report-root .size-config-section table th,
            .batch-report-root .size-config-section table td {
              padding: 6px 8px !important;
              font-size: 10pt !important;
            }
            
            /* Tables */
            .batch-report-root table {
              page-break-inside: avoid !important;
              border-collapse: collapse !important;
              width: 100% !important;
              border: 2px solid #000 !important;
            }
            
            .batch-report-root table th,
            .batch-report-root table td {
              border: 1px solid #000 !important;
              padding: 8px !important;
              text-align: left !important;
            }
            
            .batch-report-root table thead tr {
              background-color: #f3f4f6 !important;
              border-bottom: 2px solid #000 !important;
            }
            
            .batch-report-root table th {
              font-weight: bold !important;
            }
            
            /* Page breaks */
            .batch-report-root .print-no-break {
              page-break-inside: avoid !important;
            }
            
            /* Hide elements not needed in print */
            .batch-report-root .no-print {
              display: none !important;
            }
            
            /* Spacing consistency */
            .batch-report-root .mb-8,
            .batch-report-root .mb-6 {
              margin-bottom: 20px !important;
            }
            
            .batch-report-root .mb-3 {
              margin-bottom: 10px !important;
            }
            
            .batch-report-root .pb-4,
            .batch-report-root .pb-2 {
              padding-bottom: 8px !important;
            }
            
            /* Font sizes for print */
            .batch-report-root .text-4xl {
              font-size: 24pt !important;
            }
            
            .batch-report-root .text-xl {
              font-size: 14pt !important;
            }
            
            .batch-report-root .text-sm {
              font-size: 10pt !important;
            }
            
            .batch-report-root .text-xs {
              font-size: 9pt !important;
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
        <div className="mb-8 border-2 border-black print-no-break print-product-section">
          <div className="flex items-stretch gap-0">
            {/* Left: Product Image - Fixed Width */}
            <div className="w-1/3 border-r-2 border-black print-image-column">
              {productImages.length > 0 ? (
                <div className="h-[400px] flex flex-col batch-image-container" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                  <div className="text-center py-2 text-xs font-bold border-b-2 border-black bg-black text-white">PRODUIT</div>
                  <img
                    src={productImages[0]}
                    alt={batch.nom_product}
                    className="w-full flex-1 object-contain"
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
                <div className="h-[400px] flex flex-col batch-image-container" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                  <div className="text-center py-2 text-xs font-bold border-b-2 border-black bg-black text-white">PRODUIT</div>
                  <div className="flex-1 flex items-center justify-center text-xs">
                    Aucune image
                  </div>
                </div>
              )}
            </div>

            {/* Right: Product Information - Takes remaining space */}
            <div className="w-2/3 flex flex-col batch-right-col">
              {/* Product Info Section */}
              <div className="border-b-2 border-black p-4 batch-info-section">
                <h2 className="text-sm font-bold mb-3 pb-1 border-b border-black">INFORMATIONS PRODUIT</h2>
                <div className="product-info-grid text-xs">
                  <div>
                    <span className="font-bold mr-2">Nom:</span>
                    <span className="font-bold">{batch.nom_product}</span>
                  </div>
                  <div>
                    <span className="font-bold mr-2">Référence:</span>
                    <span>{batch.reference_product}</span>
                  </div>
                  <div>
                    <span className="font-bold mr-2">Boutique:</span>
                    <span>{companyName}</span>
                  </div>
                  <div>
                    <span className="font-bold mr-2">Statut:</span>
                    <span>{getStatusLabel(batch.status)}</span>
                  </div>
                  <div>
                    <span className="font-bold mr-2">Quantité:</span>
                    <span className="font-bold">{batch.quantity_to_produce} unités</span>
                  </div>
                  <div>
                    <span className="font-bold mr-2">Coût matériaux:</span>
                    <span className="font-bold">{Number(batch.total_materials_cost || 0).toFixed(2)} TND</span>
                  </div>
                </div>
              </div>

              {/* Production Dates Section */}
              <div className="border-b-2 border-black p-4 batch-info-section">
                <h2 className="text-sm font-bold mb-3 pb-1 border-b border-black">DATES DE PRODUCTION</h2>
                <div className="product-info-grid text-xs">
                  <div>
                    <span className="font-bold mr-2">Création:</span>
                    <span>{formatDate(batch.created_at)}</span>
                  </div>
                  <div>
                    <span className="font-bold mr-2">Démarrage:</span>
                    <span>{formatDate(batch.started_at)}</span>
                  </div>
                  <div>
                    <span className="font-bold mr-2">Fin:</span>
                    <span>{formatDate(batch.completed_at) !== 'Non spécifiée' ? formatDate(batch.completed_at) : '-'}</span>
                  </div>
                  <div>
                    <span className="font-bold mr-2">Démarré par:</span>
                    <span>{batch.started_by_name || 'Admin Production'}</span>
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
                       <div className="flex-1 p-4 batch-info-section">
                         <h2 className="text-sm font-bold mb-3 pb-1 border-b border-black">SPÉCIFICATIONS</h2>
                         <div className="space-y-1.5 text-xs">
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
          <div className="mb-6 print-no-break size-config-section">
            <h2 className="text-xl font-bold border-b-2 border-black pb-2 mb-3">CONFIGURATION DES TAILLES</h2>
              <div className="border-2 border-black">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-black bg-gray-100">
                    <th className="text-left p-2 border-r border-black font-bold">TAILLE</th>
                    <th className="text-left p-2 font-bold">QUANTITÉ</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedSizes.map((size, index) => (
                    <tr key={index} className={index !== parsedSizes.length - 1 ? "border-b border-black" : ""}>
                      <td className="p-2 border-r border-black font-semibold">{size.size_name}</td>
                      <td className="p-2 font-medium">{size.quantity} unités</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 border-t-2 border-black">
                    <td className="p-2 border-r border-black font-bold">TOTAL</td>
                    <td className="p-2 font-bold text-blue-600">{parsedSizes.reduce((sum, size) => sum + size.quantity, 0)} unités</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Materials Used */}
        {batch.materials_used && batch.materials_used.length > 0 && (
          <div className="mb-6 print-no-break">
            <h2 className="text-xl font-bold border-b-2 border-black pb-2 mb-3">MATÉRIAUX UTILISÉS</h2>
            <div className="border-2 border-black">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-black bg-gray-100">
                    <th className="text-left p-3 border-r border-black font-bold">MATÉRIAU</th>
                    <th className="text-left p-3 border-r border-black font-bold">COULEUR</th>
                    <th className="text-left p-3 border-r border-black font-bold">RÉPARTITION</th>
                    <th className="text-left p-3 border-r border-black font-bold">TOTAL</th>
                    <th className="text-left p-3 border-r border-black font-bold">UNITÉ</th>
                    <th className="text-left p-3 font-bold">COMMENTAIRE</th>
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
                          <td className="p-3 border-r border-black font-semibold">{material.nom_matiere}</td>
                          <td className="p-3 border-r border-black font-medium">{material.couleur || 'N/A'}</td>
                          <td className="p-3 border-r border-black">
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
                          <td className="p-3 border-r border-black font-bold text-blue-600">
                            {material.quantity_used} {material.quantity_unit}
                          </td>
                          <td className="p-3 border-r border-black text-center font-medium">
                            {material.quantity_type_name}
                          </td>
                          <td className="p-3 text-xs">
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
              <span className="text-base font-bold">Coût Total Matériaux: <span className="text-red-600">{Number(batch.total_materials_cost || 0).toFixed(2)} TND</span></span>
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
