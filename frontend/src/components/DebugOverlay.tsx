import { memo } from "react";
import { useAuth } from "../hooks/useAuth";

function _DebugOverlay() {
  const { authChecked, user, empresa, cargo } = useAuth();

  return (
    <div
      style={{
        position: "fixed",
        bottom: 8,
        right: 8,
        zIndex: 9999,
        padding: "8px 10px",
        background: "rgba(0,0,0,.75)",
        color: "#cbd5e1",
        fontSize: 12,
        border: "1px solid #334155",
        borderRadius: 6,
        maxWidth: 420,
        lineHeight: 1.35,
      }}
    >
      <div><b>authChecked</b>: {String(authChecked)}</div>
      <div><b>user</b>: {user ? `${user.nome} <${user.email}>` : "null"}</div>
      <div><b>cargo</b>: {cargo ?? "null"}</div>
      <div><b>empresa</b>: {empresa ? `${empresa.nome} (${empresa.id})` : "null"}</div>
    </div>
  );
}

// habilite/desabilite aqui
export default memo(_DebugOverlay);
