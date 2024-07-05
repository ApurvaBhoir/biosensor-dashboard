import sqlitw3 from "sqlite3";

const db = new sqlitw3.Database("./db.sqlite");

const databank = () =>{
   db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS heart_rate (id INTEGER PRIMARY KEY, value FLOAT, timestamp TEXT)");
  db.run("CREATE TABLE IF NOT EXISTS oxygen (id INTEGER PRIMARY KEY, value FLOAT, timestamp TEXT)");
  db.run("CREATE TABLE IF NOT EXISTS raw_data (id INTEGER PRIMARY KEY, value1 FLOAT, value2 FLOAT, timestamp TEXT)");
  });
}
export{databank,db};