import React, { Suspense, lazy } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/contexts/CartContext";
import { ChatProvider } from "@/contexts/ChatContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import WhatsAppButton from "@/components/layout/WhatsAppButton";
import HomePage from "./pages/HomePage";

import DeferredMount from "@/components/layout/DeferredMount";

// Lazy-load para mejorar LCP/TTI: solo HomePage se carga eager.
// AIChatWidget y SocialProofPopup se difieren hasta que el navegador esté idle
// o haya interacción del usuario — así no bloquean el primer render.
const AIChatWidget = lazy(() => import("@/components/layout/AIChatWidget"));
const SocialProofPopup = lazy(() => import("@/components/layout/SocialProofPopup"));
const ShopPage = lazy(() => import("./pages/ShopPage"));
const ProductDetailPage = lazy(() => import("./pages/ProductDetailPage"));
const CartPage = lazy(() => import("./pages/CartPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const QuotePage = lazy(() => import("./pages/QuotePage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const BrandsPage = lazy(() => import("./pages/BrandsPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const FerovaPage = lazy(() => import("./pages/FerovaPage"));
const ProductSheetGeneratorPage = lazy(() => import("./pages/ProductSheetGeneratorPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const MyAccountPage = lazy(() => import("./pages/MyAccountPage"));
const VCardNetpower = lazy(() => import("./pages/VCardNetpower"));
const PaymentResult = lazy(() => import("./pages/PaymentResult"));
const AdminBrandsPage = lazy(() => import("./pages/AdminBrandsPage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const BlogPage = lazy(() => import("./pages/BlogPage"));
const BlogPostPage = lazy(() => import("./pages/BlogPostPage"));
const AdminBlogGeneratorPage = lazy(() => import("./pages/AdminBlogGeneratorPage"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const LegalPage = lazy(() => import("./pages/LegalPage"));
const PoliticaDatosPage = lazy(() => import("./pages/PoliticaDatosPage"));
import ProtectedAdminRoute from "./components/auth/ProtectedAdminRoute";

function ScrollToTop() {
  const { pathname } = useLocation();
  React.useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [pathname]);
  return null;
}
const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false } },
});

const PageFallback = () => (
  <div className="min-h-[40vh] flex items-center justify-center text-muted-foreground text-sm">
    Cargando…
  </div>
);

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <ChatProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <div className="flex flex-col min-h-screen">
                <ScrollToTop />
                <Header />
                <main className="flex-1">
                  <Suspense fallback={<PageFallback />}>
                    <Routes>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/tienda" element={<ShopPage />} />
                      <Route path="/categoria/:slug" element={<ShopPage />} />
                      <Route path="/producto/:slug" element={<ProductDetailPage />} />
                      <Route path="/carrito" element={<CartPage />} />
                      <Route path="/checkout" element={<CheckoutPage />} />
                      <Route path="/cotizacion" element={<QuotePage />} />
                      <Route path="/contacto" element={<ContactPage />} />
                      <Route path="/marcas" element={<BrandsPage />} />
                      <Route path="/nosotros" element={<AboutPage />} />
                      <Route path="/ferova" element={<FerovaPage />} />
                      <Route path="/auth" element={<AuthPage />} />
                      <Route path="/admin/generador-fichas" element={<ProtectedAdminRoute><ProductSheetGeneratorPage /></ProtectedAdminRoute>} />
                      <Route path="/legal" element={<LegalPage />} />
                      <Route path="/politica-datos" element={<PoliticaDatosPage />} />
                      <Route path="/admin" element={<ProtectedAdminRoute><AdminPage /></ProtectedAdminRoute>} />
                      <Route path="/admin/marcas" element={<ProtectedAdminRoute><AdminBrandsPage /></ProtectedAdminRoute>} />
                      <Route path="/admin/generador-blogs" element={<ProtectedAdminRoute><AdminBlogGeneratorPage /></ProtectedAdminRoute>} />
                      <Route path="/blog" element={<BlogPage />} />
                      <Route path="/blog/:slug" element={<BlogPostPage />} />
                      <Route path="/buscar" element={<SearchPage />} />
                      <Route path="/mi-cuenta" element={<MyAccountPage />} />
                      <Route path="/contacto-digital" element={<VCardNetpower />} />
                      <Route path="/resultado-pago" element={<PaymentResult />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </main>
                <Footer />
                <WhatsAppButton />
                <DeferredMount>
                  <Suspense fallback={null}>
                    <AIChatWidget />
                    <SocialProofPopup />
                  </Suspense>
                </DeferredMount>
              </div>
            </BrowserRouter>
          </TooltipProvider>
        </ChatProvider>
      </CartProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
