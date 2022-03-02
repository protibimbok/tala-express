import { createPool } from "mysql2/promise";
export { setTala, genToken, ensureUser, getOfUser, getOfToken, revokeToken } from "../mysql2/main.js";

export const database = createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "test",
});
