const sqlite3 = require("sqlite3").verbose();
const dbname = require("../config").dbPath;
class SQLiteManager {
  async openConnection() {
    return new Promise((resolve) => {
      const db = new sqlite3.Database(dbname, (err) => {
        if (err) {
          console.error("Error opening database", err.message);
          resolve(undefined);
        } else {
          resolve(db);
        }
      });
    });
  }

  closeConnection(db) {
    // Close the database connection when done
    db.close((err) => {
      if (err) {
        console.error("Error closing database", err.message);
      }
    });
  }

  async createTable(name, columns = []) {
    await this.openConnection().then((db) => {
      if (db) {
        let query = `CREATE TABLE IF NOT EXISTS ${name} (id INTEGER PRIMARY KEY AUTOINCREMENT,`;
        columns.forEach((column) => {
          query += `${column.name} ${column.type},`;
        });
        query = query.substring(0, query.length - 1);
        query += ");";
        db.serialize(() => {
          db.run(query, (err) => {
            if (err) {
              console.error("Error creating table", err.message);
            }
            db.close();
          });
        });
      }
    });
  }

  async selectBy(table_name, column = undefined) {
    return new Promise(async (resolve) => {
      if (!column) resolve(null);
      await this.openConnection().then((db) => {
        if (!db) resolve(null);
        db.get(
          `SELECT * FROM ${table_name} WHERE ${column.name} = ?`,
          [column.value],
          (err, row) => {
            if (err) {
              console.error("Database error:", err.message);
            }
            resolve(row);

            // Close connection after query
            db.close();
          }
        );
      });
    });
  }

  async insert(table_name, columns = []) {
    return new Promise(async (resolve) => {
      await this.openConnection().then((db) => {
        if (!db) resolve(-1);
        let __columns = "";
        let __values_spaces = "";
        let values = [];
        columns.forEach((column) => {
          __columns += `${column.name},`;
          __values_spaces += "?,";
          values.push(column.value);
        });
        __columns = __columns.substring(0, __columns.length - 1);
        __values_spaces = __values_spaces.substring(
          0,
          __values_spaces.length - 1
        );

        let query = `INSERT INTO ${table_name} (${__columns}) VALUES (${__values_spaces})`;
        let stmt = db.prepare(query);
        stmt.run(values, function (err) {
          db.close();
          if (err) {
            console.error(`Error inserting to ${table_name}:`, err.message);
            resolve(-1);
          }
          resolve(this.lastID);
        });
        stmt.finalize();
      });
    });
  }

  async update(table_name, columns_to_update = [], where_columns = []) {
    return new Promise(async (resolve) => {
      await this.openConnection().then((db) => {
        if (!db) resolve(-1);
        let __columns = "";
        let __where = "";
        let values = [];
        columns_to_update.forEach((column) => {
          __columns += `${column.name} = ? AND `;
          values.push(column.value);
        });

        where_columns.forEach((column) => {
          __where += `${column.name} = ? AND `;
          values.push(column.value);
        });
        __columns = __columns.substring(0, __columns.length - 5);
        __where = __where.substring(0, __where.length - 5);

        let query = `UPDATE ${table_name} SET ${__columns} WHERE ${__where}`;
        let stmt = db.prepare(query);
        stmt.run(values, function (err) {
          db.close();
          if (err) {
            console.error(`Error updating ${table_name}:`, err.message);
            resolve(-1);
          }
          resolve(this.lastID);
        });
        stmt.finalize();
      });
    });
  }

  async select(table_name) {
    return new Promise(async (resolve) => {
      await this.openConnection().then((db) => {
        if (!db) resolve([]);
        db.all(`SELECT * FROM ${table_name}`, [], (err, rows) => {
          db.close();
          if (err) {
            console.error("Error querying users:", err.message);
          }
          resolve(rows);
        });
      });
    });
  }
}

module.exports = SQLiteManager;
