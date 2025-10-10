export const getProductImageUrl = (imagePath: string, boutiqueOrigin: string): string => {
  if (!imagePath) return '';
  
  // Clean the path by removing any leading slashes or 'uploads/' duplicates
  const cleanPath = imagePath.replace(/^\/+/, '').replace(/^uploads\//, 'uploads/');
  
  if (boutiqueOrigin === 'luccibyey') {
    // Database already includes uploads/ prefix, so just append to API base URL
    return `https://luccibyey.com.tn/api/${cleanPath}`;
  } else if (boutiqueOrigin === 'spadadibattaglia') {
    // Database stores paths with 'uploads/', prepend domain
    return `https://spadadibattaglia.com/${cleanPath}`;
  }
  
  return '';
};

export const getProductImages = (product: any): string[] => {
  const images: string[] = [];
  const imageFields = ['img_product', 'img2_product', 'img3_product', 'img4_product', 'img5_product'];
  
  imageFields.forEach(field => {
    if (product[field]) {
      const imageUrl = getProductImageUrl(product[field], product.boutique_origin);
      if (imageUrl) images.push(imageUrl);
    }
  });
  
  return images;
};