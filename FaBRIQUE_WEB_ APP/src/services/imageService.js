import { isSupabaseConfigured, supabase } from '../lib/supabase.js'

async function uploadProductImage({ vendorId, productId, file, altText = '', imageRole = 'item' }) {
  if (!vendorId || !productId || !file || !isSupabaseConfigured || !supabase) return { data: null, error: null }
  if (!['item', 'model'].includes(imageRole)) throw new Error('Choose a valid image type.')
  if (!file.type?.startsWith('image/')) throw new Error('Please upload an image file.')
  if (file.size > 10 * 1024 * 1024) throw new Error('Images must be 10 MB or smaller.')

  const sanitizedName = file.name.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9._-]/g, '')
  const storagePath = `${vendorId}/${productId}/${imageRole}/${Date.now()}-${sanitizedName}`
  const { error: uploadError } = await supabase.storage.from('product-images').upload(storagePath, file, {
    cacheControl: '3600', upsert: false, contentType: file.type,
  })
  if (uploadError) throw uploadError

  const { data: existingImages, error: listError } = await supabase.from('product_images')
    .select('sort_order, is_primary, image_role').eq('product_id', productId).order('sort_order', { ascending: true })
  if (listError) {
    await supabase.storage.from('product-images').remove([storagePath])
    throw listError
  }
  const nextSortOrder = existingImages?.length ?? 0
  const isPrimary = imageRole === 'item' && !((existingImages ?? []).some((image) => (image.image_role ?? 'item') === 'item' && image.is_primary))
  const { data, error } = await supabase.from('product_images').insert([{
    product_id: productId, storage_path: storagePath, alt_text: (altText || sanitizedName).slice(0, 300),
    sort_order: nextSortOrder, is_primary: isPrimary, image_role: imageRole,
  }]).select().single()
  if (error) {
    await supabase.storage.from('product-images').remove([storagePath])
    throw error
  }
  return { data, error: null }
}

async function deleteProductImage({ productId, vendorId, imageId, storagePath }) {
  if (!productId || !vendorId || !imageId || !isSupabaseConfigured || !supabase) return { data: null, error: null }
  const { error: dbError } = await supabase.from('product_images').delete()
    .eq('id', imageId).eq('product_id', productId)
  if (dbError) throw dbError
  if (storagePath) {
    const { error: storageError } = await supabase.storage.from('product-images').remove([storagePath])
    if (storageError) throw storageError
  }
  return { data: { productId, vendorId, imageId }, error: null }
}

async function setPrimaryProductImage({ productId, vendorId, imageId }) {
  if (!productId || !vendorId || !imageId || !isSupabaseConfigured || !supabase) return { data: null, error: null }
  const { data: target, error: targetError } = await supabase.from('product_images').select('id, image_role')
    .eq('id', imageId).eq('product_id', productId).maybeSingle()
  if (targetError) throw targetError
  if (!target || (target.image_role ?? 'item') !== 'item') throw new Error('Only actual item photos can be the primary image.')
  const { error: clearError } = await supabase.from('product_images').update({ is_primary: false }).eq('product_id', productId).eq('image_role', 'item')
  if (clearError) throw clearError
  const { data, error } = await supabase.from('product_images').update({ is_primary: true })
    .eq('id', imageId).eq('product_id', productId).select().single()
  if (error) throw error
  return { data, error: null }
}

async function reorderProductImages({ productId, imageIds }) {
  if (!productId || !imageIds?.length || !isSupabaseConfigured || !supabase) return { data: [], error: null }
  const results = await Promise.all(imageIds.map((id, sort_order) => supabase.from('product_images')
    .update({ sort_order }).eq('id', id).eq('product_id', productId)))
  const failure = results.find((result) => result.error)
  if (failure) throw failure.error
  return { data: true, error: null }
}

export { deleteProductImage, reorderProductImages, setPrimaryProductImage, uploadProductImage }
