# Portal Conexion Circular

Aplicacion `Next.js 16` con `NextAuth`, SQL Server (`mssql`) y despliegue preparado para `Azure App Service` en Linux.

## Desarrollo local

```powershell
npm install
npm run dev
```

La app usa variables de entorno para autenticacion y base de datos. Toma como base [`.env.example`](./.env.example) y define tus valores locales en `.env.local`.

## Admin interno

El proyecto ahora soporta un rol admin interno para gestionar usuarios y permisos desde API. El rol admin tiene acceso total a las paginas registradas en `cms.Pages` y puede usar endpoints protegidos bajo `/api/admin/**`.

### Bootstrap del primer admin

Como el acceso admin esta protegido, el primer administrador debe existir por una de estas vias:

- Definir `INTERNAL_ADMIN_EMAILS` o `ADMIN_EMAILS` con una lista separada por comas de correos admin.
- Insertar manualmente el usuario en `auth.AdminUsers`.

La tabla `auth.AdminUsers` se crea automaticamente al primer uso si no existe.

Ejemplo local en `.env.local`:

```powershell
INTERNAL_ADMIN_EMAILS="admin@dominio.com"
```

### Endpoints internos admin

Todos requieren sesion autenticada de un usuario admin.

#### 1. Listar paginas administrables

```http
GET /api/admin/pages
```

Devuelve los `PageId` disponibles en `cms.Pages` para asignar accesos.

#### 2. Listar usuarios gestionados

```http
GET /api/admin/users
```

Devuelve usuarios, accesos actuales, pagina primaria e indicador `isAdmin`.

#### 3. Crear usuario

```http
POST /api/admin/users
Content-Type: application/json

{
  "email": "usuario@dominio.com",
  "password": "ClaveSegura123!",
  "displayName": "Usuario Portal",
  "pageIds": ["<PAGE_ID_1>", "<PAGE_ID_2>"],
  "primaryPageId": "<PAGE_ID_1>",
  "isAdmin": false
}
```

Si `isAdmin` es `true`, el usuario queda marcado como admin en `auth.AdminUsers` y hereda acceso total.

#### 4. Actualizar contraseña

```http
PATCH /api/admin/users/<USER_ID>/password
Content-Type: application/json

{
  "password": "NuevaClaveSegura123!"
}
```

#### 5. Reemplazar accesos a paginas

```http
PUT /api/admin/users/<USER_ID>/access
Content-Type: application/json

{
  "pageIds": ["<PAGE_ID_1>", "<PAGE_ID_3>"],
  "primaryPageId": "<PAGE_ID_3>",
  "isAdmin": true
}
```

Este endpoint deja exactamente los accesos enviados. Para quitar una pagina, simplemente no la incluyas en `pageIds`.

## Azure App Service

Se recomienda `App Service Linux` con `Node 22 LTS`.

### 1. Crear infraestructura

```powershell
az login
az group create --name <resource-group> --location eastus
az appservice plan create --name <plan-name> --resource-group <resource-group> --sku B1 --is-linux
az webapp create --name <app-name> --resource-group <resource-group> --plan <plan-name> --runtime "NODE|22-lts"
```

### 2. Configurar variables en Azure

```powershell
az webapp config appsettings set `
  --name <app-name> `
  --resource-group <resource-group> `
  --settings `
    NEXTAUTH_SECRET="<secreto>" `
    NEXTAUTH_URL="https://<app-name>.azurewebsites.net" `
    NEXT_PUBLIC_BASE_URL="https://<app-name>.azurewebsites.net" `
    DEFAULT_PAGE_PATH="/" `
    SQLSERVER_CONN="<connection-string>"
```

Si usas variables separadas para SQL, define `DB_SERVER`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` y opcionalmente `DB_ENCRYPT`.

### 3. Generar el paquete para App Service

```powershell
npm run package:azure
Compress-Archive -Path .\dist\azure-appservice\* -DestinationPath .\dist\azure-appservice.zip -Force
```

### 4. Configurar startup command

El paquete generado queda listo para arrancar con `server.js`:

```powershell
az webapp config set `
  --name <app-name> `
  --resource-group <resource-group> `
  --startup-file "node server.js"
```

### 5. Subir el paquete

```powershell
az webapp deploy `
  --name <app-name> `
  --resource-group <resource-group> `
  --src-path .\dist\azure-appservice.zip `
  --type zip
```

### 5.b. Despliegue con GitHub Actions

El repositorio incluye el workflow [.github/workflows/deploy-azure-appservice.yml](.github/workflows/deploy-azure-appservice.yml), que compila en `ubuntu-latest`, genera `dist/azure-appservice.zip` y lo despliega a Azure App Service.

Configura estos secretos en GitHub:

- `AZURE_WEBAPP_NAME`: nombre del Web App en Azure.
- `AZURE_WEBAPP_PUBLISH_PROFILE`: contenido completo del publish profile descargado desde Azure Portal.

Pasos:

1. En Azure Portal, abre tu App Service.
2. Descarga el `Publish Profile`.
3. En GitHub, ve a `Settings > Secrets and variables > Actions`.
4. Crea los dos secretos anteriores.
5. Ejecuta el workflow manualmente desde `Actions`, o haz push a la rama `main`.

### 6. Verificacion

- Health check disponible en `/health`
- Login requiere `NEXTAUTH_SECRET` y `NEXTAUTH_URL` correctos
- Las paginas publicas que consumen API interna requieren `NEXT_PUBLIC_BASE_URL`
- Si la base de datos es Azure SQL, revisa el firewall o Private Endpoint para permitir trafico desde App Service

## Notas operativas

- No subas `.env.local` al repositorio.
- Este proyecto usa `output: "standalone"` para generar un artefacto mas pequeno y estable para Azure.
- Si prefieres CI/CD, puedes conectar el repo desde Deployment Center o usar GitHub Actions con `azure/webapps-deploy`.
