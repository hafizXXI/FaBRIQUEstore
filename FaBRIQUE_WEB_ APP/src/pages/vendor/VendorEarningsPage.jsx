import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { getVendorEarnings } from '../../services/orderService.js'

function formatCurrency(value) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(Number(value ?? 0))
}

function VendorEarningsPage() {
  const { vendorApplication, isSupabaseConfigured } = useAuth()
  const [earnings, setEarnings] = useState({ totalSales: 0, pendingPayout: 0, netEarnings: 0, payouts: [], commissions: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadEarnings() {
      if (!vendorApplication || !isSupabaseConfigured) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError('')
        const { data, error: loadError } = await getVendorEarnings(vendorApplication.id)
        if (loadError) {
          throw loadError
        }
        setEarnings(data ?? { totalSales: 0, pendingPayout: 0, netEarnings: 0, payouts: [], commissions: [] })
      } catch (loadError) {
        setError(loadError.message || 'Unable to load earnings.')
      } finally {
        setLoading(false)
      }
    }

    loadEarnings()
  }, [vendorApplication, isSupabaseConfigured])

  if (!isSupabaseConfigured) {
    return (
      <main className="page-shell">
        <section className="setup-notice vendor-setup-panel">
          <strong>Supabase is not configured.</strong>
          <p>Financial metrics are unavailable until your platform is connected to the live database.</p>
        </section>
      </main>
    )
  }

  return (
    <main className="page-shell vendor-main-shell">
      <div className="vendor-page-header">
        <div>
          <p className="eyebrow">Earnings</p>
          <h1>Revenue and payout overview</h1>
        </div>
      </div>

      {error && <div className="form-error-block">{error}</div>}

      {loading ? (
        <div className="loading-card"><p>Loading earnings…</p></div>
      ) : (
        <>
          <section className="vendor-stats-grid">
            <article className="vendor-stat-card">
              <span>Total sales</span>
              <strong>{formatCurrency(earnings.totalSales)}</strong>
            </article>
            <article className="vendor-stat-card">
              <span>Pending payout</span>
              <strong>{formatCurrency(earnings.pendingPayout)}</strong>
            </article>
            <article className="vendor-stat-card">
              <span>Net earnings</span>
              <strong>{formatCurrency(earnings.netEarnings)}</strong>
            </article>
          </section>

          <section className="vendor-panel-grid">
            <article className="vendor-panel">
              <div className="panel-header">
                <h2>Recent payouts</h2>
              </div>
              {earnings.payouts.length ? (
                <div className="vendor-list">
                  {earnings.payouts.map((payout) => (
                    <div key={payout.id} className="vendor-row">
                      <div>
                        <strong>{payout.reference || 'Payout'}</strong>
                        <small>{new Date(payout.created_at).toLocaleDateString()}</small>
                      </div>
                      <div className="vendor-row-meta">
                        <span>{payout.status}</span>
                        <strong>{formatCurrency(payout.amount)}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-copy">No payout history is available yet.</p>
              )}
            </article>

            <article className="vendor-panel">
              <div className="panel-header">
                <h2>Commission summary</h2>
              </div>
              {earnings.commissions.length ? (
                <div className="vendor-list">
                  {earnings.commissions.map((entry) => (
                    <div key={entry.id} className="vendor-row">
                      <div>
                        <strong>{entry.vendor_order_id}</strong>
                        <small>{entry.status}</small>
                      </div>
                      <div className="vendor-row-meta">
                        <span>Commission</span>
                        <strong>{formatCurrency(entry.commission_amount)}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-copy">No commission entries have been created for your vendor account yet.</p>
              )}
            </article>
          </section>
        </>
      )}
    </main>
  )
}

export { VendorEarningsPage }
