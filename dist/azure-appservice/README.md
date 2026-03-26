# Portal Conexion Circular

Aplicacion `Next.js 16` con `NextAuth`, SQL Server (`mssql`) y despliegue preparado para `Azure App Service` en Linux.

## Desarrollo local

```powershell
npm install
npm run dev
```

La app usa variables de entorno para autenticacion y base de datos. Toma como base [`.env.example`](./.env.example) y define tus valores locales en `.env.local`.

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

### 6. Verificacion

- Health check disponible en `/health`
- Login requiere `NEXTAUTH_SECRET` y `NEXTAUTH_URL` correctos
- Las paginas publicas que consumen API interna requieren `NEXT_PUBLIC_BASE_URL`
- Si la base de datos es Azure SQL, revisa el firewall o Private Endpoint para permitir trafico desde App Service

## Notas operativas

- No subas `.env.local` al repositorio.
- Este proyecto usa `output: "standalone"` para generar un artefacto mas pequeno y estable para Azure.
- Si prefieres CI/CD, puedes conectar el repo desde Deployment Center o usar GitHub Actions con `azure/webapps-deploy`.
