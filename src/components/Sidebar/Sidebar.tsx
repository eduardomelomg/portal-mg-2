import { useState } from "react";
import {
  FaHome,
  FaUpload,
  FaUserFriends,
  FaBars,
  FaChevronLeft,
} from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "./Sidebar.module.css";
import LogoFechada from "../../assets/icon.png";
import LogoAberta from "../../assets/LogoMenorMG.png";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const items = [
    { icon: <FaHome />, label: "Página Inicial", path: "/admin" },
    { icon: <FaUpload />, label: "Arquivos Enviados", path: "/admin/envios" },
    { icon: <FaUserFriends />, label: "Usuários", path: "/admin/empresas" },
  ];

  return (
    // 🔥 Qualquer clique na sidebar abre/fecha o menu
    <aside
      className={styles.sidebar}
      style={{ width: isOpen ? "14rem" : "4rem" }}
      onClick={() => setIsOpen(!isOpen)}
      title={isOpen ? "Fechar menu" : "Abrir menu"}
    >
      <div className={styles.top}>
        {/* Botão de toggle (não propaga o clique pra evitar duplo toggle) */}
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
          className={`${styles.menu} ${
            isOpen ? styles.menuOpen : styles.menuClosed
          }`}
        >
          {items.map((item) => (
            <button
              key={item.label}
              onClick={(e) => {
                e.stopPropagation(); // 👈 não fecha ao clicar no item
                navigate(item.path);
              }}
              className={`${styles.menuItem} ${
                pathname === item.path ? styles.menuItemActive : ""
              }`}
              title={!isOpen ? item.label : undefined}
            >
              <span className={styles.icon}>{item.icon}</span>
              {isOpen && <span className={styles.label}>{item.label}</span>}
            </button>
          ))}
        </nav>
      </div>

      {/* Logo inferior — também protegida do toggle global */}
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
