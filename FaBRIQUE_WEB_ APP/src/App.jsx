import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { MarketplaceLayout } from './layouts/MarketplaceLayout.jsx'
import { HomePage } from './pages/HomePage.jsx'
import { ExplorePage } from './pages/ExplorePage.jsx'
import { ProductDetailPage } from './pages/ProductDetailPage.jsx'
import { VendorPage } from './pages/VendorPage.jsx'
import { WishlistPage } from './pages/WishlistPage.jsx'
import { AccountPage } from './pages/account/AccountPage.jsx'
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage.jsx'
import { LoginPage } from './pages/auth/LoginPage.jsx'
import { RegisterPage } from './pages/auth/RegisterPage.jsx'
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage.jsx'
import { NotFoundPage } from './pages/errors/NotFoundPage.jsx'
import { UnauthorizedPage } from './pages/errors/UnauthorizedPage.jsx'
import { CartPage } from './pages/CartPage.jsx'
import { CheckoutPage } from './pages/CheckoutPage.jsx'
import { OrderDetailPage } from './pages/OrderDetailPage.jsx'
import { OrdersPage } from './pages/OrdersPage.jsx'
import { VendorDashboardPage } from './pages/vendor/VendorDashboardPage.jsx'
import { VendorEarningsPage } from './pages/vendor/VendorEarningsPage.jsx'
import { VendorOrdersPage } from './pages/vendor/VendorOrdersPage.jsx'
import { VendorProductFormPage } from './pages/vendor/VendorProductFormPage.jsx'
import { VendorProductsPage } from './pages/vendor/VendorProductsPage.jsx'
import { VendorStorePage } from './pages/vendor/VendorStorePage.jsx'
import { SetupPage } from './pages/SetupPage.jsx'
import { ProtectedRoute } from './routes/ProtectedRoute.jsx'
import { VendorAccessGate } from './routes/VendorAccessGate.jsx'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<MarketplaceLayout />}>
            <Route index element={<HomePage />} />
            <Route path="home" element={<HomePage />} />
            <Route path="explore" element={<ExplorePage />} />
            <Route path="products/:slug" element={<ProductDetailPage />} />
            <Route path="vendors/:slug" element={<VendorPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="forgot-password" element={<ForgotPasswordPage />} />
            <Route path="reset-password" element={<ResetPasswordPage />} />
            <Route path="unauthorized" element={<UnauthorizedPage />} />

<Route element={<ProtectedRoute roles={['customer', 'vendor', 'rider', 'admin']} />}>
              <Route path="orders" element={<OrdersPage />} />
              <Route path="orders/:id" element={<OrderDetailPage />} />
              <Route path="wishlist" element={<WishlistPage />} />
              <Route path="cart" element={<CartPage />} />
              <Route path="checkout" element={<CheckoutPage />} />
              <Route path="account" element={<AccountPage />} />
            </Route>

            <Route path="vendor" element={<VendorAccessGate />}>
              <Route index element={<VendorDashboardPage />} />
              <Route path="products" element={<VendorProductsPage />} />
              <Route path="products/new" element={<VendorProductFormPage />} />
              <Route path="products/:id/edit" element={<VendorProductFormPage />} />
              <Route path="orders" element={<VendorOrdersPage />} />
              <Route path="store" element={<VendorStorePage />} />
              <Route path="earnings" element={<VendorEarningsPage />} />
            </Route>

            <Route element={<ProtectedRoute roles={['rider']} />}>
              <Route path="rider/*" element={<SetupPage title="Rider workspace" />} />
            </Route>

            <Route element={<ProtectedRoute roles={['admin']} />}>
              <Route path="admin/*" element={<SetupPage title="Admin workspace" />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
