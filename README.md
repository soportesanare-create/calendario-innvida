# Calendario Innvida

Aplicación web para el registro y gestión de citas de pacientes por sede.

## Sedes disponibles
- Toluca
- Morelia
- Narvarte
- Tijuana

## Usuarios
| Usuario   | Contraseña      | Acceso                |
|-----------|-----------------|-----------------------|
| admin     | innvida2026     | Todas las sedes       |
| toluca    | toluca2026      | Solo Toluca           |
| morelia   | morelia2026     | Solo Morelia          |
| narvarte  | narvarte2026    | Solo Narvarte         |
| tijuana   | tijuana2026     | Solo Tijuana          |

## Tecnología
- React + Vite
- Firebase Firestore (base de datos en tiempo real)
- Vanilla CSS

## Cómo subir a GitHub Pages
1. Sube esta carpeta `github/` a tu repositorio de GitHub.
2. Ve a Settings → Pages.
3. En "Source", selecciona la rama y la carpeta raíz donde subiste los archivos.
4. GitHub te dará una URL pública donde cualquiera podrá acceder al calendario.

## Desarrollo local
```bash
cd app
npm install
npm run dev
```
