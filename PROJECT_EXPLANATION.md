# Documentación Técnica Detallada - Código y Funciones

Este documento desglosa "todo el código": las funciones clave, la lógica interna de los componentes y cómo se conectan las piezas del rompecabezas.

---

## 1. Backend: El Motor (NestJS)

El backend expone la API y se comunica con Wompi.

### 1.1 `TransactionsService` (El Cerebro)
Ubicación: `src/core/application/services/transactions.service.ts`

Es la clase principal que orquesta el pago.

*   **Función: `createTransaction(data)`**
    Esta es **LA** función más importante. Pasos que ejecuta:
    1.  **Valida Stock:** Consulta `productRepository.findOne()`. Si `stock < 1`, lanza error.
    2.  **Calcula Firma (Integrity):** Llama a una función privada que concatena `reference + amount + currency + secret` y hace un hash SHA-256. Esto es OBLIGATORIO por Wompi para asegurar que nadie modificó el precio en el camino.
    3.  **Llamada a Wompi:** Usa `axios` para hacer POST a la API de Wompi con el token de la tarjeta (que vino del frontend) y la firma generada.
    4.  **Guarda en BD:** Si Wompi responde OK, guarda la transacción en nuestra tabla `transactions` con el `wompiId`.
    5.  **Actualiza Stock:** Reduce el stock del producto en -1.

    ```typescript
    // Ejemplo simplificado de la lógica de firma
    const rawSignature = `${reference}${amountInCents}${currency}${process.env.WOMPI_INTEGRITY_SECRET}`;
    const signature = crypto.createHash('sha256').update(rawSignature).digest('hex');
    ```

### 1.2 `ProductEntity` (El Modelo)
Ubicación: `src/infrastructure/adapters/database/entity/product.entity.ts`
Define la tabla SQL. Usamos un decorador `@Check` (o lógica de negocio) para evitar stock negativo.

---

## 2. Frontend: La Interfaz (React & Redux)

### 2.1 `cartSlice.ts` (Máquina de Estados)
Ubicación: `src/features/cart/cartSlice.ts`

En lugar de tener muchos `useState` regados, usamos Redux para un estado global predecible.

*   **State:**
    *   `step`: Controla qué pantalla se ve (`PRODUCT`, `PAYMENT`, `SUMMARY`, `RESULT`). Es como un semáforo.
    *   `selectedProductId`: ID del producto que el usuario quiere.
    *   `transactionData`: Un objeto gigante que va acumulando datos (Nombre, Dirección, Tarjeta enmascarada) a medida que el usuario llena el formulario.

*   **Reducers (Funciones que cambian el estado):**
    *   `setTransactionData`: Recibe el formulario del modal y lo guarda.
    *   `resetCart`: Limpia todo para volver a comprar.

### 2.2 `apiSlice.ts` (RTK Query)
Ubicación: `src/features/api/apiSlice.ts`

Esta es nuestra capa de datos "mágica".
*   `useGetProductsQuery`: Hace el `fetch('/products')` automáticamente. Cachea el resultado. Si el stock cambia, RTK Query puede invalidar el caché y recargar solo.
*   `useCreateTransactionMutation`: Envía el pago. Maneja los estados `isLoading`, `isSuccess`, `isError` sin que escribamos `if (loading)...` manualmente.

### 2.3 `PaymentModal.tsx` (Lógica de UI Compleja)
Ubicación: `src/features/payment/PaymentModal.tsx`

Aquí está la lógica visual "bonita".

*   **Función `handleChange` (Input de Tarjeta):**
    Intercepta lo que escribes.
    *   `value.replace(/\D/g, '')`: Elimina cualquier letra (solo deja números).
    *   *Nota:* Antes poníamos espacios cada 4 dígitos, pero lo quitamos para dejarlo raw (puro) y evitar problemas.

*   **Función `validate` (Validación Manual):**
    Antes de dejarte dar click a "Pagar":
    1.  Verifica que el email tenga `@`.
    2.  Verifica que la fecha `MM/YY` no sea del pasado.
    3.  Llama a `isValidCreditCard` (ver abajo).

### 2.4 `validation.ts` (Algoritmo de Luhn)
Ubicación: `src/utils/validation.ts`

*   **Función `isValidCreditCard(number)`:**
    Implementa matemáticas reales.
    1.  Toma el número de tarjeta, lo invierte.
    2.  Multiplica por 2 cada segundo dígito.
    3.  Si el resultado > 9, le resta 9.
    4.  Suma todo. Si el total termina en 0 (módulo 10), la tarjeta es matemáticamente válida.
    *Esto es estándar mundial para detectar errores de dedo antes de enviar a Wompi.*

---

## 3. Pruebas (Lo que garantiza que funciona)

### 3.1 `PaymentModal.test.tsx`
*   **Simulación de Usuario:** Usamos `fireEvent.change` para teclear en los inputs falsos.
*   **Verificación:** `expect(screen.getByText('Invalid Email')).toBeInTheDocument()` comprueba que si escribes mal el correo, salga el error rojo.

### 3.2 `seeder.service.ts` (Datos de Prueba)
Este script corre al inicio.
*   Verifica si la base de datos está vacía.
*   Si sí, inserta: iPhone 15, Sony Headphones, etc.
*   **Importante:** Aquí definimos las rutas de las imágenes (`/products/iphone-15-pro.png`). Si cambiamos las imágenes, tocamos este archivo.

---

## 4. Guía de Pruebas Manuales (Wompi Sandbox)

Para verificar que el sistema funciona, usa estas tarjetas de prueba proporcionadas por Wompi para su entorno Sandbox.

### Tarjetas de Prueba (Sandbox)

| Estado Deseado | Número de Tarjeta | CVV | Expira |
| :--- | :--- | :--- | :--- |
| **APROBADA** | `4242 4242 4242 4242` | Cualquiera | Futuro |
| **DECLINADA** | `5555 5555 5555 5555` | Cualquiera | Futuro |

### Pasos para Probar
1.  Abre la aplicación (`http://localhost:5173`).
2.  Selecciona un producto (ej. iPhone 15).
3.  Click en "Comprar Ahora".
4.  Llena los datos personales (Cualquier nombre/email sirven).
5.  Usa la tarjeta **APROBADA** de arriba.
6.  Click en "Pagar".
7.  Deberías ver la animación de confeti 🎉 y el estado `APPROVED`.

---

## Resumen del Flujo de Datos

1.  **Usuario** `click` en iPhone -> **Redux** guarda `selectedProductId`.
2.  **Usuario** llena tarjeta -> **Validación** (Luhn) pasa -> **Redux** guarda datos en `transactionData`.
3.  **Usuario** confirma ->
    *   **Frontend** pide token a Wompi.
    *   **Frontend** manda token + datos al Backend.
    *   **Backend** valida stock, firma con secreto, cobra en Wompi.
    *   **Backend** devuelve "APPROVED".
4.  **Frontend** recibe "APPROVED" -> **Redux** cambia paso a `RESULT` -> Muestra animación.
