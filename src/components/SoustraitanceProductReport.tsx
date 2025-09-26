import React, { forwardRef } from 'react';
import { Badge } from "@/components/ui/badge";

interface SoustraitanceProductReportProps {
  product: any;
  materials: any[];
  productFiles: any[];
}

const SoustraitanceProductReport = forwardRef<HTMLDivElement, SoustraitanceProductReportProps>(
  ({ product, materials, productFiles }, ref) => {
    const getConfiguredSizes = (product: any) => {
      const configuredSizes = [];
      
      // Clothing sizes
      const clothingSizes = ['xs', 's', 'm', 'l', 'xl', 'xxl', '3xl', '4xl'];
      clothingSizes.forEach(size => {
        const fieldName = `size_${size}`;
        if (product[fieldName] === '1') {
          configuredSizes.push(size.toUpperCase());
        }
      });
      
      // Numeric sizes (pants, shoes, belts)
      const numericSizes = ['30', '31', '32', '33', '34', '36', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48', '50', '52', '54', '56', '58', '60', '62', '64', '66', '85', '90', '95', '100', '105', '110', '115', '120', '125'];
      numericSizes.forEach(size => {
        const fieldName = `size_${size}`;
        if (product[fieldName] === '1') {
          configuredSizes.push(size);
        }
      });
      
      return configuredSizes.sort((a, b) => {
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

    const availableSizes = getConfiguredSizes(product);

    // Get product images
    const getProductImages = () => {
      const productImages = [];
      const imageFields = ['img_product', 'img2_product', 'img3_product', 'img4_product', 'img5_product'];
      
      imageFields.forEach(field => {
        const imagePath = product[field];
        if (imagePath) {
          // Use same URL construction as main product page
          const imageUrl = imagePath.startsWith('http') ? imagePath : `https://luccibyey.com.tn/production/api/${imagePath}`;
          console.log(`Product image URL for ${field}:`, imageUrl);
          productImages.push(imageUrl);
        }
      });
      
      return productImages;
    };

    // Get file images
    const getFileImages = () => {
      const fileImages = productFiles.filter(file => file.mime_type && file.mime_type.startsWith('image/'));
      console.log('File images found:', fileImages);
      fileImages.forEach(file => {
        console.log('File details:', {
          filename: file.filename,
          file_path: file.file_path, 
          full_url: file.full_url,
          mime_type: file.mime_type
        });
      });
      return fileImages;
    };

    const productImages = getProductImages();
    const fileImages = getFileImages();

    return (
      <div ref={ref} className="bg-white text-black p-8 font-mono text-sm leading-tight">
        {/* Header */}
        <div className="text-center border-b-2 border-black pb-4 mb-6">
          <h1 className="text-2xl font-bold mb-2">RAPPORT PRODUIT SOUS-TRAITANCE</h1>
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
              <div className="mb-2"><strong>Client:</strong> {product.client_name}</div>
              <div className="mb-2"><strong>Type:</strong> {product.type_product || 'Non spécifié'}</div>
              <div className="mb-2"><strong>Catégorie:</strong> {product.category_product || 'Non spécifiée'}</div>
              <div className="mb-2"><strong>Couleur:</strong> {product.color_product || 'Non spécifiée'}</div>
            </div>
            <div>
              {product.price_product > 0 && (
                <div className="mb-2"><strong>Prix:</strong> {product.price_product} TND</div>
              )}
              <div className="mb-2"><strong>Quantité:</strong> {product.qnty_product} pièces</div>
              <div className="mb-2"><strong>Statut:</strong> {product.status_product === 'active' ? 'Actif' : 'Inactif'}</div>
              <div className="mb-2"><strong>Date création:</strong> {new Date(product.created_at).toLocaleDateString('fr-FR')}</div>
            </div>
          </div>
        </div>

        {/* Client Information */}
        <div className="mb-6">
          <h2 className="text-lg font-bold border-b border-black pb-1 mb-3">INFORMATIONS CLIENT</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="mb-2"><strong>Nom du client:</strong> {product.client_name}</div>
              <div className="mb-2"><strong>ID Client:</strong> {product.client_id}</div>
            </div>
            <div>
              {product.client_email && (
                <div className="mb-2"><strong>Email:</strong> {product.client_email}</div>
              )}
              {product.client_phone && (
                <div className="mb-2"><strong>Téléphone:</strong> {product.client_phone}</div>
              )}
            </div>
          </div>
        </div>

        {/* Materials Configuration */}
        <div className="mb-6">
          <h2 className="text-lg font-bold border-b border-black pb-1 mb-3">MATÉRIAUX CONFIGURÉS</h2>
          <div className="mb-2">
            <strong>Nombre de matériaux:</strong> {materials.length}
          </div>
          
          {materials.length > 0 && (
            <div className="border border-black">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-black bg-gray-100">
                    <th className="text-left p-2 border-r border-black">MATÉRIAU</th>
                    <th className="text-left p-2 border-r border-black">RÉFÉRENCE</th>
                    <th className="text-left p-2 border-r border-black">QUANTITÉ REQUISE</th>
                    <th className="text-left p-2 border-r border-black">UNITÉ</th>
                    <th className="text-left p-2">TAILLE</th>
                  </tr>
                </thead>
                <tbody>
                  {materials.map((material, index) => (
                    <tr key={index} className="border-b border-black">
                      <td className="p-2 border-r border-black">{material.material_name || 'N/A'}</td>
                      <td className="p-2 border-r border-black">{material.material_reference || 'N/A'}</td>
                      <td className="p-2 border-r border-black">{material.quantity_needed || '0'}</td>
                      <td className="p-2 border-r border-black">{material.quantity_type_name || 'N/A'}</td>
                      <td className="p-2">{material.size_specific || 'Sans taille'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Sizes Configuration */}
        <div className="mb-6">
          <h2 className="text-lg font-bold border-b border-black pb-1 mb-3">CONFIGURATION TAILLES</h2>
          <div className="mb-2">
            <strong>Statut:</strong> {availableSizes.length > 0 ? 'Configurées' : 'Non configurées'}
          </div>
          
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
        </div>

        {/* Files and Documents */}
        <div className="mb-6">
          <h2 className="text-lg font-bold border-b border-black pb-1 mb-3">FICHIERS ET DOCUMENTS</h2>
          <div className="mb-2">
            <strong>Nombre de fichiers:</strong> {productFiles.length}
          </div>
          
          {productFiles.length > 0 && (
            <div className="border border-black">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-black bg-gray-100">
                    <th className="text-left p-2 border-r border-black">NOM FICHIER</th>
                    <th className="text-left p-2 border-r border-black">TYPE</th>
                    <th className="text-left p-2 border-r border-black">TAILLE</th>
                    <th className="text-left p-2">DATE UPLOAD</th>
                  </tr>
                </thead>
                <tbody>
                  {productFiles.map((file, index) => (
                    <tr key={index} className="border-b border-black">
                      <td className="p-2 border-r border-black">{file.original_filename || file.filename}</td>
                      <td className="p-2 border-r border-black">{file.file_type?.toUpperCase() || 'N/A'}</td>
                      <td className="p-2 border-r border-black">
                        {file.file_size ? `${(file.file_size / 1024).toFixed(1)} KB` : 'N/A'}
                      </td>
                      <td className="p-2">
                        {file.upload_date ? new Date(file.upload_date).toLocaleDateString('fr-FR') : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Description */}
        {product.description_product && (
          <div className="mb-6">
            <h2 className="text-lg font-bold border-b border-black pb-1 mb-3">DESCRIPTION</h2>
            <div className="border border-black p-2 bg-gray-50">
              <div dangerouslySetInnerHTML={{ __html: product.description_product }} />
            </div>
          </div>
        )}

        {/* Page break before images and files */}
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
                              alt={`${product.nom_product} - Image ${imageNumber}`}
                              className="w-full h-full object-cover rounded-sm"
                              style={{ 
                                minHeight: '90%', 
                                minWidth: '90%', 
                                maxHeight: '95%', 
                                maxWidth: '95%',
                                printColorAdjust: 'exact',
                                WebkitPrintColorAdjust: 'exact',
                                visibility: 'visible',
                                opacity: 1
                              }}
                              onLoad={() => console.log('Image loaded for print:', imageUrl)}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                console.error('Image failed to load:', imageUrl);
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

        {/* Files Images - Last Pages */}
        {fileImages.length > 0 && (
          <div className={productImages.length > 0 ? "print:break-before-page mb-6" : "mb-6"}>
            <h2 className="text-lg font-bold border-b border-black pb-1 mb-3">IMAGES FICHIERS</h2>
            {(() => {
              const imageChunks = [];
              for (let i = 0; i < fileImages.length; i += 4) {
                imageChunks.push(fileImages.slice(i, i + 4));
              }
              
              return imageChunks.map((chunk, chunkIndex) => (
                <div key={chunkIndex} className={chunkIndex > 0 ? "print:break-before-page image-grid" : "image-grid"}>
                  <div className="grid grid-cols-2 gap-2 mb-4 image-grid-page">
                  {chunk.map((file, index) => {
                    const imageNumber = chunkIndex * 4 + index + 1;
                    // Use the full_url directly from API response
                    let imageUrl = file.full_url;
                    console.log(`File image URL ${imageNumber}:`, imageUrl, 'from file:', file);
                    return (
                        <div key={index} className="border border-black p-1">
                          <div className="text-center mb-1 text-xs font-bold">
                            Fichier {imageNumber}: {file.original_filename}
                          </div>
                          <div className="image-card">
                             <img
                               src={imageUrl}
                               alt={file.original_filename || `Fichier ${imageNumber}`}
                               className="w-full h-full object-cover rounded-sm"
                               style={{ 
                                 minHeight: '90%', 
                                 minWidth: '90%', 
                                 maxHeight: '95%', 
                                 maxWidth: '95%',
                                 printColorAdjust: 'exact',
                                 WebkitPrintColorAdjust: 'exact',
                                 visibility: 'visible',
                                 opacity: 1
                               }}
                               onLoad={() => console.log('File image loaded for print:', imageUrl)}
                               onError={(e) => {
                                 const target = e.target as HTMLImageElement;
                                 console.error('File image failed to load:', imageUrl);
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

        {/* Technical Information */}
        <div className="mb-6">
          <h2 className="text-lg font-bold border-b border-black pb-1 mb-3">INFORMATIONS TECHNIQUES</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="mb-2"><strong>ID Produit:</strong> {product.id}</div>
              <div className="mb-2"><strong>ID Client:</strong> {product.client_id}</div>
              <div className="mb-2"><strong>Référence produit:</strong> {product.reference_product}</div>
            </div>
            <div>
              <div className="mb-2"><strong>Date création:</strong> {new Date(product.created_at).toLocaleDateString('fr-FR')}</div>
              <div className="mb-2"><strong>Type sous-traitance:</strong> Externe</div>
              <div className="mb-2"><strong>Statut produit:</strong> {product.status_product}</div>
            </div>
          </div>
        </div>

      </div>
    );
  }
);

SoustraitanceProductReport.displayName = 'SoustraitanceProductReport';

export default SoustraitanceProductReport;