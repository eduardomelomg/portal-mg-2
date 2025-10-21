import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import UserDropdown from "./UserDropdown";

export default function Topbar() {
  const { user, empresa, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    const fn = (ev: MouseEvent) => {
      if (ref.current && !ref.current.contains(ev.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const companyName = empresa?.nome ?? "Carregando...";
  const cnpj = empresa?.cnpj ?? "00.000.000/0000-00";
  const initials = (user?.nome || "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="flex items-center justify-between bg-[#2e3338] text-white h-14 px-4 border-b border-[#1c1f22]">
      {/* 🔹 Esquerda: Empresa - CNPJ */}
      <div className="flex items-center gap-2">
        <span className="font-semibold">{companyName}</span>
        <span className="text-sm text-gray-400">- {cnpj}</span>
      </div>

      {/* 🔹 Direita: Avatar + Nome do Usuário */}
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 bg-transparent border-none focus:outline-none"
        >
          {/* Avatar / Logo */}
          <div className="w-9 h-9 rounded-full overflow-hidden bg-[#2e3338] border border-gray-700 flex items-center justify-center text-sm font-bold text-gray-300">
            {empresa?.logoUrl ? (
              <img
                key={empresa.logoUrl}
                src={`${empresa.logoUrl}?t=${Date.now()}`}
                alt="Logo da Empresa"
                className="object-cover w-full h-full"
              />
            ) : (
              <span>{initials}</span>
            )}
          </div>

          {/* Infos do usuário */}
          <div className="flex flex-col items-start leading-none">
            <span className="text-sm font-semibold">
              {loading ? "Carregando..." : user?.nome ?? "Usuário"}
            </span>
            <span className="text-xs text-gray-400">
              {loading ? "aguarde..." : user?.email ?? "—"}
            </span>
          </div>
        </button>

        {open && <UserDropdown onClose={() => setOpen(false)} />}
      </div>
    </header>
  );
}
