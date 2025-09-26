import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SizeBreakdownProps {
  product: any;
}

const SizeBreakdown = ({ product }: SizeBreakdownProps) => {
  // Extract all size fields from the product
  const getAllSizes = () => {
    const sizeFields = [
      // Standard sizes
      { key: 'xs_size', label: 'XS' },
      { key: 's_size', label: 'S' },
      { key: 'm_size', label: 'M' },
      { key: 'l_size', label: 'L' },
      { key: 'xl_size', label: 'XL' },
      { key: 'xxl_size', label: 'XXL' },
      { key: '3xl_size', label: '3XL' },
      { key: '4xl_size', label: '4XL' },
      // Numeric sizes
      { key: '30_size', label: '30' },
      { key: '31_size', label: '31' },
      { key: '32_size', label: '32' },
      { key: '33_size', label: '33' },
      { key: '34_size', label: '34' },
      { key: '36_size', label: '36' },
      { key: '38_size', label: '38' },
      { key: '39_size', label: '39' },
      { key: '40_size', label: '40' },
      { key: '41_size', label: '41' },
      { key: '42_size', label: '42' },
      { key: '43_size', label: '43' },
      { key: '44_size', label: '44' },
      { key: '45_size', label: '45' },
      { key: '46_size', label: '46' },
      { key: '47_size', label: '47' },
      { key: '48_size', label: '48' },
      { key: '50_size', label: '50' },
      { key: '52_size', label: '52' },
      { key: '54_size', label: '54' },
      { key: '56_size', label: '56' },
      { key: '58_size', label: '58' },
      { key: '60_size', label: '60' },
      { key: '62_size', label: '62' },
      { key: '64_size', label: '64' },
      { key: '66_size', label: '66' },
      // Belt sizes
      { key: '85_size', label: '85' },
      { key: '90_size', label: '90' },
      { key: '95_size', label: '95' },
      { key: '100_size', label: '100' },
      { key: '105_size', label: '105' },
      { key: '110_size', label: '110' },
      { key: '115_size', label: '115' },
      { key: '120_size', label: '120' },
      { key: '125_size', label: '125' },
    ];

    return sizeFields
      .map(size => ({
        label: size.label,
        quantity: parseInt(product[size.key] || '0'),
      }))
      .filter(size => size.quantity > 0)
      .sort((a, b) => {
        // Sort standard sizes first, then numeric
        const standardOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'];
        const aIndex = standardOrder.indexOf(a.label);
        const bIndex = standardOrder.indexOf(b.label);
        
        if (aIndex !== -1 && bIndex !== -1) {
          return aIndex - bIndex;
        } else if (aIndex !== -1) {
          return -1;
        } else if (bIndex !== -1) {
          return 1;
        } else {
          return parseInt(a.label) - parseInt(b.label);
        }
      });
  };

  const sizes = getAllSizes();

  if (sizes.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Répartition des Tailles</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
          {sizes.map((size, index) => (
            <div key={index} className="text-center">
              <Badge 
                variant="outline" 
                className="w-full justify-center mb-1 font-semibold"
              >
                {size.label}
              </Badge>
              <div className="text-sm text-muted-foreground font-medium">
                {size.quantity}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            <strong>Total disponible:</strong> {sizes.reduce((sum, size) => sum + size.quantity, 0)} pièces
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SizeBreakdown;