import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { inviteUser } from "./api/invite-user";
import { listUsers } from "./api/list-users";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Backend rodando em http://localhost:${PORT}`);
});

app.use(cors());
app.use(express.json());

app.get("/api/users", listUsers);
app.post("/api/invite-user", inviteUser);

app.listen(PORT, () => {
  console.log(`✅ Backend rodando em http://localhost:${PORT}`);
});
