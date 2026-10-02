import { ArrowRight, Box, CircleDollarSign, PackageCheck, ShoppingBag } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { getVendorDashboardStats } from '../../services/vendorService.js'

function formatCurrency(value) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0))
}

function VendorDashboardPage() {
  const { vendorApplication, isSupabaseConfigured } = useAuth()
  const [stats, setStats] = useState({
    todaySales: 0,
    totalSales: 0,
    ordersCount: 0,
    pendingOrders: 0,
    productCount: 0,
    lowStockProducts: 0,
    recentOrders: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isSupabaseConfigured || !vendorApplication) {
      setLoading(false)
      return
    }

    async function loadData() {
      setLoading(true)
      setError('')

      try {
        const { data, error: loadError } = await getVendorDashboardStats(vendorApplication.id)
        if (loadError) {
          throw loadError
        }
        setStats(data ?? {
          todaySales: 0,
          totalSales: 0,
          ordersCount: 0,
          pendingOrders: 0,
          productCount: 0,
          lowStockProducts: 0,
          recentOrders: [],
        })
      } catch (loadError) {
        setError(loadError.message || 'Unable to load the dashboard.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [isSupabaseConfigured, vendorApplication])

  if (!isSupabaseConfigured) {
    return (
      <main className="page-shell">
        <section className="setup-notice vendor-setup-panel">
          <div>
            <strong>Supabase is not configured.</strong>
            <p>Add your project URL and anon key to unlock the vendor dashboard.</p>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="page-shell vendor-main-shell">
      <div className="vendor-page-header">
        <div>
          <p className="eyebrow">Vendor dashboard</p>
          <h1>{vendorApplication?.store_name || 'Your store'}</h1>
        </div>
        <Link className="primary-link" to="/vendor/products/new">
          Add new product
          <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </div>

      {error && <div className="form-error-block">{error}</div>}

      {loading ? (
        <div className="loading-card"><p>Loading dashboard metrics…</p></div>
      ) : (
        <>
          <section className="vendor-stats-grid">
            <article className="vendor-stat-card">
              <span><CircleDollarSign size={18} /> Today’s sales</span>
              <strong>{formatCurrency(stats.todaySales)}</strong>
            </article>
            <article className="vendor-stat-card">
              <span><CircleDollarSign size={18} /> Total sales</span>
              <strong>{formatCurrency(stats.totalSales)}</strong>
            </article>
            <article className="vendor-stat-card">
              <span><ShoppingBag size={18} /> Orders</span>
              <strong>{stats.ordersCount}</strong>
            </article>
            <article className="vendor-stat-card">
              <span><PackageCheck size={18} /> Pending orders</span>
              <strong>{stats.pendingOrders}</strong>
            </article>
            <article className="vendor-stat-card">
              <span><Box size={18} /> Product count</span>
              <strong>{stats.productCount}</strong>
            </article>
            <article className="vendor-stat-card">
              <span><Box size={18} /> Low-stock products</span>
              <strong>{stats.lowStockProducts}</strong>
            </article>
          </section>

          <section className="vendor-panel-grid">
            <article className="vendor-panel">
              <div className="panel-header">
                <h2>Recent orders</h2>
                <Link to="/vendor/orders">View all</Link>
              </div>

              {stats.recentOrders.length ? (
                <div className="vendor-list">
                  {stats.recentOrders.map((order) => (
                    <div key={order.id} className="vendor-row">
                      <div>
                        <strong>{order.orders?.order_number || 'Order'}</strong>
                        <small>{order.orders?.profiles?.full_name || 'Customer'}</small>
                      </div>
                      <div className="vendor-row-meta">
                        <span>{order.status}</span>
                        <strong>{formatCurrency(order.subtotal)}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-copy">No orders have been placed for your store yet.</p>
              )}
            </article>

            <article className="vendor-panel">
              <div className="panel-header">
                <h2>Quick actions</h2>
              </div>
              <div className="quick-action-stack">
                <Link className="secondary-link" to="/vendor/products">Manage products</Link>
                <Link className="secondary-link" to="/vendor/orders">Review orders</Link>
                <Link className="secondary-link" to="/vendor/store">Edit store profile</Link>
                <Link className="secondary-link" to="/vendor/earnings">Review earnings</Link>
              </div>
            </article>
          </section>
        </>
      )}
    </main>
  )
}

export { VendorDashboardPage }
