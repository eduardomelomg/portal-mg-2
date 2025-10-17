import { useState, useEffect } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useAuth } from "../../hooks/useAuth";

type UserRole = "admin" | "gestor" | "colaborador";

interface EmpresaData {
  nomeEmpresa: string;
  cnpj: string;
  logoUrl: string | null;
  telefone: string;
}

interface UsuarioData {
  nome: string;
  email: string;
  cargo: UserRole;
}

export default function MinhaConta() {
  const { user } = useAuth(); // supondo que vem: { name, email, role, empresa }

  const [empresa, setEmpresa] = useState<EmpresaData>({
    nomeEmpresa: "Mendonça Galvão Contadores Associados Ltda",
    cnpj: "19.395.930/0001-10",
    logoUrl: null,
    telefone: "",
  });

  const [usuario, setUsuario] = useState<UsuarioData>({
    nome: user?.name ?? "",
    email: user?.email ?? "",
    cargo: (user?.role as UserRole) ?? "colaborador",
  });

  const [senha, setSenha] = useState({
    atual: "********",
    nova: "",
    confirmar: "",
  });

  const [mostrarSenha, setMostrarSenha] = useState({
    atual: false,
    nova: false,
    confirmar: false,
  });

  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (empresa.logoUrl) setLogoPreview(empresa.logoUrl);
  }, [empresa.logoUrl]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const podeEditar = usuario.cargo === "admin" || usuario.cargo === "gestor";

  return (
    <div className="text-white space-y-8">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold">Minha Conta</h1>
        <p className="text-gray-400">
          Gerencie os dados da sua empresa e altere sua senha
        </p>
      </div>

      {/* === LOGO DA EMPRESA === */}
      <section className="bg-[#2b2f33] p-6 rounded-lg space-y-4">
        <h2 className="text-xl font-semibold">Logo da Empresa</h2>
        <p className="text-gray-400">Gerencie a imagem da sua empresa</p>

        <div className="flex flex-col items-center space-y-4">
          <div className="w-32 h-32 bg-[#3a3a3a] rounded-full flex items-center justify-center overflow-hidden">
            {logoPreview ? (
              <img
                src={logoPreview}
                alt="Logo"
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-yellow-600" />
            )}
          </div>

          <div className="w-full">
            <label className="block text-sm font-medium mb-1">
              Selecionar Logo
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-yellow-600 file:text-black hover:file:bg-yellow-500"
            />
          </div>

          <button className="mt-4 bg-yellow-600 text-black px-4 py-2 rounded-md font-semibold hover:bg-yellow-500">
            Salvar Logo
          </button>
        </div>
      </section>

      {/* === DADOS DA EMPRESA === */}
      <section className="bg-[#2b2f33] p-6 rounded-lg space-y-4">
        <h2 className="text-xl font-semibold">Dados da Empresa</h2>
        <p className="text-gray-400">
          Atualize as informações da sua empresa
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Nome da Empresa</label>
            <input
              type="text"
              value={empresa.nomeEmpresa}
              disabled={!podeEditar}
              onChange={(e) =>
                setEmpresa({ ...empresa, nomeEmpresa: e.target.value })
              }
              className="w-full bg-[#1c1f22] border border-gray-700 rounded-md p-2"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">CNPJ</label>
            <input
              type="text"
              value={empresa.cnpj}
              disabled={!podeEditar}
              className="w-full bg-[#1c1f22] border border-gray-700 rounded-md p-2"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Nome do Usuário</label>
            <input
              type="text"
              value={usuario.nome}
              disabled={
                usuario.cargo === "colaborador" ? false : !podeEditar
              }
              onChange={(e) =>
                setUsuario({ ...usuario, nome: e.target.value })
              }
              className="w-full bg-[#1c1f22] border border-gray-700 rounded-md p-2"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">E-mail</label>
            <input
              type="email"
              value={usuario.email}
              disabled={
                usuario.cargo === "colaborador" ? false : !podeEditar
              }
              onChange={(e) =>
                setUsuario({ ...usuario, email: e.target.value })
              }
              className="w-full bg-[#1c1f22] border border-gray-700 rounded-md p-2"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Telefone</label>
            <input
              type="tel"
              value={empresa.telefone}
              disabled={false}
              onChange={(e) =>
                setEmpresa({ ...empresa, telefone: e.target.value })
              }
              className="w-full bg-[#1c1f22] border border-gray-700 rounded-md p-2"
            />
          </div>

          <button className="mt-4 bg-yellow-600 text-black px-4 py-2 rounded-md font-semibold hover:bg-yellow-500">
            Salvar Alterações
          </button>
        </div>
      </section>

      {/* === ALTERAR SENHA === */}
      <section className="bg-[#2b2f33] p-6 rounded-lg space-y-4">
        <h2 className="text-xl font-semibold">Alterar Senha</h2>
        <p className="text-gray-400">
          Mantenha sua conta segura alterando sua senha regularmente
        </p>

        {["atual", "nova", "confirmar"].map((field) => (
          <div key={field} className="relative">
            <label className="block text-sm mb-1 capitalize">
              {field === "atual"
                ? "Senha Atual"
                : field === "nova"
                ? "Nova Senha"
                : "Confirmar Nova Senha"}
            </label>
            <input
              type={
                mostrarSenha[field as keyof typeof mostrarSenha]
                  ? "text"
                  : "password"
              }
              value={senha[field as keyof typeof senha]}
              onChange={(e) =>
                setSenha({ ...senha, [field]: e.target.value })
              }
              className="w-full bg-[#1c1f22] border border-gray-700 rounded-md p-2 pr-10"
            />
            <button
              type="button"
              className="absolute right-3 top-[33px] text-gray-400"
              onClick={() =>
                setMostrarSenha({
                  ...mostrarSenha,
                  [field]:
                    !mostrarSenha[field as keyof typeof mostrarSenha],
                })
              }
            >
              {mostrarSenha[field as keyof typeof mostrarSenha] ? (
                <FaEyeSlash />
              ) : (
                <FaEye />
              )}
            </button>
          </div>
        ))}

        <button className="mt-4 bg-yellow-600 text-black px-4 py-2 rounded-md font-semibold hover:bg-yellow-500">
          Salvar Nova Senha
        </button>
      </section>
    </div>
  );
}
