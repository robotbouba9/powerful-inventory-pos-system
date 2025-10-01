import { SQLDatabase } from "encore.dev/storage/sqldb";

export default new SQLDatabase("inventory_erp", {
  migrations: "./migrations",
});
