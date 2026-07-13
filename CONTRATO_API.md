# Contrato de API — Backend Conde Travel

**Base URL:** `http://localhost:3000` (o el host donde se despliegue)
**Formato:** JSON en request y response (`Content-Type: application/json`)
**Autenticación:** header `Authorization: Bearer {token}` en todas las rutas que lo requieran

Todas las rutas de identidad viven bajo `/auth/*`; el guardado de datos de la app se hace bajo `/sync/*`; la configuración de la app web se hace bajo `/config/*`. Ningún endpoint mezcla estos prefijos, reforzando el desacople entre módulos también a nivel de URL — cada uno vive en su propio schema de base de datos y no comparte tablas con los otros, solo el `usuario_id` que viene del módulo de Autenticación.

---

## Módulo de Autenticación (`/auth/*`)

### `POST /auth/register`

Crea una cuenta nueva y deja al usuario logueado de inmediato.

**Requiere token:** No

**Body:**
```json
{
  "email": "ana@example.com",
  "password": "claveSegura123",
  "nombre": "Ana Torres"
}
```

| Campo | Tipo | Obligatorio | Notas |
|---|---|---|---|
| `email` | string | Sí | Debe ser único |
| `password` | string | Sí | Mínimo 8 caracteres, sin reglas de complejidad adicionales |
| `nombre` | string | No | — |

**Respuesta `201 Created`:**
```json
{
  "usuario_id": "636ddc31-24fd-47e7-9557-ca199b8b9cc0",
  "email": "ana@example.com",
  "nombre": "Ana Torres",
  "token": "eyJhbGciOi..."
}
```

**Errores:**
| Código | Cuándo |
|---|---|
| `400` | Falta `email` o `password`, o `password` tiene menos de 8 caracteres |
| `409` | El `email` ya está registrado |

---

### `POST /auth/login`

**Requiere token:** No

**Body:**
```json
{
  "email": "ana@example.com",
  "password": "claveSegura123"
}
```

**Respuesta `200 OK`:**
```json
{
  "usuario_id": "636ddc31-24fd-47e7-9557-ca199b8b9cc0",
  "email": "ana@example.com",
  "nombre": "Ana Torres",
  "token": "eyJhbGciOi..."
}
```

**Errores:**
| Código | Cuándo |
|---|---|
| `400` | Falta `email` o `password` |
| `401` | Email no existe o password incorrecto (mismo mensaje para ambos casos, para no filtrar qué emails existen) |

---

### `POST /auth/refresh`

Renueva el token con expiración extendida. Pensado para llamarse silenciosamente cuando hay internet, sin intervención del usuario.

**Requiere token:** Sí

**Body:** ninguno

**Respuesta `200 OK`:**
```json
{
  "token": "eyJhbGciOi..."
}
```

**Errores:**
| Código | Cuándo |
|---|---|
| `401` | Token faltante, inválido, expirado, o el usuario ya no existe en la base |

---

### `GET /auth/me`

Devuelve la identidad asociada al token. Útil para que otros módulos (ej. Sincronización) confirmen identidad, o para que el cliente refresque los datos del usuario en pantalla.

**Requiere token:** Sí

**Respuesta `200 OK`:**
```json
{
  "usuario_id": "636ddc31-24fd-47e7-9557-ca199b8b9cc0",
  "email": "ana@example.com",
  "nombre": "Ana Torres"
}
```

**Errores:**
| Código | Cuándo |
|---|---|
| `401` | Token faltante, inválido o expirado |
| `404` | El `usuario_id` del token no existe en la base (caso raro: usuario borrado manualmente) |

---

## Módulo de Sincronización (`/sync/*`)

Modelo simplificado: **guardado manual** de un JSON completo por usuario. Se conserva la versión actual y **una sola** versión anterior como respaldo — no hay historial más profundo que eso, ni sincronización automática entre dispositivos.

Todas las rutas de este módulo requieren el mismo token del módulo de Autenticación (mismo `verificarToken`, importado sin duplicar código).

### `POST /sync/guardar`

Guarda el estado actual, moviendo lo que hoy es "actual" a "anterior" antes de escribir lo nuevo.

**Requiere token:** Sí

**Body:**
```json
{
  "contenido": { "cualquier": "estructura JSON que la app quiera guardar" }
}
```

`contenido` acepta cualquier JSON válido — el backend no lo interpreta ni valida su forma, solo lo guarda tal cual.

**Respuesta `200 OK`:**
```json
{
  "contenido": { "cualquier": "estructura JSON que la app quiera guardar" },
  "guardado_en": "2026-07-11T14:05:28.314Z"
}
```

**Errores:**
| Código | Cuándo |
|---|---|
| `400` | El body no incluye la clave `contenido` |
| `401` | Token faltante, inválido o expirado |

---

### `GET /sync/actual`

Devuelve el último guardado.

**Requiere token:** Sí

**Respuesta `200 OK`:**
```json
{
  "contenido": { "...": "..." },
  "guardado_en": "2026-07-11T14:05:28.314Z"
}
```

**Errores:**
| Código | Cuándo |
|---|---|
| `401` | Token faltante, inválido o expirado |
| `404` | El usuario todavía no ha guardado nada |

---

### `GET /sync/anterior`

Devuelve el respaldo un paso atrás (el "actual" justo antes del último guardado). Pensado para un botón tipo "deshacer último guardado": el cliente lee este contenido y, si quiere restaurarlo, lo vuelve a mandar por `POST /sync/guardar` — no existe un endpoint especial de "restaurar".

**Requiere token:** Sí

**Respuesta `200 OK`:**
```json
{
  "contenido": { "...": "..." },
  "guardado_en": "2026-07-11T14:05:28.273Z"
}
```

**Errores:**
| Código | Cuándo |
|---|---|
| `401` | Token faltante, inválido o expirado |
| `404` | Todavía no existe un segundo guardado (solo hay "actual", no hay "anterior") |

---

## Módulo de Configuración (`/config/*`)

Mismo mecanismo exacto que Sincronización (guardado manual, actual + 1 versión anterior), pero **completamente independiente**: vive en su propio schema (`config`, separado de `sync`) y su propia tabla. Un guardado aquí nunca afecta ni es afectado por `/sync/*`. Está pensado para la app web (rutas, ajustes, tema, etc.), mientras que `/sync/*` es para la app de recetas/backup — ambas cuelgan de la misma cuenta (`usuario_id`), pero no comparten datos entre sí.

Todas las rutas requieren el mismo token del módulo de Autenticación.

### `POST /config/guardar`

Guarda la configuración actual, moviendo lo que hoy es "actual" a "anterior" antes de escribir lo nuevo.

**Requiere token:** Sí

**Body:**
```json
{
  "contenido": { "rutas": { "home": "/inicio", "admin": "/panel" }, "tema": "oscuro" }
}
```

`contenido` acepta cualquier JSON válido (rutas, ajustes, banderas de features, lo que la web necesite) — el backend no lo interpreta, solo lo guarda tal cual.

**Respuesta `200 OK`:**
```json
{
  "contenido": { "rutas": { "home": "/inicio", "admin": "/panel" }, "tema": "oscuro" },
  "guardado_en": "2026-07-11T15:36:38.537Z"
}
```

**Errores:**
| Código | Cuándo |
|---|---|
| `400` | El body no incluye la clave `contenido` |
| `401` | Token faltante, inválido o expirado |

---

### `GET /config/actual`

Devuelve la última configuración guardada.

**Requiere token:** Sí

**Respuesta `200 OK`:** igual forma que el guardado.

**Errores:**
| Código | Cuándo |
|---|---|
| `401` | Token faltante, inválido o expirado |
| `404` | El usuario todavía no ha guardado ninguna configuración |

---

### `GET /config/anterior`

Devuelve la configuración un paso atrás. Igual que en `/sync/anterior`: para "restaurar", el cliente lee esto y lo vuelve a mandar por `POST /config/guardar` — no hay endpoint especial de restauración.

**Requiere token:** Sí

**Respuesta `200 OK`:** igual forma que el guardado.

**Errores:**
| Código | Cuándo |
|---|---|
| `401` | Token faltante, inválido o expirado |
| `404` | Todavía no existe una segunda configuración guardada |

---

## Convenciones generales de error

Todas las respuestas de error siguen la misma forma:
```json
{ "error": "mensaje legible en español" }
```

No se exponen detalles internos (stack traces, mensajes de PostgreSQL, etc.) en respuestas `500` — esos se registran en el log del servidor, y al cliente solo le llega `{ "error": "Error inesperado" }`.

## Endpoint utilitario

### `GET /health`

Sin autenticación. Devuelve `{ "ok": true }` si el servidor está arriba. Pensado para checks de infraestructura (ej. monitoreo, healthcheck de despliegue), no forma parte de la lógica de negocio de ninguno de los dos módulos.
