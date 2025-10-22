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
      className="
        absolute top-[120%] right-0 
        min-w-[200px]
        bg-[#2e3338]
        text-white
        rounded-md
        py-1
        z-50
        overflow-hidden
      "
      onMouseLeave={onClose}
    >
      {/* 🔹 Botão Minha Conta */}
      <button
        className="
          w-full text-left px-4 py-2 text-sm 
          bg-transparent border-0 outline-none
          hover:bg-[#3a3a3a] 
          transition-colors duration-150
        "
        onClick={() => {
          onClose();
          navigate("/admin/minha-conta");
        }}
      >
        Minha Conta
      </button>

      {/* 🔹 Botão Sair */}
      <button
        className="
          w-full text-left px-4 py-2 text-sm text-red-400 
          bg-transparent border-0 outline-none
          hover:bg-[#3a3a3a] 
          transition-colors duration-150
        "
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
