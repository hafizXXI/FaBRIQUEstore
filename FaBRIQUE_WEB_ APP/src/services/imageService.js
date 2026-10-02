import { isSupabaseConfigured, supabase } from '../lib/supabase.js'

async function uploadProductImage({ vendorId, productId, file, altText = '' }) {
  if (!vendorId || !productId || !file || !isSupabaseConfigured || !supabase) {
    return { data: null, error: null }
  }

  const sanitizedName = file.name.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9._-]/g, '')
  const storagePath = `${vendorId}/${productId}/${Date.now()}-${sanitizedName}`

  const { error: uploadError } = await supabase.storage
    .from('product-images')
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || 'image/jpeg',
    })

  if (uploadError) {
    throw uploadError
  }

  const { data: existingImages } = await supabase
    .from('product_images')
    .select('sort_order, is_primary')
    .eq('product_id', productId)
    .order('sort_order', { ascending: true })

  const nextSortOrder = existingImages?.length ?? 0
  const { data, error } = await supabase
    .from('product_images')
    .insert([
      {
        product_id: productId,
        storage_path: storagePath,
        alt_text: altText || sanitizedName,
        sort_order: nextSortOrder,
        is_primary: !((existingImages ?? []).length > 0),
      },
    ])
    .select()
    .single()

  if (error) {
    throw error
  }

  return { data, error: null }
}

async function deleteProductImage({ productId, vendorId, imageId, storagePath }) {
  if (!imageId || !isSupabaseConfigured || !supabase) {
    return { data: null, error: null }
  }

  const { error: dbError } = await supabase.from('product_images').delete().eq('id', imageId)

  if (dbError) {
    throw dbError
  }

  if (storagePath) {
    const { error: storageError } = await supabase.storage.from('product-images').remove([storagePath])
    if (storageError) {
      throw storageError
    }
  }

  return { data: { productId, vendorId, imageId }, error: null }
}

async function setPrimaryProductImage({ productId, vendorId, imageId }) {
  if (!productId || !imageId || !isSupabaseConfigured || !supabase) {
    return { data: null, error: null }
  }

  await supabase.from('product_images').update({ is_primary: false }).eq('product_id', productId)
  const { data, error } = await supabase
    .from('product_images')
    .update({ is_primary: true })
    .eq('id', imageId)
    .eq('product_id', productId)
    .select()
    .single()

  if (error) {
    throw error
  }

  return { data, error: null }
}

async function reorderProductImages({ productId, imageIds }) {
  if (!productId || !imageIds?.length || !isSupabaseConfigured || !supabase) {
    return { data: [], error: null }
  }

  const updates = imageIds.map((imageId, index) => ({
    id: imageId,
    sort_order: index,
  }))

  const { data, error } = await supabase.from('product_images').upsert(updates)
  if (error) {
    throw error
  }

  return { data, error: null }
}

export { deleteProductImage, reorderProductImages, setPrimaryProductImage, uploadProductImage }
