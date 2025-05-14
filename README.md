# Sistema de Gestión de Consumo de Agua

## Últimas Actualizaciones

### 2024-03-19
- Implementación de Google AdSense para monetización responsable
  - Integración de anuncios en diferentes ubicaciones (header, sidebar, content)
  - Sistema de respaldo con anuncios internos
  - Diseño responsivo y optimizado para diferentes dispositivos
- Mejoras en el sistema de facturas
  - Exportación a PDF y Excel
  - Filtros avanzados por estado, fecha y monto
  - Estadísticas de consumo y comparativas
  - Paginación y ordenamiento
- Sistema de notificaciones mejorado
  - Notificaciones por email
  - Recordatorios de pago
  - Alertas de beneficios y membresía

## Características Principales

### Gestión de Facturas
- Visualización de facturas con filtros avanzados
- Exportación a PDF y Excel
- Estadísticas de consumo
- Sistema de pagos con beneficios
- Notificaciones automáticas

### Sistema de Beneficios
- Puntos por pagos puntuales
- Descuentos progresivos
- Membresías premium
- Racha de pagos

### Anuncios Responsables
- Integración con Google AdSense
- Anuncios internos personalizados
- Enfoque en sostenibilidad y medio ambiente
- Diseño responsivo y optimizado

### Notificaciones
- Recordatorios de pago
- Alertas de beneficios
- Notificaciones de membresía
- Configuración personalizable

## Requisitos Técnicos

### Dependencias
```bash
npm install pdfkit exceljs nodemailer
```

### Variables de Entorno
```env
# Google AdSense
ADSENSE_CLIENT_ID=ca-pub-6616389458954354

# Email
SMTP_HOST=your-smtp-host
SMTP_PORT=your-smtp-port
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
```

## Instalación

1. Clonar el repositorio
```bash
git clone https://github.com/WTunic29/consumo-agua.git
```

2. Instalar dependencias
```bash
cd consumo-agua
npm install
```

3. Configurar variables de entorno
```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

4. Iniciar la aplicación
```bash
npm start
```

## Contribución

1. Fork el repositorio
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE.md](LICENSE.md) para más detalles.

## Contacto

Tu Nombre - [@tutwitter](https://twitter.com/tutwitter) - email@ejemplo.com

Link del Proyecto: [https://github.com/WTunic29/consumo-agua](https://github.com/WTunic29/consumo-agua) 