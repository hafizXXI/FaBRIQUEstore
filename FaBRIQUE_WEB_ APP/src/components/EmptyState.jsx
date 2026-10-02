function EmptyState({ title = 'No items found', message = 'Try adjusting your filters or search.' }) {
  return (
    <div className="empty-state" role="status">
      <h3>{title}</h3>
      <p>{message}</p>
    </div>
  )
}

export { EmptyState }
