import { CircleAlert, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'

const statusCopy = {
  pending: {
    title: 'Your vendor account is pending review.',
    description: 'Your application is being reviewed. Once approved, you will receive full access to the vendor marketplace dashboard and product tools.',
  },
  under_review: {
    title: 'Your vendor account is under review.',
    description: 'We are confirming your store details and business profile before activating marketplace operations.',
  },
  rejected: {
    title: 'Your vendor application was not approved.',
    description: 'Please review the information and contact support if you need assistance updating your vendor profile.',
  },
  suspended: {
    title: 'Your vendor access has been suspended.',
    description: 'Your store is currently restricted. Please contact support to review your account status.',
  },
  missing: {
    title: 'Vendor profile not found.',
    description: 'You are signed in, but no vendor record was found for this account. Please complete your vendor onboarding before accessing the marketplace tools.',
  },
}

function VendorStatusPage({ status = 'pending' }) {
  const copy = statusCopy[status] || statusCopy.pending

  return (
    <main className="page-shell">
      <section className="vendor-status-panel">
        <div className="status-icon" aria-hidden="true">
          {status === 'approved' ? <ShieldCheck size={22} /> : <CircleAlert size={22} />}
        </div>
        <p className="eyebrow">Vendor access</p>
        <h1>{copy.title}</h1>
        <p>{copy.description}</p>
        <div className="vendor-status-actions">
          <Link className="primary-link" to="/account">Back to account</Link>
          <Link className="secondary-link" to="/home">Browse marketplace</Link>
        </div>
      </section>
    </main>
  )
}

export { VendorStatusPage }
