import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Printer, User, Phone, Mail, MapPin, Calendar, Package } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { SurMesureOrder } from '@/pages/Commandes';
import { SurMesureMaterial, getSurMesureMaterials, getSurMesureMediaUrl } from '@/utils/surMesureService';

interface SurMesureReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: SurMesureOrder;
}

const statusLabels = {
  new: 'Nouveau',
  in_progress: 'En cours',
  ready_for_pickup: 'Prêt pour essai',
  first_try: 'Premier essai',
  needs_revision: 'Révision nécessaire',
  ready_for_second_try: 'Prêt 2ème essai',
  completed: 'Terminé'
};

export const SurMesureReportModal: React.FC<SurMesureReportModalProps> = ({
  isOpen,
  onClose,
  order
}) => {
  const [optionsFinitions, setOptionsFinitions] = useState<any[]>([]);
  const [materials, setMaterials] = useState<SurMesureMaterial[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (isOpen && order.id) {
        try {
          // Fetch options & finitions
          const { getOptionsFinitions } = await import('@/utils/surMesureService');
          const options = await getOptionsFinitions(order.id);
          setOptionsFinitions(options);

          // Fetch materials
          const materialsData = await getSurMesureMaterials(order.id);
          setMaterials(materialsData);
        } catch (error) {
          console.error('Failed to fetch data:', error);
          setOptionsFinitions([]);
          setMaterials([]);
        }
      }
    };

    fetchData();
  }, [isOpen, order.id]);

  const handlePrint = () => {
    // Generate complete report HTML with auto-print script
    const reportHTML = generateReportHTML();
    
    // Create blob and URL
    const blob = new Blob([reportHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    // Open in new window/tab
    window.open(url, '_blank');
    
    // Clean up the URL after some time
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 15000);
  };

  const generateReportHTML = () => {
    const currentDate = format(new Date(), "dd/MM/yyyy 'à' HH:mm", { locale: fr });
    
    return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rapport Commande Sur Mesure #${order.id}</title>
    <style>
        @page {
            size: A4;
            margin: 0.75in 0.5in;
        }
        
        * {
            box-sizing: border-box;
        }
        
        body {
            font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
            font-size: 10pt;
            line-height: 1.3;
            color: black;
            background: white;
            margin: 0;
            padding: 1rem;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        
        table {
            border-collapse: collapse;
            width: 100%;
            margin-bottom: 1rem;
        }
        
        th, td {
            border: 1px solid black;
            padding: 4px 6px;
            font-size: 9pt;
            line-height: 1.2;
        }
        
        th {
            background-color: #f3f4f6;
            font-weight: bold;
        }
        
        tr:nth-child(even) {
            background-color: #f9fafb;
        }
        
        h1 {
            font-size: 18pt;
            font-weight: bold;
            margin: 0 0 0.5rem 0;
            text-align: center;
        }
        
        h2 {
            font-size: 12pt;
            font-weight: bold;
            border-bottom: 1px solid black;
            padding-bottom: 3px;
            margin: 1rem 0 0.5rem 0;
        }
        
        h3 {
            font-size: 10pt;
            font-weight: bold;
            margin: 0.5rem 0 0.25rem 0;
        }
        
        p {
            margin: 0.25rem 0;
            font-size: 9pt;
        }
        
        .grid-cols-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2rem;
        }
        
        .border-b-2 {
            border-bottom: 2px solid black;
        }
        
        .border-2 {
            border: 2px solid black;
        }
        
        .text-center { text-align: center; }
        .text-left { text-align: left; }
        .font-bold { font-weight: bold; }
        .font-semibold { font-weight: 600; }
        
        .page-break {
            page-break-before: always;
        }
        
        .no-break {
            page-break-inside: avoid;
        }
        
        .mb-8 { margin-bottom: 2rem; }
        .mb-4 { margin-bottom: 1rem; }
        .mb-3 { margin-bottom: 0.75rem; }
        .mb-2 { margin-bottom: 0.5rem; }
        .mt-3 { margin-top: 0.75rem; }
        .mt-2 { margin-top: 0.5rem; }
        .mt-1 { margin-top: 0.25rem; }
        .pb-6 { padding-bottom: 1.5rem; }
        .pb-3 { padding-bottom: 0.75rem; }
        .pb-2 { padding-bottom: 0.5rem; }
        .pt-6 { padding-top: 1.5rem; }
        .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
        .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
        .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
        .p-4 { padding: 1rem; }
        .space-y-2 > * + * { margin-top: 0.5rem; }
        .space-y-4 > * + * { margin-top: 1rem; }
        .gap-4 { gap: 1rem; }
        .text-xs { font-size: 8pt; }
        .text-sm { font-size: 9pt; }
        .text-base { font-size: 10pt; }
        .text-lg { font-size: 12pt; }
        .text-3xl { font-size: 18pt; }
        .tracking-wider { letter-spacing: 0.05em; }
        
        .bg-gray-50 { background-color: #f9fafb; }
        .bg-gray-200 { background-color: #e5e7eb; }
        .bg-white { background-color: white; }
        .text-gray-600 { color: #4b5563; }
        .border-gray-200 { border-color: #e5e7eb; }
        .border-gray-300 { border-color: #d1d5db; }
        .border-black { border-color: black; }
        
        .flex { display: flex; }
        .justify-between { justify-content: space-between; }
        .items-center { align-items: center; }
        
        @media print {
            body { margin: 0 !important; padding: 0 !important; }
            .page-break { page-break-before: always; }
            .no-break { page-break-inside: avoid; }
        }
    </style>
    <script>
        window.addEventListener('load', function() {
            setTimeout(function() {
                window.print();
            }, 500);
        });
        
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(function() {
                window.print();
            }, 800);
        });
    </script>
</head>
<body>
    <!-- Header -->
    <div class="text-center border-b-2 pb-6 mb-8 no-break">
        <h1 class="text-3xl font-bold tracking-wider">LUCCY BY E.Y</h1>
        <p class="text-lg mt-2 font-semibold">RAPPORT DE COMMANDE SUR MESURE</p>
        <p class="text-base mt-3 font-bold">COMMANDE N° ${order.id}</p>
        <p class="text-sm mt-2">
            Date d'émission: ${currentDate}
        </p>
    </div>

    <!-- Order & Client Information Side by Side -->
    <div class="grid-cols-2 mb-8 no-break">
        <!-- Order Information -->
        <div>
            <h2 class="text-lg font-bold border-b pb-2 mb-4">DÉTAILS COMMANDE</h2>
            <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                    <span class="font-semibold">ID:</span>
                    <span>#${order.id}</span>
                </div>
                <div class="flex justify-between">
                    <span class="font-semibold">Statut:</span>
                    <span class="font-bold">${statusLabels[order.status]}</span>
                </div>
                <div class="flex justify-between">
                    <span class="font-semibold">Produit:</span>
                    <span>${order.product_name}</span>
                </div>
                <div class="flex justify-between">
                    <span class="font-semibold">Créé le:</span>
                    <span>${format(new Date(order.created_at), "dd/MM/yyyy", { locale: fr })}</span>
                </div>
                ${order.ready_date ? `
                <div class="flex justify-between">
                    <span class="font-semibold">Doit être livré le:</span>
                    <span>${format(new Date(order.ready_date), "dd/MM/yyyy", { locale: fr })}</span>
                </div>
                ` : ''}
            </div>
        </div>

        <!-- Client Information -->
        <div>
            <h2 class="text-lg font-bold border-b pb-2 mb-4">INFORMATIONS CLIENT</h2>
            <div class="space-y-2 text-sm">
                <div>
                    <span class="font-semibold">Nom:</span>
                    <p>${order.client_name} ${order.client_vorname}</p>
                </div>
                <div>
                    <span class="font-semibold">Email:</span>
                    <p>${order.client_email}</p>
                </div>
                <div>
                    <span class="font-semibold">Téléphone:</span>
                    <p>${order.client_phone}</p>
                </div>
                <div>
                    <span class="font-semibold">Adresse:</span>
                    <p>${order.client_address}</p>
                    <p>${order.client_region}</p>
                </div>
            </div>
        </div>
    </div>

    ${order.measurements && Object.keys(order.measurements).length > 0 ? `
    <!-- Measurements Table -->
    <div class="mb-8 no-break">
        <h2 class="text-lg font-bold border-b pb-2 mb-4">MESURES ET TOLÉRANCES</h2>
        <table class="border-2 text-sm">
            <thead>
                <tr class="bg-gray-200">
                    <th class="px-3 py-2 text-left font-bold">MESURE</th>
                    <th class="px-3 py-2 text-center font-bold">VALEUR (cm)</th>
                    <th class="px-3 py-2 text-center font-bold">TOLÉRANCE (cm)</th>
                </tr>
            </thead>
            <tbody>
                ${Object.entries(order.measurements).map(([name, value], index) => `
                <tr class="${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}">
                    <td class="px-3 py-2 font-semibold">${name}</td>
                    <td class="px-3 py-2 text-center">${value}</td>
                    <td class="px-3 py-2 text-center">${order.tolerance?.[name] || 0.5}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    ` : ''}

    ${optionsFinitions && optionsFinitions.length > 0 ? `
    <!-- Options & Finitions Table -->
    <div class="mb-8 page-break">
        <h2 class="text-lg font-bold border-b pb-2 mb-4">OPTIONS & FINITIONS</h2>
        <table class="border-2 text-sm">
            <thead>
                <tr class="bg-gray-200">
                    <th class="px-3 py-2 text-left font-bold">TITRE</th>
                    <th class="px-3 py-2 text-left font-bold">DESCRIPTION</th>
                    <th class="px-3 py-2 text-center font-bold">IMAGE</th>
                    <th class="px-3 py-2 text-center font-bold">DATE CRÉATION</th>
                </tr>
            </thead>
            <tbody>
                ${optionsFinitions.map((option, index) => `
                <tr class="${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}">
                    <td class="px-3 py-2 font-semibold">${option.title}</td>
                    <td class="px-3 py-2">${option.description || '-'}</td>
                    <td class="px-3 py-2 text-center">${option.image_url ? 'OUI' : 'NON'}</td>
                    <td class="px-3 py-2 text-center">${format(new Date(option.created_date), "dd/MM/yyyy", { locale: fr })}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    ` : ''}

    ${materials && materials.length > 0 ? `
    <!-- Materials Table -->
    <div class="mb-8 page-break">
        <h2 class="text-lg font-bold border-b pb-2 mb-4">MATÉRIAUX REQUIS</h2>
        <table class="border-2 text-sm">
            <thead>
                <tr class="bg-gray-200">
                    <th class="px-3 py-2 text-left font-bold">MATÉRIAU</th>
                    <th class="px-3 py-2 text-left font-bold">CATÉGORIE</th>
                    <th class="px-3 py-2 text-center font-bold">COULEUR</th>
                    <th class="px-3 py-2 text-center font-bold">QUANTITÉ</th>
                    <th class="px-3 py-2 text-left font-bold">COMMENTAIRE</th>
                </tr>
            </thead>
            <tbody>
                ${materials.map((material, index) => `
                <tr class="${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}">
                    <td class="px-3 py-2">
                        <div class="font-semibold">${material.material_name}</div>
                        ${material.material_description ? `<div class="text-xs text-gray-600 mt-1">${material.material_description}</div>` : ''}
                    </td>
                    <td class="px-3 py-2">${material.category_name || '-'}</td>
                    <td class="px-3 py-2 text-center">${material.material_color || '-'}</td>
                    <td class="px-3 py-2 text-center font-semibold">${material.quantity_needed} ${material.quantity_unit}</td>
                    <td class="px-3 py-2">${material.commentaire || '-'}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    ` : ''}

    <!-- Combined Try Dates and Comments Section -->
    <div class="mb-8 page-break">
        <h2 class="text-lg font-bold border-b pb-2 mb-4">PLANNING DES ESSAYAGES ET COMMENTAIRES</h2>
        
        <!-- Fitting Schedule Table -->
        <table class="border-2 text-sm mb-4">
            <thead>
                <tr class="bg-gray-200">
                    <th class="px-3 py-2 text-left font-bold">ESSAI</th>
                    <th class="px-3 py-2 text-center font-bold">DATE PRÉVUE</th>
                    <th class="px-3 py-2 text-center font-bold">HEURE</th>
                    <th class="px-3 py-2 text-center font-bold">DATE RÉALISÉE</th>
                    <th class="px-3 py-2 text-center font-bold">STATUT</th>
                </tr>
            </thead>
            <tbody>
                ${order.first_try_date ? `
                <tr class="bg-gray-50">
                    <td class="px-3 py-2 font-semibold">1er ESSAI</td>
                    <td class="px-3 py-2 text-center">${format(new Date(order.first_try_date), "dd/MM/yyyy", { locale: fr })}</td>
                    <td class="px-3 py-2 text-center">${order.first_try_scheduled_time || '-'}</td>
                    <td class="px-3 py-2 text-center">${order.first_try_completed_at ? format(new Date(order.first_try_completed_at), "dd/MM/yyyy", { locale: fr }) : '-'}</td>
                    <td class="px-3 py-2 text-center font-bold">${order.first_try_completed_at ? 'RÉALISÉ' : 'PRÉVU'}</td>
                </tr>
                ` : ''}
                ${order.second_try_date ? `
                <tr class="bg-white">
                    <td class="px-3 py-2 font-semibold">2ème ESSAI</td>
                    <td class="px-3 py-2 text-center">${format(new Date(order.second_try_date), "dd/MM/yyyy", { locale: fr })}</td>
                    <td class="px-3 py-2 text-center">${order.second_try_scheduled_time || '-'}</td>
                    <td class="px-3 py-2 text-center">${order.second_try_completed_at ? format(new Date(order.second_try_completed_at), "dd/MM/yyyy", { locale: fr }) : '-'}</td>
                    <td class="px-3 py-2 text-center font-bold">${order.second_try_completed_at ? 'RÉALISÉ' : 'PRÉVU'}</td>
                </tr>
                ` : ''}
                ${order.third_try_date ? `
                <tr class="bg-gray-50">
                    <td class="px-3 py-2 font-semibold">3ème ESSAI</td>
                    <td class="px-3 py-2 text-center">${format(new Date(order.third_try_date), "dd/MM/yyyy", { locale: fr })}</td>
                    <td class="px-3 py-2 text-center">${order.third_try_scheduled_time || '-'}</td>
                    <td class="px-3 py-2 text-center">${order.third_try_completed_at ? format(new Date(order.third_try_completed_at), "dd/MM/yyyy", { locale: fr }) : '-'}</td>
                    <td class="px-3 py-2 text-center font-bold">${order.third_try_completed_at ? 'RÉALISÉ' : 'PRÉVU'}</td>
                </tr>
                ` : ''}
            </tbody>
        </table>

        ${order.commentaires && order.commentaires.length > 0 ? `
        <!-- Comments Section -->
        <div>
            <h3 class="text-base font-bold mb-3">COMMENTAIRES ET OBSERVATIONS</h3>
            <div class="border-2 p-4 space-y-4 text-sm">
                ${order.commentaires.map((comment, index) => `
                <div class="border-b border-gray-300 pb-3" style="${index === order.commentaires.length - 1 ? 'border-bottom: none;' : ''}">
                    <div class="flex justify-between items-center mb-1">
                        <span class="font-bold">${comment.created_by}</span>
                        <span class="text-xs">${format(new Date(comment.date_creation), "dd/MM/yyyy 'à' HH:mm", { locale: fr })}</span>
                    </div>
                    <p class="text-black">${comment.commentaire}</p>
                </div>
                `).join('')}
            </div>
        </div>
        ` : ''}
    </div>

     ${order.images && order.images.length > 0 ? (() => {
       // Group images into chunks of 4
       const imageChunks = [];
       for (let i = 0; i < order.images.length; i += 4) {
         imageChunks.push(order.images.slice(i, i + 4));
       }
       
       return imageChunks.map((chunk, chunkIndex) => `
       <div class="mb-8 ${chunkIndex > 0 ? 'images-page-break' : ''}">
           <h2 class="text-lg font-bold border-b pb-2 mb-4">MÉDIAS ASSOCIÉS ${chunkIndex > 0 ? `(Page ${chunkIndex + 1})` : ''}</h2>
           <div class="border-2 p-4">
               <h3 class="font-bold mb-4 text-center">IMAGES (${order.images.length} au total)</h3>
               <div class="images-grid">
                   ${chunk.map((image, index) => {
                     const imageNumber = chunkIndex * 4 + index + 1;
                     const imageUrl = getSurMesureMediaUrl(image.path);
                     return `
                   <div class="image-item">
                       <div class="image-container">
                           <div class="font-semibold mb-2">Image ${imageNumber}</div>
                           <img src="${imageUrl}" 
                                alt="Image ${imageNumber}" 
                                style="max-width: 300px; max-height: 250px; width: auto; height: auto; display: block; margin: 0 auto; border: 1px solid #ccc; object-fit: contain;"
                                onload="console.log('Print image loaded:', this.src)"
                                onerror="console.error('Print image failed to load:', this.src); this.style.display='none';" />
                       </div>
                       <div class="image-comment">${image.commentaire || 'Sans commentaire'}</div>
                   </div>
                   `;
                   }).join('')}
               </div>
           </div>
       </div>
       `).join('');
     })() : ''}

    <!-- Footer -->
    <div class="border-t-2 pt-6 mt-8 no-break">
        <div class="text-center text-sm">
            <p class="font-bold">LUCCY BY E.Y - SYSTÈME DE GESTION SUR MESURE</p>
            <p class="mt-2">Rapport généré automatiquement le ${currentDate}</p>
            <p class="mt-1 text-xs">Ce document est confidentiel et destiné uniquement à un usage interne</p>
        </div>
    </div>
</body>
</html>`;
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto print:max-w-none print:max-h-none print:overflow-visible">
          <DialogHeader className="print:hidden">
            <DialogTitle className="flex items-center justify-between">
              <span>Rapport de Commande Sur Mesure #{order.id}</span>
              <Button onClick={handlePrint} className="flex items-center gap-2">
                <Printer className="h-4 w-4" />
                Imprimer
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="report-content bg-white text-black p-8 font-mono">
            {/* Header */}
            <div className="text-center border-b-2 border-black pb-6 mb-8 no-break">
              <h1 className="text-3xl font-bold tracking-wider">LUCCY BY E.Y</h1>
              <p className="text-lg mt-2 font-semibold">RAPPORT DE COMMANDE SUR MESURE</p>
              <p className="text-base mt-3 font-bold">COMMANDE N° {order.id}</p>
              <p className="text-sm mt-2">
                Date d'émission: {format(new Date(), "dd/MM/yyyy 'à' HH:mm", { locale: fr })}
              </p>
            </div>

            {/* Order & Client Information Side by Side */}
            <div className="grid grid-cols-2 gap-8 mb-8 no-break">
              {/* Order Information */}
              <div>
                <h2 className="text-lg font-bold border-b border-black pb-2 mb-4">DÉTAILS COMMANDE</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-semibold">ID:</span>
                    <span>#{order.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Statut:</span>
                    <span className="font-bold">{statusLabels[order.status]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Produit:</span>
                    <span>{order.product_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Créé le:</span>
                    <span>{format(new Date(order.created_at), "dd/MM/yyyy", { locale: fr })}</span>
                  </div>
                  {order.ready_date && (
                     <div className="flex justify-between">
                       <span className="font-semibold">Doit être livré le:</span>
                       <span>{format(new Date(order.ready_date), "dd/MM/yyyy", { locale: fr })}</span>
                     </div>
                  )}
                </div>
              </div>

              {/* Client Information */}
              <div>
                <h2 className="text-lg font-bold border-b border-black pb-2 mb-4">INFORMATIONS CLIENT</h2>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-semibold">Nom:</span>
                    <p>{order.client_name} {order.client_vorname}</p>
                  </div>
                  <div>
                    <span className="font-semibold">Email:</span>
                    <p>{order.client_email}</p>
                  </div>
                  <div>
                    <span className="font-semibold">Téléphone:</span>
                    <p>{order.client_phone}</p>
                  </div>
                  <div>
                    <span className="font-semibold">Adresse:</span>
                    <p>{order.client_address}</p>
                    <p>{order.client_region}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Measurements Table - On same page as order info */}
            {order.measurements && Object.keys(order.measurements).length > 0 && (
              <div className="mb-8 no-break">
                <h2 className="text-lg font-bold border-b border-black pb-2 mb-4">MESURES ET TOLÉRANCES</h2>
                <table className="w-full border-2 border-black text-sm">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="border border-black px-3 py-2 text-left font-bold">MESURE</th>
                      <th className="border border-black px-3 py-2 text-center font-bold">VALEUR (cm)</th>
                      <th className="border border-black px-3 py-2 text-center font-bold">TOLÉRANCE (cm)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(order.measurements).map(([name, value], index) => (
                      <tr key={name} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        <td className="border border-black px-3 py-2 font-semibold">{name}</td>
                        <td className="border border-black px-3 py-2 text-center">{value}</td>
                        <td className="border border-black px-3 py-2 text-center">
                          {order.tolerance?.[name] || 0.5}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Options & Finitions Table */}
            {optionsFinitions && optionsFinitions.length > 0 && (
              <div className="mb-8 page-break">
                <h2 className="text-lg font-bold border-b border-black pb-2 mb-4">OPTIONS & FINITIONS</h2>
                <table className="w-full border-2 border-black text-sm">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="border border-black px-3 py-2 text-left font-bold">TITRE</th>
                      <th className="border border-black px-3 py-2 text-left font-bold">DESCRIPTION</th>
                      <th className="border border-black px-3 py-2 text-center font-bold">IMAGE</th>
                      <th className="border border-black px-3 py-2 text-center font-bold">DATE CRÉATION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {optionsFinitions.map((option, index) => (
                      <tr key={option.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        <td className="border border-black px-3 py-2 font-semibold">{option.title}</td>
                        <td className="border border-black px-3 py-2">{option.description || '-'}</td>
                        <td className="border border-black px-3 py-2 text-center">
                          {option.image_url ? 'OUI' : 'NON'}
                        </td>
                        <td className="border border-black px-3 py-2 text-center">
                          {format(new Date(option.created_date), "dd/MM/yyyy", { locale: fr })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Materials Table */}
            {materials && materials.length > 0 && (
              <div className="mb-8 page-break">
                <h2 className="text-lg font-bold border-b border-black pb-2 mb-4">MATÉRIAUX REQUIS</h2>
                <table className="w-full border-2 border-black text-sm">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="border border-black px-3 py-2 text-left font-bold">MATÉRIAU</th>
                      <th className="border border-black px-3 py-2 text-left font-bold">CATÉGORIE</th>
                      <th className="border border-black px-3 py-2 text-center font-bold">COULEUR</th>
                      <th className="border border-black px-3 py-2 text-center font-bold">QUANTITÉ</th>
                      <th className="border border-black px-3 py-2 text-left font-bold">COMMENTAIRE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materials.map((material, index) => (
                      <tr key={material.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        <td className="border border-black px-3 py-2">
                          <div className="font-semibold">{material.material_name}</div>
                          {material.material_description && (
                            <div className="text-xs text-gray-600 mt-1">{material.material_description}</div>
                          )}
                        </td>
                        <td className="border border-black px-3 py-2">
                          {material.category_name || '-'}
                        </td>
                        <td className="border border-black px-3 py-2 text-center">
                          {material.material_color || '-'}
                        </td>
                        <td className="border border-black px-3 py-2 text-center font-semibold">
                          {material.quantity_needed} {material.quantity_unit}
                        </td>
                        <td className="border border-black px-3 py-2">
                          {material.commentaire || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Combined Try Dates and Comments Section */}
            <div className="mb-8 page-break">
              <h2 className="text-lg font-bold border-b border-black pb-2 mb-4">PLANNING DES ESSAYAGES ET COMMENTAIRES</h2>
              
              {/* Fitting Schedule Table */}
              <table className="w-full border-2 border-black text-sm mb-4">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border border-black px-3 py-2 text-left font-bold">ESSAI</th>
                    <th className="border border-black px-3 py-2 text-center font-bold">DATE PRÉVUE</th>
                    <th className="border border-black px-3 py-2 text-center font-bold">HEURE</th>
                    <th className="border border-black px-3 py-2 text-center font-bold">DATE RÉALISÉE</th>
                    <th className="border border-black px-3 py-2 text-center font-bold">STATUT</th>
                  </tr>
                </thead>
                <tbody>
                  {order.first_try_date && (
                    <tr className="bg-gray-50">
                      <td className="border border-black px-3 py-2 font-semibold">1er ESSAI</td>
                      <td className="border border-black px-3 py-2 text-center">
                        {format(new Date(order.first_try_date), "dd/MM/yyyy", { locale: fr })}
                      </td>
                      <td className="border border-black px-3 py-2 text-center">
                        {order.first_try_scheduled_time || '-'}
                      </td>
                      <td className="border border-black px-3 py-2 text-center">
                        {order.first_try_completed_at ? format(new Date(order.first_try_completed_at), "dd/MM/yyyy", { locale: fr }) : '-'}
                      </td>
                      <td className="border border-black px-3 py-2 text-center font-bold">
                        {order.first_try_completed_at ? 'RÉALISÉ' : 'PRÉVU'}
                      </td>
                    </tr>
                  )}
                  {order.second_try_date && (
                    <tr className="bg-white">
                      <td className="border border-black px-3 py-2 font-semibold">2ème ESSAI</td>
                      <td className="border border-black px-3 py-2 text-center">
                        {format(new Date(order.second_try_date), "dd/MM/yyyy", { locale: fr })}
                      </td>
                      <td className="border border-black px-3 py-2 text-center">
                        {order.second_try_scheduled_time || '-'}
                      </td>
                      <td className="border border-black px-3 py-2 text-center">
                        {order.second_try_completed_at ? format(new Date(order.second_try_completed_at), "dd/MM/yyyy", { locale: fr }) : '-'}
                      </td>
                      <td className="border border-black px-3 py-2 text-center font-bold">
                        {order.second_try_completed_at ? 'RÉALISÉ' : 'PRÉVU'}
                      </td>
                    </tr>
                  )}
                  {order.third_try_date && (
                    <tr className="bg-gray-50">
                      <td className="border border-black px-3 py-2 font-semibold">3ème ESSAI</td>
                      <td className="border border-black px-3 py-2 text-center">
                        {format(new Date(order.third_try_date), "dd/MM/yyyy", { locale: fr })}
                      </td>
                      <td className="border border-black px-3 py-2 text-center">
                        {order.third_try_scheduled_time || '-'}
                      </td>
                      <td className="border border-black px-3 py-2 text-center">
                        {order.third_try_completed_at ? format(new Date(order.third_try_completed_at), "dd/MM/yyyy", { locale: fr }) : '-'}
                      </td>
                      <td className="border border-black px-3 py-2 text-center font-bold">
                        {order.third_try_completed_at ? 'RÉALISÉ' : 'PRÉVU'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Comments Section */}
              {order.commentaires && order.commentaires.length > 0 && (
                <div>
                  <h3 className="text-base font-bold mb-3">COMMENTAIRES ET OBSERVATIONS</h3>
                  <div className="border-2 border-black p-4 space-y-4 text-sm">
                    {order.commentaires.map((comment, index) => (
                      <div key={index} className="border-b border-gray-300 pb-3 last:border-b-0">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold">{comment.created_by}</span>
                          <span className="text-xs">
                            {format(new Date(comment.date_creation), "dd/MM/yyyy 'à' HH:mm", { locale: fr })}
                          </span>
                        </div>
                        <p className="text-black">{comment.commentaire}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Images Display - Print Friendly */}
            {order.images && order.images.length > 0 && (
              <>
                {/* Add print-specific CSS styles */}
                <style>{`
                  @media print {
                    .image-grid {
                      break-inside: avoid !important;
                      page-break-inside: avoid !important;
                    }
                    .image-grid-page {
                      display: grid !important;
                      grid-template-columns: 1fr 1fr !important;
                      gap: 6mm !important;
                    }
                    .image-card {
                      height: 110mm !important;
                      max-height: 110mm !important;
                      width: 100% !important;
                      border: 1px solid #000 !important;
                      background: #fbfcfd !important;
                      display: flex !important;
                      align-items: center !important;
                      justify-content: center !important;
                      padding: 3mm !important;
                    }
                    .image-card img {
                      max-width: 95% !important;
                      max-height: 95% !important;
                      width: auto !important;
                      height: auto !important;
                      object-fit: contain !important;
                      min-height: 85mm !important;
                      display: block !important;
                      visibility: visible !important;
                      opacity: 1 !important;
                      -webkit-print-color-adjust: exact !important;
                      color-adjust: exact !important;
                    }
                  }
                `}</style>
                <div className="mb-6">
                  <h2 className="text-lg font-bold border-b border-black pb-1 mb-3">IMAGES ASSOCIÉES</h2>
                  {(() => {
                    const imageChunks = [];
                    for (let i = 0; i < order.images.length; i += 4) {
                      imageChunks.push(order.images.slice(i, i + 4));
                    }
                    
                    return imageChunks.map((chunk, chunkIndex) => (
                      <div key={chunkIndex} className={chunkIndex > 0 ? "print:break-before-page image-grid" : "image-grid"}>
                        <div className="grid grid-cols-2 gap-2 mb-4 image-grid-page">
                          {chunk.map((image, index) => {
                            const imageNumber = chunkIndex * 4 + index + 1;
                            const imageUrl = getSurMesureMediaUrl(image.path);
                            console.log('Rendering image:', imageNumber, 'URL:', imageUrl);
                            return (
                              <div key={index} className="border border-black p-1">
                                <div className="text-center mb-1 text-xs font-bold">
                                  Image {imageNumber}
                                </div>
                                <div className="image-card">
                                  <img
                                    src={imageUrl}
                                    alt={`Image ${imageNumber}`}
                                    className="w-full h-full object-cover rounded-sm"
                                    style={{ 
                                      minHeight: '90%', 
                                      minWidth: '90%', 
                                      maxHeight: '95%', 
                                      maxWidth: '95%',
                                      printColorAdjust: 'exact',
                                      WebkitPrintColorAdjust: 'exact'
                                    }}
                                    onLoad={() => {
                                      console.log('✅ Image loaded successfully:', imageUrl);
                                    }}
                                    onError={(e) => {
                                      console.error('❌ Image failed to load:', imageUrl);
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                      const parent = target.parentElement;
                                      if (parent) {
                                        parent.innerHTML = '<div class="text-xs text-gray-500 text-center">Image non disponible</div>';
                                      }
                                    }}
                                  />
                                </div>
                                {image.commentaire && (
                                  <div className="text-xs text-center mt-1 text-gray-600">
                                    {image.commentaire}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          {/* Fill empty slots if less than 4 images in chunk */}
                          {chunk.length < 4 && Array.from({ length: 4 - chunk.length }).map((_, emptyIndex) => (
                            <div key={`empty-${emptyIndex}`} className="border border-gray-300 border-dashed p-1">
                              <div className="text-center mb-1 text-xs text-gray-400">
                                Emplacement libre
                              </div>
                              <div className="image-card bg-gray-50 flex items-center justify-center">
                                <span className="text-gray-400 text-xs">Pas d'image</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </>
            )}

            {/* Videos Summary (if any) */}
            {order.videos && order.videos.length > 0 && (
              <div className="mb-8 page-break">
                <h2 className="text-lg font-bold border-b border-black pb-2 mb-4">VIDÉOS ASSOCIÉES</h2>
                <div className="border-2 border-black p-4 text-sm">
                  <div className="grid grid-cols-1 gap-2">
                    {order.videos.map((video, index) => (
                      <div key={index} className="flex justify-between py-2 border-b border-gray-200 last:border-b-0">
                        <span className="font-medium">Vidéo {index + 1}</span>
                        <span className="text-xs">{video.commentaire || 'Sans commentaire'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="border-t-2 border-black pt-6 mt-8 no-break">
              <div className="text-center text-sm">
                <p className="font-bold">LUCCY BY E.Y - SYSTÈME DE GESTION SUR MESURE</p>
                <p className="mt-2">Rapport généré automatiquement le {format(new Date(), "dd/MM/yyyy 'à' HH:mm", { locale: fr })}</p>
                <p className="mt-1 text-xs">Ce document est confidentiel et destiné uniquement à un usage interne</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};