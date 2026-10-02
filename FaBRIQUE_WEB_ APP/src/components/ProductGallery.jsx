import { useMemo, useState } from 'react'

function ProductGallery({ images = [], productName = 'Fabric product' }) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  const galleryImages = useMemo(() => {
    const normalized = (images || []).filter(Boolean)
    return normalized.length ? normalized : [{ id: 'placeholder', url: null, alt_text: `${productName} placeholder image` }]
  }, [images, productName])

  const activeImage = galleryImages[selectedIndex] ?? galleryImages[0]

  return (
    <div className="product-gallery" aria-label="Product gallery">
      <div className="product-gallery-main">
        {activeImage?.url ? (
          <img src={activeImage.url} alt={activeImage.alt_text || productName} />
        ) : (
          <div className="product-image-placeholder" aria-label="No product image available">
            FaBRIQUE
          </div>
        )}
      </div>

      {galleryImages.length > 1 && (
        <div className="product-gallery-thumbs" aria-label="Available product images">
          {galleryImages.map((image, index) => (
            <button
              key={image.id ?? `${productName}-${index}`}
              type="button"
              className={`gallery-thumb ${selectedIndex === index ? 'active' : ''}`}
              onClick={() => setSelectedIndex(index)}
              aria-label={`View image ${index + 1}`}
            >
              {image.url ? (
                <img src={image.url} alt={image.alt_text || `${productName} preview ${index + 1}`} />
              ) : (
                <div className="gallery-thumb-placeholder">FaBRIQUE</div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export { ProductGallery }
