# Diagrama de componentes

```mermaid
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
```
