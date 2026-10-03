// Genera diccionario de datos y diagramas Mermaid a partir del esquema real (database/bd.sql)
const fs = require('node:fs');
const path = require('node:path');

const sql = fs.readFileSync(path.join(__dirname, '..', 'database', 'bd.sql'), 'utf8');
const out = path.join(__dirname, '..', 'docs');
fs.mkdirSync(out, { recursive: true });

const tables = [];
const re = /CREATE TABLE IF NOT EXISTS (\w+) \(([\s\S]*?)\n\);/g;
let m;
while ((m = re.exec(sql))) {
  const cols = m[2].split('\n').map((l) => l.trim().replace(/,$/, '')).filter(Boolean).map((l) => {
    const [name, type, ...rest] = l.split(/\s+/);
    const extra = rest.join(' ');
    const ref = /REFERENCES (\w+)\((\w+)\)/.exec(extra);
    return {
      name, type,
      pk: /PRIMARY KEY/.test(extra),
      notNull: /NOT NULL/.test(extra) || /PRIMARY KEY/.test(extra),
      unique: /UNIQUE/.test(extra),
      fk: ref ? { table: ref[1], col: ref[2] } : null,
      def: (/DEFAULT (\S+)/.exec(extra) || [])[1] || '',
    };
  });
  tables.push({ name: m[1], cols });
}

const fence = (code) => '```mermaid\n' + code.trim() + '\n```\n';

// 1. Diccionario de datos
let dict = '# Diccionario de datos\n\n';
for (const t of tables) {
  dict += `## ${t.name}\n\n| Columna | Tipo | PK | FK | Nulo | Único | Default |\n|---|---|---|---|---|---|---|\n`;
  for (const c of t.cols) {
    dict += `| ${c.name} | ${c.type} | ${c.pk ? 'Sí' : ''} | ${c.fk ? `${c.fk.table}.${c.fk.col}` : ''} | ${c.notNull ? 'No' : 'Sí'} | ${c.unique ? 'Sí' : ''} | ${c.def} |\n`;
  }
  dict += '\n';
}
fs.writeFileSync(path.join(out, 'diccionario-datos.md'), dict);

// 2. Diagrama entidad-relación
let er = 'erDiagram\n';
for (const t of tables) for (const c of t.cols) if (c.fk) er += `  ${c.fk.table} ||--o{ ${t.name} : "tiene"\n`;
for (const t of tables) {
  er += `  ${t.name} {\n`;
  for (const c of t.cols) er += `    ${c.type} ${c.name}${c.pk ? ' PK' : c.fk ? ' FK' : ''}\n`;
  er += '  }\n';
}
fs.writeFileSync(path.join(out, 'diagrama-er.md'), '# Diagrama entidad-relación\n\n' + fence(er));

// 3. Diagrama de clases (modulos reales del backend)
const classes = `
classDiagram
  class App {
    +createApp(db) Express
  }
  class Database {
    +createDb(file) DatabaseSync
  }
  class Validators {
    +validateCustomer(body) string[]
    +validateOrder(body) string[]
    +validateSchedule(body) string[]
    +validateStatus(body) string[]
  }
  class Server {
    +listen(port)
  }
  Server --> App
  App --> Database
  App --> Validators
`;
fs.writeFileSync(path.join(out, 'diagrama-clases.md'), '# Diagrama de clases\n\n' + fence(classes));

// 4. Diagrama de componentes
const comps = `
flowchart LR
  subgraph Cliente
    UI[Frontend HTML/JS]
  end
  subgraph Contenedor
    API[API REST Express]
    VAL[Validaciones]
    DB[(SQLite)]
  end
  UI -->|HTTP JSON| API
  API --> VAL
  API --> DB
`;
fs.writeFileSync(path.join(out, 'diagrama-componentes.md'), '# Diagrama de componentes\n\n' + fence(comps));

// 5. Diagrama de despliegue
const deploy = `
flowchart TB
  Dev[Desarrollador] -->|git push| GH[GitHub]
  GH --> CI[GitHub Actions]
  CI -->|build y push| GHCR[(GitHub Container Registry)]
  CI -->|terraform apply| RG
  CI -->|webapps-deploy| APP
  subgraph AZ[Azure]
    direction TB
    RG[Resource Group] --> PLAN[App Service Plan Linux]
    PLAN --> APP[Web App Contenedor]
  end
  GHCR -->|pull imagen| APP
  User[Usuario] -->|HTTPS| APP
  CI --> SONAR[SonarCloud]
  CI --> SNYK[Snyk y Semgrep]
`;
fs.writeFileSync(path.join(out, 'diagrama-despliegue.md'), '# Diagrama de despliegue\n\n' + fence(deploy));

console.log('Documentacion generada en docs/');
