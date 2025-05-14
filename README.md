# Sistema de Pagos y Consumo de Agua con Bases de Datos Separadas

Este sistema integra donaciones, membresías y gestión de consumo de agua, utilizando **dos bases de datos independientes**:
- Una base de datos para pagos (donaciones y membresías)
- Otra base de datos para facturación y estadísticas de consumo de agua

## Características

- Sistema de donaciones (únicas y mensuales)
- Sistema de membresías (básica, pro y business)
- Gestión de facturas y estadísticas de consumo de agua
- Integración con Nu Colombia (transferencia bancaria)
- Notificaciones por correo electrónico
- Autenticación JWT
- Manejo de webhooks
- **Separación de datos para mayor seguridad y organización**

## Requisitos

- Node.js >= 14.x
- MongoDB >= 4.x
- Cuenta de Nu Colombia (personal)

## Instalación

1. Clona el repositorio:
```bash
git clone <url-del-repositorio>
cd sistema-pagos
```

2. Instala dependencias:
```bash
npm install
```

3. Configura las variables de entorno en un archivo `.env`:
```env
# Base de datos de pagos (donaciones y membresías)
MONGODB_URI=mongodb://localhost:27017/sistema-pagos

# Base de datos de acueducto (facturación y estadísticas)
MONGODB_URI_ACUEDUCTO=mongodb://localhost:27017/AcueductoDB

# Configuración del servidor
PORT=3000
NODE_ENV=development
BASE_URL=http://localhost:3000

# Configuración de JWT
JWT_SECRET=tu_clave_secreta_jwt

# Configuración de Nu (Cuenta Personal)
NU_ACCOUNT_NUMBER=tu_numero_de_cuenta_nu
NU_BANK_NAME=Nu Colombia
NU_ACCOUNT_TYPE=Cuenta de Ahorros
NU_ACCOUNT_HOLDER=tu_nombre_completo

# Configuración de Email
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_password_de_aplicacion_gmail

# Configuración de CORS
CORS_ORIGIN=http://localhost:3000
```

4. Inicia el servidor:
```bash
npm run dev
```

## Estructura del Proyecto

```
src/
  ├── models/
  │   ├── Donacion.js      # Usa la base de datos de pagos
  │   ├── Membresia.js     # Usa la base de datos de pagos
  │   ├── Factura.js       # Usa la base de datos de acueducto
  │   ├── Stats.js         # Usa la base de datos de acueducto
  │   └── User.js          # Usa la base de datos de pagos
  ├── controllers/
  ├── routes/
  ├── middleware/
  ├── config/
  └── app.js
```

## Notas sobre la separación de bases de datos
- **Donaciones, membresías y usuarios** se almacenan en la base de datos `sistema-pagos`.
- **Facturas y estadísticas de consumo de agua** se almacenan en la base de datos `AcueductoDB`.
- Esto permite mayor seguridad, escalabilidad y organización de los datos.

## API Endpoints

### Donaciones
- POST /api/donaciones/procesar
- POST /api/donaciones/webhook
- GET /api/donaciones/estado/:referencia

### Membresías
- POST /api/membresias/procesar
- POST /api/membresias/webhook
- GET /api/membresias/estado/:referencia

## Licencia

MIT 