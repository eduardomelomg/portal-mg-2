import express from "express";
import cors from "cors";
import { inviteUser } from "./src/api/invite-user.ts";
import { listUsers } from "./src/api/list-users.ts";

const app = express();

app.use(cors());
app.use(express.json());

// ✅ Rotas da API
app.get("/api/users", listUsers);
app.post("/api/invite-user", inviteUser);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Backend rodando em http://localhost:${PORT}`);
});
