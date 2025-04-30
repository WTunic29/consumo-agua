s # Sistema de Registro de Consumo de Agua

Aplicación web para visualizar y analizar el consumo de agua en diferentes municipios (Bogotá, Soacha y Gachancipá).

## Características

- 📊 Visualización de datos históricos de consumo
- 📈 Gráficos interactivos de tendencias
- 🗺️ Mapa interactivo de sectores
- 📱 Diseño responsivo
- 🌓 Modo claro/oscuro
- 📊 Análisis comparativo entre municipios
- 📈 Proyecciones de consumo futuro
- 📊 Cálculo de variaciones porcentuales

## Tecnologías Utilizadas

- Node.js
- Express
- MongoDB
- EJS (Template Engine)
- Chart.js
- Leaflet.js
- Bootstrap 5

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
│   ├── models/
│   │   └── Stats.js       # Modelo de datos
│   ├── views/
│   │   └── index.ejs      # Vista principal
│   └── index.js           # Archivo principal
├── .env                   # Variables de entorno
├── .gitignore            # Archivos ignorados por git
└── README.md             # Documentación
```

## Uso

La aplicación muestra:
- Promedios de consumo por municipio
- Variaciones porcentuales mensuales
- Gráfico de tendencias históricas
- Mapa interactivo con ubicaciones
- Proyecciones de consumo futuro
- Tabla de datos históricos

## Contribuir

1. Fork el proyecto
2. Crear una rama para tu función: `git checkout -b feature/NuevaFuncion`
3. Commit tus cambios: `git commit -m 'Agregar nueva función'`
4. Push a la rama: `git push origin feature/NuevaFuncion`
5. Abrir un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT. 