import { useEffect } from "react";
import { HashRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";

// Pages
import Ind from "@/pages/ind";
import CartPage from "@/pages/Cart";
import DetailsPage from "@/pages/Details";
import PaymentPage from "@/pages/Payment";
import TrackingPage from "@/pages/Tracking";
import OrderPage from "@/pages/Order";
import NotFoundPage from "@/pages/NotFound";
import ProfilePage from "@/pages/Profile";
import { ROUTE_KEY, readMaterialOrderState } from "@/lib/materialOrderStorage";

function RoutePersistence() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const state = readMaterialOrderState();
    const savedRoute = localStorage.getItem(ROUTE_KEY);

    if (location.pathname === "/" && savedRoute && savedRoute !== "/") {
      const canResume =
        (savedRoute === "/cart" && (state.cart?.length ?? 0) > 0) ||
        (savedRoute === "/payment" && ((state.cart?.length ?? 0) > 0 || (!!state.order && !!state.buyerInfo))) ||
        ((savedRoute === "/tracking" || savedRoute.startsWith("/order/")) && !!state.order);

      if (canResume) {
        navigate(savedRoute, { replace: true });
      }
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    localStorage.setItem(ROUTE_KEY, location.pathname);
  }, [location.pathname]);

  return null;
}

export default function AppRoutes() {
  return (
    <Router>
      <RoutePersistence />
      <Routes>
        {/* MATERIAL ORDER PAGE (MAIN PAGE) */}
        <Route path="/" element={<Ind />} />

        {/* Support old static HTML link without leaving the page */}
        <Route
          path="/materials-order-page.html"
          element={<Navigate to="/" replace />}
        />

        {/* MATERIAL FLOW */}
        <Route path="/details/:id" element={<DetailsPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/payment" element={<PaymentPage />} />

        {/* ORDER FLOW */}
        <Route path="/tracking" element={<TrackingPage />} />
        <Route path="/order/:id" element={<OrderPage />} />
        <Route path="/profile" element={<ProfilePage />} />

        {/* FALLBACK */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}
