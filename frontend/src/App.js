import { useEffect, useRef } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Outlet, useLocation, useNavigate, Navigate } from "react-router-dom";
import Lenis from "lenis";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { ShopCartProvider } from "./context/ShopCartContext";
import { Navbar, MobileCTA } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { CartDrawer } from "./components/CartDrawer";
import { WhatsAppCTA } from "./components/WhatsAppCTA";
import { api } from "./lib/api";
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import About from "./pages/About";
import Industries from "./pages/Industries";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Account from "./pages/Account";
import Admin from "./pages/Admin";
import QuoteCart from "./pages/QuoteCart";
import Cart from "./pages/Cart";
import Calculator from "./pages/Calculator";

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

function AuthCallback() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;
    const sessionId = new URLSearchParams(window.location.hash.replace("#", "")).get("session_id");
    api
      .post("/auth/google/session", { session_id: sessionId })
      .then(({ data }) => {
        setUser(data);
        window.history.replaceState(null, "", "/account");
        navigate("/account", { replace: true });
      })
      .catch(() => navigate("/login", { replace: true }));
  }, [navigate, setUser]);

  return (
    <div className="grid min-h-screen place-items-center bg-[#090D16]" data-testid="auth-callback">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-amber-500">Signing you in…</p>
    </div>
  );
}

const FullPageLoader = () => (
  <div className="grid min-h-screen place-items-center bg-[#090D16]">
    <p className="font-mono text-xs uppercase tracking-[0.3em] text-amber-500">Loading…</p>
  </div>
);

const Protected = ({ children, admin = false }) => {
  const { user } = useAuth();
  if (user === null) return <FullPageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (admin && user.role !== "admin") return <Navigate to="/account" replace />;
  return children;
};

const Layout = () => (
  <>
    <Navbar />
    <main>
      <Outlet />
    </main>
    <Footer />
    <CartDrawer />
    <MobileCTA />
    <div className="h-12 md:hidden" />
  </>
);

function AppRouter() {
  const location = useLocation();
  // OAuth return: exchange session_id before any route/auth check runs
  if (location.hash?.includes("session_id=")) return <AuthCallback />;
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/about" element={<About />} />
        <Route path="/industries" element={<Industries />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/quote" element={<QuoteCart />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/calculator" element={<Calculator />} />
        <Route path="/login" element={<Login />} />
        <Route path="/account" element={<Protected><Account /></Protected>} />
        <Route path="/admin" element={<Protected admin><Admin /></Protected>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

function App() {
  useEffect(() => {
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    let rafId;
    const raf = (time) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return (
    <AuthProvider>
      <CartProvider>
        <ShopCartProvider>
          <BrowserRouter>
            <ScrollToTop />
            <AppRouter />
            <WhatsAppCTA />
            <Toaster position="top-right" toastOptions={{ style: { borderRadius: 0 } }} />
          </BrowserRouter>
        </ShopCartProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
