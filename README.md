# Sistema de Registro de Consumo de Agua

Aplicación web para visualizar y analizar el consumo de agua en diferentes municipios (Bogotá, Soacha y Gachancipá), con sistema de autenticación y gestión de facturas personales.

## Características

### Visualización de Datos
- 📊 Visualización de datos históricos de consumo
- 📈 Gráficos interactivos de tendencias
- 🗺️ Mapa interactivo de sectores
- 📱 Diseño responsivo
- 🌓 Modo claro/oscuro
- 📊 Análisis comparativo entre municipios
- 📈 Proyecciones de consumo futuro
- 📊 Cálculo de variaciones porcentuales

### Sistema de Usuarios
- 👤 Registro de usuarios
- 🔐 Autenticación segura
- ✅ Validación de políticas de uso
- 👥 Perfiles de usuario personalizados

### Gestión de Facturas
- 📝 Registro manual de facturas
- 📋 Visualización de facturas personales
- ✏️ Edición de facturas
- 🗑️ Eliminación de facturas
- 🔍 Filtrado y búsqueda de facturas

### Sostenibilidad y Donaciones
- 💚 Sistema de donaciones
- ⭐ Planes de membresía
- 📢 Anuncios responsables
- 💧 Métricas de sostenibilidad

## Tecnologías Utilizadas

- Node.js
- Express
- MongoDB
- EJS (Template Engine)
- Chart.js
- Leaflet.js
- Bootstrap 5
- JWT (JSON Web Tokens)
- bcrypt

## Requisitos Previos

- Node.js (v14 o superior)
- MongoDB
- npm o yarn

## Instalación

1. Clonar el repositorio:
```bash
git clone [URL_DEL_REPOSITORIO]
cd proyecto
```

2. Instalar dependencias:
```bash
npm install
```

3. Crear archivo .env en la raíz del proyecto:
```env
MONGODB_URI=mongodb://localhost:27017/consumo_agua
PORT=3000
JWT_SECRET=tu_clave_secreta_aqui
```

4. Iniciar la aplicación:
```bash
npm start
```

5. Abrir en el navegador:
```
http://localhost:3000
```

## Estructura del Proyecto

```
proyecto/
├── src/
│   ├── config/
│   │   └── database.js    # Configuración de MongoDB
│   ├── middleware/
│   │   └── auth.js        # Middleware de autenticación
│   ├── models/
│   │   ├── Stats.js       # Modelo de estadísticas
│   │   ├── User.js        # Modelo de usuarios
│   │   └── Factura.js     # Modelo de facturas
│   ├── routes/
│   │   ├── auth.js        # Rutas de autenticación
│   │   ├── facturas.js    # Rutas de facturas
│   │   └── politicas.js   # Rutas de políticas
│   ├── views/
│   │   ├── index.ejs      # Vista principal
│   │   ├── politicas.ejs  # Políticas de uso
│   │   └── registro.ejs   # Formulario de registro
│   └── index.js           # Archivo principal
├── .env                   # Variables de entorno
├── .gitignore            # Archivos ignorados por git
└── README.md             # Documentación
```

## API Endpoints

### Autenticación
- POST `/auth/registro` - Registro de usuarios
- POST `/auth/login` - Inicio de sesión
- GET `/auth/perfil` - Obtener perfil de usuario

### Facturas
- GET `/facturas/:usuarioId` - Obtener facturas del usuario
- POST `/facturas` - Crear nueva factura
- PUT `/facturas/:id` - Actualizar factura
- DELETE `/facturas/:id` - Eliminar factura

### Políticas
- GET `/politicas` - Ver políticas de uso y privacidad

## Características de Seguridad

- Autenticación mediante JWT
- Contraseñas hasheadas con bcrypt
- Validación de datos en frontend y backend
- Protección de rutas mediante middleware
- Aceptación obligatoria de políticas de uso

## Planes de Membresía

### Plan Básico ($5/mes)
- Sin anuncios
- Reportes básicos

### Plan Pro ($10/mes)
- Sin anuncios
- Reportes avanzados
- Predicciones personalizadas

### Plan Empresarial ($25/mes)
- Todo lo del Plan Pro
- API access
- Soporte prioritario

## Contribuir

1. Fork el proyecto
2. Crear una rama para tu función: `git checkout -b feature/NuevaFuncion`
3. Commit tus cambios: `git commit -m 'Agregar nueva función'`
4. Push a la rama: `git push origin feature/NuevaFuncion`
5. Abrir un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT. 