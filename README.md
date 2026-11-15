# Productos Financieros

Aplicación web para consultar, crear, editar y eliminar productos financieros, desarrollada con Angular 20 y CSS puro (sin frameworks ni librerías externas de componentes).

## Tecnologías

- Angular 20.3 (standalone components, Signals y Reactive Forms)
- TypeScript 5.9
- RxJS 7.8
- CSS puro (diseño responsive con unidades `rem`)
- Jest 30 + `jest-preset-angular` para pruebas unitarias

## Funcionalidades

- **Listado de productos (`/products`):** muestra logo o iniciales de respaldo cuando la imagen falla, nombre, descripción, fecha de liberación y fecha de revisión (`dd/MM/yyyy`), además de esqueletos de carga mientras responde la API.
- **Búsqueda:** filtra en tiempo real por nombre, descripción o ID desde el buscador superior.
- **Cantidad de registros y paginación:** permite mostrar `5`, `10` o `20` productos por página, muestra el total de resultados y habilita botones de paginación.
- **Agregar producto (`/products/new`):** formulario con validaciones síncronas (campos requeridos, longitudes mínimas y máximas, fecha igual o mayor a la actual), verificación asíncrona de ID disponible, cálculo automático de la fecha de revisión un año después de la fecha de liberación y botón **Reiniciar**.
- **Editar producto (`/products/edit/:id`):** accesible desde el menú contextual (`⋮`) de cada fila. Precarga los datos del producto manteniendo el ID bloqueado. El botón **Reiniciar** limpia los campos editables conservando el ID.
- **Eliminar producto:** desde el menú contextual de la fila abre un modal de confirmación con las opciones **Cancelar** y **Eliminar** antes de ejecutar la petición.
- **Mensajes de estado:** muestra notificaciones temporales en pantalla al completar o fallar una operación (crear, editar, eliminar o cargar datos).

## Requisitos previos y backend local

Para ejecutar la aplicación completa se requiere que el backend de la prueba esté corriendo en el puerto `3002`.

Desde la carpeta del backend (`repo-interview-main`):

```bash
npm install
npm run start:dev
```

El proyecto frontend incluye [`proxy.conf.json`](proxy.conf.json) para redirigir las peticiones `/bp` hacia `http://localhost:3002` y evitar bloqueos de CORS en desarrollo local.

## Instalación y ejecución

Desde la raíz del proyecto (`ErickSalgado`):

```bash
npm install
npm start
```

Una vez compilada la aplicación, acceder desde el navegador a `http://localhost:4200/`.

Para generar el compilado de producción en `dist/`:

```bash
npm run build
```

## Pruebas unitarias y cobertura

El proyecto utiliza Jest en reemplazo de Karma. Las pruebas unitarias se ejecutan con:

```bash
npm test
```

Para ejecutarlas en modo observador durante el desarrollo:

```bash
npm run test:watch
```

Para generar el reporte de cobertura:

```bash
npm run test:coverage
```

Última ejecución verificada: **15 suites** y **69 pruebas unitarias** pasando (`97.88%` de sentencias y `97.93%` de líneas cubiertas).

## Estructura del proyecto

```text
src/app/
├── core/                  # Interceptor HTTP y modelo de error de aplicación
├── domain/                # Modelo FinancialProduct y contrato abstracto del repositorio
├── infrastructure/        # DTOs del backend, mapper y repositorio HTTP
├── application/           # Facade con estado reactivo (Signals) y validadores del formulario
└── presentation/
    ├── components/        # Componentes reutilizables (alert-banner, confirm-modal, context-menu, product-logo, table-skeleton)
    ├── layout/            # Encabezado de la aplicación
    ├── pages/             # Páginas con carga perezosa (product-list y product-form)
    └── pipes/             # Pipe de formato de fechas (CalendarDatePipe)
```
