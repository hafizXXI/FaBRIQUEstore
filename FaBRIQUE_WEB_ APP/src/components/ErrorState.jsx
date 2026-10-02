function ErrorState({ message = 'Something went wrong.', onRetry }) {
  return (
    <div className="error-state" role="alert">
      <h3>Something went wrong</h3>
      <p>{message}</p>
      {onRetry && (
        <button type="button" className="primary-link" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  )
}

export { ErrorState }
