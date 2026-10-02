import { CircleAlert } from 'lucide-react'

function SetupPage({ title }) {
  return (
    <section className="setup-page" aria-labelledby="setup-title">
      <p className="eyebrow">FaBRIQUE</p>
      <h1 id="setup-title">{title}</h1>
      <div className="setup-notice" role="status">
        <CircleAlert size={19} aria-hidden="true" />
        <div>
          <strong>This area is not available yet</strong>
          <p>Its data and workflows will be enabled after the relevant Supabase services and access policies are implemented.</p>
        </div>
      </div>
    </section>
  )
}

export { SetupPage }