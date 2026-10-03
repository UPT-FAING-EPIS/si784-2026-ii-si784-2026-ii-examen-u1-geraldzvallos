# Diccionario de datos

## customers

| Columna | Tipo | PK | FK | Nulo | Único | Default |
|---|---|---|---|---|---|---|
| id | INTEGER | Sí |  | No |  |  |
| name | TEXT |  |  | No |  |  |
| email | TEXT |  |  | No | Sí |  |
| phone | TEXT |  |  | No |  |  |
| created_at | TEXT |  |  | No |  | CURRENT_TIMESTAMP |

## addresses

| Columna | Tipo | PK | FK | Nulo | Único | Default |
|---|---|---|---|---|---|---|
| id | INTEGER | Sí |  | No |  |  |
| customer_id | INTEGER |  | customers.id | No |  |  |
| street | TEXT |  |  | No |  |  |
| district | TEXT |  |  | No |  |  |
| reference | TEXT |  |  | Sí |  |  |

## laundry_orders

| Columna | Tipo | PK | FK | Nulo | Único | Default |
|---|---|---|---|---|---|---|
| id | INTEGER | Sí |  | No |  |  |
| customer_id | INTEGER |  | customers.id | No |  |  |
| address_id | INTEGER |  | addresses.id | Sí |  |  |
| service_type | TEXT |  |  | No |  |  |
| status | TEXT |  |  | No |  | 'registrado' |
| created_at | TEXT |  |  | No |  | CURRENT_TIMESTAMP |

## order_items

| Columna | Tipo | PK | FK | Nulo | Único | Default |
|---|---|---|---|---|---|---|
| id | INTEGER | Sí |  | No |  |  |
| order_id | INTEGER |  | laundry_orders.id | No |  |  |
| garment_type | TEXT |  |  | No |  |  |
| quantity | INTEGER |  |  | No |  |  |

## pickups

| Columna | Tipo | PK | FK | Nulo | Único | Default |
|---|---|---|---|---|---|---|
| id | INTEGER | Sí |  | No |  |  |
| order_id | INTEGER |  | laundry_orders.id | No | Sí |  |
| pickup_date | TEXT |  |  | No |  |  |
| time_slot | TEXT |  |  | No |  |  |

## deliveries

| Columna | Tipo | PK | FK | Nulo | Único | Default |
|---|---|---|---|---|---|---|
| id | INTEGER | Sí |  | No |  |  |
| order_id | INTEGER |  | laundry_orders.id | No | Sí |  |
| delivery_date | TEXT |  |  | No |  |  |
| time_slot | TEXT |  |  | No |  |  |
| confirmed | INTEGER |  |  | No |  | 0 |

## order_status_history

| Columna | Tipo | PK | FK | Nulo | Único | Default |
|---|---|---|---|---|---|---|
| id | INTEGER | Sí |  | No |  |  |
| order_id | INTEGER |  | laundry_orders.id | No |  |  |
| status | TEXT |  |  | No |  |  |
| changed_at | TEXT |  |  | No |  | CURRENT_TIMESTAMP |

