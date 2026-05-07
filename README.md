# TiendaRopa - Marketplace de moda

## Requisitos
- Docker y Docker Compose
- Node.js 18+ (para el frontend)
- Python 3.12+ (para desarrollo local del backend)

## Cómo levantar el proyecto

### 1. Base de datos con Docker
```bash
docker-compose up db -d
```

### 2. Backend (FastAPI)
```bash
cd backend
cp .env.example .env          # Completá el archivo .env
pip install -r requirements.txt
uvicorn main:app --reload
```
API disponible en: http://localhost:8000  
Documentación: http://localhost:8000/docs

### 3. Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```
App disponible en: http://localhost:3000

---

## Estructura del proyecto

```
tienda-ropa/
├── backend/
│   ├── main.py              # Entrada de la app FastAPI
│   ├── core/                # Config, DB, seguridad, dependencias
│   ├── models/              # Modelos SQLAlchemy (User, Product, Order, Shipment)
│   ├── schemas/             # Validaciones Pydantic
│   ├── routers/             # Endpoints: auth, products, orders
│   └── uploads/             # Imágenes subidas (local)
└── frontend/
    ├── app/                 # Páginas Next.js (App Router)
    │   ├── page.tsx         # Home con listado y filtros
    │   ├── auth/            # Login y registro
    │   ├── productos/[id]/  # Detalle de producto
    │   ├── carrito/         # Carrito de compras
    │   ├── checkout/        # Finalizar compra + MercadoPago
    │   └── vendedor/        # Dashboard del vendedor
    ├── components/          # Navbar, ProductCard, Filtros, etc.
    ├── hooks/               # useAuth (Zustand), useCart (Zustand)
    ├── lib/api.ts           # Cliente Axios con interceptors JWT
    └── types/               # Tipos TypeScript compartidos
```

## Funcionalidades implementadas

- **Registro y login** de compradores y vendedores (JWT)
- **Catálogo** con filtros por categoría, género y precio
- **Detalle de producto** con galería de imágenes y selección de talle
- **Carrito** persistente con manejo de stock
- **Checkout** con generación de orden y redirección a MercadoPago
- **Dashboard del vendedor**: publicar productos, subir fotos, activar/desactivar
- **Gestión de envíos** (modelo listo, endpoints para extender)

## MercadoPago
Agregá tu `MERCADOPAGO_ACCESS_TOKEN` en el `.env` del backend.  
Obtenés uno en: https://www.mercadopago.com.ar/developers/panel
