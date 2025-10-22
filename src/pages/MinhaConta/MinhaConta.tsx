import { useState, useEffect } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../services/supabase";

type UserRole = "admin" | "gestor" | "colaborador";

interface EmpresaData {
  id: string;
  nomeEmpresa: string;
  cnpj: string;
  dominio?: string | null;
  logoUrl?: string | null;
  telefone?: string | null;
}

interface UsuarioData {
  nome: string;
  email: string;
  cargo: UserRole;
}

// 🔧 Helper: Redimensiona imagem antes do upload
async function resizeImage(file: File, maxSize = 256): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = document.createElement("img");
    img.src = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const scale = Math.min(maxSize / img.width, maxSize / img.height);
      const width = img.width * scale;
      const height = img.height * scale;

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Erro ao acessar canvas"));
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("Erro ao gerar blob da imagem."));
          const resizedFile = new File([blob], file.name, { type: file.type });
          resolve(resizedFile);
        },
        file.type,
        0.85
      );
    };

    img.onerror = reject;
  });
}

export default function MinhaConta() {
  const {
    user,
    empresa: empresaInfo,
    cargo,
    updateLogoUrl,
    updateUserData,
  } = useAuth();

  // ✅ Usa o nome e email diretamente do contexto (sem user_metadata)
  const [usuario, setUsuario] = useState<UsuarioData>({
    nome: user?.nome || "Usuário",
    email: user?.email || "",
    cargo: (cargo as UserRole) || "colaborador",
  });

  const [empresa, setEmpresa] = useState<EmpresaData | null>(null);

  // Senhas
  const [senha, setSenha] = useState({ atual: "", nova: "", confirmar: "" });
  const [mostrarSenha, setMostrarSenha] = useState({
    atual: false,
    nova: false,
    confirmar: false,
  });

  // Logo
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  // Loaders
  const [salvandoLogo, setSalvandoLogo] = useState(false);
  const [salvandoDados, setSalvandoDados] = useState(false);
  const [salvandoSenha, setSalvandoSenha] = useState(false);

  // Prefill inicial
  useEffect(() => {
    if (empresaInfo) {
      setEmpresa({
        id: empresaInfo.id,
        nomeEmpresa: empresaInfo.nome,
        cnpj: empresaInfo.cnpj || "",
        dominio: empresaInfo.dominio || null,
        logoUrl: empresaInfo.logoUrl || null,
        telefone: empresaInfo.telefone || "",
      });
      setLogoPreview(empresaInfo.logoUrl || null);
    }

    if (user) {
      setUsuario((prev) => ({
        ...prev,
        nome: user.nome || prev.nome,
        email: user.email || prev.email,
      }));
    }
  }, [empresaInfo, user]);

  // Limpa URLs blob
  useEffect(() => {
    return () => {
      if (logoPreview?.startsWith("blob:")) URL.revokeObjectURL(logoPreview);
    };
  }, [logoPreview]);

  //const podeEditar = usuario.cargo === "admin" || usuario.cargo === "gestor";

  // Upload da logo
  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (
      !["image/png", "image/jpeg", "image/webp"].includes(selectedFile.type)
    ) {
      alert("Envie uma imagem PNG, JPG ou WEBP.");
      return;
    }

    if (selectedFile.size > 3 * 1024 * 1024) {
      alert("A imagem deve ter no máximo 3 MB.");
      return;
    }

    try {
      const resized = await resizeImage(selectedFile, 256);
      setFile(resized);
      setLogoPreview(URL.createObjectURL(resized));
    } catch {
      alert("Erro ao processar imagem.");
    }
  };

  const handleSalvarLogo = async () => {
    if (!file || !empresa) return alert("Selecione um arquivo.");

    setSalvandoLogo(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${empresa.id}_${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const publicUrl = data?.publicUrl;
      if (!publicUrl) throw new Error("Erro ao gerar URL pública.");

      const { error: dbError } = await supabase
        .from("empresas")
        .update({ logoUrl: publicUrl })
        .eq("id", empresa.id);

      if (dbError) throw dbError;

      setEmpresa((prev) => prev && { ...prev, logoUrl: publicUrl });
      updateLogoUrl(publicUrl);

      alert("✅ Logo atualizada com sucesso!");
    } catch (e) {
      console.error(e);
      alert("Erro ao salvar logo.");
    } finally {
      setSalvandoLogo(false);
    }
  };

  // Atualiza dados da empresa e usuário
  // Substitua apenas o handleSalvarAlteracoes() por este:
  const handleSalvarAlteracoes = async () => {
    if (!empresa) return;
    setSalvandoDados(true);
    try {
      // Atualiza empresa
      const { error: empError } = await supabase
        .from("empresas")
        .update({
          nome: empresa.nomeEmpresa,
          cnpj: empresa.cnpj,
          telefone: empresa.telefone,
        })
        .eq("id", empresa.id);
      if (empError) throw empError;

      // Atualiza usuário no auth
      if (usuario.email && usuario.email !== user?.email) {
        const { error: userError } = await supabase.auth.updateUser({
          email: usuario.email,
          data: { full_name: usuario.nome },
        });
        if (userError) throw userError;
      } else {
        await supabase.auth.updateUser({
          data: { full_name: usuario.nome },
        });
      }

      // 🔁 Atualiza contexto local sem reload
      updateUserData({
        nome: usuario.nome,
        email: usuario.email,
      });

      alert("✅ Dados atualizados com sucesso!");
    } catch (e) {
      console.error(e);
      alert("Erro ao atualizar dados.");
    } finally {
      setSalvandoDados(false);
    }
  };

  // Alterar senha
  const handleSalvarSenha = async () => {
    if (!usuario.email) return alert("Usuário sem e-mail válido.");
    if (!senha.atual || !senha.nova || !senha.confirmar)
      return alert("Preencha todos os campos.");
    if (senha.nova.length < 8)
      return alert("A nova senha deve ter pelo menos 8 caracteres.");
    if (senha.nova !== senha.confirmar) return alert("As senhas não conferem.");

    setSalvandoSenha(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: usuario.email,
        password: senha.atual,
      });
      if (signInError) {
        alert("Senha atual incorreta.");
        return;
      }

      const { error: passError } = await supabase.auth.updateUser({
        password: senha.nova,
      });
      if (passError) throw passError;

      alert("✅ Senha alterada com sucesso!");
      setSenha({ atual: "", nova: "", confirmar: "" });
    } catch (e) {
      console.error(e);
      alert("Erro ao alterar senha.");
    } finally {
      setSalvandoSenha(false);
    }
  };

  return (
    <div className="text-white space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Minha Conta</h1>
        <p className="text-gray-400">
          Gerencie os dados da sua empresa e altere sua senha
        </p>
      </div>

      {/* === LOGO === */}
      <section className="bg-[#2b2f33] p-6 rounded-lg space-y-4">
        <h2 className="text-xl font-semibold">Logo da Empresa</h2>
        <div className="flex flex-col items-center space-y-4">
          <div className="w-32 h-32 bg-[#2b2f33] rounded-full flex items-center justify-center overflow-hidden border border-gray-700">
            {logoPreview ? (
              <img
                src={
                  logoPreview.startsWith("data:image") ||
                  logoPreview.startsWith("blob:")
                    ? logoPreview
                    : `${logoPreview}?t=${Date.now()}`
                }
                alt="Logo"
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-700" />
            )}
          </div>

          <div className="w-full text-center">
            <label
              htmlFor="logo-upload"
              className="inline-block bg-yellow-600 text-black px-4 py-2 rounded-md font-semibold cursor-pointer hover:bg-yellow-500 transition-colors duration-150"
            >
              Escolher arquivo
            </label>
            <input
              id="logo-upload"
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              className="hidden"
            />
          </div>

          <button
            onClick={handleSalvarLogo}
            disabled={!file || salvandoLogo}
            className={`mt-4 px-4 py-2 rounded-md font-semibold text-black ${
              salvandoLogo
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-yellow-600 hover:bg-yellow-500"
            }`}
          >
            {salvandoLogo ? "Salvando..." : "Salvar Logo"}
          </button>
        </div>
      </section>

      {/* === DADOS DA EMPRESA === */}
      <section className="bg-[#2b2f33] p-6 rounded-lg space-y-4">
        <h2 className="text-xl font-semibold">Dados da Empresa</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Nome da Empresa</label>
            <input
              type="text"
              value={empresa?.nomeEmpresa || ""}
              onChange={(e) =>
                setEmpresa((prev) =>
                  prev ? { ...prev, nomeEmpresa: e.target.value } : prev
                )
              }
              className="w-full bg-[#1c1f22] border border-gray-700 rounded-md p-2"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">CNPJ</label>
            <input
              type="text"
              value={empresa?.cnpj || ""}
              onChange={(e) =>
                setEmpresa((prev) =>
                  prev ? { ...prev, cnpj: e.target.value } : prev
                )
              }
              className="w-full bg-[#1c1f22] border border-gray-700 rounded-md p-2"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Nome de Usuário</label>
              <input
                type="text"
                value={usuario.nome}
                onChange={(e) =>
                  setUsuario((prev) => ({ ...prev, nome: e.target.value }))
                }
                className="w-full bg-[#1c1f22] border border-gray-700 rounded-md p-2"
              />
            </div>

            <div>
              <label className="block text-sm mb-1">E-mail</label>
              <input
                type="email"
                value={usuario.email}
                onChange={(e) =>
                  setUsuario((prev) => ({ ...prev, email: e.target.value }))
                }
                className="w-full bg-[#1c1f22] border border-gray-700 rounded-md p-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1">Telefone</label>
            <input
              type="tel"
              value={empresa?.telefone || ""}
              onChange={(e) =>
                setEmpresa((prev) =>
                  prev ? { ...prev, telefone: e.target.value } : prev
                )
              }
              className="w-full bg-[#1c1f22] border border-gray-700 rounded-md p-2"
            />
          </div>

          <button
            onClick={handleSalvarAlteracoes}
            disabled={salvandoDados}
            className={`mt-4 px-4 py-2 rounded-md font-semibold text-black ${
              salvandoDados
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-yellow-600 hover:bg-yellow-500"
            }`}
          >
            {salvandoDados ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>
      </section>

      {/* === ALTERAR SENHA === */}
      <section className="bg-[#2b2f33] p-6 rounded-lg space-y-4">
        <h2 className="text-xl font-semibold">Alterar Senha</h2>

        {(["atual", "nova", "confirmar"] as const).map((field) => (
          <div key={field} className="relative">
            <label className="block text-sm mb-1 capitalize">
              {field === "atual"
                ? "Senha Atual"
                : field === "nova"
                ? "Nova Senha"
                : "Confirmar Nova Senha"}
            </label>
            <input
              type={mostrarSenha[field] ? "text" : "password"}
              value={senha[field]}
              onChange={(e) =>
                setSenha((prev) => ({ ...prev, [field]: e.target.value }))
              }
              className="w-full bg-[#1c1f22] border border-gray-700 rounded-md p-2 pr-10"
            />
            <button
              type="button"
              className="absolute right-3 top-[33px] text-gray-400"
              onClick={() =>
                setMostrarSenha((prev) => ({ ...prev, [field]: !prev[field] }))
              }
            >
              {mostrarSenha[field] ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        ))}

        <button
          onClick={handleSalvarSenha}
          disabled={salvandoSenha}
          className={`mt-4 px-4 py-2 rounded-md font-semibold text-black ${
            salvandoSenha
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-yellow-600 hover:bg-yellow-500"
          }`}
        >
          {salvandoSenha ? "Salvando..." : "Salvar Nova Senha"}
        </button>
      </section>
    </div>
  );
}
