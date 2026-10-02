import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getCategories } from '../../services/categoryService.js'
import { getVendorProductById, createProduct, updateProduct } from '../../services/productService.js'
import { uploadProductImage, deleteProductImage, setPrimaryProductImage } from '../../services/imageService.js'
import { useAuth } from '../../contexts/AuthContext.jsx'

function makeSlug(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function VendorProductFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { vendorApplication, isSupabaseConfigured } = useAuth()
  const [categories, setCategories] = useState([])
  const [product, setProduct] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const isEditMode = Boolean(id)

  const { register, handleSubmit, reset, watch } = useForm({
    defaultValues: {
      name: '',
      categoryId: '',
      description: '',
      price: 0,
      quantity: 0,
      unit: 'yard',
      color: '',
      pattern: '',
      condition: 'new',
      status: 'draft',
    },
  })

  const currentImages = useMemo(() => product?.images ?? [], [product])
  const watchName = watch('name')

  useEffect(() => {
    async function loadOptions() {
      if (!isSupabaseConfigured || !vendorApplication) {
        return
      }

      const { data: categoryData } = await getCategories({ activeOnly: true })
      setCategories(categoryData ?? [])

      if (isEditMode) {
        const { data: currentProduct } = await getVendorProductById(id)
        setProduct(currentProduct)
        if (currentProduct) {
          reset({
            name: currentProduct.name || '',
            categoryId: currentProduct.category?.id || '',
            description: currentProduct.description || '',
            price: Number(currentProduct.price || 0),
            quantity: Number(currentProduct.quantity || 0),
            unit: currentProduct.unit || 'yard',
            color: currentProduct.color || '',
            pattern: currentProduct.pattern || '',
            condition: currentProduct.condition || 'new',
            status: currentProduct.status || 'draft',
          })
        }
      }
    }

    loadOptions()
  }, [isEditMode, id, isSupabaseConfigured, reset, vendorApplication])

  async function handleImageUpload(event) {
    const file = event.target.files?.[0]
    if (!file || !product) {
      return
    }

    try {
      setUploading(true)
      setError('')
      await uploadProductImage({
        vendorId: vendorApplication.id,
        productId: product.id,
        file,
        altText: product.name,
      })
      const { data } = await getVendorProductById(product.id)
      setProduct(data)
    } catch (uploadError) {
      setError(uploadError.message || 'Unable to upload the selected image.')
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  async function handleDeleteImage(imageId, storagePath) {
    if (!product) {
      return
    }

    try {
      await deleteProductImage({
        productId: product.id,
        vendorId: vendorApplication.id,
        imageId,
        storagePath,
      })
      const { data } = await getVendorProductById(product.id)
      setProduct(data)
    } catch (deleteError) {
      setError(deleteError.message || 'Unable to remove that image.')
    }
  }

  async function handlePrimaryImage(imageId) {
    if (!product) {
      return
    }

    try {
      await setPrimaryProductImage({
        productId: product.id,
        vendorId: vendorApplication.id,
        imageId,
      })
      const { data } = await getVendorProductById(product.id)
      setProduct(data)
    } catch (imageError) {
      setError(imageError.message || 'Unable to update the primary image.')
    }
  }

  async function onSubmit(formData) {
    if (!vendorApplication || !isSupabaseConfigured) {
      return
    }

    if (!formData.name || formData.name.trim().length < 2) {
      setError('Product name is required.')
      return
    }

    if (!formData.categoryId) {
      setError('Please select a category.')
      return
    }

    if (!formData.unit || formData.unit.trim().length < 1) {
      setError('Unit is required.')
      return
    }

    if (!formData.description || formData.description.trim().length < 20) {
      setError('Description should be at least 20 characters.')
      return
    }

    if (Number(formData.price) <= 0) {
      setError('Price must be valid.')
      return
    }

    try {
      setIsSubmitting(true)
      setError('')
      setMessage('')

      const payload = {
        vendorId: vendorApplication.id,
        categoryId: formData.categoryId,
        name: formData.name,
        slug: makeSlug(formData.name || watchName || 'fabric-product'),
        description: formData.description,
        price: formData.price,
        quantity: Number(formData.quantity ?? 0),
        unit: formData.unit,
        color: formData.color || null,
        pattern: formData.pattern || null,
        condition: formData.condition,
        status: formData.status,
        location: null,
      }

      if (isEditMode && product) {
        await updateProduct(product.id, payload)
        setMessage('Product updated successfully.')
      } else {
        const { data: createdProduct } = await createProduct(payload)
        setProduct(createdProduct)
        setMessage('Product created successfully.')
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

  if (!isSupabaseConfigured) {
    return (
      <main className="page-shell">
        <section className="setup-notice vendor-setup-panel">
          <strong>Supabase is not configured.</strong>
          <p>Product creation requires the project’s authenticated marketplace backend.</p>
        </section>
      </main>
    )
  }

  return (
    <main className="page-shell vendor-main-shell">
      <div className="vendor-page-header">
        <div>
          <p className="eyebrow">Products</p>
          <h1>{isEditMode ? 'Edit product' : 'New product'}</h1>
        </div>
        <Link className="secondary-link" to="/vendor/products">Back to products</Link>
      </div>

      {message && <div className="success-banner">{message}</div>}
      {error && <div className="form-error-block">{error}</div>}

      <form className="vendor-form" onSubmit={handleSubmit(onSubmit)}>
        <div className="vendor-form-grid">
          <label className="form-field full-width">
            <span>Product name</span>
            <input {...register('name')} />
          </label>

          <label className="form-field">
            <span>Category</span>
            <select {...register('categoryId')}>
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </label>

          <label className="form-field">
            <span>Status</span>
            <select {...register('status')}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="unpublished">Unpublished</option>
              <option value="out_of_stock">Out of stock</option>
            </select>
          </label>

          <label className="form-field">
            <span>Price</span>
            <input type="number" min="0" step="0.01" {...register('price')} />
          </label>

          <label className="form-field">
            <span>Quantity</span>
            <input type="number" min="0" step="1" {...register('quantity')} />
          </label>

          <label className="form-field">
            <span>Unit</span>
            <input {...register('unit')} />
          </label>

          <label className="form-field">
            <span>Color</span>
            <input {...register('color')} />
          </label>

          <label className="form-field">
            <span>Pattern</span>
            <input {...register('pattern')} />
          </label>

          <label className="form-field">
            <span>Condition</span>
            <select {...register('condition')}>
              <option value="new">New</option>
              <option value="old_stock">Old Stock</option>
              <option value="vintage">Vintage</option>
              <option value="pre_owned">Pre-owned</option>
              <option value="limited_stock">Limited Stock</option>
            </select>
          </label>

          <label className="form-field full-width">
            <span>Description</span>
            <textarea rows={6} {...register('description')} />
          </label>
        </div>

        <div className="vendor-media-panel">
          <h2>Images</h2>
          {currentImages.length ? (
            <div className="vendor-image-list">
              {currentImages.map((image) => (
                <div key={image.id} className="vendor-image-card">
                  <img src={image.url} alt={image.alt_text || 'Product'} />
                  <div className="vendor-image-actions">
                    <button type="button" onClick={() => handlePrimaryImage(image.id)}>
                      {image.is_primary ? 'Primary' : 'Set primary'}
                    </button>
                    <button type="button" className="danger-button" onClick={() => handleDeleteImage(image.id, image.storage_path)}>
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-copy">No images uploaded yet.</p>
          )}

          <label className="upload-button">
            <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading || !product} />
            {uploading ? 'Uploading…' : 'Upload image'}
          </label>
        </div>

        <div className="vendor-form-actions">
          <button type="submit" className="primary-link" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : isEditMode ? 'Save changes' : 'Create product'}
          </button>
        </div>
      </form>
    </main>
  )
}

export { VendorProductFormPage }
