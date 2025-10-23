import { supabase } from "../../../frontend/src/services/supabase";
import { useNavigate } from "react-router-dom";

export default function ClientDashboard() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#1c1f22] text-white flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold mb-4">Portal do Cliente</h1>
      <p className="text-lg mb-8">Bem-vindo ao sistema Mendonça Galvão.</p>
      <button
        onClick={handleLogout}
        className="bg-yellow-500 text-black px-4 py-2 rounded-md hover:opacity-90 transition"
      >
        Sair
      </button>
    </div>
  );
}
