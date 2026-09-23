import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/lib/auth";
import Login from "@/pages/Login";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Transaksi from "@/pages/Transaksi";
import Produk from "@/pages/Produk";
import Analitik from "@/pages/Analitik";
import Insight from "@/pages/Insight";
import Laporan from "@/pages/Laporan";
import Profil from "@/pages/Profil";

const Protected = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-stone-500">Memuat NADI...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const PublicOnly = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-stone-500">Memuat NADI...</div>;
  if (user) return <Navigate to="/" replace />;
  return children;
};

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <Toaster richColors position="top-right" />
          <Routes>
            <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
            <Route element={<Protected><Layout /></Protected>}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/transaksi" element={<Transaksi />} />
              <Route path="/produk" element={<Produk />} />
              <Route path="/analitik" element={<Analitik />} />
              <Route path="/insight" element={<Insight />} />
              <Route path="/laporan" element={<Laporan />} />
              <Route path="/profil" element={<Profil />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}

export default App;
