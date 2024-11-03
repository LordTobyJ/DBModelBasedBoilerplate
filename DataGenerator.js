const path = require('path');
const fs = require('fs');

const regexRemoveBrackets = /\(|\)/g;

class GeneralDataGenerator {
  constructor() {

    this.header = `// WARNING: This file is autogenerated, and will be changed with every deploy`;

    this.db = {};
    this.frontend = {};

    this.db.create = `#bin/bash
${this.header.replace("//","#")}
    
psql -U $POSTGRES_USER -c "CREATE DATABASE $POSTGRES_DB;"
psql -U $POSTGRES_DB -d $POSTGRES_DB -c "CREATE EXTENSION IF NOT EXISTS \"pgcrypto\";"
`;

    this.frontend.apihandler = ` ${this.header}
const RequestFromAPI = async (endpoint, method, data) => {
  const headers={"Content-Type": "application/json"};

  if (method !== "GET") 
    return await fetch(\`\${endpoint}\`, { method, headers, body: JSON.stringify(data)})

  if (Object.keys(data).length == 0)
    return await fetch (\`\${endpoint}\`, {method, headers})

  const params = Object.entries(data).map((kv) => kv.join("=")).join("&");

  return await fetch (\`\${endpoint}?\$\{params}\`, {method, headers})
}`;
  }

}

class EachFileDataGenerator {
  constructor(modelsFolder, file) {    
    
    this.header = `// WARNING: This file is autogenerated, and will be changed with every deploy`;

    this.db = {};
    this.frontend = {};
    this.backend = {};

    this.fileDataRaw = fs.readFileSync(path.join(modelsFolder, file));
    this.fileData = JSON.parse(this.fileDataRaw);
    this.data = Object.entries(this.fileData);

    this.tableName = file.replace(".json","");
    this.primaryKey = this.data.reduce((json) => json.filter((col) => col[1] && col[1].includes("PRIMARY KEY") ? col : []));
    this.foreignKeys = this.data.filter((col) => col[1] && col[1].includes("FOREIGN KEY"));
    this.columnNames = this.data.map((json) => json[0]).filter((col) => col !== this.primaryKey[0]); 
    
    // Frontend
    this.frontend.get = `${this.header}
export const Get${this.tableName} = async () => {
  const response = await RequestFromAPI("/api/db/${this.tableName}", "GET", {})
  try {return await response.json()} catch {return []}
}

module.exports = Get${this.tableName};`;

    this.frontend.getById = `${this.header}
    export const Get${this.tableName}ById = async (${this.primaryKey[0]}) => {
      const response = await RequestFromAPI("/api/db/${this.tableName}", "GET", {${this.primaryKey[0]}})
      try {return await response.json()} catch {return []}
    }

module.exports = Get${this.tableName}ById;`;

    this.frontend.update = `${this.header}
export const Update${this.tableName} = async(${this.primaryKey[0]},${this.columnNames.join(",")}) => {
  const response = await RequestFromAPI("/api/db/${this.tableName}", "PUT", {${this.primaryKey[0]},${this.columnNames.join(",")}})
  try {return await response.json()} catch {return []}
}

module.exports = Update${this.tableName};`;

    this.frontend.create = `${this.header}
export const Create${this.tableName} = async (${this.columnNames.join(",")}) => {
  const response = await RequestFromAPI("/api/db/${this.tableName}", "POST", {${this.columnNames.join(",")}})
  try {return await response.json()} catch {return []}
}

module.exports = Create${this.tableName};`;

    this.frontend.delete = `${this.header}
export const Delete${this.tableName} = async (${this.primaryKey[0]}) => {
  const response = await RequestFromAPI("/api/db/${this.tableName}", "DELETE", {${this.primaryKey[0]}})
  try {return await response.json()} catch {return []}
}

module.exports = Delete${this.tableName};`;

    // Backend
    this.backend.get = `${this.header}
const Get${this.tableName} = async (req, res) => {
  const dbClient = req.dbClient;
  try {
    const response = await dbClient.query("SELECT * FROM ${this.tableName}");
    if (response.rows.length == 0) {
      res.status(404).send();
    };
    res.status(200).json(response.rows).send();
  } catch {
    res.status(500).send();
  };
};
  
module.exports = Get${this.tableName};`;
  
    this.backend.create = `${this.header}
const Post${this.tableName} = async (req, res) => {
  const dbClient = req.dbClient;
  const body = req.body;
  try {
    ${this.columnNames.map((name) => `const ${name} = body["${name}"];`).join("\n")}
    await dbClient.query(
      "INSERT INTO ${this.tableName} (${this.columnNames.join(",")}) VALUES (${this.columnNames.map((m, i) => `$${i+1}`)})",
      [${this.columnNames.join(",")}]);
    res.status(204).send();
  } catch {
    res.status(500).send();
  };
};
        
module.exports = Post${this.tableName};`;
  
  this.backend.update = `${this.header}
const Put${this.tableName} = async (req, res) => {
  const dbClient = req.dbClient;
  const body = req.body;
  try {
    ${this.columnNames.map((name) => `const ${name} = body["${name}"];`).join("\n")}
    const ${this.primaryKey[0]} = body["${this.primaryKey[0]}"];
    await dbClient.query(
      "INSERT INTO ${this.tableName} (${this.columnNames.join(",")}) VALUES (${this.columnNames.map((m, i) => `$${i+1}`)}) WHERE ${this.primaryKey[0]}::${this.primaryKey[1][0].toLowerCase()} = $${this.columnNames.length+1}",
      [${this.columnNames.join(",")}, ${this.primaryKey[0]}]);
    res.status(204).send();
  } catch {
    res.status(500).send();
  };
};
        
module.exports = Put${this.tableName};`;
      
  this.backend.delete = `${this.header}
const Delete${this.tableName} = async (req, res) => {
  const dbClient = req.dbClient;
  const body = req.body;
  try {
    const ${this.primaryKey[0]} = body["${this.primaryKey[0]}"];
    await dbClient.query(
      "DELETE * FROM ${this.tableName} WHERE ${this.primaryKey[0]}::${this.primaryKey[1][0].toLowerCase()} = $1",
      [${this.primaryKey[0]}]);
    res.status(204).send();
  } catch {
    res.status(500).send();
  };
};
              
module.exports = Delete${this.tableName};`;
  
  this.backend.getById = `${this.header}
const Get${this.tableName}ById = async (req, res) => {
  const dbClient = req.dbClient;
  const body = req.query;
  try {
    const ${this.primaryKey[0]} = body["${this.primaryKey[0]}"];
    await dbClient.query(
      \`SELECT * FROM ${this.tableName} 
      ${this.foreignKeys.map((fk) => `JOIN ${fk[1][2]} ON ${fk[1][2]}.${fk[1][3].replace(regexRemoveBrackets, '')} = ${this.tableName}.${this.primaryKey[0]}`).join("\n      ")}
      WHERE ${this.primaryKey[0]}::${this.primaryKey[1][0].toLowerCase()} = $1;\`,
      [${this.primaryKey[0]}]);
    res.status(204).send();
  } catch {
    res.status(500).send();
  };
};
                    
module.exports = Get${this.tableName}ById;
    `

  // DB Data
  this.db.generateTable = `psql -U $POSTGRES_DB -d $POSTGRES_DB -c "
CREATE TABLE IF NOT EXISTS ${file.replace(".json", "")} (
${this.data.map((item, i) => `    ${item[0]} ${item[1].includes("FOREIGN KEY") ? item[1][0] : item[1].join(" ")}${i == this.data.length - 1 && this.foreignKeys.length == 0 ? "" : ","}`).join("\n")}
${this.foreignKeys.map((item, i) => `    CONSTRAINT fk_${item[0]} FOREIGN KEY (${item[0]}) REFERENCES ${item[1].slice(2,).join("")}${i == this.foreignKeys.length - 1 ? "" : ","}`).join("\n")}
);"
`;
  
  }
}

module.exports = { GeneralDataGenerator, EachFileDataGenerator };