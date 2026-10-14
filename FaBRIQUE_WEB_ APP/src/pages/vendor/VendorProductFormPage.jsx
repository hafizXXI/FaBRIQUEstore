import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getCategories } from '../../services/categoryService.js'
import { getVendorProductById, createProduct, updateProduct } from '../../services/productService.js'
import { uploadProductImage, deleteProductImage, setPrimaryProductImage } from '../../services/imageService.js'
import { useAuth } from '../../contexts/AuthContext.jsx'

function makeSlug(value) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

function VendorProductFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { vendorApplication, isSupabaseConfigured } = useAuth()
  const [categories, setCategories] = useState([])
  const [product, setProduct] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadingRole, setUploadingRole] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const isEditMode = Boolean(id)

  const { register, handleSubmit, reset, watch } = useForm({
    defaultValues: {
      name: '', categoryId: '', description: '', price: 0, quantity: 0, unit: 'yard',
      color: '', pattern: '', condition: 'new', status: 'draft', listingType: 'fabric',
    },
  })
  const currentImages = useMemo(() => product?.images ?? [], [product])
  const watchName = watch('name')
  const watchCondition = watch('condition')
  const watchListingType = watch('listingType')
  const itemImages = currentImages.filter((image) => (image.image_role ?? 'item') === 'item')
  const modelImages = currentImages.filter((image) => image.image_role === 'model')

  useEffect(() => {
    async function loadOptions() {
      if (!isSupabaseConfigured || !vendorApplication) return
      const { data: categoryData } = await getCategories({ activeOnly: true })
      setCategories(categoryData ?? [])
      if (!isEditMode) return
      const { data: currentProduct } = await getVendorProductById(id)
      setProduct(currentProduct)
      if (currentProduct) reset({
        name: currentProduct.name || '', categoryId: currentProduct.category?.id || '',
        description: currentProduct.description || '', price: Number(currentProduct.price || 0),
        quantity: Number(currentProduct.quantity || 0), unit: currentProduct.unit || 'yard',
        color: currentProduct.color || '', pattern: currentProduct.pattern || '',
        condition: currentProduct.condition || 'new', status: currentProduct.status || 'draft',
        listingType: currentProduct.listingType || 'fabric',
      })
    }
    loadOptions().catch((loadError) => setError(loadError.message || 'Unable to load product form.'))
  }, [isEditMode, id, isSupabaseConfigured, reset, vendorApplication])

  async function refreshProduct() {
    if (!product?.id) return
    const { data } = await getVendorProductById(product.id)
    setProduct(data)
  }

  async function handleImageUpload(event, imageRole) {
    const file = event.target.files?.[0]
    if (!file || !product) return
    try {
      setUploadingRole(imageRole)
      setError('')
      await uploadProductImage({
        vendorId: vendorApplication.id, productId: product.id, file,
        altText: `${product.name} ${imageRole === 'model' ? 'styled by seller' : 'actual item'}`,
        imageRole,
      })
      await refreshProduct()
    } catch (uploadError) {
      setError(uploadError.message || 'Unable to upload the selected image.')
    } finally {
      setUploadingRole('')
      event.target.value = ''
    }
  }

  async function handleDeleteImage(image) {
    if (!product) return
    try {
      await deleteProductImage({
        productId: product.id, vendorId: vendorApplication.id,
        imageId: image.id, storagePath: image.storage_path,
      })
      await refreshProduct()
    } catch (deleteError) {
      setError(deleteError.message || 'Unable to remove that image.')
    }
  }

  async function handlePrimaryImage(imageId) {
    if (!product) return
    try {
      await setPrimaryProductImage({ productId: product.id, vendorId: vendorApplication.id, imageId })
      await refreshProduct()
    } catch (imageError) {
      setError(imageError.message || 'Unable to update the primary image.')
    }
  }

  async function onSubmit(formData) {
    if (!vendorApplication || !isSupabaseConfigured) return
    if (!formData.name || formData.name.trim().length < 2) return setError('Product name is required.')
    if (!formData.categoryId) return setError('Please select a category.')
    if (!formData.unit?.trim()) return setError('Unit is required.')
    if (!formData.description || formData.description.trim().length < 20) return setError('Description should be at least 20 characters.')
    if (Number(formData.price) <= 0) return setError('Price must be valid.')
    if (isEditMode && formData.status === 'published' && !itemImages.length) {
      return setError('Add at least one actual item photo before publishing this listing.')
    }

    try {
      setIsSubmitting(true)
      setError('')
      setMessage('')
      const payload = {
        vendorId: vendorApplication.id, categoryId: formData.categoryId,
        name: formData.name, slug: makeSlug(formData.name || watchName || 'fabric-product'),
        description: formData.description, listingType: formData.listingType || 'fabric',
        price: Number(formData.price), quantity: Number(formData.quantity ?? 0), unit: formData.unit,
        color: formData.color || null, pattern: formData.pattern || null,
        condition: formData.condition, status: formData.status, location: null,
      }
      if (isEditMode && product) {
        await updateProduct(product.id, payload)
        setMessage('Product updated successfully.')
      } else {
        const { data: createdProduct } = await createProduct({ ...payload, status: formData.status === 'published' ? 'draft' : formData.status })
        setProduct(createdProduct)
        setMessage('Product saved. Add at least one actual item photo before publishing.')
        if (createdProduct) {
          navigate(`/vendor/products/${createdProduct.id}/edit`, { replace: true })
          return
        }
      }
    } catch (submitError) {
      setError(submitError.message || 'Unable to save this product.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isSupabaseConfigured) return (
    <main className="page-shell">
      <section className="setup-notice vendor-setup-panel">
        <strong>Supabase is not configured.</strong>
        <p>Product creation requires the project’s authenticated marketplace backend.</p>
      </section>
    </main>
  )

  return (
    <main className="page-shell vendor-main-shell">
      <div className="vendor-page-header">
        <div><p className="eyebrow">Products</p><h1>{isEditMode ? 'Edit product' : 'New product'}</h1></div>
        <Link className="secondary-link" to="/vendor/products">Back to products</Link>
      </div>
      {message && <div className="success-banner">{message}</div>}
      {error && <div className="form-error-block" role="alert">{error}</div>}

      <form className="vendor-form" onSubmit={handleSubmit(onSubmit)}>
        <div className="vendor-form-grid">
          <label className="form-field full-width"><span>Product name</span><input {...register('name')} /></label>
          <label className="form-field"><span>What are you selling?</span>
            <select {...register('listingType')}>
              <option value="fabric">Fabric for sale</option>
              <option value="finished_outfit">Finished outfit for sale</option>
            </select>
          </label>
          <label className="form-field"><span>Category</span>
            <select {...register('categoryId')}><option value="">Select a category</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </label>
          <label className="form-field"><span>Status</span>
            <select {...register('status')}>
              <option value="draft">Draft</option><option value="published">Published</option>
              <option value="unpublished">Unpublished</option><option value="out_of_stock">Out of stock</option>
            </select>
          </label>
          <label className="form-field"><span>Price (₦)</span><input type="number" min="0" step="0.01" {...register('price')} /></label>
          <label className="form-field"><span>Quantity</span><input type="number" min="0" step="1" {...register('quantity')} /></label>
          <label className="form-field"><span>{watchListingType === 'finished_outfit' ? 'Unit / item' : 'Unit (yard, metre, piece)'}</span><input {...register('unit')} /></label>
          <label className="form-field"><span>Color</span><input {...register('color')} /></label>
          <label className="form-field"><span>Pattern</span><input {...register('pattern')} /></label>
          <label className="form-field"><span>Condition</span>
            <select {...register('condition')}>
              <option value="new">New</option><option value="old_stock">Old Stock</option>
              <option value="vintage">Vintage</option><option value="pre_owned">Pre-owned</option>
              <option value="limited_stock">Limited Stock</option>
            </select>
          </label>
          <label className="form-field full-width"><span>Description</span><textarea rows={6} {...register('description')} /></label>
        </div>

        {watchCondition === 'pre_owned' && (
          <aside className="model-photo-prompt">
            <strong>Show it styled</strong>
            <p>Help buyers see how your item looks when worn. Model photos are optional. Upload images you own or have permission to share; buyers will see them publicly with your listing.</p>
          </aside>
        )}

        <section className="vendor-media-panel" aria-labelledby="item-images-title">
          <h2 id="item-images-title">{watchListingType === 'finished_outfit' ? 'Actual garment photos' : 'Actual fabric photos'}</h2>
          <p className="supporting-copy">Required before publishing. Show the real item for sale, including texture and any visible wear or flaws.</p>
          {itemImages.length ? <div className="vendor-image-list">
            {itemImages.map((image) => <div key={image.id} className="vendor-image-card">
              <img src={image.url} alt={image.alt_text || 'Actual item for sale'} />
              <div className="vendor-image-actions">
                <button type="button" onClick={() => handlePrimaryImage(image.id)}>{image.is_primary ? 'Primary item photo' : 'Set as primary'}</button>
                <button type="button" className="danger-button" onClick={() => handleDeleteImage(image)}>Remove</button>
              </div>
            </div>)}
          </div> : <p className="empty-copy">No actual item photos uploaded yet.</p>}
          <label className="upload-button">
            <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => handleImageUpload(event, 'item')} disabled={Boolean(uploadingRole) || !product} />
            {uploadingRole === 'item' ? 'Uploading item photo…' : 'Upload actual item photo'}
          </label>
        </section>

        <section className="vendor-media-panel" aria-labelledby="model-images-title">
          <h2 id="model-images-title">Model photos (optional)</h2>
          <p className="supporting-copy">{watchListingType === 'finished_outfit' ? 'Show the finished outfit being worn.' : 'Show how the fabric looks when styled or worn. The garment is not included unless stated in the listing.'}</p>
          {modelImages.length ? <div className="vendor-image-list">
            {modelImages.map((image) => <div key={image.id} className="vendor-image-card">
              <img src={image.url} alt={image.alt_text || 'Seller styling the listed item'} />
              <div className="vendor-image-actions"><span className="image-role-label">Model photo</span>
                <button type="button" className="danger-button" onClick={() => handleDeleteImage(image)}>Remove</button>
              </div>
            </div>)}
          </div> : <p className="empty-copy">No model photos added. You can add these now or later.</p>}
          <label className="upload-button">
            <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => handleImageUpload(event, 'model')} disabled={Boolean(uploadingRole) || !product} />
            {uploadingRole === 'model' ? 'Uploading model photo…' : 'Upload model photo'}
          </label>
        </section>
        {!product && <p className="supporting-copy">Save the product as a draft first. Then upload item and model photos on the edit screen.</p>}
        {product && !itemImages.length && <p className="form-hint">Add at least one actual item photo before publishing. Model photos do not count toward this requirement.</p>}
        <div className="vendor-form-actions">
          <button type="submit" className="primary-link" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : isEditMode ? 'Save changes' : 'Create draft'}</button>
          {product && itemImages.length > 0 && product.status !== 'published' && (
            <button type="button" className="secondary-button compact" onClick={async () => {
              try {
                await updateProduct(product.id, { status: 'published' })
                await refreshProduct()
                setMessage('Listing published.')
              } catch (publishError) { setError(publishError.message || 'Unable to publish listing.') }
            }}>Publish listing</button>
          )}
        </div>
      </form>
    </main>
  )
}

export { VendorProductFormPage }
