import { MapPin, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'

function VendorCard({ vendor }) {
  if (!vendor) {
    return null
  }

  return (
    <article className="vendor-card">
      <Link className="vendor-card-media" to={`/vendors/${vendor.slug}`} aria-label={`View ${vendor.store_name} storefront`}>
        {vendor.logo_url ? (
          <img src={vendor.logo_url} alt={`${vendor.store_name} logo`} />
        ) : (
          <div className="vendor-card-fallback" aria-label="Vendor placeholder">FaBRIQUE</div>
        )}
      </Link>

      <div className="vendor-card-body">
        <div className="vendor-card-header">
          <div>
            <h3>{vendor.store_name}</h3>
            {vendor.status === 'approved' && (
              <span className="status-badge approved">
                <ShieldCheck size={13} aria-hidden="true" />
                Approved
              </span>
            )}
          </div>
        </div>

        <p className="vendor-card-description">{vendor.description || 'Marketplace vendor.'}</p>

        <div className="meta-line">
          <MapPin size={14} aria-hidden="true" />
          <span>{vendor.city || vendor.state ? `${vendor.city || ''}${vendor.city && vendor.state ? ', ' : ''}${vendor.state || ''}` : 'Location available on request'}</span>
        </div>
      </div>
    </article>
  )
}

export { VendorCard }
