import { useState, useEffect } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, 
  Package, 
  Clock, 
  CheckCircle, 
  Truck, 
  Store, 
  Calendar,
  User,
  DollarSign,
  BarChart3,
  AlertTriangle,
  FileText,
  Target,
  TrendingUp,
  MapPin,
  Weight,
  Timer,
  X,
  Undo,
  ArrowRight,
  Image as ImageIcon,
  Paperclip,
  Download,
  FileOutput,
  MessageSquare,
  Plus,
  Edit,
  Trash2,
  Send,
  AlertCircle
} from 'lucide-react';
import { getProductImageUrl, getProductImages } from "@/utils/imageUtils";
import BatchReport from '@/components/BatchReport';
import BatchImageUpload from '@/components/BatchImageUpload';
import BatchAttachmentUpload from '@/components/BatchAttachmentUpload';
import { BatchLeftoversView } from '@/components/BatchLeftoversView';
import { authService } from '@/lib/authService';

// Helper function to parse sizes breakdown
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

interface BatchMaterial {
  id: number;
  material_id: number;
  nom_matiere: string;
  quantity_used: number;
  quantity_filled?: number | null;
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
  product_type?: string;  // Added for soustraitance support
  client_id?: number;     // Added for soustraitance client navigation
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

const BatchDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [batch, setBatch] = useState<ProductionBatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [showStatusConfirmModal, setShowStatusConfirmModal] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showFinalCancelConfirm, setShowFinalCancelConfirm] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [productAttachments, setProductAttachments] = useState<any[]>([]);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [soustraitanceProductImages, setSoustraitanceProductImages] = useState<string[]>([]);
  const [batchImages, setBatchImages] = useState<any[]>([]);
  const [batchAttachments, setBatchAttachments] = useState<any[]>([]);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<string | null>(null);
  const [showTransactionsModal, setShowTransactionsModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [measurementScale, setMeasurementScale] = useState<any>(null);
  const [statusHistory, setStatusHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // Batch notes state
  const [batchNotes, setBatchNotes] = useState<any[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editingNoteText, setEditingNoteText] = useState('');
  
  // Materials quantities state
  const [materialsQuantities, setMaterialsQuantities] = useState<Record<number, number>>({});
  const [savingQuantities, setSavingQuantities] = useState(false);
  const [quantitiesSaved, setQuantitiesSaved] = useState(false); // Track if quantities have been saved
  const [showSaveQuantitiesModal, setShowSaveQuantitiesModal] = useState(false);
  const [showLeftoversSection, setShowLeftoversSection] = useState(false);
  const [leftovers, setLeftovers] = useState<{[key: string]: { quantity: number, reusable: boolean, notes: string }}>({});
  const [savedLeftovers, setSavedLeftovers] = useState<any[]>([]);
  const [materialStocks, setMaterialStocks] = useState<{[key: number]: number}>({});
  const [stockWarnings, setStockWarnings] = useState<{[key: number]: boolean}>({});

  useEffect(() => {
    if (id) {
      fetchBatchDetails(parseInt(id));
      fetchBatchCompleteReport(id);
      fetchSavedLeftovers();
      // Images and attachments are now fetched within fetchBatchDetails
      
      // Mark batch as seen when viewing details
      const markAsSeen = async () => {
        try {
          await fetch('https://luccibyey.com.tn/production/api/mark_batch_as_seen.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ batchId: parseInt(id) }),
          });
        } catch (error) {
          console.error('Error marking batch as seen:', error);
        }
      };
      
      markAsSeen();
    }
  }, [id]);

  // Separate function for PDF export with exact formatting
  const handleExportPDF = async () => {
    if (!batch) return;
    
    setIsGeneratingPDF(true);
    
    try {
      const reportContent = document.getElementById('batch-report-content');
      if (!reportContent) {
        throw new Error('Report content not found');
      }
      
      // Clone the content to avoid modifying the original - same as print version
      const clonedContent = reportContent.cloneNode(true) as HTMLElement;
      
      // Get all computed styles and apply them inline to preserve formatting
      const originalElements = reportContent.querySelectorAll('*');
      const clonedElements = clonedContent.querySelectorAll('*');
      
      for (let i = 0; i < originalElements.length; i++) {
        const originalElement = originalElements[i] as HTMLElement;
        const clonedElement = clonedElements[i] as HTMLElement;
        
        if (originalElement && clonedElement) {
          const computedStyle = window.getComputedStyle(originalElement);
          
          // Apply essential styles
          clonedElement.style.fontSize = computedStyle.fontSize;
          clonedElement.style.fontFamily = computedStyle.fontFamily;
          clonedElement.style.fontWeight = computedStyle.fontWeight;
          clonedElement.style.color = computedStyle.color;
          clonedElement.style.backgroundColor = computedStyle.backgroundColor;
          clonedElement.style.border = computedStyle.border;
          clonedElement.style.borderCollapse = computedStyle.borderCollapse;
          clonedElement.style.padding = computedStyle.padding;
          clonedElement.style.margin = computedStyle.margin;
          clonedElement.style.textAlign = computedStyle.textAlign;
          clonedElement.style.width = computedStyle.width;
        }
      }
      
      // Create a temporary container with the same styles as print version
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = '800px'; // Fixed width for consistency
      tempContainer.style.background = 'white';
      tempContainer.style.padding = '30px 20px 20px 20px';
      tempContainer.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif';
      tempContainer.style.fontSize = '14px';
      tempContainer.style.lineHeight = '1.4';
      tempContainer.style.color = '#000';
      
      // Apply the same CSS as print version
      const style = document.createElement('style');
      style.textContent = `
        * { 
          color: #000 !important;
          background-color: white !important;
        }
        
        table {
          width: 100% !important;
          border-collapse: collapse !important;
          border-spacing: 0 !important;
          font-size: 12px !important;
          margin-bottom: 16px !important;
          margin-top: 10px !important;
        }
        
        td {
          border: 1px solid #000 !important;
          padding: 6px 8px !important;
          text-align: left !important;
          vertical-align: top !important;
          background: white !important;
        }
        
        th {
          background-color: #f0f0f0 !important;
          font-weight: bold !important;
          color: #000 !important;
          border: none !important;
          border-bottom: 2px solid #000 !important;
          padding: 6px 8px !important;
          text-align: left !important;
          vertical-align: top !important;
        }
        
        h1, h2, h3 { 
          color: #000 !important; 
          font-weight: bold !important;
        }
        
        h1 { 
          font-size: 24px !important; 
          text-align: center !important; 
          margin-bottom: 20px !important; 
          border-bottom: 2px solid #000 !important;
          padding-bottom: 8px !important;
        }
        
        h2 { 
          font-size: 16px !important; 
          border-bottom: 1px solid #000 !important; 
          padding-bottom: 4px !important; 
          margin: 20px 0 12px 0 !important; 
        }
        
        .border, .border-black {
          border: 1px solid #000 !important;
        }
        
        .bg-gray-100, .bg-gray-50 {
          background-color: #f0f0f0 !important;
        }
        
        strong, .font-bold {
          font-weight: bold !important;
          color: #000 !important;
        }
        
        .text-center {
          text-align: center !important;
        }
        
        div, span, p {
          color: #000 !important;
        }
      `;
      
      tempContainer.appendChild(style);
      tempContainer.appendChild(clonedContent);
      document.body.appendChild(tempContainer);
      
      // Wait a bit for styles to apply
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Create canvas from the HTML content with high quality
      const canvas = await html2canvas(tempContainer, {
        scale: 1.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: tempContainer.scrollWidth,
        height: tempContainer.scrollHeight,
        scrollX: 0,
        scrollY: 0
      });
      
      // Clean up
      document.body.removeChild(tempContainer);
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Get PDF dimensions
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate image dimensions in mm (convert from pixels)
      const imgWidthMM = (canvas.width * 25.4) / (96 * 1.5); // Convert pixels to mm (96 DPI, scale 1.5)
      const imgHeightMM = (canvas.height * 25.4) / (96 * 1.5);
      
      // Calculate how to fit the image to page width
      const scale = Math.min(pdfWidth / imgWidthMM, 1); // Don't scale up, only down if needed
      const scaledWidth = imgWidthMM * scale;
      const scaledHeight = imgHeightMM * scale;
      
      // Center the image horizontally
      const xOffset = (pdfWidth - scaledWidth) / 2;
      
      // If content fits on one page
      if (scaledHeight <= pdfHeight) {
        pdf.addImage(imgData, 'PNG', xOffset, 0, scaledWidth, scaledHeight);
      } else {
        // Content needs multiple pages
        const pageCount = Math.ceil(scaledHeight / pdfHeight);
        
        for (let i = 0; i < pageCount; i++) {
          if (i > 0) {
            pdf.addPage();
          }
          
          // Calculate the portion of the image for this page
          const sourceY = (i * pdfHeight / scaledHeight) * canvas.height;
          const sourceHeight = Math.min((pdfHeight / scaledHeight) * canvas.height, canvas.height - sourceY);
          
          // Create a temporary canvas for this page slice
          const tempCanvas = document.createElement('canvas');
          const tempCtx = tempCanvas.getContext('2d');
          tempCanvas.width = canvas.width;
          tempCanvas.height = sourceHeight;
          
          if (tempCtx) {
            // Fill with white background
            tempCtx.fillStyle = '#ffffff';
            tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
            
            // Draw the slice of the original image
            const img = new Image();
            img.onload = () => {
              tempCtx.drawImage(img, 0, sourceY, canvas.width, sourceHeight, 0, 0, canvas.width, sourceHeight);
              
              const pageImgData = tempCanvas.toDataURL('image/png');
              const pageHeight = Math.min(pdfHeight, scaledHeight - (i * pdfHeight));
              
              pdf.addImage(pageImgData, 'PNG', xOffset, 0, scaledWidth, pageHeight);
              
              // If this is the last page, save the PDF
              if (i === pageCount - 1) {
                const fileName = `Rapport_Batch_${batch.batch_reference}_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.pdf`;
                pdf.save(fileName);
                setIsGeneratingPDF(false);
              }
            };
            img.src = imgData;
          }
        }
        return; // Exit here for multi-page handling
      }
      
      // Single page - save the PDF
      const fileName = `Rapport_Batch_${batch.batch_reference}_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.pdf`;
      pdf.save(fileName);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la génération du PDF",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Updated print function - matches ProductReport styling exactly
  const handlePrintReport = () => {
    const reportElement = document.getElementById('batch-report-content');
    if (!reportElement) return;
    
    // Generate complete report HTML with auto-print script
    const reportHTML = generateBatchReportHTML(reportElement.innerHTML);
    
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

  const generateBatchReportHTML = (reportContent: string) => {
    // If the rendered reportContent is missing the materials table, append it explicitly
    let finalReportContent = reportContent;
    try {
      if (!/MAT.{0,20}ÉRIAUX\s+UTILIS[ÉE]S/i.test(reportContent) && batch && batch.materials_used && batch.materials_used.length > 0) {
        // Build materials HTML (same structure as BatchReport component)
        const grouped: any = {};
        (batch.materials_used || []).forEach((m: any) => {
          const key = `${m.nom_matiere}-${m.couleur || 'N/A'}`;
          if (!grouped[key]) grouped[key] = { ...m, quantity_used: Number(m.quantity_used) || 0 };
          else grouped[key].quantity_used += Number(m.quantity_used) || 0;
        });

        const sizesObj = (() => {
          try {
            return batch.sizes_breakdown ? JSON.parse(batch.sizes_breakdown) : {};
          } catch (e) {
            return {};
          }
        })();

        let materialsHtml = `\n<div class="mb-6">\n  <h2 class="text-lg font-bold border-b-2 border-black pb-1 mb-3">MATÉRIAUX UTILISÉS</h2>\n  <div class="border-2 border-black">\n    <table class="w-full text-xs">\n      <thead>\n        <tr class="border-b-2 border-black bg-gray-100">\n          <th class="text-left p-2 border-r border-black">MATÉRIAU</th>\n          <th class="text-left p-2 border-r border-black">COULEUR</th>\n          <th class="text-left p-2 border-r border-black">RÉPARTITION PAR TAILLE</th>\n          <th class="text-left p-2 border-r border-black">TOTAL</th>\n          <th class="text-left p-2 border-r border-black">UNITÉ</th>\n          <th class="text-left p-2">COMMENTAIRE</th>\n        </tr>\n      </thead>\n      <tbody>\n`;

        Object.values(grouped).forEach((material: any, idx: number) => {
          // compute size breakdown
          let sizeBreakdown: any = {};
          try {
            const parsedSizes: any = sizesObj || {};
            const totalQuantity = Number(material.quantity_used) || 0;
            const totalPieces = Object.values(parsedSizes).reduce((s: number, v: any) => s + Number(v || 0), 0) as number;
            if (totalPieces > 0) {
              Object.entries(parsedSizes).forEach(([size, pieces]) => {
                const numPieces = Number(pieces) || 0;
                if (numPieces > 0) {
                  const proportion = numPieces / totalPieces;
                  sizeBreakdown[size] = (totalQuantity * proportion).toFixed(1);
                }
              });
            }
          } catch (e) {
            sizeBreakdown = {};
          }

          materialsHtml += `        <tr class="${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}">\n` +
            `          <td class="p-2 border-r border-black font-medium">${material.nom_matiere}</td>\n` +
            `          <td class="p-2 border-r border-black">${material.couleur || 'N/A'}</td>\n` +
            `          <td class="p-2 border-r border-black">`;

          if (Object.keys(sizeBreakdown).length > 0) {
            materialsHtml += `<div class="flex flex-wrap gap-2">`;
            Object.entries(sizeBreakdown).forEach(([size, quantity]) => {
              materialsHtml += `<div class="bg-gray-100 px-2 py-1 rounded"><span class="font-medium">${size === 'none' ? 'Standard' : size.toUpperCase()}:</span> <span class="ml-1">${quantity} ${material.quantity_unit}</span></div>`;
            });
            materialsHtml += `</div>`;
          } else {
            materialsHtml += `<span class="text-gray-600 italic">Toutes tailles</span>`;
          }

          materialsHtml += `</td>\n` +
            `          <td class="p-2 border-r border-black font-bold">${material.quantity_used} ${material.quantity_unit}</td>\n` +
            `          <td class="p-2 border-r border-black text-center">${material.quantity_type_name || ''}</td>\n` +
            `          <td class="p-2">${material.commentaire || '-'}</td>\n` +
            `        </tr>\n`;
        });

        materialsHtml += `      </tbody>\n    </table>\n    <div class="mt-3 text-right"><span class="font-bold">Coût Total Matériaux: ${Number(batch.total_materials_cost || 0).toFixed(2)} TND</span></div>\n  </div>\n</div>\n`;

        // Append to final content
        finalReportContent = reportContent + materialsHtml;
      }
    } catch (e) {
      console.error('Error appending materials to print report:', e);
      finalReportContent = reportContent;
    }

    return `<!DOCTYPE html>
<html lang="fr">
<head>
  <title>Rapport de Production - ${batch?.batch_reference}</title>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    /* Reset and base styles */
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    body {
      font-family: "Segoe UI", "Arial", "Helvetica", sans-serif;
      font-size: 13px;
      line-height: 1.4;
      color: #000 !important;
      background: white !important;
      padding: 18px;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    /* Print-specific styles */
    @media print {
      body {
        padding: 12px;
        margin: 0;
      }
      @page {
        margin: 0.8cm;
        size: A4;
      }
    }
    
    /* Typography */
    h1 {
      font-size: 22px;
      font-weight: 700;
      text-align: center;
      margin-bottom: 8px;
      letter-spacing: 1px;
    }
    
    h2 {
      font-size: 16px;
      font-weight: 700;
      border-bottom: 2px solid #000;
      padding-bottom: 4px;
      margin-bottom: 10px;
      margin-top: 18px;
      letter-spacing: 0.5px;
    }
    
    /* Header section */
    .text-center {
      text-align: center;
    }
    
    .border-b-2 {
      border-bottom: 1.5px solid #000;
    }
    
    .pb-4 {
      padding-bottom: 12px;
    }
    
    .mb-6 {
      margin-bottom: 18px;
    }
    
    .mb-2 {
      margin-bottom: 6px;
    }
    
    .mb-3 {
      margin-bottom: 8px;
    }
    
    /* Grid layouts */
    .grid {
      display: grid;
    }
    
    .grid-cols-2 {
      grid-template-columns: 1fr 1fr;
    }
    
    .grid-cols-8 {
      grid-template-columns: repeat(8, 1fr);
    }
    
    .gap-2 {
      gap: 6px;
    }
    
    .gap-4 {
      gap: 12px;
    }
    
    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      border: 1.5px solid #000;
      margin-bottom: 12px;
      font-size: 11px;
    }
    
    th, td {
      border: 1px solid #000;
      padding: 6px 7px;
      text-align: left;
      vertical-align: top;
    }
    
    th {
      background-color: #f8f9fa !important;
      font-weight: 600;
      font-size: 11px;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    .bg-gray-100 {
      background-color: #f8f9fa !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    .bg-gray-50 {
      background-color: #fbfcfd !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    .bg-white {
      background-color: #ffffff !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    /* Borders */
    .border {
      border: 1px solid #000;
    }
    
    .border-black {
      border-color: #000;
    }
    
    .border-b {
      border-bottom: 1px solid #000;
    }
    
    .border-r {
      border-right: 1px solid #000;
    }
    
    .border-gray-300 {
      border: 1px solid #d1d5db;
    }
    
    /* Padding and margins */
    .p-1 {
      padding: 3px;
    }
    
    .p-2 {
      padding: 6px;
    }
    
    .p-8 {
      padding: 24px;
    }
    
    .pb-1 {
      padding-bottom: 3px;
    }
    
    /* Text styles */
    .text-xs {
      font-size: 10px;
    }
    
    .text-sm {
      font-size: 12px;
    }
    
    .text-base {
      font-size: 13px;
    }
    
    .text-lg {
      font-size: 16px;
    }
    
    .text-xl {
      font-size: 18px;
    }
    
    .text-2xl {
      font-size: 22px;
    }
    
    .text-3xl {
      font-size: 24px;
    }
    
    .font-bold {
      font-weight: 600;
    }
    
    .font-medium {
      font-weight: 500;
    }
    
    .text-center {
      text-align: center;
    }
    
    .text-left {
      text-align: left;
    }
    
    /* Size boxes */
    .inline-block {
      display: inline-block;
    }
    
    .mr-2 {
      margin-right: 6px;
    }
    
    /* Page breaks */
    .break-inside-avoid {
      break-inside: avoid;
      page-break-inside: avoid;
    }
    
    /* Print page breaks - Critical for proper page layout */
    .print\\:break-before-page {
      page-break-before: always !important;
      break-before: page !important;
    }
    
    /* Ensure smaller content sections don't break awkwardly */
    table {
      break-inside: avoid;
      page-break-inside: avoid;
    }
    
    /* Remove break-inside avoid from large sections that might cause empty pages */
    .mb-6 {
      break-inside: auto;
      page-break-inside: auto;
    }
    
    /* Image grid and card for print */
    .image-grid {
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .image-grid-page {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6mm;
    }
    .image-card {
      height: 110mm !important;
      max-height: 110mm !important;
      width: 100%;
      border: 1px solid #000;
      background: #fbfcfd;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 3mm;
    }
    .image-card img {
      max-width: 95% !important;
      max-height: 95% !important;
      width: auto !important;
      height: auto !important;
      object-fit: contain !important;
      min-height: 85mm !important;
    }
    
    /* Ensure images don't create excessive white space */
    .h-20 {
      height: 60px !important;
      max-height: 60px !important;
    }
    
    /* Grid improvements for better print layout */
    .grid {
      break-inside: auto;
      page-break-inside: auto;
    }
    
    /* Utility fallbacks used in report */
    .flex{display:flex;}
    .items-center{align-items:center;}
    .justify-center{justify-content:center;}
    .max-w-full{max-width:100%;}
    .max-h-full{max-height:100%;}
    .object-contain{object-fit:contain;}
    
    /* Strong text */
    strong {
      font-weight: 600;
      font-size: 11px;
    }
    
    /* Measurement scale specific styles */
    .w-full {
      width: 100%;
    }
    
    /* Hide any unwanted elements during print */
    button, .cursor-pointer {
      display: none !important;
    }
    
    /* Ensure all content is visible */
    * {
      color: #000 !important;
    }
    
    /* Size grid styling */
    .grid-cols-8 > div {
      border: 1px solid #d1d5db;
      padding: 3px;
      text-align: center;
      font-size: 8px;
      min-height: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    /* Material table responsive text */
    .material-sizes span {
      display: inline-block;
      margin-right: 6px;
      font-size: 8px;
    }
    
    /* Ensure HTML content in description is properly styled */
    div[dangerouslySetInnerHTML] p {
      margin-bottom: 6px;
    }
    
    div[dangerouslySetInnerHTML] ul {
      margin-left: 16px;
      margin-bottom: 6px;
    }
    
    div[dangerouslySetInnerHTML] li {
      margin-bottom: 3px;
    }
    
    /* Additional BatchReport specific styles */
    .font-mono {
      font-family: "Segoe UI", "Arial", "Helvetica", sans-serif;
    }
    
    .leading-tight {
      line-height: 1.2;
    }
    
    /* Ensure proper spacing and layout */
    .mb-4 {
      margin-bottom: 12px;
    }
    
    .mt-1 {
      margin-top: 3px;
    }
    
    .mt-2 {
      margin-top: 6px;
    }
    
    /* Status badges and indicators */
    .badge {
      display: inline-block;
      padding: 2px 4px;
      border: 1px solid #000;
      font-size: 8px;
      font-weight: 500;
    }
    
    /* Ensure proper table cell alignment */
    td.text-center {
      text-align: center;
    }
    
    td.text-right {
      text-align: right;
    }
    
    /* Handle measurement scale tables */
    .measurement-table {
      font-size: 8px;
    }
    
    .measurement-table th,
    .measurement-table td {
      padding: 3px 4px;
      font-size: 8px;
      text-align: center;
    }
    
    .measurement-table th:first-child,
    .measurement-table td:first-child {
      text-align: left;
    }
    
    /* Professional spacing adjustments */
    .text-sm div {
      font-size: 9px;
      line-height: 1.2;
    }
    
    /* Compact layout for better space utilization */
    .grid-cols-2 > div {
      padding-right: 8px;
    }
    
    /* Professional header styling */
    .text-center .text-sm {
      font-size: 9px;
      color: #333;
      font-weight: 400;
    }
    
    /* Ensure consistent font sizing throughout */
    div {
      font-size: inherit;
    }
    
    /* Table header improvements */
    thead tr {
      background-color: #f8f9fa !important;
    }
    
    /* Subtle improvements for readability */
    table {
      font-variant-numeric: tabular-nums;
    }
    
    /* Color classes for highlighting important info */
    .text-blue-600 {
      color: #2563eb !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    .text-purple-600 {
      color: #9333ea !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    .text-green-600 {
      color: #16a34a !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    .text-red-600 {
      color: #dc2626 !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    .text-gray-700 {
      color: #374151 !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    .text-gray-600 {
      color: #4b5563 !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    /* Font weight utilities */
    .font-semibold {
      font-weight: 600;
    }
    
    .font-bold {
      font-weight: 700;
    }
    
    /* Blue specification box styling */
    .border-blue-600 {
      border: 2px solid #2563eb !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    .bg-blue-600 {
      background-color: #2563eb !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    .bg-blue-50 {
      background-color: #eff6ff !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    .text-white {
      color: #ffffff !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    .px-3 {
      padding-left: 8px;
      padding-right: 8px;
    }
    
    .py-2 {
      padding-top: 6px;
      padding-bottom: 6px;
    }
    
    .p-3 {
      padding: 8px;
    }
    
    .space-y-1 > * + * {
      margin-top: 3px;
    }
    
    /* Print-specific improvements for image and text layout */
    @media print {
      /* Force grid layout for image and info section */
      .grid-cols-3 {
        display: grid !important;
        grid-template-columns: 1fr 2fr !important;
      }
      
      .print\\:grid-cols-3 {
        display: grid !important;
        grid-template-columns: 1fr 2fr !important;
      }
      
      .col-span-1,
      .print\\:col-span-1 {
        grid-column: span 1 !important;
      }
      
      .col-span-2,
      .print\\:col-span-2 {
        grid-column: span 2 !important;
      }
      
      /* Make image smaller in print */
      .print\\:h-32 {
        height: 128px !important;
        max-height: 128px !important;
      }
      
      .print\\:object-contain {
        object-fit: contain !important;
      }
      
      /* Adjust text sizes for print */
      .print\\:text-2xl {
        font-size: 22px !important;
      }
      
      .print\\:text-lg {
        font-size: 16px !important;
      }
      
      .print\\:text-base {
        font-size: 13px !important;
      }
      
      .print\\:text-sm {
        font-size: 12px !important;
      }
      
      .print\\:text-xs {
        font-size: 10px !important;
      }
      
      /* Adjust spacing for print */
      .print\\:gap-3 {
        gap: 8px !important;
      }
      
      .print\\:p-3 {
        padding: 8px !important;
      }
      
      .print\\:p-2 {
        padding: 6px !important;
      }
      
      .print\\:px-2 {
        padding-left: 6px !important;
        padding-right: 6px !important;
      }
      
      .print\\:py-1 {
        padding-top: 3px !important;
        padding-bottom: 3px !important;
      }
      
      .print\\:py-1\\.5 {
        padding-top: 4px !important;
        padding-bottom: 4px !important;
      }
      
      .print\\:pb-1\\.5 {
        padding-bottom: 4px !important;
      }
      
      .print\\:mb-1 {
        margin-bottom: 3px !important;
      }
      
      .print\\:mb-1\\.5 {
        margin-bottom: 4px !important;
      }
      
      .print\\:mb-2 {
        margin-bottom: 6px !important;
      }
      
      .print\\:mb-4 {
        margin-bottom: 12px !important;
      }
      
      .print\\:mt-2 {
        margin-top: 6px !important;
      }
      
      .print\\:space-y-2 > * + * {
        margin-top: 6px !important;
      }
      
      .print\\:space-y-0\\.5 > * + * {
        margin-top: 2px !important;
      }
      
      .print\\:gap-y-1 {
        row-gap: 3px !important;
      }
      
      /* Ensure font sans is used */
      .font-sans {
        font-family: "Segoe UI", "Arial", "Helvetica", sans-serif !important;
      }
      
      /* Ensure proper line height */
      .leading-normal {
        line-height: 1.4 !important;
      }
      
      .print\\:p-6 {
        padding: 18px !important;
      }
      
      .print\\:pb-3 {
        padding-bottom: 8px !important;
      }
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
  ${reportContent}
</body>
</html>`;
  };
  const fetchBatchImages = async (batchId: string) => {
    try {
      console.log('🔍 Fetching batch images for batch ID:', batchId);
      const response = await fetch(`https://luccibyey.com.tn/production/api/batch_images.php?batch_id=${batchId}`);
      console.log('📡 Batch images API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📦 Batch images API data:', data);
        
        if (data.success) {
          console.log('✅ Found', data.data.length, 'images:', data.data);
          setBatchImages(data.data || []);
        } else {
          console.error('❌ API returned error:', data.message);
        }
      } else {
        console.error('❌ API request failed with status:', response.status);
      }
    } catch (error) {
      console.error('💥 Error fetching batch images:', error);
    }
  };

  const fetchBatchAttachments = async (batchId: string) => {
    try {
      const response = await fetch(`https://luccibyey.com.tn/production/api/batch_attachments.php?batch_id=${batchId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setBatchAttachments(data.data || []);
        }
      }
    } catch (error) {
      console.error('Error fetching batch attachments:', error);
    }
  };

  const fetchBatchCompleteReport = async (batchId: string) => {
    try {
      console.log('🔍 fetchBatchCompleteReport - Starting for batch ID:', batchId);
      
      // First get basic batch info to get batch_reference and product_type
      const batchResponse = await fetch(`https://luccibyey.com.tn/production/api/production_batches.php?id=${batchId}`);
      console.log('📡 Batch response status:', batchResponse.status);
      
      if (batchResponse.ok) {
        const batchData = await batchResponse.json();
        console.log('📦 Batch data received:', batchData);
        
        if (batchData.success) {
          const batchReference = batchData.data.batch_reference;
          const productType = batchData.data.product_type;
          const productId = batchData.data.product_id;
          
          console.log('🔍 Batch info:', { batchReference, productType, productId });
          
          // Load regular product images if it's a regular product
          if (productType !== 'soustraitance') {
            console.log('📸 Fetching regular product images for batch:', batchReference);
            const completeResponse = await fetch(`https://luccibyey.com.tn/production/api/batch_complete_report.php?batch_id=${batchReference}`);
            console.log('📡 Complete report response status:', completeResponse.status);
            
            if (completeResponse.ok) {
              const completeData = await completeResponse.json();
              console.log('📦 Complete report data:', completeData);
              
              if (completeData.success && completeData.data.product_images) {
                console.log('✅ Setting product images:', completeData.data.product_images);
                setProductImages(completeData.data.product_images);
              } else {
                console.warn('⚠️ No product images found in complete report');
              }
            } else {
              console.error('❌ Failed to fetch complete report:', completeResponse.status);
            }
          } else {
            console.log('ℹ️ Skipping regular product images (soustraitance product)');
          }
          
          // Load soustraitance product images if it's a soustraitance product
          if (productType === 'soustraitance' && productId) {
            console.log('📸 Fetching soustraitance product images for product ID:', productId);
            try {
              const soustraitanceResponse = await fetch(`https://luccibyey.com.tn/production/api/soustraitance_products.php?id=${productId}`);
              console.log('📡 Soustraitance product response status:', soustraitanceResponse.status);
              
              if (soustraitanceResponse.ok) {
                const soustraitanceData = await soustraitanceResponse.json();
                console.log('📦 Soustraitance product data:', soustraitanceData);
                
                if (soustraitanceData.success && soustraitanceData.data) {
                  const product = soustraitanceData.data;
                  const images: string[] = [];
                  
                  // Collect all product images
                  if (product.img_product) {
                    images.push(`https://luccibyey.com.tn/production/api/${product.img_product}`);
                  }
                  if (product.img2_product) {
                    images.push(`https://luccibyey.com.tn/production/api/${product.img2_product}`);
                  }
                  if (product.img3_product) {
                    images.push(`https://luccibyey.com.tn/production/api/${product.img3_product}`);
                  }
                  if (product.img4_product) {
                    images.push(`https://luccibyey.com.tn/production/api/${product.img4_product}`);
                  }
                  if (product.img5_product) {
                    images.push(`https://luccibyey.com.tn/production/api/${product.img5_product}`);
                  }
                  
                  console.log('✅ Setting soustraitance product images:', images);
                  setSoustraitanceProductImages(images);
                } else {
                  console.warn('⚠️ No soustraitance product data found');
                }
              } else {
                console.error('❌ Failed to fetch soustraitance product:', soustraitanceResponse.status);
              }
            } catch (error) {
              console.error('💥 Error fetching soustraitance product images:', error);
            }
          } else if (productType === 'soustraitance') {
            console.warn('⚠️ Soustraitance product but no product_id found');
          }
        } else {
          console.error('❌ Batch data fetch failed:', batchData);
        }
      } else {
        console.error('❌ Batch response not OK:', batchResponse.status);
      }
    } catch (error) {
      console.error('💥 Error fetching complete batch report:', error);
    }
  };

  useEffect(() => {
    if (batch?.product_id) {
      fetchProductAttachments(batch.product_id.toString());
    }
  }, [batch?.product_id]);

  const fetchProductAttachments = async (productId: string) => {
    try {
      const response = await fetch(`https://luccibyey.com.tn/production/api/product_attachments.php?product_id=${productId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setProductAttachments(data.data || []);
        }
      }
    } catch (error) {
      console.error('Error fetching product attachments:', error);
    }
  };

  const fetchMaterialStocks = async (materials: BatchMaterial[]) => {
    try {
      const stocksData: {[key: number]: number} = {};
      
      for (const material of materials) {
        const response = await fetch(`https://luccibyey.com.tn/production/api/matieres.php?id=${material.material_id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            stocksData[material.material_id] = Number(data.data.quantite_disponible) || 0;
          }
        }
      }
      
      setMaterialStocks(stocksData);
    } catch (error) {
      console.error('Error fetching material stocks:', error);
    }
  };

  const generatePDFReport = async () => {
    if (!batch) return;
    
    setIsGeneratingPDF(true);
    
    try {
      // Fetch comprehensive batch data
      const response = await fetch(`https://luccibyey.com.tn/production/api/batch_complete_report.php?batch_id=${batch.batch_reference}`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch comprehensive batch data');
      }
      
      const batchData = result.data;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let currentY = 45; // Start below the new header
      
      // Define company name for later use in document
      const companyName = batchData.batch.boutique_origin === 'luccibyey' ? 'Lucci By Ey' : 'Spada di Battaglia';
      
      // Helper function to add new page if needed  
      const checkPageBreak = (neededSpace: number) => {
        if (currentY + neededSpace > pageHeight - 40) { // Better footer margin
          pdf.addPage();
          currentY = 45; // Start below header on new pages
          return true;
        }
        return false;
      };
      
      // Professional Header - Clean white background design
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');
      
      // Date - top right  
      const reportDate = new Date().toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric'
      });
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Date: ${reportDate}`, pageWidth - 15, 15, { align: 'right' });
      
      // Main title - centered and bold
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('RAPPORT DE PRODUCTION', pageWidth / 2, 25, { align: 'center' });
      
      // Batch reference - right aligned under date
      const batchRef = batchData.batch.batch_reference || `BATCH-${batchData.batch.batch_id}`;
      pdf.setTextColor(80, 80, 80);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Batch: ${batchRef}`, pageWidth - 15, 30, { align: 'right' });
      
      // Top and bottom border lines for header
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.5);
      pdf.line(0, 0, pageWidth, 0);
      pdf.line(15, 35, pageWidth - 15, 35);

      // Helper function to draw professional tables with very light borders
      const drawTable = (headers: string[], rows: string[][], startY: number, colWidths: number[], maxRowsPerPage = 20) => {
        let tableY = startY;
        const rowHeight = 8; // Compact height
        const cellPadding = 3;
        const totalWidth = colWidths.reduce((a, b) => a + b, 0);
        
        // Check if we have space for at least header + 3 rows
        const minSpaceNeeded = (rowHeight * 4) + 15;
        if (tableY + minSpaceNeeded > pageHeight - 40) {
          pdf.addPage();
          tableY = 45;
          currentY = 45;
        }
        
        // Calculate how many rows can fit on current page
        let rowsPerPage = Math.floor((pageHeight - tableY - 40) / rowHeight) - 1;
        rowsPerPage = Math.min(rowsPerPage, maxRowsPerPage);
        rowsPerPage = Math.max(rowsPerPage, 5);
        
        // Split rows into chunks to fit on pages
        const chunkedRows = [];
        for (let i = 0; i < rows.length; i += rowsPerPage) {
          chunkedRows.push(rows.slice(i, i + rowsPerPage));
        }
        
        chunkedRows.forEach((rowChunk, chunkIndex) => {
          if (chunkIndex > 0) {
            pdf.addPage();
            tableY = 45;
            currentY = 45;
          }
          
          const tableStartY = tableY;
          
          // Draw header with very light styling like reference
          pdf.setFillColor(248, 248, 248); // Very light gray background
          pdf.rect(15, tableY, totalWidth, rowHeight, 'F');
          
          // Very light header border
          pdf.setDrawColor(230, 230, 230); // Much lighter border
          pdf.setLineWidth(0.2); // Very thin border
          pdf.rect(15, tableY, totalWidth, rowHeight);
          
          // Header text
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(8);
          pdf.setTextColor(0, 0, 0);
          
          let headerX = 15;
          headers.forEach((header, i) => {
            const textWidth = pdf.getTextWidth(header);
            const centerX = headerX + (colWidths[i] - textWidth) / 2;
            pdf.text(header, centerX, tableY + rowHeight - cellPadding);
            
            // Very light column separators
            if (i < headers.length - 1) {
              pdf.setDrawColor(240, 240, 240);
              pdf.setLineWidth(0.1);
              pdf.line(headerX + colWidths[i], tableY, headerX + colWidths[i], tableY + rowHeight);
            }
            headerX += colWidths[i];
          });
          
          tableY += rowHeight;
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(7);
          
          // Draw data rows with minimal styling
          rowChunk.forEach((row, rowIndex) => {            
            // Very subtle alternating rows (almost invisible)
            if (rowIndex % 2 === 0) {
              pdf.setFillColor(252, 252, 252);
              pdf.rect(15, tableY, totalWidth, rowHeight, 'F');
            }
            
            // Extremely light row borders
            pdf.setDrawColor(245, 245, 245);
            pdf.setLineWidth(0.1);
            pdf.rect(15, tableY, totalWidth, rowHeight);
            
            let cellX = 15;
            row.forEach((cell, cellIndex) => {
              const cellText = cell || '';
              const maxWidth = colWidths[cellIndex] - (cellPadding * 2);
              
              // Better text truncation
              let displayText = cellText;
              if (pdf.getTextWidth(cellText) > maxWidth) {
                const maxChars = Math.floor(maxWidth / (pdf.getTextWidth('A') * 0.8));
                displayText = cellText.substring(0, Math.max(8, maxChars - 3)) + '...';
              }
              
              pdf.text(displayText, cellX + cellPadding, tableY + rowHeight - cellPadding);
              
              // Very light column separators for data
              if (cellIndex < row.length - 1) {
                pdf.setDrawColor(248, 248, 248);
                pdf.setLineWidth(0.1);
                pdf.line(cellX + colWidths[cellIndex], tableY, cellX + colWidths[cellIndex], tableY + rowHeight);
              }
              cellX += colWidths[cellIndex];
            });
            tableY += rowHeight;
          });
          
          // Very light outer table border
          pdf.setDrawColor(230, 230, 230);
          pdf.setLineWidth(0.2);
          pdf.rect(15, tableStartY, totalWidth, tableY - tableStartY);
        });
        
        return tableY + 8;
      };

      // BATCH INFORMATION TABLE - Professional section header
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text('INFORMATIONS GÉNÉRALES', 15, currentY);
      currentY += 5;
      
      const batchRows = [
        ['Référence Batch', batchData.batch.batch_reference || batchData.batch.batch_id || 'N/A'],
        ['Statut', getStatusLabel(batchData.batch.status) || 'N/A'],
        ['Date Création', formatDate(batchData.batch.started_at) || 'N/A'],
        ['Date Fin', batchData.batch.status === 'termine' ? formatDate(batchData.batch.completed_at) || 'N/A' : 'En cours'],
      ];
      
      currentY = drawTable(['ÉLÉMENT', 'VALEUR'], batchRows, currentY, [90, 90]);

      // PRODUCT DETAILS TABLE - Professional section header
      checkPageBreak(50);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('DÉTAILS PRODUIT', 15, currentY);
      currentY += 5;
      
      const productRows = [
        ['Nom Produit', batchData.batch.nom_produit || 'N/A'],
        ['Référence', batchData.batch.ref_produit || 'N/A'],
        ['Boutique', companyName],
        ['Quantité', `${batchData.batch.quantity_to_produce || batchData.batch.quantity || 0} unités`],
      ];
      
      currentY = drawTable(['CARACTÉRISTIQUE', 'VALEUR'], productRows, currentY, [90, 90]);

      // SIZES BREAKDOWN TABLE
      const parsedSizes = parseSizesBreakdown(batchData.batch.sizes_breakdown);
      if (parsedSizes.length > 0) {
        checkPageBreak(60);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('RÉPARTITION DES TAILLES', 15, currentY);
        currentY += 5;
        
        const sizeRows = parsedSizes.map((size: any) => [
          size.size_name || 'N/A',
          `${size.quantity || 0}`
        ]);
        
        currentY = drawTable(['TAILLE', 'QUANTITÉ'], sizeRows, currentY, [90, 90], 20);
      }

      // PRODUCTION SPECIFICATIONS TABLE
      if (batchData.batch.production_specifications && 
          batchData.batch.production_specifications !== 'null' && 
          batchData.batch.production_specifications !== '{}') {
        try {
          const specs = typeof batchData.batch.production_specifications === 'string' 
            ? JSON.parse(batchData.batch.production_specifications) 
            : batchData.batch.production_specifications;
          
          if (specs && Object.keys(specs).length > 0) {
            checkPageBreak(60);
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'bold');
            pdf.text('SPÉCIFICATIONS DE PRODUCTION', 15, currentY);
            currentY += 5;
            
            const specRows = Object.entries(specs).map(([key, value]) => [
              key,
              String(value)
            ]);
            
            currentY = drawTable(['SPÉCIFICATION', 'VALEUR'], specRows, currentY, [90, 90], 20);
          }
        } catch (e) {
          console.error('Error parsing production specifications for PDF:', e);
        }
      }

      // MATERIALS USED TABLE - Handle large datasets with compact layout
      if (batchData.materials_used && batchData.materials_used.length > 0) {
        checkPageBreak(40);
        
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('MATÉRIAUX UTILISÉS', 15, currentY);
        currentY += 5;
        
        const materialRows = batchData.materials_used.map((material: any) => [
          (material.nom_matiere || material.nom || 'N/A').substring(0, 18), // Further truncate long names
          (material.couleur || 'N/A').substring(0, 10), // Add color column
          `${Number(material.quantity_used || material.quantity_needed || 0).toFixed(1)}`,
          `${(material.unite_mesure || material.quantity_unit || 'u').substring(0, 5)}`, // Shorter units
        ]);
        
        currentY = drawTable(
          ['MATÉRIAU', 'COULEUR', 'QTÉ', 'UNITÉ'], 
          materialRows, 
          currentY, 
          [60, 25, 25, 20], // Adjusted column widths
          30 // More rows per page for materials
        );
      }
      
      // NOTES AND ATTACHMENTS TABLE
      if (batchData.batch.notes || (batchData.product_attachments && batchData.product_attachments.length > 0)) {
        checkPageBreak(60);
        
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text('NOTES ET PIÈCES JOINTES', 15, currentY);
        currentY += 5;
        
        const notesRows = [];
        
        if (batchData.batch.notes) {
          // Better handling of long notes
          const noteChunks = batchData.batch.notes.match(/.{1,80}/g) || [batchData.batch.notes];
          noteChunks.forEach((chunk, index) => {
            notesRows.push([index === 0 ? 'Notes Production' : '', chunk]);
          });
        }
        
        if (batchData.product_attachments && batchData.product_attachments.length > 0) {
          batchData.product_attachments.slice(0, 10).forEach((attachment: any, index: number) => {
            const fileName = attachment.original_filename || attachment.filename || `Fichier ${index + 1}`;
            const fileInfo = `${fileName.substring(0, 60)} (${attachment.file_type || 'N/A'})`;
            notesRows.push(['Pièce Jointe', fileInfo]);
          });
          
          if (batchData.product_attachments.length > 10) {
            notesRows.push(['', `... et ${batchData.product_attachments.length - 10} autres fichiers`]);
          }
        }
        
        if (notesRows.length === 0) {
          notesRows.push(['Notes', 'Aucune note disponible']);
        }
        
        currentY = drawTable(['TYPE', 'CONTENU'], notesRows, currentY, [50, 130], 20);
      }
      
      // Professional Footer on all pages
      const pageCount = pdf.internal.pages.length - 1;
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setDrawColor(180, 180, 180);
        pdf.setLineWidth(0.2);
        pdf.line(15, pageHeight - 20, pageWidth - 15, pageHeight - 20);
        
        pdf.setFontSize(7);
        pdf.setTextColor(100, 100, 100);
        pdf.text(`Page ${i} sur ${pageCount}`, 15, pageHeight - 12);
        pdf.text(`Généré le ${new Date().toLocaleString('fr-FR')}`, pageWidth - 15, pageHeight - 12, { align: 'right' });
        pdf.text(`${companyName} - Batch: ${batchData.batch.batch_reference || batchData.batch.batch_id}`, pageWidth / 2, pageHeight - 12, { align: 'center' });
      }
      
      // Create blob URL for preview
      const pdfBlob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      setPdfBlob(blobUrl);
      setShowPDFPreview(true);
      
      toast({
        title: "Rapport professionnel généré",
        description: "Le rapport complet est prêt pour prévisualisation et téléchargement",
      });
      
    } catch (error) {
      console.error('Error generating comprehensive PDF:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la génération du rapport complet",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const fetchBatchDetails = async (batchId: number) => {
    try {
      console.log('🔍 Fetching batch details for ID:', batchId);
      const response = await fetch(`https://luccibyey.com.tn/production/api/production_batches.php?id=${batchId}`);
      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📦 Received data:', data);
      
      if (data.success) {
        console.log('🔍 DEBUG - Batch data received:', data.data);
        console.log('🔍 DEBUG - Materials used:', data.data.materials_used);
        setBatch(data.data);
        
        // Initialize materials quantities from batch data
        if (data.data.materials_used) {
          const initialQuantities: Record<number, number> = {};
          let hasAllQuantities = true;
          
          data.data.materials_used.forEach((material: BatchMaterial) => {
            if (material.quantity_filled !== null && material.quantity_filled !== undefined && material.quantity_filled > 0) {
              initialQuantities[material.material_id] = material.quantity_filled;
            } else {
              hasAllQuantities = false;
            }
          });
          
          setMaterialsQuantities(initialQuantities);
          // If all quantities are already filled from database, mark as saved
          setQuantitiesSaved(hasAllQuantities && Object.keys(initialQuantities).length === data.data.materials_used.length);
          
          // Fetch stock levels for all materials
          fetchMaterialStocks(data.data.materials_used);
        }
        
        // Load status history after batch is loaded
        loadStatusHistory();
        
        // Load batch notes after batch is loaded
        loadBatchNotes();
        
        // Load measurements after batch is loaded
        loadBatchMeasurements(data.data);
        
        // If images and attachments are included in the response, use them
        if (data.data.batch_images) {
          setBatchImages(data.data.batch_images);
        } else {
          // Fallback to separate API call
          fetchBatchImages(batchId.toString());
        }
        
        if (data.data.batch_attachments) {
          setBatchAttachments(data.data.batch_attachments);
        } else {
          // Fallback to separate API call
          fetchBatchAttachments(batchId.toString());
        }
      } else {
        console.error('❌ API returned error:', data);
        toast({
          title: "Erreur",
          description: data.message || "Erreur lors du chargement des détails",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('💥 Error fetching batch details:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors du chargement des détails",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load measurements based on product type
  const loadBatchMeasurements = async (batchData: any) => {
    if (!batchData?.product_id) return;
    
    try {
      const productType = batchData.product_type;
      const apiEndpoint = productType === 'soustraitance' 
        ? 'production_soustraitance_products_mesure_by_size.php'
        : 'production_ready_products_mesure_by_size.php';
      
      const response = await fetch(`https://luccibyey.com.tn/production/api/${apiEndpoint}?product_id=${batchData.product_id}`);
      const data = await response.json();
      
      if (data.success && data.data?.length > 0) {
        // Convert the new measurement format to BatchReport format
        const measurementTypes = data.data.map((m: any) => m.measurement_name);
        const measurementsData: any = {};
        const toleranceData: any = {};
        
        data.data.forEach((measurement: any) => {
          measurementsData[measurement.measurement_name] = measurement.sizes;
          toleranceData[measurement.measurement_name] = measurement.tolerance || 0.5;
        });
        
        // Debug logging to check data structure
        console.log('Loaded measurements data:', {
          measurementTypes,
          measurementsData,
          toleranceData,
          batchSizes: batchData?.sizes_breakdown
        });
        
        setMeasurementScale({
          measurement_types: measurementTypes,
          measurements_data: measurementsData,
          tolerance_data: toleranceData
        });
      } else {
        // No measurements found, set empty state
        setMeasurementScale({
          measurement_types: [],
          measurements_data: {},
          tolerance_data: {}
        });
      }
    } catch (error) {
      console.error('Error loading batch measurements:', error);
      setMeasurementScale({
        measurement_types: [],
        measurements_data: {},
        tolerance_data: {}
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

  const getStatusColorAndText = (status: string) => {
    switch (status) {
      case 'planifie': return { bg: 'bg-blue-500', text: 'text-blue-700' };
      case 'en_cours': return { bg: 'bg-green-500', text: 'text-green-700' };
      case 'termine': return { bg: 'bg-purple-500', text: 'text-purple-700' };
      case 'en_a_collecter': return { bg: 'bg-orange-500', text: 'text-orange-700' };
      case 'en_magasin': return { bg: 'bg-gray-500', text: 'text-gray-700' };
      case 'cancelled': return { bg: 'bg-red-500', text: 'text-red-700' };
      case 'en_attente': return { bg: 'bg-gray-500', text: 'text-gray-700' };
      case 'en_pause': return { bg: 'bg-yellow-500', text: 'text-yellow-700' };
      case 'annule': return { bg: 'bg-red-500', text: 'text-red-700' };
      default: return { bg: 'bg-gray-500', text: 'text-gray-700' };
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

  const formatDateShort = (dateString: string | null | undefined) => {
    if (!dateString) return 'Non spécifiée';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Date invalide';
    
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const calculateDuration = (startDate?: string, endDate?: string) => {
    if (!startDate) return null;
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'planifie': return 'secondary';
      case 'en_cours': return 'default';
      case 'termine': return 'default';
      case 'en_a_collecter': return 'secondary';
      case 'en_magasin': return 'default';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const getPriorityLevel = (status: string, duration?: number) => {
    if (status === 'planifie' && duration && duration > 7) return 'high';
    if (status === 'en_cours' && duration && duration > 14) return 'high';
    return 'normal';
  };

  const loadStatusHistory = async () => {
    if (!id) return;
    
    setLoadingHistory(true);
    try {
      const response = await fetch(`https://luccibyey.com.tn/production/api/batch_status_history.php?batch_id=${id}`);
      const data = await response.json();
      
      if (data.success) {
        setStatusHistory(data.data || []);
      } else {
        console.error('Error loading status history:', data.error);
      }
    } catch (error) {
      console.error('Error loading status history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Materials quantities functions
  const handleSaveQuantitiesClick = () => {
    // Show confirmation modal
    setShowSaveQuantitiesModal(true);
  };
  
  const confirmSaveMaterialsQuantities = async () => {
    if (!batch) return;
    
    // Validate all materials have quantities filled
    if (!areAllMaterialsQuantitiesFilled()) {
      toast({
        title: "Erreur de validation",
        description: "Veuillez remplir les quantités réelles pour tous les matériaux",
        variant: "destructive",
      });
      setShowSaveQuantitiesModal(false);
      return;
    }
    
    setShowSaveQuantitiesModal(false);
    setSavingQuantities(true);
    
    try {
      console.log('Saving materials quantities:', {
        batch_id: batch.id,
        materials_quantities: materialsQuantities
      });
      
      // Step 1: Save the quantities to batch
      const saveResponse = await fetch('https://luccibyey.com.tn/production/api/update_batch_materials_quantities.php', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          batch_id: batch.id,
          materials_quantities: materialsQuantities
        }),
      });
      
      if (!saveResponse.ok) {
        throw new Error(`HTTP error! status: ${saveResponse.status}`);
      }
      
      const saveData = await saveResponse.json();
      console.log('Save quantities response:', saveData);
      
      if (!saveData.success) {
        throw new Error(saveData.error || "Erreur lors de la sauvegarde des quantités");
      }
      
      // Step 2: Deduct stock using actual filled quantities (not estimated)
      // Prepare totals per material to avoid ambiguity on server side
      const materialsTotals: Record<string, number> = Object.fromEntries(
        Object.entries(materialsQuantities).map(([materialId, perPiece]) => {
          const perPieceNum = Number(perPiece) || 0;
          const total = perPieceNum * (Number(batch.quantity_to_produce) || 0);
          return [materialId, total];
        })
      );

      console.log('Deducting stock with actual quantities (per-piece + totals):', {
        action: 'deduct_stock_with_actual_quantities',
        batch_id: batch.id,
        materials_quantities: materialsQuantities,
        materials_quantities_totals: materialsTotals,
        production_number: batch.batch_reference
      });

      const deductResponse = await fetch('https://luccibyey.com.tn/production/api/production_stock_deduction.php', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          action: 'deduct_stock_with_actual_quantities',
          batch_id: batch.id,
          materials_quantities: materialsQuantities,
          materials_quantities_totals: materialsTotals,
          production_number: batch.batch_reference,
          user_id: 1
        }),
      });
      
      if (!deductResponse.ok) {
        throw new Error(`Stock deduction HTTP error! status: ${deductResponse.status}`);
      }
      
      const deductData = await deductResponse.json();
      console.log('Deduct stock response:', deductData);
      
      if (!deductData.success) {
        // Quantities saved but stock deduction failed
        toast({
          title: "Avertissement",
          description: deductData.message || "Quantités sauvegardées mais le stock n'a pas pu être déduit. Veuillez vérifier le stock.",
          variant: "destructive",
        });
        setQuantitiesSaved(true);
        await fetchBatchDetails(batch.id);
        return;
      }
      
      // Both operations succeeded
      setQuantitiesSaved(true);
      
      const transactionCount = deductData.transactions?.length || 0;
      toast({
        title: "Succès",
        description: `Quantités sauvegardées avec succès. ${transactionCount} transaction(s) de stock créée(s).`,
      });
      
      // Refresh batch details to show updated data
      await fetchBatchDetails(batch.id);
      
    } catch (error) {
      console.error('Error in confirmSaveMaterialsQuantities:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de la sauvegarde des quantités et de la déduction du stock",
        variant: "destructive",
      });
    } finally {
      setSavingQuantities(false);
    }
  };
  
  const handleMaterialQuantityChange = (materialId: number, value: string) => {
    // Mark as not saved when user makes changes (only if not yet in production)
    if (batch.status !== 'en_cours') {
      setQuantitiesSaved(false);
    }
    
    // Allow empty string for clearing the input
    if (value === '') {
      setMaterialsQuantities(prev => ({
        ...prev,
        [materialId]: 0
      }));
      setStockWarnings(prev => ({
        ...prev,
        [materialId]: false
      }));
      return;
    }
    
    // Parse the value - supports decimals like 9.5, 10.75, etc.
    const numValue = parseFloat(value);
    
    // Only update if it's a valid number
    if (!isNaN(numValue) && numValue >= 0) {
      setMaterialsQuantities(prev => ({
        ...prev,
        [materialId]: numValue
      }));
      
      // Check stock availability
      const totalRequired = numValue * batch.quantity_to_produce;
      const availableStock = materialStocks[materialId] || 0;
      
      setStockWarnings(prev => ({
        ...prev,
        [materialId]: totalRequired > availableStock
      }));
    }
  };
  
  const areAllMaterialsQuantitiesFilled = () => {
    if (!batch?.materials_used) return false;
    
    return batch.materials_used.every(material => {
      const quantity = materialsQuantities[material.material_id];
      return quantity !== undefined && quantity !== null && quantity > 0;
    });
  };

  // Leftovers handlers
  const handleLeftoverChange = (materialId: string, field: 'quantity' | 'reusable' | 'notes', value: any) => {
    setLeftovers(prev => ({
      ...prev,
      [materialId]: {
        ...prev[materialId],
        quantity: prev[materialId]?.quantity || 0,
        reusable: prev[materialId]?.reusable || false,
        notes: prev[materialId]?.notes || '',
        [field]: value
      }
    }));
  };

  const handleSaveLeftovers = async () => {
    try {
      // Save leftovers
      const leftoversArray = Object.entries(leftovers).map(([materialId, data]) => ({
        material_id: materialId,
        ...data
      }));

      await fetch('https://luccibyey.com.tn/production/api/production_batch_leftovers.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save',
          batch_id: id,
          leftovers: leftoversArray
        })
      });

      // Now proceed with status change to 'termine'
      const statusResponse = await fetch('https://luccibyey.com.tn/production/api/update_batch_status.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batch_id: id,
          new_status: 'termine',
          changed_by: 'Current User',
          comments: 'Leftovers recorded'
        })
      });
      
      const statusData = await statusResponse.json();
      if (!statusData.success) {
        throw new Error(statusData.error || 'Erreur lors de la mise à jour du statut');
      }
      
      setShowLeftoversSection(false);
      setLeftovers({});
      toast({ title: "Lot terminé avec succès" });
      await fetchBatchDetails(parseInt(id!));
      await fetchSavedLeftovers();
    } catch (error) {
      console.error('Error saving leftovers:', error);
      toast({ 
        title: "Erreur lors de l'enregistrement des déchets", 
        variant: "destructive",
        description: error instanceof Error ? error.message : 'Une erreur est survenue'
      });
    }
  };

  const fetchSavedLeftovers = async () => {
    if (!id) return;
    
    try {
      const response = await fetch(`https://luccibyey.com.tn/production/api/production_batch_leftovers.php?batch_id=${id}`);
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setSavedLeftovers(data);
      }
    } catch (error) {
      console.error('Error fetching saved leftovers:', error);
    }
  };

  const handleCancelLeftovers = () => {
    setShowLeftoversSection(false);
    setLeftovers({});
  };

  // Batch notes functions
  const loadBatchNotes = async () => {
    if (!id) return;
    
    setLoadingNotes(true);
    try {
      const response = await fetch(`https://luccibyey.com.tn/production/api/production_batch_notes.php?batch_id=${id}`);
      const data = await response.json();
      
      if (data.success) {
        setBatchNotes(data.data || []);
      }
    } catch (error) {
      console.error('Error loading batch notes:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les notes",
        variant: "destructive",
      });
    } finally {
      setLoadingNotes(false);
    }
  };

  const addBatchNote = async () => {
    if (!newNoteText.trim() || !id) return;
    
    try {
      const response = await fetch(`https://luccibyey.com.tn/production/api/production_batch_notes.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          batch_id: id,
          note_text: newNoteText.trim(),
          created_by: 'Production' // Set as Production user
        })
      });

      const data = await response.json();
      if (data.success) {
        setNewNoteText('');
        loadBatchNotes(); // Reload notes
        toast({
          title: "Succès",
          description: "Note ajoutée avec succès",
        });
      } else {
        toast({
          title: "Erreur",
          description: data.error || "Erreur lors de l'ajout de la note",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error adding note:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de l'ajout de la note",
        variant: "destructive",
      });
    }
  };

  const updateBatchNote = async (noteId: number, noteText: string) => {
    if (!noteText.trim()) return;
    
    try {
      const response = await fetch(`https://luccibyey.com.tn/production/api/production_batch_notes.php`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          note_id: noteId,
          note_text: noteText.trim()
        })
      });

      const data = await response.json();
      if (data.success) {
        setEditingNoteId(null);
        setEditingNoteText('');
        loadBatchNotes(); // Reload notes
        toast({
          title: "Succès",
          description: "Note mise à jour avec succès",
        });
      } else {
        toast({
          title: "Erreur",
          description: data.error || "Erreur lors de la mise à jour de la note",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating note:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la mise à jour de la note",
        variant: "destructive",
      });
    }
  };

  const deleteBatchNote = async (noteId: number) => {
    try {
      const response = await fetch(`https://luccibyey.com.tn/production/api/production_batch_notes.php`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          note_id: noteId
        })
      });

      const data = await response.json();
      if (data.success) {
        loadBatchNotes(); // Reload notes
        toast({
          title: "Succès",
          description: "Note supprimée avec succès",
        });
      } else {
        toast({
          title: "Erreur",
          description: data.error || "Erreur lors de la suppression de la note",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression de la note",
        variant: "destructive",
      });
    }
  };

  const updateStatus = async (newStatus: string, comments?: string) => {
    if (!batch) return;
    
    try {
      const response = await fetch('https://luccibyey.com.tn/production/api/update_batch_status.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batch_id: batch.id,
          new_status: newStatus,
          changed_by: 'User', // You can get this from auth context
          comments: comments
        })
      });

      const data = await response.json();
      if (data.success) {
        setBatch({ ...batch, status: newStatus as any });
        // Reload status history
        loadStatusHistory();
        toast({
          title: "Succès",
          description: `Statut mis à jour vers: ${getStatusLabel(newStatus)}`,
        });
      } else {
        toast({
          title: "Erreur",
          description: data.error || "Erreur lors de la mise à jour",
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

  const handleStatusClick = (targetStatus: string) => {
    if (!batch) return;
    
    const statusOrder = ['planifie', 'en_cours', 'termine', 'en_a_collecter', 'en_magasin'];
    const currentIndex = statusOrder.indexOf(batch.status);
    const targetIndex = statusOrder.indexOf(targetStatus);
    
    // If trying to move to 'termine', show leftovers section first
    if (targetStatus === 'termine' && batch.status === 'en_cours') {
      setShowLeftoversSection(true);
      toast({ 
        title: "Action requise", 
        description: "Veuillez remplir les informations sur les déchets ou restes de matériaux avant de terminer le lot."
      });
      return;
    }
    
    // If going backwards or same status, show confirmation
    if (targetIndex <= currentIndex && targetStatus !== batch.status) {
      setPendingStatusChange(targetStatus);
      setShowStatusConfirmModal(true);
    } else if (targetStatus !== batch.status) {
      // Going forward, update directly
      updateStatus(targetStatus);
    }
  };

  const confirmStatusChange = async () => {
    if (!pendingStatusChange || !batch) return;
    
    // If changing to en_cours from planifie, just validate quantities are saved
    // Stock deduction already happened when saving quantities
    if (pendingStatusChange === 'en_cours' && batch.status === 'planifie') {
      if (!quantitiesSaved) {
        toast({
          title: "Quantités non sauvegardées",
          description: "Veuillez sauvegarder les quantités pour tous les matériaux avant de passer en cours",
          variant: "destructive",
        });
        setShowStatusConfirmModal(false);
        setPendingStatusChange(null);
        return;
      }
    }
    
    // Proceed with status update
    if (pendingStatusChange) {
      updateStatus(pendingStatusChange);
      setPendingStatusChange(null);
      setShowStatusConfirmModal(false);
    }
  };

  const proceedToFinalConfirmation = () => {
    if (!cancellationReason.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir une raison d'annulation",
        variant: "destructive",
      });
      return;
    }
    setShowCancelModal(false);
    setShowFinalCancelConfirm(true);
  };

  const cancelBatch = async () => {
    if (!batch || !cancellationReason.trim()) {
      return;
    }

    // Prevent cancellation of completed batches
    if (batch.status === 'termine') {
      toast({
        title: "Erreur",
        description: "Impossible d'annuler un batch déjà terminé",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('https://luccibyey.com.tn/production/api/production_batches.php', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: batch.id,
          action: 'cancel_batch',
          cancellation_reason: cancellationReason
        })
      });

      const data = await response.json();
      if (data.success) {
        setBatch({ ...batch, status: 'cancelled' as any, cancellation_reason: cancellationReason });
        setShowFinalCancelConfirm(false);
        setShowCancelModal(false);
        setCancellationReason('');
        toast({
          title: "Batch Annulé",
          description: "Le batch a été annulé avec succès",
        });
      } else {
        toast({
          title: "Erreur",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error cancelling batch:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de l'annulation",
        variant: "destructive",
      });
    }
  };

  const canUpdateToStatus = (targetStatus: string, currentStatus: string) => {
    // Can't update if already cancelled
    if (currentStatus === 'cancelled') return false;
    
    const statusOrder = ['planifie', 'en_cours', 'termine', 'en_a_collecter', 'en_magasin'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const targetIndex = statusOrder.indexOf(targetStatus);
    
    // Allow going to any adjacent status (forward or backward)
    return Math.abs(targetIndex - currentIndex) <= 2;
  };

  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/productions')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <div className="h-8 w-48 bg-muted rounded animate-pulse" />
            <div className="h-4 w-32 bg-muted rounded animate-pulse mt-2" />
            </div>
          </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/productions')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-destructive">Batch Introuvable</h1>
            <p className="text-sm md:text-base text-muted-foreground">Le batch demandé n'existe pas ou a été supprimé</p>
          </div>
        </div>
        <Card className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Aucune donnée disponible pour ce batch</p>
        </Card>
      </div>
    );
  }


  const duration = calculateDuration(batch.started_at, batch.completed_at);
  const priority = getPriorityLevel(batch.status, duration);

  return (
    <div className="space-y-4 md:space-y-6 p-3 md:p-6 bg-muted/20 min-h-screen">
      {/* Professional Header */}
      <div className="bg-background rounded-lg shadow-sm border">
        <div className="p-3 md:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 md:gap-4">
            <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
              <Button variant="outline" size="sm" onClick={() => navigate('/productions')} className="w-full md:w-auto text-xs md:text-sm">
                <ArrowLeft className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                Retour
              </Button>
              <div className="flex-1 min-w-0">
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 mb-2">
                  <h1 className="text-lg md:text-2xl lg:text-3xl font-bold truncate">{batch.batch_reference}</h1>
                  <div className="flex flex-wrap gap-1 md:gap-2">
                    <Badge 
                      variant={getStatusBadgeVariant(batch.status)}
                      className={`${getStatusColor(batch.status)} text-white font-medium px-2 md:px-3 py-0.5 md:py-1 text-xs md:text-sm`}
                    >
                      <div className="flex items-center gap-1">
                        {getStatusIcon(batch.status)}
                        {getStatusLabel(batch.status)}
                      </div>
                    </Badge>
                    {priority === 'high' && (
                      <Badge variant="destructive" className="flex items-center gap-1 text-xs md:text-sm">
                        <AlertTriangle className="h-3 w-3" />
                        Priorité Haute
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="text-sm md:text-lg text-muted-foreground truncate">{batch.nom_product}</p>
                <p className="text-xs md:text-sm text-muted-foreground">Ref: {batch.reference_product}</p>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="flex gap-1 md:gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => setShowReportModal(true)} className="flex-1 md:flex-initial text-xs md:text-sm">
                <FileText className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                Rapport
              </Button>
              {batch.status !== 'cancelled' && batch.status !== 'termine' && (
                <AlertDialog open={showCancelModal} onOpenChange={setShowCancelModal}>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="flex-1 md:flex-initial text-xs md:text-sm">
                      <X className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                      Annuler
                    </Button>
                  </AlertDialogTrigger>
                </AlertDialog>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Production Note Alert - Highlighted at Top */}
      {batch.production_specifications && 
       batch.production_specifications !== 'null' && 
       batch.production_specifications !== '{}' && (() => {
         try {
           const specs = typeof batch.production_specifications === 'string' 
             ? JSON.parse(batch.production_specifications) 
             : batch.production_specifications;
           
           // Check if there's a "Note" field
           if (specs && specs.Note) {
             return (
               <Card className="border-amber-500 bg-amber-50 shadow-lg">
                 <CardContent className="p-4 md:p-6">
                   <div className="flex items-start gap-3">
                     <AlertCircle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
                     <div className="flex-1">
                       <h3 className="text-lg font-bold text-amber-900 mb-2">Note importante de production</h3>
                       <p className="text-base text-amber-800 font-medium">{specs.Note}</p>
                     </div>
                   </div>
                 </CardContent>
               </Card>
             );
           }
         } catch (e) {
           console.error('Error parsing production specifications for note:', e);
         }
         return null;
       })()}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-6">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/20 border-primary/20">
          <CardContent className="p-3 md:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs md:text-sm font-medium text-primary/80">Quantité</p>
                <p className="text-xl md:text-3xl font-bold text-primary truncate">{batch.quantity_to_produce}</p>
                <p className="text-xs text-primary/70 mt-0.5 md:mt-1">unités</p>
              </div>
              <Package className="h-5 w-5 md:h-8 md:w-8 text-primary/70 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/10 to-primary/20 border-primary/20">
          <CardContent className="p-3 md:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs md:text-sm font-medium text-primary/80">Coût Total</p>
                <p className="text-xl md:text-3xl font-bold text-primary truncate">{Number(batch.total_materials_cost || 0).toFixed(2)}</p>
                <p className="text-xs text-primary/70 mt-0.5 md:mt-1">TND</p>
              </div>
              <DollarSign className="h-5 w-5 md:h-8 md:w-8 text-primary/70 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/10 to-primary/20 border-primary/20">
          <CardContent className="p-3 md:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs md:text-sm font-medium text-primary/80">Progression</p>
                <p className="text-xl md:text-3xl font-bold text-primary truncate">{getProgressPercentage(batch.status)}%</p>
                <p className="text-xs text-primary/70 mt-0.5 md:mt-1">complété</p>
              </div>
              <BarChart3 className="h-5 w-5 md:h-8 md:w-8 text-primary/70 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/10 to-primary/20 border-primary/20">
          <CardContent className="p-3 md:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs md:text-sm font-medium text-primary/80">Durée</p>
                <p className="text-xl md:text-3xl font-bold text-primary truncate">{duration || '-'}</p>
                <p className="text-xs text-primary/70 mt-0.5 md:mt-1">jours</p>
              </div>
              <Timer className="h-5 w-5 md:h-8 md:w-8 text-primary/70 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Materials Quantities Alert & Table - Above Status (Only if planifie and not saved) */}
      {batch.status === 'planifie' && batch.materials_used && batch.materials_used.length > 0 && !quantitiesSaved && (
        <Card className="border-destructive/50 shadow-lg bg-destructive/5">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2 text-lg text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Action Requise: Configuration des Matériaux
                </CardTitle>
                <div className="mt-3 p-3 bg-destructive/10 border border-destructive/30 rounded-md flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-destructive">Quantités non renseignées</p>
                    <p className="text-xs text-destructive/80 mt-1">
                      Veuillez remplir les quantités pour tous les matériaux et sauvegarder avant de passer le batch en cours.
                    </p>
                  </div>
                </div>
              </div>
              <Button 
                onClick={handleSaveQuantitiesClick}
                disabled={savingQuantities || !areAllMaterialsQuantitiesFilled()}
                size="lg"
                className="bg-primary hover:bg-primary/90"
              >
                {savingQuantities ? 'Sauvegarde...' : 'Sauvegarder les quantités'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Matériau</TableHead>
                    <TableHead className="font-semibold">Couleur</TableHead>
                    <TableHead className="font-semibold">Qté Réelle Utilisée</TableHead>
                    <TableHead className="font-semibold">Unité</TableHead>
                    <TableHead className="font-semibold">Commentaire</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batch.materials_used.map((material) => {
                    const quantityValue = materialsQuantities[material.material_id] ?? material.quantity_filled ?? '';
                    
                    return (
                      <TableRow key={material.id} className="hover:bg-muted/20">
                        <TableCell className="font-medium">{material.nom_matiere}</TableCell>
                        <TableCell>
                          <span className="text-sm">{material.couleur || 'Non spécifiée'}</span>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={quantityValue}
                            onChange={(e) => handleMaterialQuantityChange(material.material_id, e.target.value)}
                            className={`w-28 ${!quantityValue || quantityValue === 0 ? 'border-destructive' : ''}`}
                            placeholder="0"
                          />
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {material.quantity_type_name}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {material.commentaire || '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {batch.materials_used.map((material) => {
                const quantityValue = materialsQuantities[material.material_id] ?? material.quantity_filled ?? '';
                
                return (
                  <Card key={material.id} className="border shadow-sm">
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{material.nom_matiere}</p>
                          <p className="text-xs text-muted-foreground">{material.couleur || 'Non spécifiée'}</p>
                        </div>
                        <Badge variant="outline" className="text-xs flex-shrink-0">
                          {material.quantity_type_name}
                        </Badge>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">Qté réelle utilisée:</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={quantityValue}
                          onChange={(e) => handleMaterialQuantityChange(material.material_id, e.target.value)}
                          className={`w-full ${!quantityValue || quantityValue === 0 ? 'border-destructive' : ''}`}
                          placeholder="0"
                        />
                      </div>
                      {material.commentaire && (
                        <div className="pt-1 border-t">
                          <p className="text-xs text-muted-foreground">{material.commentaire}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="mt-4 p-3 bg-muted/30 rounded-md">
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold">Note:</span> Les quantités estimées sont calculées automatiquement à partir de la configuration produit. Remplissez les quantités réelles que vous allez utiliser pour cette production.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Production Specifications - Prominent Display */}
      {batch.production_specifications && 
       batch.production_specifications !== 'null' && 
       batch.production_specifications !== '{}' && (() => {
         try {
           const specs = typeof batch.production_specifications === 'string' 
             ? JSON.parse(batch.production_specifications) 
             : batch.production_specifications;
           
           if (specs && Object.keys(specs).length > 0) {
             return (
               <Card className="border-primary/30 shadow-lg bg-primary/5">
                 <CardHeader className="pb-3">
                   <CardTitle className="flex items-center gap-2 text-lg">
                     <AlertTriangle className="h-5 w-5 text-primary" />
                     Spécifications de Production - Note Important
                   </CardTitle>
                 </CardHeader>
                 <CardContent>
                   <div className="bg-background p-4 rounded-lg border border-primary/20">
                     <div className="space-y-3">
                       {Object.entries(specs).map(([key, value], index) => (
                         <div key={index} className="flex justify-between items-start gap-4 py-2 border-b last:border-b-0">
                           <span className="font-semibold text-sm">{key}:</span>
                           <span className="text-sm text-right font-medium">{value as string}</span>
                         </div>
                       ))}
                     </div>
                   </div>
                 </CardContent>
               </Card>
             );
           }
         } catch (e) {
           console.error('Error parsing production specifications:', e);
         }
         return null;
       })()}

      {/* Progress Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Progression du Batch
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium">Avancement: {getStatusLabel(batch.status)}</span>
              <span className="font-medium">{getProgressPercentage(batch.status)}%</span>
            </div>
            <Progress value={getProgressPercentage(batch.status)} className="h-3" />
            <div className={`grid ${authService.getCurrentUser()?.user_type === 'sous_traitance' ? 'grid-cols-3' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5'} gap-2 md:gap-4 mt-4 md:mt-6 ${authService.getCurrentUser()?.user_type === 'sous_traitance' ? 'justify-center' : ''}`}>
              {(() => {
                const currentUser = authService.getCurrentUser();
                     const isSoustraitance = currentUser?.user_type === 'sous_traitance';
                const statuses = isSoustraitance 
                  ? ['planifie', 'termine', 'en_a_collecter']
                  : ['planifie', 'en_cours', 'termine', 'en_a_collecter', 'en_magasin'];
                
                return statuses.map((status, index) => {
                const isCurrentStatus = batch.status === status;
                const isCompleted = getProgressPercentage(batch.status) >= getProgressPercentage(status);
                
                // Special handling - if materials not saved and batch is planifie, disable en_cours and all subsequent statuses
                let canUpdate = canUpdateToStatus(status, batch.status);
                if (batch.status === 'planifie' && !quantitiesSaved) {
                  // Disable en_cours and all statuses after it
                  if (['en_cours', 'termine', 'en_a_collecter', 'en_magasin'].includes(status)) {
                    canUpdate = false;
                  }
                }
                
                return (
                  <button
                    key={status}
                    onClick={() => canUpdate ? handleStatusClick(status) : null}
                    disabled={!canUpdate}
                    className={`group text-center p-1.5 md:p-2 rounded-lg transition-all duration-200 ${
                      canUpdate 
                        ? 'hover:bg-primary/10 hover:scale-105 cursor-pointer' 
                        : 'cursor-default'
                    } ${
                      isCurrentStatus ? 'bg-primary/20 ring-2 ring-primary/50' : ''
                    }`}
                  >
                    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full mx-auto mb-1 md:mb-2 flex items-center justify-center transition-all duration-200 ${
                      isCompleted
                        ? getStatusColor(status) + ' text-white shadow-lg' 
                        : 'bg-muted text-muted-foreground border-2 border-dashed border-muted-foreground/20'
                    } ${
                      canUpdate && !isCurrentStatus ? 'group-hover:scale-110 group-hover:shadow-md' : ''
                    }`}>
                      {getStatusIcon(status)}
                    </div>
                    <p className={`text-xs font-medium transition-colors ${
                      isCurrentStatus ? 'text-primary font-bold' : 'text-foreground'
                    } ${
                      canUpdate && !isCurrentStatus ? 'group-hover:text-primary' : ''
                    }`}>
                      {getStatusLabel(status)}
                    </p>
                    {canUpdate && !isCurrentStatus && (
                      <p className="text-xs text-muted-foreground group-hover:text-primary/70 transition-colors">
                        Cliquer pour changer
                      </p>
                    )}
                  </button>
                );
                });
              })()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leftovers Section - appears when status is being changed to 'termine' */}
      {showLeftoversSection && batch.materials_used && batch.materials_used.length > 0 && (
        <Card className="border-warning shadow-lg bg-warning/5">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2 text-lg text-warning">
                  <AlertTriangle className="h-5 w-5" />
                  Gestion des Surplus de Matériaux
                </CardTitle>
                <div className="mt-3 p-3 bg-warning/10 border border-warning/30 rounded-md flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-warning">Action requise avant finalisation</p>
                    <p className="text-xs text-warning/80 mt-1">
                      Veuillez indiquer les quantités de déchets ou restes pour chaque matériau utilisé dans ce lot.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Matériau</TableHead>
                    <TableHead className="font-semibold">Qté Utilisée</TableHead>
                    <TableHead className="font-semibold">Qté Déchet/Reste</TableHead>
                    <TableHead className="font-semibold text-center">Réutilisable</TableHead>
                    <TableHead className="font-semibold">Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batch.materials_used.map((material) => (
                    <TableRow key={material.material_id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{material.nom_matiere}</p>
                          {material.couleur && (
                            <p className="text-xs text-muted-foreground">{material.couleur}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono">
                          {material.quantity_filled || material.quantity_used} {material.quantity_unit}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.001"
                          min="0"
                          value={leftovers[material.material_id]?.quantity || ''}
                          onChange={(e) => handleLeftoverChange(material.material_id.toString(), 'quantity', parseFloat(e.target.value) || 0)}
                          placeholder="0.000"
                          className="w-32"
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <input
                            type="checkbox"
                            checked={leftovers[material.material_id]?.reusable || false}
                            onChange={(e) => handleLeftoverChange(material.material_id.toString(), 'reusable', e.target.checked)}
                            className="h-4 w-4"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          value={leftovers[material.material_id]?.notes || ''}
                          onChange={(e) => handleLeftoverChange(material.material_id.toString(), 'notes', e.target.value)}
                          placeholder="Notes optionnelles"
                          className="w-48"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {batch.materials_used.map((material) => (
                <Card key={material.material_id} className="p-4">
                  <div className="space-y-3">
                    <div>
                      <p className="font-medium">{material.nom_matiere}</p>
                      {material.couleur && (
                        <p className="text-xs text-muted-foreground">{material.couleur}</p>
                      )}
                      <p className="text-sm text-muted-foreground mt-1">
                        Qté utilisée: <span className="font-mono">{material.quantity_filled || material.quantity_used} {material.quantity_unit}</span>
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Qté Déchet/Reste ({material.quantity_unit})</label>
                      <Input
                        type="number"
                        step="0.001"
                        min="0"
                        value={leftovers[material.material_id]?.quantity || ''}
                        onChange={(e) => handleLeftoverChange(material.material_id.toString(), 'quantity', parseFloat(e.target.value) || 0)}
                        placeholder="0.000"
                        className="mt-1"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`reusable-mobile-${material.material_id}`}
                        checked={leftovers[material.material_id]?.reusable || false}
                        onChange={(e) => handleLeftoverChange(material.material_id.toString(), 'reusable', e.target.checked)}
                        className="h-4 w-4"
                      />
                      <label htmlFor={`reusable-mobile-${material.material_id}`} className="text-sm">
                        Réutilisable
                      </label>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Notes</label>
                      <Input
                        value={leftovers[material.material_id]?.notes || ''}
                        onChange={(e) => handleLeftoverChange(material.material_id.toString(), 'notes', e.target.value)}
                        placeholder="Notes optionnelles"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button variant="outline" onClick={handleCancelLeftovers}>
                Annuler
              </Button>
              <Button onClick={handleSaveLeftovers} className="bg-primary hover:bg-primary/90">
                Enregistrer et Terminer le Lot
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Information Tabs */}
      <Tabs defaultValue="overview" className="space-y-4 md:space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-muted p-1 gap-1">
          <TabsTrigger value="overview" className="text-xs md:text-sm">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="materials" className="text-xs md:text-sm">Matériaux</TabsTrigger>
          <TabsTrigger value="timeline" className="text-xs md:text-sm">Chronologie</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 md:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {/* Product Information */}
            <Card>
              <CardHeader className="pb-3 md:pb-4 px-3 md:px-6 pt-3 md:pt-6">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <Package className="h-4 w-4 md:h-5 md:w-5" />
                  Informations Produit
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 md:space-y-4 px-3 md:px-6 pb-3 md:pb-6">
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div className="min-w-0">
                    <p className="text-xs md:text-sm text-muted-foreground">Nom du produit</p>
                    <p 
                      className="font-semibold text-sm md:text-base text-primary hover:text-primary/80 cursor-pointer transition-colors underline-offset-4 hover:underline truncate"
                      onClick={() => navigate(batch.product_type === 'soustraitance' ? `/soustraitance-products/${batch.product_id}` : `/produits/${batch.product_id}`)}
                    >
                      {batch.nom_product}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs md:text-sm text-muted-foreground">Référence</p>
                    <p 
                      className="font-semibold text-sm md:text-base text-primary hover:text-primary/80 cursor-pointer transition-colors underline-offset-4 hover:underline truncate"
                      onClick={() => navigate(batch.product_type === 'soustraitance' ? `/soustraitance-products/${batch.product_id}` : `/produits/${batch.product_id}`)}
                    >
                      {batch.reference_product}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs md:text-sm text-muted-foreground">Boutique</p>
                    {batch.product_type === 'soustraitance' && batch.client_id ? (
                      <Badge 
                        variant="outline" 
                        className="font-semibold cursor-pointer hover:bg-accent transition-colors text-xs md:text-sm"
                        onClick={() => navigate(`/clients-soustraitance/${batch.client_id}`)}
                      >
                        <MapPin className="h-3 w-3 mr-1" />
                        {batch.boutique_origin}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="font-semibold text-xs md:text-sm">
                        <MapPin className="h-3 w-3 mr-1" />
                        {batch.product_type === 'soustraitance' 
                          ? batch.boutique_origin 
                          : (batch.boutique_origin === 'luccibyey' ? 'Lucci By Ey' : 'Spada di Battaglia')
                        }
                      </Badge>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs md:text-sm text-muted-foreground">Quantité cible</p>
                    <p className="font-semibold text-sm md:text-base flex items-center gap-1 truncate">
                      <Weight className="h-4 w-4" />
                      {batch.quantity_to_produce} unités
                    </p>
                  </div>
                </div>
                
                {batch.sizes_breakdown && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-2">Répartition des tailles</p>
                    <div className="bg-muted p-3 rounded-md">
                      {(() => {
                        const parsedSizes = parseSizesBreakdown(batch.sizes_breakdown);
                        if (parsedSizes.length === 0) {
                          return <p className="text-sm text-muted-foreground">Aucune répartition de tailles disponible</p>;
                        }
                        return (
                          <div className="space-y-2">
                            {parsedSizes.map((size, index) => (
                              <div key={index} className="flex justify-between items-center text-sm">
                                <span className="font-medium">{size.size_name}:</span>
                                <span className="font-mono">{size.quantity} unités</span>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

              </CardContent>
            </Card>

            {/* Financial Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Résumé Financier
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Coût des matériaux</span>
                    <span className="font-semibold">{Number(batch.total_materials_cost || 0).toFixed(2)} TND</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Coût par unité</span>
                    <span className="font-semibold">
                      {(Number(batch.total_materials_cost || 0) / batch.quantity_to_produce).toFixed(2)} TND
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total estimé</span>
                    <span className="text-green-600">{Number(batch.total_materials_cost || 0).toFixed(2)} TND</span>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                </div>
              </CardContent>
            </Card>

            {/* Upload Sections */}
            {/* Batch Images Upload */}
            <BatchImageUpload
              batchId={batch.id}
              images={batchImages}
              productImages={productImages}
              soustraitanceProductImages={soustraitanceProductImages}
              onImagesUpdate={() => fetchBatchImages(id!)}
            />
            
            {/* Batch Attachments Upload */}
            <BatchAttachmentUpload
              batchId={batch.id}
              attachments={batchAttachments}
              onAttachmentsUpdate={() => fetchBatchAttachments(id!)}
            />

          </div>
        </TabsContent>

        <TabsContent value="materials" className="space-y-4 md:space-y-6">
          {/* Leftovers Section - Show only if batch is termine */}
          {batch.status === 'termine' && (
            <BatchLeftoversView batchId={batch.id} batchStatus={batch.status} />
          )}
          
          {batch.materials_used && batch.materials_used.length > 0 ? (
            <Card>
              <CardHeader className="pb-3 md:pb-4 px-3 md:px-6 pt-3 md:pt-6">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <Package className="h-4 w-4 md:h-5 md:w-5" />
                  Matériaux Utilisés ({batch.materials_used.length})
                </CardTitle>
                {batch.status === 'planifie' && !quantitiesSaved && (
                  <div className="mt-4 p-3 bg-destructive/10 border border-destructive/30 rounded-md flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-destructive">Quantités non renseignées</p>
                      <p className="text-xs text-destructive/80 mt-1">
                        Veuillez remplir les quantités pour tous les matériaux et sauvegarder avant de passer le batch en cours.
                      </p>
                    </div>
                  </div>
                )}
              </CardHeader>
              <CardContent className="p-0">
                {/* Save Button at Top - visible when batch is planifie */}
                {batch.status === 'planifie' && (
                  <div className="p-4 bg-primary/5 border-b border-primary/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {quantitiesSaved ? 'Modifier les quantités réelles utilisées' : 'Remplissez les quantités réelles utilisées'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {quantitiesSaved ? 'Vous pouvez modifier les quantités avant de passer en production' : 'Les quantités estimées sont calculées automatiquement à partir de la configuration produit'}
                      </p>
                    </div>
                    <Button 
                      onClick={handleSaveQuantitiesClick}
                      disabled={savingQuantities || !areAllMaterialsQuantitiesFilled()}
                      className="w-full md:w-auto"
                    >
                      {savingQuantities ? 'Sauvegarde...' : (quantitiesSaved ? 'Mettre à jour les quantités' : 'Sauvegarder les quantités')}
                    </Button>
                  </div>
                )}
                
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold">Matériau</TableHead>
                        <TableHead className="font-semibold">Couleur</TableHead>
                        <TableHead className="font-semibold">Qté Préconfiguré</TableHead>
                        <TableHead className="font-semibold">Qté Réelle Utilisée</TableHead>
                        <TableHead className="font-semibold">Qté Déchet/Reste</TableHead>
                        <TableHead className="font-semibold">Réutilisable</TableHead>
                        <TableHead className="font-semibold">Unité</TableHead>
                        <TableHead className="font-semibold">Commentaire</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {batch.materials_used.map((material) => {
                        const canEdit = batch.status === 'planifie' || (quantitiesSaved && batch.status !== 'en_cours');
                        const quantityValue = materialsQuantities[material.material_id] ?? material.quantity_filled ?? '';
                        const leftoverData = savedLeftovers.find(l => String(l.material_id) === String(material.material_id));
                        
                        return (
                          <TableRow key={material.id} className="hover:bg-muted/20">
                            <TableCell className="font-medium">
                              <button
                                onClick={() => navigate(`/material-details/${material.material_id}`)}
                                className="text-primary hover:underline cursor-pointer text-left"
                              >
                                {material.nom_matiere}
                              </button>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">{material.couleur || 'Non spécifiée'}</span>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <span className="font-medium text-muted-foreground">{material.quantity_used || '-'}</span>
                                {Number(material.quantity_used) > 0 && (
                                  <div className="text-xs text-muted-foreground">
                                    {material.quantity_used} × {batch.quantity_to_produce} = {(Number(material.quantity_used) * batch.quantity_to_produce).toFixed(2)} {material.quantity_unit}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {canEdit ? (
                                <div className="space-y-1">
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={quantityValue}
                                    onChange={(e) => handleMaterialQuantityChange(material.material_id, e.target.value)}
                                    className={`w-28 ${!quantityValue || quantityValue === 0 ? 'border-destructive' : ''}`}
                                    placeholder="0"
                                  />
                                  {Number(quantityValue) > 0 && (
                                    <div className="space-y-1">
                                      <span className="text-xs text-muted-foreground">
                                        {quantityValue} × {batch.quantity_to_produce} = {(Number(quantityValue) * batch.quantity_to_produce).toFixed(2)} {material.quantity_unit}
                                      </span>
                                      {stockWarnings[material.material_id] && (() => {
                                        const totalRequired = Number(quantityValue) * batch.quantity_to_produce;
                                        const availableStock = materialStocks[material.material_id] || 0;
                                        const maxUnits = Math.floor(availableStock / Number(quantityValue));
                                        
                                        return (
                                          <div className="flex flex-col gap-2 text-xs text-destructive bg-destructive/10 p-2 rounded border border-destructive/30">
                                            <div className="flex items-start gap-1">
                                              <AlertCircle className="h-3 w-3 flex-shrink-0 mt-0.5" />
                                              <div className="flex-1">
                                                <div className="font-semibold">Stock insuffisant!</div>
                                                <div className="mt-1">Requis: {totalRequired.toFixed(2)} {material.quantity_unit}</div>
                                                <div>Disponible: {availableStock.toFixed(2)} {material.quantity_unit}</div>
                                                {maxUnits > 0 && (
                                                  <div className="mt-1 text-muted-foreground">
                                                    Suggestion: Réduire à {maxUnits} unité{maxUnits > 1 ? 's' : ''}
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  <span className="font-medium">{quantityValue || '-'}</span>
                                  {Number(quantityValue) > 0 && (
                                    <div className="text-xs text-muted-foreground">
                                      {quantityValue} × {batch.quantity_to_produce} = {(Number(quantityValue) * batch.quantity_to_produce).toFixed(2)} {material.quantity_unit}
                                    </div>
                                  )}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              {leftoverData ? (
                                <span className="font-medium">{parseFloat(leftoverData.leftover_quantity).toFixed(2)}</span>
                              ) : '-'}
                            </TableCell>
                            <TableCell>
                              {leftoverData ? (
                                leftoverData.is_reusable == 1 || leftoverData.is_reusable === true ? (
                                  <Badge variant="default" className="bg-green-500">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Oui
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary">
                                    <X className="h-3 w-3 mr-1" />
                                    Non
                                  </Badge>
                                )
                              ) : '-'}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {material.quantity_type_name}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {leftoverData?.notes || material.commentaire || '-'}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  
                  {/* Bottom Save Button (Secondary) - Show when planifie OR when quantities can be edited before en_cours */}
                  {batch.status === 'planifie' && (
                    <div className="p-4 bg-muted/30 border-t flex justify-end">
                      <Button 
                        onClick={handleSaveQuantitiesClick}
                        disabled={savingQuantities || !areAllMaterialsQuantitiesFilled()}
                        variant="outline"
                      >
                        {savingQuantities ? 'Sauvegarde...' : (quantitiesSaved ? 'Mettre à jour' : 'Sauvegarder')}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-3 p-3">
                  {batch.materials_used.map((material) => {
                    const canEdit = batch.status === 'planifie' || (quantitiesSaved && batch.status !== 'en_cours');
                    const quantityValue = materialsQuantities[material.material_id] ?? material.quantity_filled ?? '';
                    const leftoverData = savedLeftovers.find(l => String(l.material_id) === String(material.material_id));
                    
                    return (
                      <Card key={material.id} className="border shadow-sm">
                        <CardContent className="p-3 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate">{material.nom_matiere}</p>
                              <p className="text-xs text-muted-foreground">{material.couleur || 'Non spécifiée'}</p>
                            </div>
                            <Badge variant="outline" className="text-xs flex-shrink-0">
                              {material.quantity_type_name}
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Qté préconfiguré:</span>
                              <span className="text-sm font-medium text-muted-foreground">{material.quantity_used || '-'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Qté réelle utilisée:</span>
                              {canEdit ? (
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={quantityValue}
                                  onChange={(e) => handleMaterialQuantityChange(material.material_id, e.target.value)}
                                  className={`w-24 ${!quantityValue || quantityValue === 0 ? 'border-destructive' : ''}`}
                                  placeholder="0"
                                />
                              ) : (
                                <span className="text-sm font-semibold">{quantityValue || '-'}</span>
                              )}
                            </div>
                            {Number(quantityValue) > 0 && (
                              <div className="space-y-1">
                                <span className="text-xs text-muted-foreground">
                                  {quantityValue} × {batch.quantity_to_produce} = {(Number(quantityValue) * batch.quantity_to_produce).toFixed(2)} {material.quantity_unit}
                                </span>
                                {stockWarnings[material.material_id] && (() => {
                                  const totalRequired = Number(quantityValue) * batch.quantity_to_produce;
                                  const availableStock = materialStocks[material.material_id] || 0;
                                  const maxUnits = Math.floor(availableStock / Number(quantityValue));
                                  
                                  return (
                                    <div className="flex flex-col gap-2 text-xs text-destructive bg-destructive/10 p-2 rounded border border-destructive/30">
                                      <div className="flex items-start gap-1">
                                        <AlertCircle className="h-3 w-3 flex-shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                          <div className="font-semibold">Stock insuffisant!</div>
                                          <div className="mt-1">Requis: {totalRequired.toFixed(2)} {material.quantity_unit}</div>
                                          <div>Disponible: {availableStock.toFixed(2)} {material.quantity_unit}</div>
                                          {maxUnits > 0 && (
                                            <div className="mt-1 text-muted-foreground">
                                              Suggestion: Réduire à {maxUnits} unité{maxUnits > 1 ? 's' : ''}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                            )}
                          </div>
                          {leftoverData && (
                            <>
                              <div className="flex items-center gap-2 pt-1 border-t">
                                <span className="text-xs text-muted-foreground">Déchet/Reste:</span>
                                <span className="text-sm font-semibold">{parseFloat(leftoverData.leftover_quantity).toFixed(2)} {material.quantity_type_name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">Réutilisable:</span>
                                {leftoverData.is_reusable == 1 || leftoverData.is_reusable === true ? (
                                  <Badge variant="default" className="bg-green-500 text-xs">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Oui
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="text-xs">
                                    <X className="h-3 w-3 mr-1" />
                                    Non
                                  </Badge>
                                )}
                              </div>
                              {leftoverData.notes && (
                                <div className="pt-1 border-t">
                                  <p className="text-xs text-muted-foreground italic">{leftoverData.notes}</p>
                                </div>
                              )}
                            </>
                          )}
                          {material.commentaire && !leftoverData && (
                            <div className="pt-1 border-t">
                              <p className="text-xs text-muted-foreground">{material.commentaire}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                  
                  {/* Bottom Save Button for Mobile (Secondary) - Show when planifie */}
                  {batch.status === 'planifie' && (
                    <div className="px-3 pb-3">
                      <Button 
                        onClick={handleSaveQuantitiesClick}
                        disabled={savingQuantities || !areAllMaterialsQuantitiesFilled()}
                        className="w-full"
                        variant="outline"
                      >
                        {savingQuantities ? 'Sauvegarde...' : (quantitiesSaved ? 'Mettre à jour' : 'Sauvegarder')}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="p-8 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg text-muted-foreground">Aucun matériau enregistré</p>
              <p className="text-sm text-muted-foreground mt-2">
                Les matériaux seront listés une fois la production démarrée
              </p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4 md:space-y-6">
          <Card>
            <CardHeader className="pb-3 md:pb-4 px-3 md:px-6 pt-3 md:pt-6">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Calendar className="h-4 w-4 md:h-5 md:w-5" />
                Chronologie du Batch
              </CardTitle>
              <p className="text-xs md:text-sm text-muted-foreground">
                Historique complet des changements de statut
              </p>
            </CardHeader>
            <CardContent>
              {loadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-2 text-muted-foreground">Chargement de l'historique...</span>
                </div>
              ) : statusHistory.length > 0 ? (
                <div className="space-y-6">
                  {(() => {
                    const currentUser = authService.getCurrentUser();
                    const isSoustraitance = currentUser?.user_type === 'sous_traitance';
                    const allowedStatuses = isSoustraitance 
                      ? ['planifie', 'termine', 'en_a_collecter']
                      : null;
                    
                    const filteredHistory = allowedStatuses
                      ? statusHistory.filter(entry => allowedStatuses.includes(entry.new_status))
                      : statusHistory;
                    
                    return filteredHistory.map((entry, index) => {
                      const isLast = index === filteredHistory.length - 1;
                      const statusColor = getStatusColorAndText(entry.new_status);
                      const StatusIcon = getStatusIcon(entry.new_status);
                      
                      return (
                        <div key={entry.id} className="relative pl-8">
                        <div className={`absolute left-0 top-1 w-4 h-4 rounded-full ${statusColor.bg}`}></div>
                        {!isLast && (
                          <div className="absolute left-2 top-5 w-0 h-16 border-l-2 border-muted"></div>
                        )}
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            {StatusIcon}
                            <p className={`font-semibold ${statusColor.text}`}>
                              {getStatusLabel(entry.new_status)}
                              {entry.old_status && (
                                <span className="text-muted-foreground font-normal text-sm ml-2">
                                  (depuis {getStatusLabel(entry.old_status)})
                                </span>
                              )}
                            </p>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {entry.changed_at_formatted} • {entry.time_ago}
                          </p>
                          {entry.changed_by && (
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <User className="h-3 w-3" />
                              Par {entry.changed_by}
                            </p>
                          )}
                          {entry.comments && (
                            <p className="text-xs text-muted-foreground mt-1 italic">
                              "{entry.comments}"
                            </p>
                          )}
                        </div>
                      </div>
                      );
                    });
                  })()}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun historique de statut disponible</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Notes & Comments
              </CardTitle>
            </CardHeader>
            <CardContent>
                {/* Add new note section */}
                <div className="mb-6">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Ajouter une note ou commentaire..."
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      className="flex-1"
                      rows={3}
                    />
                    <Button 
                      onClick={addBatchNote}
                      disabled={!newNoteText.trim()}
                      size="sm"
                      className="self-end"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Notes list */}
                <div className="space-y-4">
                  {loadingNotes ? (
                    <div className="text-center text-muted-foreground">
                      Chargement des notes...
                    </div>
                  ) : batchNotes.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Aucune note disponible</p>
                      <p className="text-sm">Ajoutez la première note ci-dessus</p>
                    </div>
                  ) : (
                    batchNotes.map((note) => (
                      <div key={note.id} className="bg-muted p-4 rounded-md">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span className="font-medium text-sm">{note.created_by}</span>
                            <span className="text-xs text-muted-foreground">
                              {note.created_time_ago}
                              {note.created_at !== note.updated_at && (
                                <span> • Modifié {note.updated_time_ago}</span>
                              )}
                            </span>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingNoteId(note.id);
                                setEditingNoteText(note.note_text);
                              }}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteBatchNote(note.id)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        
                        {editingNoteId === note.id ? (
                          <div className="space-y-2">
                            <Textarea
                              value={editingNoteText}
                              onChange={(e) => setEditingNoteText(e.target.value)}
                              rows={3}
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => updateBatchNote(note.id, editingNoteText)}
                                disabled={!editingNoteText.trim()}
                              >
                                <Send className="h-3 w-3 mr-1" />
                                Sauvegarder
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingNoteId(null);
                                  setEditingNoteText('');
                                }}
                              >
                                Annuler
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm whitespace-pre-wrap">{note.note_text}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>

              </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
      
      {/* Save Quantities Confirmation Modal */}
      <AlertDialog open={showSaveQuantitiesModal} onOpenChange={setShowSaveQuantitiesModal}>
        <AlertDialogContent className="bg-background z-50">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Confirmer la sauvegarde des quantités
            </AlertDialogTitle>
            <AlertDialogDescription>
              Vous êtes sur le point de sauvegarder les quantités de matériaux pour ce batch de production.
              <br />
              <br />
              <strong>Important:</strong> Cette action va automatiquement:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Enregistrer les quantités saisies</li>
                <li>Déduire ces quantités du stock disponible</li>
                <li>Créer des transactions de stock pour traçabilité</li>
              </ul>
              <br />
              Voulez-vous continuer?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowSaveQuantitiesModal(false)}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmSaveMaterialsQuantities}
              className="bg-primary hover:bg-primary/90"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirmer et sauvegarder
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Status Change Confirmation Modal */}
      <AlertDialog open={showStatusConfirmModal} onOpenChange={setShowStatusConfirmModal}>
        <AlertDialogContent className="bg-background z-50">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer le changement de statut</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir changer le statut de <strong>{getStatusLabel(batch.status)}</strong> vers <strong>{pendingStatusChange ? getStatusLabel(pendingStatusChange) : ''}</strong> ?
              <br />
              <br />
              Cette action peut affecter le suivi de la production.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setPendingStatusChange(null);
              setShowStatusConfirmModal(false);
            }}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmStatusChange}
              className="bg-primary hover:bg-primary/90"
            >
              <Undo className="h-4 w-4 mr-2" />
              Confirmer le changement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Batch Modal */}
      <AlertDialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <AlertDialogContent className="bg-background z-50">
          <AlertDialogHeader>
            <AlertDialogTitle>Annuler le batch de production</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action annulera définitivement ce batch de production. Cette action est <strong>irréversible</strong>.
              <br />
              <br />
              Veuillez expliquer la raison de cette annulation :
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Raison de l'annulation (obligatoire)..."
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setCancellationReason('');
              setShowCancelModal(false);
            }}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={proceedToFinalConfirmation}
              className="bg-destructive hover:bg-destructive/90"
              disabled={!cancellationReason.trim()}
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Continuer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Final Cancel Confirmation Modal */}
      <AlertDialog open={showFinalCancelConfirm} onOpenChange={setShowFinalCancelConfirm}>
        <AlertDialogContent className="bg-background z-50 border-destructive">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <X className="h-5 w-5" />
              CONFIRMATION FINALE - Annuler le Batch
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <div className="bg-destructive/10 p-4 rounded-lg border border-destructive/20">
                <p className="font-semibold text-destructive mb-2">⚠️ ATTENTION - Action irréversible</p>
                <p>Vous êtes sur le point d'annuler définitivement ce batch de production :</p>
              </div>
              
              <div className="space-y-2 text-sm">
                <p><strong>Référence:</strong> {batch?.batch_reference}</p>
                <p><strong>Produit:</strong> {batch?.reference_product}</p>
                <p><strong>Quantité:</strong> {batch?.quantity_to_produce}</p>
                <p><strong>Status actuel:</strong> {getStatusLabel(batch?.status || '')}</p>
              </div>

              <div className="bg-muted p-3 rounded border-l-4 border-l-destructive">
                <p className="font-semibold text-sm">Raison d'annulation:</p>
                <p className="text-sm italic">"{cancellationReason}"</p>
              </div>

              <div className="text-destructive text-sm font-medium">
                Cette action ne peut pas être annulée. Le batch sera définitivement marqué comme annulé.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowFinalCancelConfirm(false);
              setShowCancelModal(true);
            }}>
              Retour
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={cancelBatch}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              <X className="h-4 w-4 mr-2" />
              ANNULER DÉFINITIVEMENT
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* PDF Preview Modal */}
      <AlertDialog open={showPDFPreview} onOpenChange={setShowPDFPreview}>
        <AlertDialogContent className="max-w-6xl max-h-[90vh] bg-background z-50">
          <AlertDialogHeader>
            <div className="flex items-center justify-between">
              <AlertDialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Prévisualisation du Rapport - {batch?.batch_reference}
              </AlertDialogTitle>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    if (pdfBlob && batch) {
                      const link = document.createElement('a');
                      link.href = pdfBlob;
                      link.download = `Rapport_Production_${batch.batch_reference}.pdf`;
                      link.click();
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Télécharger
                </Button>
                
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (pdfBlob) {
                      const printWindow = window.open(pdfBlob, '_blank');
                      if (printWindow) {
                        printWindow.onload = () => {
                          printWindow.print();
                        };
                      }
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Imprimer
                </Button>
              </div>
            </div>
          </AlertDialogHeader>
          
          <div className="flex-1 min-h-[70vh]">
            {pdfBlob && (
              <iframe
                src={pdfBlob}
                className="w-full h-full min-h-[70vh] border rounded-md bg-white"
                title="PDF Preview"
              />
            )}
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setShowPDFPreview(false);
                if (pdfBlob) {
                  URL.revokeObjectURL(pdfBlob);
                  setPdfBlob(null);
                }
              }}
            >
              Fermer
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Material Transactions Modal */}
      <Dialog open={showTransactionsModal} onOpenChange={setShowTransactionsModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Transactions Matériaux - Batch #{batch?.batch_reference}
            </DialogTitle>
          </DialogHeader>
          
          {batch?.materials_used && batch.materials_used.length > 0 ? (
            <div className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Produit:</span>
                    <p className="font-medium">{batch.nom_product}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Quantité produite:</span>
                    <p className="font-medium">{batch.quantity_to_produce} unités</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Statut:</span>
                    <Badge variant={
                      batch.status === 'termine' ? 'default' : 
                      batch.status === 'en_cours' ? 'secondary' : 'outline'
                    }>
                      {getStatusLabel(batch.status)}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Coût total:</span>
                    <p className="font-medium text-green-600">
                      {Number(batch.total_materials_cost || 0).toFixed(2)} TND
                    </p>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-medium">Matériau</TableHead>
                      <TableHead className="font-medium">Couleur</TableHead>
                      <TableHead className="font-medium">Quantité Utilisée</TableHead>
                      <TableHead className="font-medium">Unité</TableHead>
                      <TableHead className="font-medium">Commentaire</TableHead>
                      <TableHead className="font-medium text-right">Prix Unitaire</TableHead>
                      <TableHead className="font-medium text-right">Coût Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batch.materials_used.map((material, index) => {
                      const materialCost = Number(material.total_cost || 0);
                      const totalBatchCost = Number(batch.total_materials_cost || 1);
                      const percentage = (materialCost / totalBatchCost) * 100;
                      
                      return (
                        <TableRow key={index} className="hover:bg-muted/20">
                          <TableCell>
                            <div>
                              <p className="font-medium">{material.nom_matiere}</p>
                              <p className="text-xs text-muted-foreground">
                                ID: #{material.material_id}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{material.couleur || 'Non spécifiée'}</span>
                          </TableCell>
                          <TableCell className="font-mono">
                            {Number(material.quantity_used || 0).toFixed(3)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {material.quantity_type_name || material.quantity_unit || 'unité'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {material.commentaire || '-'}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {Number(material.unit_cost || 0).toFixed(2)} TND
                          </TableCell>
                          <TableCell className="text-right font-mono font-semibold">
                            {materialCost.toFixed(2)} TND
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Summary */}
              <div className="bg-primary/5 p-4 rounded-lg border">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Résumé des Transactions
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="text-center p-3 bg-background rounded-md">
                    <p className="text-muted-foreground">Matériaux utilisés</p>
                    <p className="text-2xl font-bold text-primary">
                      {batch.materials_used.length}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-background rounded-md">
                    <p className="text-muted-foreground">Coût moyen/matériau</p>
                    <p className="text-2xl font-bold text-primary">
                      {(Number(batch.total_materials_cost || 0) / batch.materials_used.length).toFixed(2)} TND
                    </p>
                  </div>
                  <div className="text-center p-3 bg-background rounded-md">
                    <p className="text-muted-foreground">Coût/unité produite</p>
                    <p className="text-2xl font-bold text-primary">
                      {(Number(batch.total_materials_cost || 0) / Number(batch.quantity_to_produce || 1)).toFixed(2)} TND
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Aucune transaction trouvée</h3>
              <p className="text-muted-foreground">
                Les transactions matériaux apparaîtront ici une fois la production démarrée.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Batch Report Modal */}
      <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Rapport de Production - {batch?.batch_reference}
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handlePrintReport}
                  className="flex items-center gap-2"
                >
                  <FileOutput className="h-4 w-4" />
                  Imprimer
                </Button>
              </div>
            </div>
          </DialogHeader>
          <div className="border rounded-lg overflow-auto max-h-[70vh] bg-white">
            <div id="batch-report-content">
              {batch && <BatchReport 
                batch={batch} 
                measurementScale={measurementScale}
                productImages={[...productImages, ...soustraitanceProductImages, ...batchImages.map(img => img.full_url)]}
                productAttachments={[...productAttachments, ...batchAttachments]}
              />}
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default BatchDetails;
