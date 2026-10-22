# Grupo Nexus · Portal de negocios

Portal privado para administrar los negocios de la organización (DELTA, SANTO TACO, FIZA, RIVAL GYM, AUTOLAVADO y los que agregues).
Funciona como página web y como **app instalable** en celular y computadora.

## Páginas

| Página | Para qué sirve |
|---|---|
| `index.html` | Portal: órbita con los logos, pestañas y ficha de cada negocio (redes, WhatsApp, correo, contraseña, cuenta bancaria, propuestas, solicitar cambio). |
| `negocio.html?id=fiza` | Panel individual de un negocio, con el historial de solicitudes de cambio. |
| `admin.html` | Administración: negocios, logos, usuarios, permisos, solicitudes y datos del grupo. Solo administradores. |

Todas piden **usuario y contraseña**. Cada usuario ve solo los negocios que el administrador le asigna.

## Puesta en marcha (una sola vez)

1. **Consola de Firebase** → proyecto `negocios-andres`:
   - *Authentication* → *Sign-in method* → activa **Correo electrónico/contraseña**.
   - *Firestore Database* → crea la base de datos (modo producción).
2. **Publica las reglas de seguridad y la página** (en esta carpeta):
   ```bash
   firebase login
   ```
   ```bash
   firebase deploy
   ```
   Esto sube `firestore.rules` y publica el sitio en `https://negocios-andres.web.app`.
3. Abre el sitio. La primera vez aparece **Configuración inicial**: crea tu cuenta de administrador.
4. En el admin → **Negocios** → **Cargar negocios iniciales** para crear los 5 negocios con sus logos. Luego edita cada uno.

> Importante: hasta que publiques `firestore.rules`, la base de datos usa las reglas que tenga ahora (si está en "modo prueba", cualquiera podría leerla). Publica las reglas antes de capturar datos reales.

## Usuarios

- El usuario puede ser un nombre simple (`carlos`) o un correo real (`carlos@gmail.com`).
- Cada usuario puede cambiar su propia contraseña desde su menú (arriba a la derecha).
- Si el usuario tiene correo real, el admin puede enviarle un correo para restablecerla.
- "Quitar acceso" borra su perfil y ya no puede entrar. Su cuenta queda en Firebase Authentication; para reutilizar el mismo nombre de usuario bórrala ahí primero.

## Instalar como app

- **Celular (Android/Chrome):** abre el sitio → menú ⋮ → *Instalar app*.
- **iPhone (Safari):** botón Compartir → *Agregar a inicio*.
- **Computadora (Chrome/Edge):** icono de instalar en la barra de direcciones.
- El portal (`index.html`) y el admin (`admin.html`) se instalan como apps separadas.

## Notas

- Los logos se guardan dentro de la base de datos (no se necesita Firebase Storage ni plan de pago).
- Contraseñas y cuentas bancarias quedan protegidas por las reglas: solo las ven usuarios con acceso a ese negocio. Aparecen ocultas (••••) hasta pulsar el ojo.
- En *Organización* puedes cambiar nombre, subtítulo y logo del grupo, y descargar un respaldo en JSON.
