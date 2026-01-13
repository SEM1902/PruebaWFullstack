# Wompi Payment Challenge

## Descripción
Aplicación Full Stack (Frontend React + Backend NestJS) para procesar pagos utilizando la pasarela **Wompi** en modo Sandbox. La aplicación permite elegir un producto, ingresar datos de tarjeta y envío, y procesar la transacción asegurando la integridad de los datos.

## Arquitectura

### Backend (NestJS)
Implementa **Arquitectura Hexagonal (Ports & Adapters)** para desacoplar la lógica de negocio de la infraestructura.
- **Domain**: Entidades (`Product`, `Transaction`, `Customer`) y lógica pura.
- **Application**: Servicios (`TransactionsService`, `ProductsService`) que orquestan los casos de uso.
- **Infrastructure**: Adaptadores para Base de Datos (TypeORM/Postgres) y HTTP Controllers.

### Frontend (React + Redux)
- **SPA** construida con Vite y TypeScript.
- **Redux Toolkit** para manejo de estado global.
- **Redux Persist** para resiliencia (el carrito no se pierde al refrescar).
- **Diseño Responsivo** optimizado para Mobile First (iPhone SE reference).

## Tecnologías Utilizadas
- **Backend**: NestJS, TypeORM, PostgreSQL, Axios, @nestjs/config.
- **Frontend**: React, Redux Toolkit, Styled Components, Axios.
- **DevOps**: Docker, Docker Compose.

---

## Configuración y Ejecución

### Prerrequisitos
- Node.js v18+
- Docker & Docker Compose

### Pasos para correr el proyecto

1. **Clonar el repositorio**:
   ```bash
   git clone <URL_DEL_REPO>
   cd PruebaWompi
   ```

2. **Iniciar Base de Datos (Docker)**:
   ```bash
   docker-compose up -d
   ```
   Esto levantará un contenedor PostgreSQL en el puerto `5433` (para evitar conflictos con el 5432 local).

3. **Backend**:
   ```bash
   cd backend
   npm install
   # Crear archivo .env (ver abajo)
   npm run start:dev
   ```

4. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

### Variables de Entorno (.env)
Crear un archivo `backend/.env` con:
```env
WOMPI_API_URL=https://api-sandbox.co.uat.wompi.dev/v1
WOMPI_PUB_KEY=pub_stagtest_g2u0HQd3ZMh05hsSgTS2lUV8t3s4mOt7
WOMPI_PRV_KEY=prv_stagtest_5i0ZGIGiFcDQifYsXxvsny7Y37tKqFWg
WOMPI_INTEGRITY_KEY=stagtest_integrity_nAIBuqayW70XpUqJS4qf4STYiISd89Fp
WOMPI_EVENTS_KEY=stagtest_events_2PDUmhMywUkvb1LvxYnayFbmofT7w39N

DB_HOST=localhost
DB_PORT=5433
DB_USER=user
DB_PASSWORD=password
DB_NAME=wompi_db
```

---

## API Documentation

### Products
- **GET /products**
  - Obitne lista de productos.
- **GET /products/:id**
  - Obtiene detalle de un producto (incluyendo Stock).

### Transactions
- **POST /transactions**
  - Crea una nueva transacción.
  - Body: `{ productId, customer: {...}, delivery: {...}, cardToken, acceptanceToken }`
  - *Nota*: Calcula automáticamente la **Firma de Integridad** (SHA256) antes de enviar a Wompi.
- **GET /transactions/:reference**
  - Obtiene el estado de una transacción por su referencia única.
- **PATCH /transactions/:id**
  - Actualiza el estado de una transacción (Callback/Webhook).
  - Body: `{ status: 'APPROVED' | 'DECLINED' ... }`

---

## Modelo de Datos (PostgreSQL)

- **Product**: `id, name, price, stock, imageUrl`
- **Transaction**: `id (uuid), reference, amountInCents, currency, status, wompiTransactionId`
  - FKs: `productId`, `customerId`, `deliveryId`
- **Customer**: `id, fullName, email, phoneNumber`
- **Delivery**: `id, address, city, region, postalCode`

---

## Tests y Cobertura

Se implementaron pruebas unitarias exhaustivas superando el **80% de cobertura** requerido.

**Frontend (Vitest):**
- **Cobertura Global:** 94.2% (Statements)
- **Componentes Clave:**
  - `Summary`: 93% (Lógica de pago)
  - `Result`: 95% (Estados de transacción)
  - `PaymentModal`: 100% (Validación de tarjeta)

**Backend (Jest):**
- **Cobertura Core:** > 90% en lógica de negocio.
- **Servicios:**
  - `TransactionsService`: **94.73%** (Flujo completo: PENDING -> APPROVED/ERROR)
  - `ProductsService`: 100%
- **Controladores:**
  - `ProductsController`: 100%
  - `TransactionsController`: Covered
  
Para ejecutar los tests:
- Backend: `npm run test` o `npm run test:cov`
- Frontend: `npm run test` o `npm run coverage`

---

## Seguridad
- Las llaves de API (Secretas) no están hardcodeadas, se cargan vía `ConfigService` desde variables de entorno.
- Se implementó la firma de integridad SHA256 para evitar manipulación de montos.
- CORS habilitado para comunicación segura con el Frontend.

---
**Desarrollado para la Prueba Técnica Wompi.**
