# Sistema de Lavandería con recojo y envío a domicilio

API REST (Node.js/Express + SQLite) y frontend web servidos desde el mismo contenedor.

Endpoints: 
- POST `/customers`
- GET `/customers/{id}`
- POST `/laundry-orders`
- GET `/laundry-orders/{id}`
- POST `/laundry-orders/{id}/pickup`
- POST `/laundry-orders/{id}/delivery`
- POST `/laundry-orders/{id}/status`
- GET `/customers/{id}/laundry-orders`