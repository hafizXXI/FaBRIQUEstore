import { useEffect, useMemo, useState } from 'react'

function ProductGallery({ images = [], productName = 'Fabric product', listingType = 'fabric' }) {
  const [selectedGroup, setSelectedGroup] = useState('item')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const normalized = useMemo(() => (images || []).filter(Boolean), [images])
  const itemImages = normalized.filter((image) => (image.image_role ?? 'item') === 'item')
  const modelImages = normalized.filter((image) => image.image_role === 'model')
  const groupImages = selectedGroup === 'model' && modelImages.length ? modelImages : itemImages
  const galleryImages = groupImages.length ? groupImages : normalized
  const activeImage = galleryImages[selectedIndex] ?? galleryImages[0]

  useEffect(() => { setSelectedIndex(0) }, [selectedGroup, images])

  return (
    <div className="product-gallery" aria-label="Product gallery">
      {modelImages.length > 0 && (
        <div className="model-gallery-tabs" role="tablist" aria-label="Photo type">
          <button type="button" role="tab" aria-selected={selectedGroup === 'item'} className={selectedGroup === 'item' ? 'active' : ''} onClick={() => setSelectedGroup('item')}>
            {listingType === 'finished_outfit' ? 'Actual outfit' : 'Actual fabric'} ({itemImages.length})
          </button>
          <button type="button" role="tab" aria-selected={selectedGroup === 'model'} className={selectedGroup === 'model' ? 'active' : ''} onClick={() => setSelectedGroup('model')}>
            Styled by seller ({modelImages.length})
          </button>
        </div>
      )}
      <div className="product-gallery-main">
        {activeImage?.url ? <img src={activeImage.url} alt={activeImage.alt_text || productName} /> :
          <div className="product-image-placeholder" aria-label="No product image available">FaBRIQUE</div>}
      </div>
      {galleryImages.length > 1 && <div className="product-gallery-thumbs" aria-label="Available product images">
        {galleryImages.map((image, index) => <button key={image.id ?? `${productName}-${index}`} type="button"
          className={`gallery-thumb ${selectedIndex === index ? 'active' : ''}`} onClick={() => setSelectedIndex(index)}
          aria-label={`View ${selectedGroup === 'model' ? 'model' : 'item'} image ${index + 1}`}>
          {image.url ? <img src={image.url} alt={image.alt_text || `${productName} preview ${index + 1}`} /> :
            <div className="gallery-thumb-placeholder">FaBRIQUE</div>}
        </button>)}
      </div>}
    </div>
  )
}

export { ProductGallery }
