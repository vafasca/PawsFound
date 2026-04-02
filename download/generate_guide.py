import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.lib import colors
from reportlab.lib.units import cm, inch
from reportlab.platypus import (
    Paragraph, Spacer, Table, TableStyle, PageBreak, SimpleDocTemplate
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

# Register fonts
pdfmetrics.registerFont(TTFont('Times New Roman', '/usr/share/fonts/truetype/english/Times-New-Roman.ttf'))
pdfmetrics.registerFont(TTFont('Calibri', '/usr/share/fonts/truetype/english/calibri-regular.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSans', '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'))
registerFontFamily('Times New Roman', normal='Times New Roman', bold='Times New Roman')
registerFontFamily('Calibri', normal='Calibri', bold='Calibri')

pdf_path = '/home/z/my-project/download/PawsFound_Guia_Vercel.pdf'
title_meta = os.path.splitext(os.path.basename(pdf_path))[0]

doc = SimpleDocTemplate(
    pdf_path,
    pagesize=A4,
    title=title_meta,
    author='Z.ai',
    creator='Z.ai',
    subject='Guia de despliegue de PawsFound a Vercel',
    leftMargin=2*cm, rightMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm
)

# Colors
HEADER_BG = colors.HexColor('#1F4E79')
ACCENT = colors.HexColor('#D97706')
GREEN = colors.HexColor('#059669')
RED = colors.HexColor('#DC2626')
LIGHT_BG = colors.HexColor('#F8FAFC')

# Styles
cover_title = ParagraphStyle('CoverTitle', fontName='Times New Roman', fontSize=36, leading=44, alignment=TA_CENTER, spaceAfter=20, textColor=colors.HexColor('#1E3A5F'))
cover_sub = ParagraphStyle('CoverSub', fontName='Times New Roman', fontSize=16, leading=22, alignment=TA_CENTER, spaceAfter=12, textColor=colors.HexColor('#64748B'))
cover_info = ParagraphStyle('CoverInfo', fontName='Times New Roman', fontSize=12, leading=18, alignment=TA_CENTER, textColor=colors.HexColor('#94A3B8'))

h1 = ParagraphStyle('H1', fontName='Times New Roman', fontSize=20, leading=28, textColor=colors.HexColor('#1E3A5F'), spaceBefore=18, spaceAfter=10)
h2 = ParagraphStyle('H2', fontName='Times New Roman', fontSize=15, leading=22, textColor=colors.HexColor('#1F4E79'), spaceBefore=14, spaceAfter=8)
h3 = ParagraphStyle('H3', fontName='Times New Roman', fontSize=12, leading=18, textColor=colors.HexColor('#334155'), spaceBefore=10, spaceAfter=6)

body = ParagraphStyle('Body', fontName='Times New Roman', fontSize=10.5, leading=17, alignment=TA_JUSTIFY, spaceAfter=6)
body_left = ParagraphStyle('BodyLeft', fontName='Times New Roman', fontSize=10.5, leading=17, alignment=TA_LEFT, spaceAfter=6)

code_style = ParagraphStyle('Code', fontName='DejaVuSans', fontSize=9, leading=14, textColor=colors.HexColor('#1E293B'), backColor=colors.HexColor('#F1F5F9'), leftIndent=12, rightIndent=12, spaceBefore=6, spaceAfter=6, borderPadding=6)

warning_style = ParagraphStyle('Warn', fontName='Times New Roman', fontSize=10.5, leading=17, textColor=RED, leftIndent=12, spaceBefore=6, spaceAfter=6)
tip_style = ParagraphStyle('Tip', fontName='Times New Roman', fontSize=10.5, leading=17, textColor=GREEN, leftIndent=12, spaceBefore=6, spaceAfter=6)
note_style = ParagraphStyle('Note', fontName='Times New Roman', fontSize=10.5, leading=17, textColor=ACCENT, leftIndent=12, spaceBefore=6, spaceAfter=6)

th_style = ParagraphStyle('TH', fontName='Times New Roman', fontSize=10, textColor=colors.white, alignment=TA_CENTER)
td_style = ParagraphStyle('TD', fontName='Times New Roman', fontSize=10, textColor=colors.black, alignment=TA_LEFT)
td_center = ParagraphStyle('TDC', fontName='Times New Roman', fontSize=10, textColor=colors.black, alignment=TA_CENTER)

story = []

# === COVER ===
story.append(Spacer(1, 100))
story.append(Paragraph('<b>PawsFound</b>', cover_title))
story.append(Spacer(1, 12))
story.append(Paragraph('<b>Guia Completa de Despliegue a Vercel</b>', cover_sub))
story.append(Spacer(1, 36))
story.append(Paragraph('App de mascotas perdidas con Next.js, Prisma y PostgreSQL', cover_info))
story.append(Spacer(1, 24))
story.append(Paragraph('Incluye: Migracion de SQLite a PostgreSQL, configuracion de Supabase,', cover_info))
story.append(Paragraph('variables de entorno y pasos detallados de deploy.', cover_info))
story.append(Spacer(1, 60))
story.append(Paragraph('Generado por Z.ai - Abril 2026', cover_info))
story.append(PageBreak())

# === INTRO ===
story.append(Paragraph('<b>1. Problemas que debes resolver antes de subir a Vercel</b>', h1))
story.append(Spacer(1, 6))

story.append(Paragraph('<b>1.1 El SDK de IA no funciona fuera de z.ai</b>', h2))
story.append(Paragraph(
    'El paquete <font name="DejaVuSans">z-ai-web-dev-sdk</font> que se usa para analizar fotos de mascotas '
    'SOLO funciona dentro del entorno de z.ai. Necesita un archivo de configuracion interno '
    '(<font name="DejaVuSans">.z-ai-config</font>) que no existe en tu computadora local ni en Vercel. '
    'Cuando intentas usarlo, ves el error: <font name="DejaVuSans">"Configuration file not found or invalid"</font>. '
    'Este problema ya fue corregido en el codigo: la API ahora detecta si el SDK no esta disponible '
    'y retorna un error claro al cliente (codigo 503) en vez de crashear con un error 500. '
    'El boton "Analizar con IA" mostrara un toast informativo diciendo que la funcion solo esta '
    'disponible en z.ai. El resto de la app funciona perfectamente sin esta dependencia.', body))

story.append(Spacer(1, 8))
story.append(Paragraph('<b>1.2 SQLite no funciona en Vercel (CRITICAL)</b>', h2))
story.append(Paragraph(
    'Vercel usa un sistema de archivos <b>efimero</b>. Esto significa que cualquier archivo que '
    'escribas en el servidor se <b>borrara automaticamente</b> cada vez que la funcion se reinicie '
    '(que ocurre frecuentemente en Vercel). Tu base de datos SQLite (<font name="DejaVuSans">custom.db</font>) '
    'es un archivo local, por lo que en Vercel los datos se perderian cada vez. Ademas, en Vercel '
    'las funciones serverless pueden ejecutarse en multiples instancias simultaneas, y SQLite no '
    'soporta conexiones concurrentes de esa manera.', body))

story.append(Paragraph(
    '<b>Solucion:</b> Migrar a una base de datos en la nube. La mejor opcion gratuita es '
    '<b>Supabase</b> (PostgreSQL), que ofrece 500MB gratis y es totalmente compatible con Prisma. '
    'Otra opcion es <b>Neon</b> (PostgreSQL serverless) o <b>Turso</b> (SQLite en la nube). '
    'Esta guia usa Supabase por ser la mas popular y facil de configurar.', body))

story.append(Spacer(1, 8))
story.append(Paragraph('<b>1.3 Output "standalone" no es necesario en Vercel</b>', h2))
story.append(Paragraph(
    'El archivo <font name="DejaVuSans">next.config.ts</font> tenia <font name="DejaVuSans">output: "standalone"</font> '
    'que sirve para deployments propios (Docker, VPS), pero Vercel maneja su propio formato de build. '
    'Esto ya fue eliminado del config. El script de build tambien fue actualizado para no copiar '
    'archivos SQLite y usar <font name="DejaVuSans">prisma generate</font> antes de compilar.', body))

# === STEP BY STEP ===
story.append(Spacer(1, 12))
story.append(Paragraph('<b>2. Paso a Paso: Migrar a PostgreSQL y Deployar</b>', h1))

# Step 1
story.append(Paragraph('<b>Paso 1: Crear base de datos en Supabase</b>', h2))
story.append(Paragraph(
    'Supabase es una plataforma de base de datos como servicio (BaaS) que ofrece PostgreSQL '
    'gratuito con 500MB de almacenamiento. Es la opcion ideal porque es compatible directamente '
    'con Prisma y tiene una interfaz web para gestionar tu base de datos.', body))

story.append(Spacer(1, 4))
story.append(Paragraph('1. Ve a <b>https://supabase.com</b> y crea una cuenta gratuita', body_left))
story.append(Paragraph('2. Haz clic en <b>"New Project"</b>', body_left))
story.append(Paragraph('3. Completa: Name (ej: "pawsfound-db"), Database Password (guardo esta clave), Region (elige la mas cercana a tus usuarios, ej: US East)', body_left))
story.append(Paragraph('4. Espera a que el proyecto se cree (puede tomar 2 minutos)', body_left))
story.append(Spacer(1, 6))
story.append(Paragraph('<b>5. Ve a Settings > Database y copia estos datos:</b>', body_left))
story.append(Spacer(1, 4))

# Connection strings table
conn_data = [
    [Paragraph('<b>Parametro</b>', th_style), Paragraph('<b>Ejemplo</b>', th_style)],
    [Paragraph('Host', td_style), Paragraph('db.xxxxx.supabase.co', td_style)],
    [Paragraph('Port', td_style), Paragraph('5432', td_style)],
    [Paragraph('Database', td_style), Paragraph('postgres', td_style)],
    [Paragraph('User', td_style), Paragraph('postgres.xxxxx', td_style)],
    [Paragraph('Password', td_style), Paragraph('la-clave-que-elegiste', td_style)],
]
conn_table = Table(conn_data, colWidths=[4*cm, 11*cm])
conn_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), HEADER_BG),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, 1), colors.white),
    ('BACKGROUND', (0, 2), (-1, 2), LIGHT_BG),
    ('BACKGROUND', (0, 3), (-1, 3), colors.white),
    ('BACKGROUND', (0, 4), (-1, 4), LIGHT_BG),
    ('BACKGROUND', (0, 5), (-1, 5), colors.white),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ('TOPPADDING', (0, 0), (-1, -1), 5),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
]))
story.append(conn_table)
story.append(Spacer(1, 12))

# Step 2
story.append(Paragraph('<b>Paso 2: Actualizar variables de entorno</b>', h2))
story.append(Paragraph(
    'En tu proyecto local, edita el archivo <font name="DejaVuSans">.env</font> y reemplaza el contenido '
    'con las URLs de conexion de Supabase. Necesitas DOS URLs: una para conexion normal (via PgBouncer, '
    'para queries del dia a dia) y una directa (para migraciones de Prisma).', body))

story.append(Spacer(1, 4))
story.append(Paragraph('<b>Archivo .env (reemplaza los valores con los de tu Supabase):</b>', body_left))
story.append(Paragraph(
    'DATABASE_URL="postgresql://postgres.xxxxx:tu-password@db.xxxxx.supabase.co:5432/postgres?pgbouncer=true"<br/>'
    'DIRECT_URL="postgresql://postgres.xxxxx:tu-password@db.xxxxx.supabase.co:5432/postgres"<br/>'
    'JWT_SECRET="genera-una-clave-secreta-aqui-con-openssl-rand-base64-32"', code_style))

story.append(Spacer(1, 6))
story.append(Paragraph(
    '<b>Nota:</b> La URL con <font name="DejaVuSans">?pgbouncer=true</font> es para el pool de conexiones. '
    'La DIRECT_URL sin pgbouncer es necesaria para que Prisma pueda ejecutar migraciones. '
    'Ambas apuntan al mismo servidor pero usan diferentes metodos de conexion.', note_style))

# Step 3
story.append(Spacer(1, 8))
story.append(Paragraph('<b>Paso 3: Instalar Prisma PostgreSQL adapter</b>', h2))
story.append(Paragraph(
    'El schema de Prisma ya fue actualizado a PostgreSQL, pero necesitas instalar el adapter '
    'y regenerar el cliente de Prisma. Ejecuta estos comandos en tu terminal:', body))

story.append(Paragraph(
    'npm install<br/>'
    'npx prisma generate<br/>'
    'npx prisma db push', code_style))

story.append(Spacer(1, 6))
story.append(Paragraph(
    '<font name="DejaVuSans">prisma db push</font> creara todas las tablas en tu base de datos '
    'de Supabase automaticamente. Luego ejecuta el seed para cargar los datos de demostracion:', body))
story.append(Paragraph('npx tsx prisma/seed.ts', code_style))

# Step 4
story.append(Spacer(1, 8))
story.append(Paragraph('<b>Paso 4: Probar localmente con PostgreSQL</b>', h2))
story.append(Paragraph(
    'Antes de subir a Vercel, asegurate de que todo funcione localmente con la nueva base de datos. '
    'Ejecuta el servidor de desarrollo:', body))
story.append(Paragraph('npm run dev', code_style))
story.append(Spacer(1, 4))
story.append(Paragraph(
    'Abre <font name="DejaVuSans">http://localhost:3000</font> y verifica: login con '
    '<font name="DejaVuSans">admin@pawsfound.com / admin123</font>, publicar reportes, '
    'ver el mapa, etc. Si todo funciona correctamente, estas listo para deployar.', body))

# Step 5
story.append(Spacer(1, 8))
story.append(Paragraph('<b>Paso 5: Subir a Vercel</b>', h2))

story.append(Paragraph('<b>Opcion A: Vercel CLI (recomendado)</b>', h3))
story.append(Paragraph(
    'Instalar Vercel CLI te permite hacer deploy desde tu terminal con un solo comando. '
    'Tambien puedes configurar variables de entorno facilmente:', body))

story.append(Paragraph(
    'npm i -g vercel<br/>'
    'vercel login<br/>'
    'vercel', code_style))

story.append(Spacer(1, 6))
story.append(Paragraph(
    'Vercel CLI te preguntara varias opciones. Respondelas asi:', body))
story.append(Paragraph(
    'Set up and deploy? Yes<br/>'
    'Which scope? (tu cuenta)<br/>'
    'Link to existing project? No<br/>'
    'Project name? pawsfound<br/>'
    'In which directory is your code located? ./ (presiona Enter)<br/>'
    'Want to modify settings? No', code_style))

story.append(Spacer(1, 6))
story.append(Paragraph('<b>Configurar variables de entorno en Vercel:</b>', body_left))
story.append(Paragraph(
    'vercel env add DATABASE_URL<br/>'
    'vercel env add DIRECT_URL<br/>'
    'vercel env add JWT_SECRET', code_style))

story.append(Spacer(1, 4))
story.append(Paragraph(
    'Por cada variable, pega el valor correspondiente (las mismas de tu <font name="DejaVuSans">.env</font>) '
    'y selecciona Production, Preview y Development cuando te pregunte para cual entorno es.', body))

story.append(Spacer(1, 6))
story.append(Paragraph('Finalmente, hacer deploy de produccion:', body))
story.append(Paragraph('vercel --prod', code_style))

story.append(Spacer(1, 8))
story.append(Paragraph('<b>Opcion B: GitHub + Vercel Dashboard</b>', h3))
story.append(Paragraph(
    'Sube tu codigo a GitHub y conecta el repositorio en Vercel Dashboard:', body))

story.append(Paragraph(
    '1. Sube tu proyecto a un repositorio de GitHub (git init, git add, commit, push)<br/>'
    '2. Ve a https://vercel.com/new e importa tu repositorio<br/>'
    '3. En Settings del proyecto en Vercel, ve a Environment Variables<br/>'
    '4. Agrega: DATABASE_URL, DIRECT_URL, JWT_SECRET con los valores de Supabase<br/>'
    '5. Framework Preset: Next.js (se detecta automaticamente)<br/>'
    '6. Root Directory: ./ (o la raiz de tu proyecto)<br/>'
    '7. Build Command: prisma generate && next build<br/>'
    '8. Haz clic en Deploy', body_left))

story.append(Spacer(1, 12))

# === POST DEPLOY ===
story.append(Paragraph('<b>3. Despues del Deploy</b>', h1))

story.append(Paragraph('<b>3.1 Ejecutar el seed en produccion</b>', h2))
story.append(Paragraph(
    'Despues del primer deploy, la base de datos estara vacia (sin datos de demostracion). '
    'Para cargar los datos de demo, ejecuta el seed remotamente usando Vercel CLI o '
    'directamente en la consola de Supabase:', body))

story.append(Paragraph(
    'vercel env pull .env.production.local<br/>'
    'npx tsx prisma/seed.ts', code_style))

story.append(Spacer(1, 6))
story.append(Paragraph(
    '<b>Alternativa:</b> Ve al SQL Editor en Supabase Dashboard y ejecuta las consultas SQL '
    'manualmente para insertar los usuarios de demostracion, mascotas y reportes.', note_style))

story.append(Spacer(1, 8))
story.append(Paragraph('<b>3.2 Funcionalidades que funcionan perfectamente en Vercel</b>', h2))

features_data = [
    [Paragraph('<b>Funcionalidad</b>', th_style), Paragraph('<b>Estado</b>', th_style), Paragraph('<b>Notas</b>', th_style)],
    [Paragraph('Login/Registro con JWT', td_style), Paragraph('Funciona', td_center), Paragraph('Auth con cookies HTTP-only', td_style)],
    [Paragraph('Reportes de mascotas', td_style), Paragraph('Funciona', td_center), Paragraph('CRUD completo', td_style)],
    [Paragraph('Mapa con Leaflet', td_style), Paragraph('Funciona', td_center), Paragraph('Mapa interactivo', td_style)],
    [Paragraph('GPS en tiempo real', td_style), Paragraph('Funciona', td_center), Paragraph('En el navegador del usuario', td_style)],
    [Paragraph('Chat seguro', td_style), Paragraph('Funciona', td_center), Paragraph('Mensajeria entre usuarios', td_style)],
    [Paragraph('Comentarios', td_style), Paragraph('Funciona', td_center), Paragraph('En reportes y avistamientos', td_style)],
    [Paragraph('Notificaciones', td_style), Paragraph('Funciona', td_center), Paragraph('Push notifications del browser', td_style)],
    [Paragraph('Admin Dashboard', td_style), Paragraph('Funciona', td_center), Paragraph('Gestion de usuarios', td_style)],
    [Paragraph('Badges/Gamificacion', td_style), Paragraph('Funciona', td_center), Paragraph('Insignias de logros', td_style)],
    [Paragraph('Analisis de fotos con IA', td_style), Paragraph('Solo z.ai', td_center), Paragraph('SDK exclusivo de z.ai', td_style)],
]
feat_table = Table(features_data, colWidths=[5*cm, 2.5*cm, 7.5*cm])
feat_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), HEADER_BG),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    *[('BACKGROUND', (0, i), (-1, i), colors.white if i % 2 == 1 else LIGHT_BG) for i in range(1, 11)],
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ('TOPPADDING', (0, 0), (-1, -1), 5),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
]))
story.append(feat_table)
story.append(Spacer(1, 12))

# === TROUBLESHOOTING ===
story.append(Paragraph('<b>4. Problemas Comunes y Soluciones</b>', h1))

story.append(Paragraph('<b>Error: "P1001: Can not reach database server"</b>', h3))
story.append(Paragraph(
    'Verifica que las URLs de conexion sean correctas y que el password no tenga caracteres '
    'especiales sin escapar. Asegurate de que el proyecto de Supabase este "Active" '
    '(no en pausa). En Supabase Dashboard, ve a Settings > Database y verifica que la conexion '
    'string copiada sea exactamente la misma que pegaste en las variables de entorno de Vercel.', body))

story.append(Paragraph('<b>Error: "P3005: Database schema is not empty"</b>', h3))
story.append(Paragraph(
    'Esto ocurre si ya habias creado tablas en Supabase manualmente. Ejecuta '
    '<font name="DejaVuSans">npx prisma db push --accept-data-loss</font> para forzar la '
    'sincronizacion. Advertencia: esto eliminara datos existentes.', body))

story.append(Paragraph('<b>Error: "Module not found: z-ai-web-dev-sdk"</b>', h3))
story.append(Paragraph(
    'Este error puede aparecer en el build de Vercel. Es seguro ignorarlo porque el SDK se importa '
    'dinamicamente y solo se ejecuta cuando alguien usa el boton de analisis de fotos. La app '
    'funciona perfectamente sin el. Si quieres eliminarlo completamente del build, quita '
    '<font name="DejaVuSans">z-ai-web-dev-sdk</font> de <font name="DejaVuSans">package.json</font>.', body))

story.append(Paragraph('<b>Error: "Relation User does not exist"</b>', h3))
story.append(Paragraph(
    'Significa que las tablas no se crearon en PostgreSQL. Ejecuta '
    '<font name="DejaVuSans">npx prisma db push</font> localmente con las credenciales de Supabase, '
    'o ejecuta el seed desde la pestaña SQL Editor en Supabase Dashboard.', body))

story.append(Paragraph('<b>El mapa no carga o muestra blanco</b>', h3))
story.append(Paragraph(
    'Leaflet necesita acceso a los tiles de OpenStreetMap. Verifica que no haya un bloqueador '
    'de contenido o CSP (Content Security Policy) que bloquee las solicitudes a '
    '<font name="DejaVuSans">https://tile.openstreetmap.org</font>. En Vercel, agrega el dominio '
    'a los dominios permitidos en tu configuracion.', body))

story.append(Paragraph('<b>GPS no funciona en Vercel</b>', h3))
story.append(Paragraph(
    'El GPS usa la API del navegador (<font name="DejaVuSans">navigator.geolocation</font>), '
    'por lo que funciona en el celular del usuario final, no en el servidor. En HTTPS (que '
    'Vercel provee automaticamente), el GPS funciona sin problemas. En HTTP, algunos navegadores '
    'bloquean la geolocalizacion por seguridad.', body))

# Build
doc.build(story)
print(f"PDF generated: {pdf_path}")
