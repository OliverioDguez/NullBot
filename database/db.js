const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

// Nos aseguramos de que el archivo .sqlite se guarde en la carpeta database
const dbPath = path.join(__dirname, "sentinel.sqlite");

// Conexión a la base de datos
// 'verbose: console.log' imprime las queries en consola (útil para debug, quítalo en producción)
const db = new Database(dbPath);

// Optimización recomendada para SQLite (Write-Ahead Logging)
db.pragma("journal_mode = WAL");

module.exports = {
  // Exponemos la instancia de la db para usarla en los comandos
  db,

  // Función para inicializar tablas base
  initDB: () => {
    // Ejemplo: Tabla de Usuarios/Niveles
    const createUsersTable = db.prepare(`
            CREATE TABLE IF NOT EXISTS user_levels (
                user_id TEXT PRIMARY KEY,
                xp INTEGER DEFAULT 0,
                level INTEGER DEFAULT 1,
                last_message_date INTEGER
            );
        `);

    createUsersTable.run();

    console.log("Database tables initialized.");
  },
};
