function formatStatusLabel(value) {
  if (!value) {
    return 'Status update'
  }

  return String(value)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

function OrderTimeline({ entries = [] }) {
  if (!entries.length) {
    return (
      <div className="empty-state-panel">
        <h2>Order timeline</h2>
        <p className="empty-copy">Status history will appear here after the order is created.</p>
      </div>
    )
  }

  return (
    <div className="order-timeline">
      {entries.map((entry) => (
        <div key={entry.id || `${entry.created_at}-${entry.new_status}`} className="timeline-row">
          <span className="timeline-dot" aria-hidden="true" />
          <div className="timeline-body">
            <strong>{formatStatusLabel(entry.new_status)}</strong>
            <small>{entry.note || 'Order status updated.'}</small>
            <time>{new Date(entry.created_at).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}</time>
          </div>
        </div>
      ))}
    </div>
  )
}

export { OrderTimeline }
