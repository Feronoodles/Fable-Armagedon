# Despliegue con Docker

El proyecto incluye una imagen de la aplicación y PostgreSQL 16 con un volumen persistente. La aplicación se ejecuta como el usuario `node`, comprueba la configuración y aplica las migraciones antes de iniciar Next.js. No se incluye ningún archivo de credenciales en la imagen.

## Preparar el servidor

Instala Docker Engine y el plugin Docker Compose en el servidor. Clona este repositorio y entra en su directorio. Los comandos de esta guía usan una terminal Linux en ese directorio.

PostgreSQL no publica puertos en producción. La aplicación escucha únicamente en `127.0.0.1:3000` del servidor; utiliza un proxy HTTPS, como Nginx o Caddy, para servirla públicamente. Abre al exterior solo los puertos necesarios para HTTPS y tu acceso administrativo.

## Configuración privada

```bash
cp .env.production.example .env.production
chmod 600 .env.production
```

Edita el archivo y establece:

- `POSTGRES_DB` y `POSTGRES_USER`: identificadores propios de esta instalación.
- `POSTGRES_PASSWORD`: contraseña aleatoria exclusiva para esta base de datos.
- `NEXTAUTH_SECRET`: secreto aleatorio distinto de la contraseña de PostgreSQL.
- `NEXTAUTH_URL`: URL pública final, por ejemplo `https://juego.example.com`.
- `APP_PORT`: puerto local opcional; por defecto es `3000`.

Genera cada secreto por separado con `openssl rand -hex 32`. Utiliza valores hexadecimales para la contraseña de PostgreSQL: Compose construye las URL de conexión con esos datos y así se evitan caracteres que requieren codificación URL. Los identificadores de base de datos y usuario también deben usar caracteres aptos para una URL, como letras, números y guion bajo.

La plantilla contiene únicamente ejemplos. No publiques `.env.production`, contraseñas, copias de la base de datos ni claves privadas. `DATABASE_URL` y `DIRECT_URL` de la aplicación se generan dentro de Compose y usan el nombre de servicio `postgres`. Las variables de `.env` o `.env.local` del desarrollo no se copian al contenedor.

La aplicación rechaza secretos vacíos, demasiado cortos o con marcadores de ejemplo. También rechaza una URL pública HTTP; permite HTTP únicamente para pruebas en `localhost`.

## Construir e iniciar

Valida la configuración sin mostrar los secretos en pantalla:

```bash
docker compose --env-file .env.production config --quiet
docker compose --env-file .env.production up -d --build
docker compose --env-file .env.production ps
```

El contenedor de PostgreSQL debe estar saludable antes de que arranque la aplicación. Las migraciones se ejecutan automáticamente con `prisma migrate deploy`; si fallan, Next.js no inicia. La comprobación de salud de la aplicación consulta `/login`.

## Cargar el catálogo inicial

En una instalación nueva, carga las cartas y los sobres:

```bash
docker compose --env-file .env.production exec app node prisma/seed.cjs
```

El seed está compilado dentro de la imagen y no requiere TypeScript, `tsx` ni archivos de desarrollo. Puede volver a ejecutarse para agregar cartas nuevas y actualizar las definiciones de sobres; conserva los jugadores, sus cartas y sus mazos.

## Conectar el dominio y HTTPS

Configura el DNS de tu dominio hacia el servidor, un certificado TLS válido y el proxy HTTPS hacia `http://127.0.0.1:3000`. Si el proxy se ejecuta en el propio servidor, debe acceder a esa dirección local. `NEXTAUTH_URL` debe coincidir exactamente con el dominio HTTPS usado por los jugadores.

Para una comprobación privada antes de configurar el dominio, establece temporalmente `NEXTAUTH_URL=http://localhost:3000` y usa un túnel SSH:

```bash
ssh -L 3000:127.0.0.1:3000 usuario@servidor
```

Abre `http://localhost:3000` en tu equipo. Después establece la URL HTTPS definitiva y recrea la aplicación para aplicar las variables nuevas:

```bash
docker compose --env-file .env.production up -d app
```

## Actualizar y consultar registros

Antes de una actualización, crea una copia de seguridad y revisa las migraciones incluidas. Después:

```bash
git pull --ff-only
docker compose --env-file .env.production up -d --build
```

Consulta los registros cuando necesites diagnosticar un fallo:

```bash
docker compose --env-file .env.production logs --tail=100 app
docker compose --env-file .env.production logs --tail=100 postgres
```

Los registros de Docker tienen rotación para limitar el uso del disco. No compartas registros sin revisar si contienen información privada.

Para detener los servicios conservando la base de datos:

```bash
docker compose --env-file .env.production down
```

El volumen `postgres_data` conserva la información entre reinicios y reconstrucciones. No elimines ese volumen ni uses opciones que borren volúmenes en una instalación con datos que debas conservar.

## Copias de seguridad

El siguiente comando expande el usuario y el nombre de la base de datos dentro del contenedor y desactiva el terminal interactivo para guardar un archivo válido:

```bash
mkdir -p backups
chmod 700 backups
docker compose --env-file .env.production exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom' > backups/fable.dump
chmod 600 backups/fable.dump
```

Programa copias periódicas, guárdalas también fuera del servidor y comprueba la restauración en una base de datos aparte. El directorio `backups` está excluido de Git y del contexto de construcción.

## Desarrollo con PostgreSQL local

`docker-compose.db.yml` publica PostgreSQL solo en `127.0.0.1:5432`. Usa `.env.db` para ese contenedor y `.env` para Prisma CLI y la aplicación local. No reutilices los secretos de producción. Los comandos de desarrollo están en `README.md`.
