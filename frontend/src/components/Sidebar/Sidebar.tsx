import { useState, useMemo } from "react";
import {
  FaHome,
  FaUpload,
  FaUserFriends,
  FaBars,
  FaChevronLeft,
} from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import styles from "./Sidebar.module.css";
import LogoFechada from "../../assets/icon.png";
import LogoAberta from "../../assets/LogoMenorMG.png";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { cargo } = useAuth(); // 👈 pega o cargo do contexto

  const isManager = cargo === "admin" || cargo === "gestor";

  const items = useMemo(
    () => [
      { icon: <FaHome />, label: "Página Inicial", path: "/admin", show: true },
      { icon: <FaUpload />, label: "Arquivos Enviados", path: "/admin/envios", show: true },
      // ✅ só mostra para admin/gestor
      { icon: <FaUserFriends />, label: "Usuários", path: "/admin/usuarios", show: isManager },
    ],
    [isManager]
  );

  return (
    <aside
      className={styles.sidebar}
      style={{ width: isOpen ? "14rem" : "4rem" }}
      onClick={() => setIsOpen(!isOpen)}
      title={isOpen ? "Fechar menu" : "Abrir menu"}
    >
      <div className={styles.top}>
        <button
          className={styles.toggle}
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
        >
          {isOpen ? <FaChevronLeft size={18} /> : <FaBars size={18} />}
        </button>

        <nav
          className={`${styles.menu} ${isOpen ? styles.menuOpen : styles.menuClosed}`}
        >
          {items.filter(i => i.show).map((item) => (
            <button
              key={item.label}
              onClick={(e) => {
                e.stopPropagation();
                navigate(item.path);
              }}
              className={`${styles.menuItem} ${pathname === item.path ? styles.menuItemActive : ""}`}
              title={!isOpen ? item.label : undefined}
            >
              <span className={styles.icon}>{item.icon}</span>
              {isOpen && <span className={styles.label}>{item.label}</span>}
            </button>
          ))}
        </nav>
      </div>

      <div
        className={styles.logo}
        onClick={(e) => {
          e.stopPropagation();
          navigate("/admin");
        }}
      >
        <img
          src={isOpen ? LogoAberta : LogoFechada}
          alt="Logo"
          style={{
            height: isOpen ? "40px" : "32px",
            transition: "all 0.3s ease",
            cursor: "pointer",
          }}
        />
      </div>
    </aside>
  );
}
