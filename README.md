# La Quiniela NFL

Aplicación privada, móvil y en español para elegir al ganador de cada partido de la NFL. Cada acierto vale un punto; el desempate semanal usa el total combinado del último partido. Incluye resultados, clasificación, historial, perfiles y administración.

## Arquitectura y stack

- Next.js 14 (App Router), React y TypeScript
- Supabase PostgreSQL y Storage
- Sesión firmada y `httpOnly` (sin contraseñas, conforme al requisito)
- Proveedor NFL aislado detrás de `NFLDataProvider`; la implementación incluida usa el marcador estructurado de ESPN
- Vercel para hosting y cron diario opcional

Las rutas de servidor usan exclusivamente la llave de servicio. Las reglas de cierre, privacidad, estado del usuario y administración se validan en servidor. La autenticación por correo es intencionalmente ligera: quien conozca el correo autorizado de otra persona podría suplantarla. El PIN adicional protege la administración.

## Desarrollo local

Requisitos: Node.js 20+, npm y un proyecto Supabase.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abre `http://localhost:3000`. Para ejecutar las pruebas: `npm test`. Para verificar producción: `npm run build`.

## Configurar Supabase

1. Crea un proyecto en Supabase.
2. En SQL Editor ejecuta `supabase/migrations/001_initial.sql`. Esto crea tablas, índices, tipos, RLS y el bucket público `avatars` (2 MB, JPG/PNG/WebP).
3. Opcionalmente, en desarrollo ejecuta `supabase/seed.sql`.
4. Agrega al menos un correo en `users` y marca `is_admin = true` directamente en Supabase.
5. Copia URL, anon key y service-role key a `.env.local`.

RLS está habilitado sin políticas públicas: el navegador no accede directamente a las tablas. Toda lectura y mutación pasa por las rutas del servidor, que aplican las reglas de negocio.

## Variables de entorno

| Variable | Uso |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública (reservada para futuras lecturas cliente) |
| `SUPABASE_SERVICE_ROLE_KEY` | Acceso servidor; nunca exponer |
| `SESSION_SECRET` | Secreto aleatorio de al menos 32 caracteres |
| `ADMIN_PIN` | PIN compartido de administración, sólo servidor |
| `CRON_SECRET` | Protege `/api/cron/sync` |
| `NFL_PROVIDER_BASE_URL` | Endpoint base del proveedor NFL |

Genera secretos con `openssl rand -base64 32`.

## Proveedor NFL

`lib/nfl/provider.ts` define `NFLDataProvider` e implementa `EspnNFLProvider`. `syncSeason()` consume únicamente la interfaz normalizada, así que otra fuente puede reemplazar ESPN sin cambiar picks, puntuación o UI. La sincronización es idempotente: temporadas, semanas y partidos se actualizan por claves únicas y no se duplican.

Desde Administrador usa **Sincronizar temporada** para la carga inicial y **Actualizar resultados** después. El cron de Vercel hace una sincronización diaria; en el plan gratuito los mismos controles permiten operar sin depender del cron. Durante partidos conviene configurar un cron externo gratuito cada cinco minutos contra `/api/cron/sync` con `Authorization: Bearer CRON_SECRET`.

## Despliegue en Vercel

1. Sube el repositorio a GitHub e impórtalo en Vercel.
2. Configura todas las variables de `.env.example` en Production.
3. Despliega; Vercel detecta Next.js automáticamente.
4. Ejecuta la migración en Supabase.
5. Inserta correos autorizados y marca el primer administrador en `users`.
6. Entra con ese correo, abre **Admin**, introduce el PIN y pulsa **Sincronizar temporada**.
7. Verifica semana, horarios locales, picks, cierre y resultados desde un teléfono.

## Administración

Un usuario necesita `is_admin = true` y el `ADMIN_PIN`. Puede agregar correos, sincronizar calendario/resultados, cambiar la semana activa y bloquearla. La API también admite activar/desactivar usuarios, cambiar administradores, corregir resultados y elegir el partido de desempate. Los usuarios desactivados pierden acceso, pero sus picks históricos no se borran.

## Reglas

- Pick correcto: 1 punto. Incorrecto, ausente, cancelado o empate NFL: 0.
- Todos los picks de equipos cierran al kickoff del primer partido semanal.
- Los picks ajenos se revelan únicamente después de ese cierre.
- El desempate se puede editar y permanece privado hasta el kickoff del último partido.
- Gana la semana quien tenga más aciertos; entre iguales, la menor diferencia absoluta del desempate. Si persiste el empate, todos ganan la semana.
- La temporada se ordena por aciertos y luego victorias semanales; un empate restante comparte rango.
- Cada temporada incluye la temporada regular y todos los playoffs, incluido el Super Bowl.

## Problemas comunes

- **“Falta configurar Supabase”**: revisa URL y service-role key y reinicia el servidor.
- **Correo no autorizado**: debe existir en `users`, en minúsculas, con `status = 'active'`.
- **No aparecen partidos**: sincroniza la temporada desde Admin; revisa los logs si el proveedor externo no responde.
- **No sube una foto**: confirma que el bucket `avatars` existe y que la imagen es JPG/PNG/WebP menor de 2 MB.
- **PIN incorrecto**: comprueba `ADMIN_PIN` en Vercel y vuelve a desplegar.
- **Horarios inesperados**: se guardan en UTC y el navegador los muestra automáticamente en su zona local.
