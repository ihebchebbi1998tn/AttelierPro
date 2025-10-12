import React, { forwardRef } from 'react';
import { Badge } from "@/components/ui/badge";

interface ProductReportProps {
  product: any;
  configuredMaterials: any[];
  configuredSizes: any;
  sizeConfigured: boolean;
  measurementScale?: {
    measurement_types: string[];
    measurements_data: { [measurementType: string]: { [size: string]: number } };
    tolerance_data: { [measurementType: string]: number };
  };
}

const ProductReport = forwardRef<HTMLDivElement, ProductReportProps>(
  ({ product, configuredMaterials, configuredSizes, sizeConfigured, measurementScale }, ref) => {
    const getAvailableSizes = (): string[] => {
      const sizes: string[] = [];
      
      Object.keys(configuredSizes).forEach(sizeType => {
        if (Array.isArray(configuredSizes[sizeType])) {
          configuredSizes[sizeType].forEach((sizeItem: any) => {
            if (sizeItem.is_active === '1' || sizeItem.is_active === 1) {
              sizes.push(sizeItem.size_value);
            }
          });
        }
      });
      
      return sizes.sort((a, b) => {
        const aIsNumeric = !isNaN(Number(a));
        const bIsNumeric = !isNaN(Number(b));
        
        if (aIsNumeric && bIsNumeric) {
          return Number(a) - Number(b);
        } else if (!aIsNumeric && !bIsNumeric) {
          const order = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'];
          const aIndex = order.indexOf(a.toUpperCase());
          const bIndex = order.indexOf(b.toUpperCase());
          if (aIndex !== -1 && bIndex !== -1) {
            return aIndex - bIndex;
          }
          return a.localeCompare(b);
        } else {
          return aIsNumeric ? 1 : -1;
        }
      });
    };

    const availableSizes = getAvailableSizes();

    return (
      <div ref={ref} className="bg-white text-black p-8 font-mono text-sm leading-tight">
        {/* Header */}
        <div className="text-center border-b-2 border-black pb-4 mb-6">
          <h1 className="text-2xl font-bold mb-2">RAPPORT DE PRODUIT</h1>
          <div className="text-sm">
            <div>Référence: {product.reference_product}</div>
            <div>Date: {new Date().toLocaleDateString('fr-FR')}</div>
          </div>
        </div>

        {/* Product Information */}
        <div className="mb-6">
          <h2 className="text-lg font-bold border-b border-black pb-1 mb-3">INFORMATIONS GÉNÉRALES</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="mb-2"><strong>Nom du produit:</strong> {product.nom_product}</div>
              <div className="mb-2"><strong>Type:</strong> {product.type_product || 'Non spécifié'}</div>
              <div className="mb-2"><strong>Catégorie:</strong> {product.category_product || 'Non spécifiée'}</div>
              <div className="mb-2"><strong>Couleur:</strong> {product.color_product || 'Non spécifiée'}</div>
            </div>
            <div>
              <div className="mb-2"><strong>Prix:</strong> {product.price_product} TND</div>
              <div className="mb-2"><strong>Stock:</strong> {product.qnty_product} pièces</div>
              <div className="mb-2"><strong>Statut:</strong> {product.status_product === 'active' ? 'Actif' : 'Inactif'}</div>
              <div className="mb-2"><strong>Boutique:</strong> {product.boutique_origin === 'luccibyey' ? 'Lucci By Ey' : 'Spada di Battaglia'}</div>
            </div>
          </div>
        </div>

        {/* Materials Configuration */}
        <div className="mb-6">
          <h2 className="text-lg font-bold border-b border-black pb-1 mb-3">CONFIGURATION MATÉRIAUX</h2>
          <div className="mb-2">
            <strong>Statut:</strong> {(product.materials_configured == 1 || product.materials_configured === "1") ? 'Configurés' : 'Non configurés'}
          </div>
          
          {configuredMaterials.length > 0 && (
            <div className="border border-black">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-black bg-gray-100">
                    <th className="text-left p-2 border-r border-black">MATÉRIAU</th>
                    <th className="text-left p-2 border-r border-black">COULEUR</th>
                    <th className="text-left p-2 border-r border-black">QUANTITÉ REQUISE</th>
                    <th className="text-left p-2 border-r border-black">STOCK DISPONIBLE</th>
                    <th className="text-left p-2">TAILLES</th>
                  </tr>
                </thead>
                <tbody>
                  {configuredMaterials.map((material, index) => {
                    const totalQuantityNeeded = material.sizes.reduce((total, size) => total + parseFloat(size.quantity), 0);
                    return (
                      <tr key={index} className="border-b border-black">
                        <td className="p-2 border-r border-black">{material.material_name}</td>
                        <td className="p-2 border-r border-black">{material.color || 'N/A'}</td>
                        <td className="p-2 border-r border-black">{totalQuantityNeeded.toFixed(1)} {material.quantity_unit}</td>
                        <td className="p-2 border-r border-black">{material.material_stock} {material.quantity_unit}</td>
                        <td className="p-2">
                          {material.sizes.map((size, sizeIndex) => (
                            <span key={sizeIndex} className="inline-block mr-2">
                              {size.size ? `${size.size.toUpperCase()}: ${size.quantity}${size.unit}` : `Sans taille: ${size.quantity}${size.unit}`}
                            </span>
                          ))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Sizes Configuration */}
        <div className="mb-6">
          <h2 className="text-lg font-bold border-b border-black pb-1 mb-3">CONFIGURATION TAILLES</h2>
          <div className="mb-2">
            <strong>Statut:</strong> {sizeConfigured ? 'Configurées' : 'Non configurées'}
          </div>
          
          {sizeConfigured && Object.keys(configuredSizes).length === 0 && (
            <div className="p-2 bg-gray-100 border border-black">
              <strong>Type:</strong> Sans tailles spécifiques
            </div>
          )}

          {availableSizes.length > 0 && (
            <div className="border border-black mb-4">
              <div className="bg-gray-100 p-2 border-b border-black">
                <strong>TAILLES DISPONIBLES</strong>
              </div>
              <div className="p-2">
                <div className="grid grid-cols-8 gap-2">
                  {availableSizes.map((size, index) => (
                    <div key={index} className="border border-gray-300 p-1 text-center text-xs">
                      {size}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Measurement Scale Table - Only show if configured */}
          {measurementScale && 
           measurementScale.measurement_types && 
           measurementScale.measurement_types.length > 0 && 
           availableSizes.length > 0 && 
           measurementScale.measurements_data && 
           Object.keys(measurementScale.measurements_data).length > 0 && (
            <div className="border border-black">
              <div className="bg-gray-100 p-2 border-b border-black">
                <strong>BARÈME DE MESURE</strong>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-black bg-gray-50">
                    <th className="text-left p-2 border-r border-black text-xs">TYPE DE MESURE</th>
                    <th className="text-center p-2 border-r border-black text-xs">+/-</th>
                    {availableSizes.map(size => (
                      <th key={size} className="text-center p-2 border-r border-black text-xs">
                        {size}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {measurementScale.measurement_types.map((measurementType, index) => (
                    <tr key={index} className="border-b border-black">
                      <td className="p-2 border-r border-black text-xs font-medium">{measurementType}</td>
                      <td className="p-2 border-r border-black text-center text-xs">
                        {measurementScale.tolerance_data?.[measurementType] || '0'}
                      </td>
                      {availableSizes.map(size => (
                        <td key={size} className="p-2 border-r border-black text-center text-xs">
                          {measurementScale.measurements_data?.[measurementType]?.[size] || '0'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Stock Details */}
        <div className="mb-6">
          <h2 className="text-lg font-bold border-b border-black pb-1 mb-3">DÉTAILS STOCK</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="mb-2"><strong>Stock total:</strong> {product.qnty_product} pièces</div>
              <div className="mb-2"><strong>Réapprovisionnement auto:</strong> {product.auto_replenishment ? 'Activé' : 'Désactivé'}</div>
              {product.auto_replenishment && (
                <div className="mb-2"><strong>Quantité réappro:</strong> {product.auto_replenishment_quantity} pièces</div>
              )}
            </div>
            <div>
              {product.sizes_data && (() => {
                try {
                  const stockData = JSON.parse(product.sizes_data || '{}');
                  const sizeEntries = Object.entries(stockData).filter(([_, quantity]) => parseInt(quantity as string) > 0);
                  
                  if (sizeEntries.length > 0) {
                    return (
                      <div>
                        <strong>Stock par taille:</strong>
                        <div className="mt-1">
                          {sizeEntries.map(([size, quantity], index) => (
                            <div key={index} className="text-xs">
                              {size}: {quantity as string} pcs
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                } catch (e) {
                  return null;
                }
                return null;
              })()}
            </div>
          </div>
        </div>

        {/* Production Specifications */}
        {product.production_specifications && 
         product.production_specifications !== 'null' && 
         product.production_specifications !== '{}' && (() => {
           try {
             const specs = typeof product.production_specifications === 'string' 
               ? JSON.parse(product.production_specifications) 
               : product.production_specifications;
             
             if (specs && Object.keys(specs).length > 0) {
               return (
                 <div className="mb-6">
                   <h2 className="text-lg font-bold border-b border-black pb-1 mb-3">SPÉCIFICATIONS DE PRODUCTION</h2>
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
                             <td className="p-2">{value as string}</td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   </div>
                 </div>
               );
             }
           } catch (e) {
             console.error('Error parsing production specifications:', e);
           }
           return null;
         })()}

        {/* Description */}
        {product.description_product && (
          <div className="mb-6">
            <h2 className="text-lg font-bold border-b border-black pb-1 mb-3">DESCRIPTION</h2>
            <div className="border border-black p-2 bg-gray-50">
              <div dangerouslySetInnerHTML={{ __html: product.description_product }} />
            </div>
          </div>
        )}

        {/* Technical Information */}
        <div className="mb-6">
          <h2 className="text-lg font-bold border-b border-black pb-1 mb-3">INFORMATIONS TECHNIQUES</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="mb-2"><strong>ID Produit:</strong> {product.id}</div>
              <div className="mb-2"><strong>ID Externe:</strong> {product.external_product_id}</div>
              <div className="mb-2"><strong>Groupe article:</strong> {product.itemgroup_product || 'N/A'}</div>
            </div>
            <div>
              <div className="mb-2"><strong>Date création:</strong> {new Date(product.createdate_product || product.created_at).toLocaleDateString('fr-FR')}</div>
              <div className="mb-2"><strong>Dernière sync:</strong> {new Date(product.sync_date).toLocaleDateString('fr-FR')}</div>
              <div className="mb-2"><strong>Collection:</strong> {product.collection_product || 'N/A'}</div>
            </div>
          </div>
        </div>

      </div>
    );
  }
);

ProductReport.displayName = 'ProductReport';

export default ProductReport;