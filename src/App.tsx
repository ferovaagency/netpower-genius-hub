import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
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
import HomePage from "./pages/HomePage";
import ShopPage from "./pages/ShopPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CartPage from "./pages/CartPage";
import QuotePage from "./pages/QuotePage";
import ContactPage from "./pages/ContactPage";
import BrandsPage from "./pages/BrandsPage";
import AboutPage from "./pages/AboutPage";
import ProductSheetGeneratorPage from "./pages/ProductSheetGeneratorPage";
import NotFound from "./pages/NotFound";

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
                <Header />
                <main className="flex-1">
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/tienda" element={<ShopPage />} />
                    <Route path="/producto/:slug" element={<ProductDetailPage />} />
                    <Route path="/carrito" element={<CartPage />} />
                    <Route path="/cotizacion" element={<QuotePage />} />
                    <Route path="/contacto" element={<ContactPage />} />
                    <Route path="/marcas" element={<BrandsPage />} />
                    <Route path="/nosotros" element={<AboutPage />} />
                    <Route path="/admin/generador-fichas" element={<ProductSheetGeneratorPage />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
                <Footer />
                <WhatsAppButton />
                <AIChatWidget />
              </div>
            </BrowserRouter>
          </TooltipProvider>
        </ChatProvider>
      </CartProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
