import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import NotFoundPage from '../pages/NotFoundPage';
import PlaceholderPage from '../pages/PlaceholderPage';
import LoginPage from '../pages/LoginPage';
import EditOrderPage from '../pages/production/EditOrderPage';
import EditWorkOrderPage from '../pages/production/EditWorkOrderPage';
import NewWorkOrderPage from '../pages/production/NewWorkOrderPage';
import OrderDetailsPage from '../pages/production/OrderDetailsPage';
import ProductionOrdersPage from '../pages/production/ProductionOrdersPage';
import { useAuth } from '../contexts/AuthContext';

/** Modules that exist in the navigation but are built in later phases. */
const PLACEHOLDER_ROUTES: { path: string; title: string }[] = [
  { path: '/dashboard', title: 'Dashboard' },
  { path: '/clients', title: 'Clients' },
  { path: '/production/cutting', title: 'Cutting' },
  { path: '/production/sorting', title: 'Sorting' },
  { path: '/production/sewing', title: 'Sewing' },
  { path: '/production/ironing', title: 'Ironing' },
  { path: '/production/packing', title: 'Packing' },
  { path: '/production/qc', title: 'Quality Check' },
  { path: '/inventory', title: 'Inventory' },
  { path: '/reports', title: 'Reports' },
  { path: '/settings', title: 'Settings' },
];

/** Wraps protected routes — redirects to /login if not authenticated. */
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/production/orders" replace /> : <LoginPage />}
      />

      {/* Protected — all routes inside AppLayout */}
      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/production/orders" replace />} />
        <Route path="/production" element={<Navigate to="/production/orders" replace />} />
        <Route path="/production/orders" element={<ProductionOrdersPage />} />
        {/* `new` is declared before `:id` so it is never read as an order id. */}
        <Route path="/production/orders/new" element={<NewWorkOrderPage />} />
        <Route path="/production/work-orders/:id/edit" element={<EditWorkOrderPage />} />
        <Route path="/production/orders/:id" element={<OrderDetailsPage />} />
        <Route path="/production/orders/:id/edit" element={<EditOrderPage />} />
        {PLACEHOLDER_ROUTES.map(({ path, title }) => (
          <Route key={path} path={path} element={<PlaceholderPage title={title} />} />
        ))}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
