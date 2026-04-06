import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { StoreProvider } from "@/data/store";
import Index from "./pages/Index";
import Studenti from "./pages/Studenti";
import TestPage from "./pages/Test";
import ClassBuilder from "./pages/ClassBuilder";
import Registro from "./pages/Registro";
import Insegnanti from "./pages/Insegnanti";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <StoreProvider>
        <BrowserRouter>
          <SidebarProvider>
            <div className="min-h-screen flex w-full">
              <AppSidebar />
              <div className="flex-1 flex flex-col">
                <header className="h-12 flex items-center border-b bg-background px-4">
                  <SidebarTrigger />
                  <span className="ml-3 text-sm font-medium text-muted-foreground">SEMI FORESTI — Gestionale Scuola</span>
                </header>
                <main className="flex-1 p-4 md:p-6 overflow-auto">
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/studenti" element={<Studenti />} />
                    <Route path="/test" element={<TestPage />} />
                    <Route path="/class-builder" element={<ClassBuilder />} />
                    <Route path="/registro" element={<Registro />} />
                    <Route path="/insegnanti" element={<Insegnanti />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
              </div>
            </div>
          </SidebarProvider>
        </BrowserRouter>
      </StoreProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
