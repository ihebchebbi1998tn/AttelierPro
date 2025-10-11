import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import ProductionSpecificationsModal from "@/components/ProductionSpecificationsModal";

interface SizeQuantity {
  [key: string]: number;
}

interface ProductSizeQuantityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProducts: any[];
  boutique: string;
  onTransferComplete: () => void;
}

const ProductSizeQuantityModal = ({ 
  open, 
  onOpenChange, 
  selectedProducts, 
  boutique, 
  onTransferComplete 
}: ProductSizeQuantityModalProps) => {
  const { toast } = useToast();
  const [productQuantities, setProductQuantities] = useState<{[productId: string]: SizeQuantity}>({});
  const [transferring, setTransferring] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [transferResult, setTransferResult] = useState<{transferred: number, total: number, details: Array<{name: string, sizes: string}>}>({transferred: 0, total: 0, details: []});
  const [showSpecificationsModal, setShowSpecificationsModal] = useState(false);
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const [productSpecifications, setProductSpecifications] = useState<{[productId: string]: Record<string, string>}>({});
  const [quantitiesConfirmed, setQuantitiesConfirmed] = useState(false);

  // Size categories moved to module scope (see SIZE_CATEGORIES)

  const initializedRef = useRef(false);

  useEffect(() => {
    if (open && !initializedRef.current && selectedProducts.length > 0) {
      const initialQuantities: {[productId: string]: SizeQuantity} = {};
      selectedProducts.forEach(product => {
        initialQuantities[product.id.toString()] = {};
      });
      setProductQuantities(initialQuantities);
      initializedRef.current = true;
      console.log('[QtyModal] Initialized quantities for session', initialQuantities);
    }

    if (!open && initializedRef.current) {
      // Reset session state when modal closes
      initializedRef.current = false;
    }
  }, [open, selectedProducts.length]);

  const updateQuantity = useCallback((productId: string, size: string, quantity: number) => {
    setProductQuantities(prev => ({
      ...prev,
      [productId]: {
        ...(prev[productId] || {}),
        [size]: Math.max(0, quantity),
      },
    }));
  }, []);

  const getTotalQuantity = (productId: string) => {
    const quantities = productQuantities[productId] || {};
    return Object.values(quantities).reduce((sum, qty) => sum + (qty || 0), 0);
  };

  const getOverallTotal = () => {
    return selectedProducts.reduce((total, product) => {
      return total + getTotalQuantity(product.id.toString());
    }, 0);
  };

  const handleContinueToSpecifications = () => {
    // Validate that at least one product has quantities
    const hasQuantities = selectedProducts.some(product => {
      return getTotalQuantity(product.id.toString()) > 0;
    });

    if (!hasQuantities) {
      toast({
        title: "Erreur",
        description: "Veuillez définir au moins une quantité pour un produit",
        variant: "destructive",
      });
      return;
    }

    // Start specifications flow with first product
    setQuantitiesConfirmed(true);
    setCurrentProductIndex(0);
    setShowSpecificationsModal(true);
  };

  const handleSpecificationsSaved = (specs: Record<string, string>) => {
    // Save specifications for current product
    const currentProduct = selectedProducts[currentProductIndex];
    setProductSpecifications(prev => ({
      ...prev,
      [currentProduct.id.toString()]: specs
    }));

    // Move to next product or finalize
    if (currentProductIndex < selectedProducts.length - 1) {
      setCurrentProductIndex(prev => prev + 1);
    } else {
      // All products done, proceed with transfer
      setShowSpecificationsModal(false);
      performTransfer();
    }
  };

  const handleSkipSpecifications = () => {
    // Skip current product specifications
    if (currentProductIndex < selectedProducts.length - 1) {
      setCurrentProductIndex(prev => prev + 1);
    } else {
      // All products done, proceed with transfer
      setShowSpecificationsModal(false);
      performTransfer();
    }
  };

  const performTransfer = async () => {
    setTransferring(true);
    try {
      // Prepare products with size quantities and specifications
      const productsWithQuantities = selectedProducts.map(product => ({
        ...product,
        size_quantities: productQuantities[product.id.toString()] || {},
        production_specifications: productSpecifications[product.id.toString()] || {}
      }));

      const response = await fetch('https://luccibyey.com.tn/production/api/transfer_products_with_quantities.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          products: productsWithQuantities,
          boutique: boutique
        })
      });

      const data = await response.json();

      if (data.success) {
        // Capture the transfer details at the time of success
        const transferDetails = selectedProducts.map(product => {
          const quantities = productQuantities[product.id.toString()] || {};
          const activeSizes = Object.entries(quantities).filter(([_, qty]) => qty > 0);
          return {
            name: product.nom_product,
            sizes: activeSizes.map(([size, qty]) => `${size}(${qty})`).join(', ')
          };
        }).filter(detail => detail.sizes.length > 0);

        setTransferResult({
          transferred: data.data.transferred || selectedProducts.length,
          total: getOverallTotal(),
          details: transferDetails
        });
        setShowSuccessModal(true);
        onTransferComplete();
        onOpenChange(false);
      } else {
        toast({
          title: "Erreur de transfert",
          description: data.message || "Erreur lors du transfert",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors du transfert des produits",
        variant: "destructive",
      });
    } finally {
      setTransferring(false);
    }
  };

  const isMobile = useIsMobile();
  const navigate = useNavigate();

  useEffect(() => {
    if (open && selectedProducts.length > 0) {
      const first = selectedProducts[0];
      console.warn('[QtyModal] Deprecated modal usage detected. Redirecting to page flow.');
      try { onOpenChange?.(false); } catch {}
      navigate(`/production/transfer/${boutique}/${first.id}/quantities`, { state: { product: first } });
    }
  }, [open, selectedProducts, boutique, navigate, onOpenChange]);

  // Size categories moved to module scope and memoized ProductCard to avoid full modal rerenders
  const SIZE_CATEGORIES = {
    clothing: ['xs', 's', 'm', 'l', 'xl', 'xxl', '3xl', '4xl'],
    numeric_pants: ['30', '31', '32', '33', '34', '36', '38', '40', '42', '44', '46', '48', '50', '52', '54', '56', '58', '60', '62', '64', '66'],
    shoes: ['39', '40', '41', '42', '43', '44', '45', '46', '47'],
    belts: ['85', '90', '95', '100', '105', '110', '115', '120', '125']
  } as const;

  type ProductCardProps = {
    product: any;
    quantities?: Record<string, number>;
    onChangeQuantity: (productId: string, size: string, quantity: number) => void;
  };

  type SizeInputProps = {
    productId: string;
    size: string;
    value: number | undefined;
    onChange: (val: number) => void;
  };

  const SizeInput = memo(function SizeInput({ productId, size, value, onChange }: SizeInputProps) {
    const renders = useRef(0);
    renders.current += 1;
    useEffect(() => {
      console.log('[SizeInput] MOUNT', { productId, size });
      return () => console.log('[SizeInput] UNMOUNT', { productId, size });
    }, [productId, size]);
    console.log('[SizeInput] render', { productId, size, count: renders.current, value });

    return (
      <Input
        type="number"
        min="0"
        value={value ?? ''}
        onChange={(e) => {
          const val = parseInt(e.target.value) || 0;
          console.log('[SizeInput] change', { productId, size, val });
          onChange(val);
        }}
        onFocus={() => console.log('[SizeInput] focus', { productId, size })}
        onBlur={() => console.log('[SizeInput] blur', { productId, size })}
        className="h-8 text-xs text-center"
        placeholder="0"
      />
    );
  });

  const ProductCard = memo(function ProductCard({ product, quantities, onChangeQuantity }: ProductCardProps) {
    const total = Object.values(quantities || {}).reduce((sum, qty) => sum + (qty || 0), 0);

    return (
      <Card key={product.id} className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            {product.img_product && (
              <img 
                src={product.img_product} 
                alt={product.nom_product}
                className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-md shrink-0"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/placeholder.svg';
                }}
              />
            )}
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base sm:text-lg truncate">{product.nom_product}</CardTitle>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">Réf: {product.reference_product}</p>
              <Badge variant="outline" className="text-xs mt-1">
                Total: {total} pièces
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(SIZE_CATEGORIES).map(([category, sizes]) => (
              <div key={category} className="space-y-3">
                <Label className="text-sm font-semibold capitalize">
                  {category === 'clothing' ? 'Vêtements' : 
                   category === 'numeric_pants' ? 'Tailles Numériques' :
                   category === 'shoes' ? 'Chaussures' : 'Ceintures'}
                </Label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {sizes.map((size) => (
                    <div key={size} className="flex flex-col space-y-1">
                      <Label className="text-xs text-center font-medium">{size}</Label>
                      <SizeInput
                        productId={product.id.toString()}
                        size={size as string}
                        value={quantities?.[size as string]}
                        onChange={(val) => onChangeQuantity(product.id.toString(), size as string, val)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  });

  const computedOpen = open && !showSpecificationsModal;
  const handleOpenChange = useCallback((o: boolean) => {
    console.log('[QtyModal] onOpenChange', o);
    onOpenChange(o);
  }, [onOpenChange]);

  const renderCountRef = useRef(0);
  renderCountRef.current += 1;
  console.log('[QtyModal] render', { count: renderCountRef.current, open, showSpecificationsModal, computedOpen });

  useEffect(() => {
    console.log('[QtyModal] MOUNT');
    return () => console.log('[QtyModal] UNMOUNT');
  }, []);

  useEffect(() => { console.log('[QtyModal] open prop changed', open); }, [open]);
  useEffect(() => { console.log('[QtyModal] showSpecificationsModal changed', showSpecificationsModal); }, [showSpecificationsModal]);
  useEffect(() => { console.log('[QtyModal] selectedProducts changed', selectedProducts.map(p => p.id)); }, [selectedProducts]);
  useEffect(() => { console.log('[QtyModal] productQuantities updated', productQuantities); }, [productQuantities]);
  useEffect(() => { console.log('[QtyModal] computedOpen changed', computedOpen); }, [computedOpen]);

  const ModalContent = () => (
    <div className="space-y-4 md:space-y-6" onKeyDown={(e) => { console.log('[QtyModal] keydown stopped', e.key); e.stopPropagation(); }}>
      {selectedProducts.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          quantities={productQuantities[product.id.toString()]}
          onChangeQuantity={updateQuantity}
        />
      ))}

      <Separator />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="text-lg font-semibold">
          Total général: {getOverallTotal()} pièces
        </div>
        <Badge variant="default" className="text-sm px-3 py-1">
          {selectedProducts.length} produit{selectedProducts.length > 1 ? 's' : ''}
        </Badge>
      </div>
    </div>
  );

  const FooterButtons = () => (
    <div className="flex flex-col sm:flex-row gap-2 w-full">
      <Button
        variant="outline"
        onClick={() => onOpenChange(false)}
        disabled={transferring}
        className="flex-1 sm:flex-none"
      >
        Annuler
      </Button>
      <Button
        onClick={handleContinueToSpecifications}
        disabled={transferring || getOverallTotal() === 0}
        className="flex-1 sm:flex-none"
      >
        {transferring ? 'Transfert en cours...' : `Continuer (${getOverallTotal()} pièces)`}
      </Button>
    </div>
  );

  if (isMobile) {
    return (<>
      <Drawer open={computedOpen} onOpenChange={handleOpenChange}>
        <DrawerContent className="max-h-[95vh]" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DrawerHeader className="text-left">
            <DrawerTitle className="text-lg">Configuration des Quantités</DrawerTitle>
            <p className="text-sm text-muted-foreground">
              Définissez les quantités à produire pour chaque taille
            </p>
          </DrawerHeader>
          
          <div className="px-4 pb-4 overflow-y-auto flex-1">
            <ModalContent />
          </div>
          
          <DrawerFooter className="mt-auto">
            <FooterButtons />
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Success Modal for Mobile */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
          <div className="flex flex-col items-center text-center space-y-4 py-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-green-800">
                Demande Envoyée avec Succès ! 🎉
              </h3>
            <div className="text-sm text-green-700 space-y-1">
              {transferResult.details.map((detail, index) => (
                <p key={index}>
                  <span className="font-medium">{detail.name}</span> a été demandé pour production
                  <br />
                  <span className="text-xs">Tailles: {detail.sizes}</span>
                </p>
              ))}
            </div>
            </div>

            <div className="w-full p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-xs text-green-600">
                ✓ Configuration des quantités validée<br/>
                ✓ Prêt pour la production
              </p>
            </div>

            <Button 
              onClick={() => setShowSuccessModal(false)}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              Parfait !
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>);
  }

  return (<>
    <Dialog open={computedOpen} onOpenChange={handleOpenChange}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        onEscapeKeyDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onOpenAutoFocus={(e) => { e.preventDefault(); }}
        onCloseAutoFocus={(e) => { console.log('[QtyModal] onCloseAutoFocus'); }}
        onPointerDownOutside={(e) => { console.log('[QtyModal] onPointerDownOutside'); }}
        onInteractOutside={(e) => { console.log('[QtyModal] onInteractOutside'); }}
        onFocusCapture={(e) => { console.log('[QtyModal] focus capture', (e.target as HTMLElement)?.tagName); }}
        onBlurCapture={(e) => { console.log('[QtyModal] blur capture', (e.target as HTMLElement)?.tagName); }}
      >
        <DialogHeader>
          <DialogTitle>Configuration des Quantités de Production</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Définissez précisément les quantités à produire pour chaque taille pour optimiser l'utilisation des matériaux
          </p>
        </DialogHeader>

        <ModalContent />

        <DialogFooter>
          <FooterButtons />
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Success Modal */}
    <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
      <DialogContent className="sm:max-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
        <div className="flex flex-col items-center text-center space-y-4 py-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-green-800">
              Demande Envoyée avec Succès ! 🎉
            </h3>
            <div className="text-sm text-green-700 space-y-1">
              {transferResult.details.map((detail, index) => (
                <p key={index}>
                  <span className="font-medium">{detail.name}</span> a été demandé pour production
                  <br />
                  <span className="text-xs">Tailles: {detail.sizes}</span>
                </p>
              ))}
            </div>
          </div>

          <div className="w-full p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-xs text-green-600">
              ✓ Configuration des quantités validée<br/>
              ✓ Prêt pour la production
            </p>
          </div>

          <Button 
            onClick={() => setShowSuccessModal(false)}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            Parfait !
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    
    {/* Specifications Modal */}
    {quantitiesConfirmed && selectedProducts[currentProductIndex] && (
      <ProductionSpecificationsModal
        key={selectedProducts[currentProductIndex]?.id}
        open={showSpecificationsModal}
        onClose={handleSkipSpecifications}
        onSave={handleSpecificationsSaved}
        initialSpecifications={productSpecifications[selectedProducts[currentProductIndex]?.id?.toString()] || {}}
        productName={`${selectedProducts[currentProductIndex]?.nom_product} (${currentProductIndex + 1}/${selectedProducts.length})`}
      />
    )}
  </>);
};

export default ProductSizeQuantityModal;