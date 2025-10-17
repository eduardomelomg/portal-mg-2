import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

type Props = {
  onClose: () => void;
};

export default function UserDropdown({ onClose }: Props) {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div
      className="absolute top-[120%] right-0 min-w-[180px] bg-[#2e3338] text-white rounded-md shadow-lg py-1 z-50"
      onMouseLeave={onClose}
    >
      {/* ✅ Botão "Minha Conta" agora navega corretamente */}
      <button
        className="w-full text-left px-4 py-2 hover:bg-[#3a3a3a] text-sm"
        onClick={() => {
          onClose(); // fecha o dropdown
          navigate("/admin/minha-conta"); // redireciona para a página Minha Conta
        }}
      >
        Minha Conta
      </button>

      {/* ✅ Botão "Sair" mantém o comportamento original */}
      <button
        className="w-full text-left px-4 py-2 hover:bg-[#3a3a3a] text-sm text-red-400"
        onClick={() => {
          onClose();
          void signOut();
        }}
      >
        Sair
      </button>
    </div>
  );
}
