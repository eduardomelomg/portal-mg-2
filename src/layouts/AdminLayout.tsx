import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar/Sidebar";
import Topbar from "../components/Topbar/Topbar";

export default function AdminLayout() {
  return (
    <div className="flex h-screen w-screen">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-y-auto">
        <Topbar />
        <main className="p-6 bg-[#1c1f22] flex-1">
          {/* 🔹 Aqui o React Router renderiza as páginas internas */}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
