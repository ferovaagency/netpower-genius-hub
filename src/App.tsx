import React from "react";
import LegalPage from "./pages/LegalPage";
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
import AIChatWidget from "@/components/layout/AIChatWidget";
import SocialProofPopup from "@/components/layout/SocialProofPopup";
import HomePage from "./pages/HomePage";
import ShopPage from "./pages/ShopPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import QuotePage from "./pages/QuotePage";
import ContactPage from "./pages/ContactPage";
import BrandsPage from "./pages/BrandsPage";
import AboutPage from "./pages/AboutPage";
import ProductSheetGeneratorPage from "./pages/ProductSheetGeneratorPage";
import NotFound from "./pages/NotFound";
import AdminPage from "./pages/AdminPage";
import MyAccountPage from "./pages/MyAccountPage";
import VCardNetpower from "./pages/VCardNetpower";
import PaymentResult from "./pages/PaymentResult";
import AdminBrandsPage from "./pages/AdminBrandsPage";
import SearchPage from "./pages/SearchPage";
import BlogPage from "./pages/BlogPage";
import BlogPostPage from "./pages/BlogPostPage";
import AdminBlogGeneratorPage from "./pages/AdminBlogGeneratorPage";
import AuthPage from "./pages/AuthPage";
import ProtectedAdminRoute from "./components/auth/ProtectedAdminRoute";

function ScrollToTop() {
  const { pathname } = useLocation();
  React.useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [pathname]);
  return null;
}
const queryClient = new QueryClient();

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
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/tienda" element={<ShopPage />} />
                    <Route path="/producto/:slug" element={<ProductDetailPage />} />
                    <Route path="/carrito" element={<CartPage />} />
                    <Route path="/checkout" element={<CheckoutPage />} />
                    <Route path="/cotizacion" element={<QuotePage />} />
                    <Route path="/contacto" element={<ContactPage />} />
                    <Route path="/marcas" element={<BrandsPage />} />
                    <Route path="/nosotros" element={<AboutPage />} />
                    <Route path="/auth" element={<AuthPage />} />
                    <Route path="/admin/generador-fichas" element={<ProtectedAdminRoute><ProductSheetGeneratorPage /></ProtectedAdminRoute>} />
                    <Route path="*" element={<NotFound />} />
                    <Route path="/legal" element={<LegalPage />} />
                    <Route path="/admin" element={<ProtectedAdminRoute><AdminPage /></ProtectedAdminRoute>} />
                    <Route path="/admin/marcas" element={<ProtectedAdminRoute><AdminBrandsPage /></ProtectedAdminRoute>} />
                    <Route path="/admin/generador-blogs" element={<ProtectedAdminRoute><AdminBlogGeneratorPage /></ProtectedAdminRoute>} />
                    <Route path="/blog" element={<BlogPage />} />
                    <Route path="/blog/:slug" element={<BlogPostPage />} />
                    <Route path="/buscar" element={<SearchPage />} />
                    <Route path="/mi-cuenta" element={<MyAccountPage />} />
                    <Route path="/contacto-digital" element={<VCardNetpower />} />
                    <Route path="/resultado-pago" element={<PaymentResult />} />
                  </Routes>
                </main>
                <Footer />
                <WhatsAppButton />
                <AIChatWidget />
                <SocialProofPopup />
              </div>
            </BrowserRouter>
          </TooltipProvider>
        </ChatProvider>
      </CartProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
