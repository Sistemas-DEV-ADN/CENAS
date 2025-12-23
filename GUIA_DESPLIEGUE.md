# Guía de Despliegue en Vercel - CENAS

Esta guía contiene los comandos exactos para tu repositorio: `https://github.com/Sistemas-DEV-ADN/CENAS.git`.

## 1. Subir Código a GitHub

Ejecuta estos comandos en tu terminal de VS Code uno por uno:

```bash
# 1. Asegurar que Git está inicializado
git init

# 2. Agregar todos los archivos (ignora las advertencias de LF/CRLF)
git add .

# 3. Guardar los cambios localmente
git commit -m "Preparado para despliegue final"

# 4. Cambiar a la rama principal (main)
git branch -M main

# 5. Conectar con TU repositorio
git remote add origin https://github.com/Sistemas-DEV-ADN/CENAS.git

# 6. Subir el código (te pedirá iniciar sesión si no lo has hecho)
git push -u origin main
```

## 2. Configuración en Vercel

1.  Inicia sesión en [Vercel.com](https://vercel.com) con tu cuenta de GitHub.
2.  Haz clic en **"Add New"** -> **"Project"**.
3.  Busca el repositorio `CENAS` y haz clic en **"Import"**.

## 3. Variables de Entorno (IMPORTANTE)

Antes de darle a "Deploy", busca la sección **"Environment Variables"** y pega estos dos valores que tienes en tu archivo `.env.local`:

| Nombre | Valor |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | *(Ver en .env.local)* |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | *(Ver en .env.local)* |

## 4. ¡Listo!

Haz clic en **"Deploy"**. En un par de minutos tu sistema de cenas estará en línea.
