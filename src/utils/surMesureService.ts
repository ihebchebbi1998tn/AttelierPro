import axios from 'axios';

const API_BASE_URL = 'https://luccibyey.com.tn/api';

export interface SurMesureOrder {
  id: number;
  client_name: string;
  client_vorname: string;
  client_email: string;
  client_phone: string;
  client_address: string;
  client_region: string;
  product_name: string;
  ready_date: string;
  first_try_date: string;
  first_try_scheduled_time?: string;
  first_try_completed_at?: string;
  second_try_date?: string;
  second_try_scheduled_time?: string;
  second_try_completed_at?: string;
  third_try_date?: string;
  third_try_scheduled_time?: string;
  third_try_completed_at?: string;
  status: 'new' | 'in_progress' | 'ready_for_pickup' | 'ready_for_try' | 'first_try' | 'needs_revision' | 'ready_for_second_try' | 'completed';
  measurements: Record<string, number>;
  tolerance: Record<string, number>;
  couple: Array<{ donne: string; valeur: string }>;
  images: Array<{ id: number; path: string; commentaire?: string }>;
  videos?: Array<{ id: number; path: string; commentaire?: string }>;
  commentaires: Array<{ id: number; commentaire: string; created_by: string; date_creation: string }>;
  created_at: string;
  updated_at: string;
  is_seen: string;
  is_confirmed: string;
}

export const fetchSurMesureOrders = async (): Promise<SurMesureOrder[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/get_sur_mesure_orders.php`);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error('Failed to fetch orders');
  } catch (error) {
    console.error('Error fetching sur mesure orders:', error);
    throw error;
  }
};

// Fetch only unseen sur mesure orders
export const fetchUnseenSurMesureOrders = async (): Promise<SurMesureOrder[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/get_sur_mesure_orders.php?is_seen=0`);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error('Failed to fetch unseen orders');
  } catch (error) {
    console.error('Error fetching unseen sur mesure orders:', error);
    throw error;
  }
};

export const createSurMesureOrder = async (orderData: any): Promise<void> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/insert_sur_mesure_order.php`, orderData);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to create order');
    }
  } catch (error) {
    console.error('Error creating sur mesure order:', error);
    throw error;
  }
};

export const updateSurMesureOrderStatus = async (orderId: number, status: string): Promise<void> => {
  try {
    console.log('Updating status for order:', orderId, 'to status:', status);
    
    const response = await axios.post(`${API_BASE_URL}/update_sur_mesure_status.php`, {
      id: parseInt(orderId.toString()),
      status: status
    });
    
    console.log('Status update response:', response.data);
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to update status');
    }
  } catch (error) {
    console.error('Error updating sur mesure order status:', error);
    
    if (error.response?.status === 500) {
      throw new Error('Erreur serveur: Impossible de mettre à jour le statut. Vérifiez la connexion à la base de données.');
    }
    
    throw error;
  }
};

export const addSurMesureComment = async (orderId: number, comment: string, createdBy: string = 'Usine production'): Promise<void> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/add_sur_mesure_comment.php`, {
      order_id: orderId,
      commentaire: comment,
      created_by: createdBy
    });
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to add comment');
    }
  } catch (error) {
    console.error('Error adding sur mesure comment:', error);
    throw error;
  }
};

export const getSurMesureOrderDetails = async (orderId: number): Promise<SurMesureOrder> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/get_sur_mesure_order_details.php?id=${orderId}`);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch order details');
  } catch (error) {
    console.error('Error fetching sur mesure order details:', error);
    throw error;
  }
};

export const updateSurMesureOrderComplete = async (orderData: any): Promise<SurMesureOrder> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/update_sur_mesure_order_complete.php`, orderData);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to update order');
  } catch (error) {
    console.error('Error updating sur mesure order:', error);
    throw error;
  }
};

export const updateSurMesureTries = async (orderId: number, numberOfTries: number): Promise<void> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/update_sur_mesure_tries.php`, {
      id: orderId,
      number_of_tries: numberOfTries
    });
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to update tries');
    }
  } catch (error) {
    console.error('Error updating sur mesure tries:', error);
    throw error;
  }
};

// Upload image for sur mesure order
export const uploadSurMesureImage = async (commandeId: number, imageFile: File, commentaire?: string) => {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('commande_id', commandeId.toString());
    if (commentaire) {
      formData.append('commentaire', commentaire);
    }

    const response = await fetch('https://luccibyey.com.tn/api/upload_sur_mesure_image.php', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Upload failed');
    }

    return data.data;
  } catch (error) {
    console.error('Error uploading sur mesure image:', error);
    throw error;
  }
};

// Upload video for sur mesure order (regular upload for small files)
export const uploadSurMesureVideo = async (commandeId: number, videoFile: File, commentaire?: string) => {
  try {
    const formData = new FormData();
    formData.append('video', videoFile);
    formData.append('commande_id', commandeId.toString());
    if (commentaire) {
      formData.append('commentaire', commentaire);
    }

    const response = await fetch('https://luccibyey.com.tn/api/upload_sur_mesure_video.php', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Upload failed');
    }

    return data.data;
  } catch (error) {
    console.error('Error uploading sur mesure video:', error);
    throw error;
  }
};

// Upload large video for sur mesure order (chunked upload)
export const uploadSurMesureVideoChunked = async (
  commandeId: number, 
  videoFile: File, 
  commentaire?: string,
  onProgress?: (progress: number, stage: 'uploading' | 'merging') => void,
  onChunkProgress?: (chunkIndex: number, totalChunks: number) => void
) => {
  try {
    // For now, use regular upload and simulate chunked progress
    if (onProgress) {
      onProgress(0, 'uploading');
    }
    
    const formData = new FormData();
    formData.append('video', videoFile);
    formData.append('commande_id', commandeId.toString());
    if (commentaire) {
      formData.append('commentaire', commentaire);
    }

    const response = await fetch('https://luccibyey.com.tn/api/upload_sur_mesure_video.php', {
      method: 'POST',
      body: formData,
    });

    if (onProgress) {
      onProgress(50, 'uploading');
    }

    const data = await response.json();
    
    if (onProgress) {
      onProgress(100, 'merging');
    }
    
    if (!data.success) {
      throw new Error(data.error || 'Upload failed');
    }

    return data.data;
  } catch (error) {
    console.error('Error uploading chunked sur mesure video:', error);
    throw error;
  }
};

// Delete media (image or video) from sur mesure order
export const deleteSurMesureMedia = async (mediaId: number, mediaType: 'image' | 'video') => {
  try {
    const formData = new FormData();
    formData.append('media_id', mediaId.toString());
    formData.append('media_type', mediaType);

    const response = await fetch('https://luccibyey.com.tn/api/delete_sur_mesure_media.php', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Delete failed');
    }

    return data;
  } catch (error) {
    console.error('Error deleting sur mesure media:', error);
    throw error;
  }
};
// Get media URL for display (following same pattern as imageUtils)
export const getSurMesureMediaUrl = (mediaPath: string) => {
  if (!mediaPath) return '';
  
  // If it's already a full URL, return as is
  if (mediaPath.startsWith('http')) {
    return mediaPath;
  }
  
  // Construct full URL using API path
  const cleanPath = mediaPath.startsWith('/') ? mediaPath.substring(1) : mediaPath;
  return `https://luccibyey.com.tn/api/${cleanPath}`;
};

// Materials API functions for Surmesure orders

export interface SurMesureMaterial {
  id: number;
  commande_id: number;
  material_id: number;
  material_name: string;
  material_description?: string;
  material_stock: number;
  material_color?: string;
  material_price?: number;
  material_image_url?: string;
  quantity_needed: number;
  quantity_type_id: number;
  quantity_type_name: string;
  quantity_unit: string;
  category_name?: string;
  fournisseur_name?: string;
  commentaire?: string;
  created_at: string;
  updated_at: string;
}

// Get materials for a specific surmesure order
export const getSurMesureMaterials = async (commandeId: number): Promise<SurMesureMaterial[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/surmesure_matieres.php?commande_id=${commandeId}`);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch materials');
  } catch (error) {
    console.error('Error fetching surmesure materials:', error);
    throw error;
  }
};

// Add a single material to surmesure order
export const addSurMesureMaterial = async (data: {
  commande_id: number;
  material_id: number;
  quantity_needed: number;
  quantity_type_id: number;
  commentaire?: string;
}): Promise<void> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/surmesure_matieres.php`, data);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to add material');
    }
  } catch (error) {
    console.error('Error adding surmesure material:', error);
    throw error;
  }
};

// Configure multiple materials for a surmesure order (replaces existing)
export const configureSurMesureMaterials = async (commandeId: number, materials: Array<{
  material_id: number;
  quantity_needed: number;
  quantity_type_id: number;
  commentaire?: string;
}>): Promise<void> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/surmesure_matieres.php`, {
      action: 'configure_surmesure_materials',
      commande_id: commandeId,
      materials: materials
    });
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to configure materials');
    }
  } catch (error) {
    console.error('Error configuring surmesure materials:', error);
    throw error;
  }
};

// Update a specific material configuration
export const updateSurMesureMaterial = async (data: {
  id: number;
  material_id: number;
  quantity_needed: number;
  quantity_type_id: number;
  commentaire?: string;
}): Promise<void> => {
  try {
    const response = await axios.put(`${API_BASE_URL}/surmesure_matieres.php`, data);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to update material');
    }
  } catch (error) {
    console.error('Error updating surmesure material:', error);
    throw error;
  }
};

// Delete a material from surmesure order
export const deleteSurMesureMaterial = async (id: number): Promise<void> => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/surmesure_matieres.php?id=${id}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete material');
    }
  } catch (error) {
    console.error('Error deleting surmesure material:', error);
    throw error;
  }
};

// Get orders using a specific material (for material usage tracking)
export const getSurMesureOrdersByMaterial = async (materialId: number): Promise<any[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/surmesure_matieres.php?material_id=${materialId}`);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch orders by material');
  } catch (error) {
    console.error('Error fetching orders by material:', error);
    throw error;
  }
};

// Options & Finitions API functions

export interface OptionFinition {
  id: number;
  commande_id: number;
  title: string;
  description?: string;
  image_url?: string;
  created_date: string;
  updated_date: string;
}

// Get options & finitions for a specific order
export const getOptionsFinitions = async (commandeId: number): Promise<OptionFinition[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/get_options_finitions.php?commande_id=${commandeId}`);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch options & finitions');
  } catch (error) {
    console.error('Error fetching options & finitions:', error);
    throw error;
  }
};

// Create a new option/finition
export const createOptionFinition = async (data: {
  commande_id: number;
  title: string;
  description?: string;
  image_url?: string;
}): Promise<OptionFinition> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/create_option_finition.php`, data);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to create option/finition');
  } catch (error) {
    console.error('Error creating option/finition:', error);
    throw error;
  }
};

// Update an option/finition
export const updateOptionFinition = async (data: {
  id: number;
  title: string;
  description?: string;
  image_url?: string;
}): Promise<OptionFinition> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/update_option_finition.php`, data);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to update option/finition');
  } catch (error) {
    console.error('Error updating option/finition:', error);
    throw error;
  }
};

// Delete an option/finition
export const deleteOptionFinition = async (id: number): Promise<void> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/delete_option_finition.php`, { id });
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete option/finition');
    }
  } catch (error) {
    console.error('Error deleting option/finition:', error);
    throw error;
  }
};

// Upload image for option/finition
export const uploadOptionFinitionImage = async (optionId: number, imageFile: File) => {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('option_id', optionId.toString());

    const response = await fetch(`${API_BASE_URL}/upload_option_finition_image.php`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Upload failed');
    }

    return data.data;
  } catch (error) {
    console.error('Error uploading option/finition image:', error);
    throw error;
  }
};

// Mark sur mesure order as seen
export const markSurMesureOrderAsSeen = async (orderId: number): Promise<void> => {
  try {
    console.log('🔄 Marking order as seen, ID:', orderId);
    const response = await axios.post('https://luccibyey.com.tn/production/api/mark_sur_mesure_seen.php', {
      id: orderId
    });
    console.log('✅ API Response:', response.data);
    if (!response.data.success) {
      console.error('❌ API returned error:', response.data.message);
      throw new Error(response.data.message || 'Failed to mark order as seen');
    }
    console.log('✅ Order marked as seen successfully, rows affected:', response.data.rows_affected);
  } catch (error) {
    console.error('❌ Error marking sur mesure order as seen:', error);
    if (error.response) {
      console.error('❌ Response data:', error.response.data);
      console.error('❌ Response status:', error.response.status);
    }
    throw error;
  }
};