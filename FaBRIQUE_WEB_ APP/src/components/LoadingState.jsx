function LoadingState({ message = 'Loading…' }) {
  return (
    <div className="loading-shell" aria-live="polite">
      <div className="loading-card">
        <p>{message}</p>
      </div>
    </div>
  )
}

export { LoadingState }
