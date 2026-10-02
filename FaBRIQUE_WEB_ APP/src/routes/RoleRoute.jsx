import { ProtectedRoute } from './ProtectedRoute.jsx'

function RoleRoute({ roles }) {
  return <ProtectedRoute roles={roles} />
}

export { RoleRoute }
