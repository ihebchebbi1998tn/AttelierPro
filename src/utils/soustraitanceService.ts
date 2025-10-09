const API_BASE_URL = 'https://luccibyey.com.tn/production/api';

// Upload image for soustraitance product (automatically finds next available slot)
export const uploadSoustraitanceProductImageAuto = async (productId: string, imageFile: File) => {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('product_id', productId);

    const response = await fetch(`${API_BASE_URL}/upload_soustraitance_product_image.php`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || data.message || 'Upload failed');
    }

    return data.data;
  } catch (error) {
    console.error('Error uploading soustraitance product image:', error);
    throw error;
  }
};

// Upload temporary image (before product creation)
export const uploadTempSoustraitanceProductImage = async (imageFile: File) => {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('temp_upload', 'true');

    const response = await fetch(`${API_BASE_URL}/upload_soustraitance_product_image.php`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || data.message || 'Upload failed');
    }

    return data.data;
  } catch (error) {
    console.error('Error uploading temp soustraitance product image:', error);
    throw error;
  }
};

// Assign temporary images to product after creation
export const assignTempImagesToProduct = async (productId: string, tempImagePaths: string[]) => {
  try {
    const response = await fetch(`${API_BASE_URL}/upload_soustraitance_product_image.php`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_id: productId,
        temp_images: tempImagePaths
      }),
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || data.message || 'Assignment failed');
    }

    return data.data;
  } catch (error) {
    console.error('Error assigning temp images to product:', error);
    throw error;
  }
};

// Delete specific image from soustraitance product
export const deleteSoustraitanceProductImage = async (productId: string, imageSlot: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/upload_soustraitance_product_image.php`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_id: productId,
        image_slot: imageSlot
      }),
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || data.message || 'Delete failed');
    }

    return data.data;
  } catch (error) {
    console.error('Error deleting soustraitance product image:', error);
    throw error;
  }
};

// Upload image for soustraitance product (specific slot - legacy)
export const uploadSoustraitanceProductImage = async (productId: string, imageSlot: string, imageFile: File) => {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('product_id', productId);
    formData.append('image_slot', imageSlot);

    const response = await fetch(`${API_BASE_URL}/soustraitance_product_images.php`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || data.message || 'Upload failed');
    }

    return data.data;
  } catch (error) {
    console.error('Error uploading soustraitance product image:', error);
    throw error;
  }
};

// Get soustraitance clients
export const getSoustraitanceClients = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/soustraitance_clients.php`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || data.message || 'Failed to fetch clients');
    }

    return data.data;
  } catch (error) {
    console.error('Error fetching soustraitance clients:', error);
    throw error;
  }
};

// Create soustraitance product with images
export const createSoustraitanceProduct = async (productData: any, imageFiles?: File[]) => {
  try {
    const formData = new FormData();
    
    // Add all product data to FormData
    Object.keys(productData).forEach(key => {
      if (productData[key] !== null && productData[key] !== undefined) {
        formData.append(key, productData[key].toString());
      }
    });
    
    // Add image files if provided
    if (imageFiles && imageFiles.length > 0) {
      imageFiles.forEach((file, index) => {
        formData.append(`image_${index}`, file);
      });
    }

    const response = await fetch(`${API_BASE_URL}/soustraitance_products.php`, {
      method: 'POST',
      body: formData, // Use FormData instead of JSON
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || data.message || 'Failed to create product');
    }

    return data;
  } catch (error) {
    console.error('Error creating soustraitance product:', error);
    throw error;
  }
};

// Update soustraitance product
export const updateSoustraitanceProduct = async (productId: string, productData: any) => {
  try {
    const response = await fetch(`${API_BASE_URL}/soustraitance_products.php?id=${productId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productData),
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || data.message || 'Failed to update product');
    }

    return data;
  } catch (error) {
    console.error('Error updating soustraitance product:', error);
    throw error;
  }
};

// Get soustraitance product by ID
export const getSoustraitanceProduct = async (productId: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/soustraitance_products.php?id=${productId}`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || data.message || 'Failed to fetch product');
    }

    return data.data;
  } catch (error) {
    console.error('Error fetching soustraitance product:', error);
    throw error;
  }
};