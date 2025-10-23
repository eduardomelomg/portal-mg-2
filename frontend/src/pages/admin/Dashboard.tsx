export default function AdminDashboard() {
  return (
    <div className="text-white">
      <h1 className="text-2xl font-semibold mb-2">Painel Administrativo</h1>
      <p className="text-gray-400 mb-6">Visão geral do sistema</p>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#2b2f33] p-4 rounded-lg">
          <h2 className="text-lg font-medium">Total de Empresas</h2>
          <p className="text-3xl font-bold mt-2">0</p>
        </div>

        <div className="bg-[#2b2f33] p-4 rounded-lg">
          <h2 className="text-lg font-medium">Total de Envios</h2>
          <p className="text-3xl font-bold mt-2">0</p>
        </div>

        <div className="bg-[#2b2f33] p-4 rounded-lg">
          <h2 className="text-lg font-medium">Colaboradores Ativos</h2>
          <p className="text-3xl font-bold mt-2">0</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="bg-[#2b2f33] p-4 rounded-lg">
          <h2 className="text-lg font-medium mb-2">
            Arquivos Enviados por Empresa
          </h2>
          <p className="text-gray-400">Nenhum dado disponível</p>
        </div>

        <div className="bg-[#2b2f33] p-4 rounded-lg">
          <h2 className="text-lg font-medium mb-2">Últimos 5 Envios</h2>
          <p className="text-gray-400">Nenhum envio recente</p>
        </div>
      </div>
    </div>
  );
}
