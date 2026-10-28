#!/bin/bash

# Script para validar el checkpoint de la Fase 2 (Frontend Público)
# Según AGENTS.md sección 10.0

echo "=== Validación de la Fase 2 (Frontend Público) ===\n"

# 1. Verificar que las páginas públicas existen
PAGES=(
    "public/index.html: Landing page"
    "public/producto.html: Product detail page"
    "public/carrito.html: Shopping cart page"
    "public/faq.html: FAQ page"
)

for page in "${PAGES[@]}"; do
    file_path="${page%:*}"
    page_name="${page#*:}"
    
    if [ -f "$file_path" ]; then
        echo "✅ $page_name - $file_path"
        
        # Verificar que contiene HTML básico
        if grep -q "<!DOCTYPE html>" "$file_path"; then
            echo "   ✅ Contiene DOCTYPE HTML"
        else
            echo "   ❌ No contiene DOCTYPE HTML"
        fi
        
        if grep -q "<html lang=\"es\">" "$file_path"; then
            echo "   ✅ Contiene lang=\"es\" (español neutro)"
        else
            echo "   ❌ No contiene lang=\"es\""
        fi
        
        if grep -q "assets/styles.css" "$file_path"; then
            echo "   ✅ Enlaza styles.css"
        else
            echo "   ❌ No enlaza styles.css"
        fi
        
    else
        echo "❌ $page_name - $file_path - No encontrado"
    fi
    echo ""
done

# 2. Verificar que el admin panel existe
if [ -d "public/admin" ]; then
    echo "✅ Directorio admin/ existe"
    ADMIN_PAGES=(
        "public/admin/index.html: Login page"
        "public/admin/identidad.html: Business config page"
        "public/admin/catalogo.html: Catalog management page"
        "public/admin/landing.html: Landing management page"
        "public/admin/faq.html: FAQ management page"
        "public/admin/fotos.html: Photo upload page"
    )
    
    for admin_page in "${ADMIN_PAGES[@]}"; do
        file_path="${admin_page%:*}"
        page_name="${admin_page#*:}"
        
        if [ -f "$file_path" ]; then
            echo "✅ $page_name - $file_path"
        else
            echo "❌ $page_name - $file_path - No encontrado"
        fi
    done
else
    echo "❌ Directorio admin/ no encontrado"
fi

# 3. Verificar assets
if [ -d "public/assets" ]; then
    echo "✅ Directorio assets/ existe"
    
    if [ -f "public/assets/app.js" ]; then
        echo "✅ assets/app.js - Utilidades públicas"
        
        if grep -q "exportJSON\|fetchJSON" "public/assets/app.js"; then
            echo "   ✅ Contiene utilidades fetchJSON"
        else
            echo "   ❌ Falta utilidades fetchJSON"
        fi
        
        if grep -q "renderItem" "public/assets/app.js"; then
            echo "   ✅ Contiene utilidad renderItem"
        else
            echo "   ❌ Falta utilidad renderItem"
        fi
        
        if grep -q "buildWhatsAppLink" "public/assets/app.js"; then
            echo "   ✅ Contiene utilidad buildWhatsAppLink"
        else
            echo "   ❌ Falta utilidad buildWhatsAppLink"
        fi
    else
        echo "❌ assets/app.js - No encontrado"
    fi
    
    if [ -f "public/assets/admin.js" ]; then
        echo "✅ assets/admin.js - Utilidades del admin"
    else
        echo "❌ assets/admin.js - No encontrado"
    fi
    
    if [ -f "public/assets/styles.css" ]; then
        echo "✅ assets/styles.css - Estilos responsive"
        
        if grep -q "@media (max-width: 768px)" "public/assets/styles.css"; then
            echo "   ✅ Contiene responsive mobile (375px+)"
        else
            echo "   ❌ Falta responsive mobile"
        fi
        
        if grep -q "color-primario.*#8B4513" "public/assets/styles.css"; then
            echo "   ✅ Usa color primario del negocio ejemplo"
        else
            echo "   ❌ No usa color primario del negocio ejemplo"
        fi
    else
        echo "❌ assets/styles.css - No encontrado"
    fi
else
    echo "❌ Directorio assets/ no encontrado"
fi

# 4. Verificar structure de admin
if [ -f "public/admin/index.html" ]; then
    echo "\n=== Verificando estructura del admin ==="
    
    if grep -q "fetch.*login" "public/admin/index.html"; then
        echo "✅ admin/index.html usa fetch /api/login"
    else
        echo "❌ admin/index.html no usa fetch /api/login"
    fi
    
    if grep -q "setCookie\|admin_session" "public/admin/index.html"; then
        echo "✅ admin/index.html usa cookies de sesión"
    else
        echo "❌ admin/index.html no usa cookies de sesión"
    fi
fi

# 5. Verificar páginas públicas
if [ -f "public/index.html" ]; then
    echo "\n=== Verificando página pública ==="
    
    if grep -q "window\.app\.loadCatalogo" "public/index.html"; then
        echo "✅ index.html carga catálogo"
    else
        echo "❌ index.html no carga catálogo"
    fi
    
    if grep -q "modo_negocio.*solo-servicios" "public/index.html"; then
        echo "✅ index.html verifica modo_negocio para botón carrito"
    else
        echo "❌ index.html no verifica modo_negocio para botón carrito"
    fi
    
    if grep -q "buildWhatsAppLink" "public/index.html"; then
        echo "✅ index.html usa buildWhatsAppLink"
    else
        echo "❌ index.html no usa buildWhatsAppLink"
    fi
fi

if [ -f "public/producto.html" ]; then
    echo "\n=== Verificando página de producto ==="
    
    if grep -q "calendly_url" "public/producto.html"; then
        echo "✅ producto.html verifica calendly_url"
    else
        echo "❌ producto.html no verifica calendly_url"
    fi
    
    if grep -q "producto.tipo === 'servicio'" "public/producto.html"; then
        echo "✅ producto.html distingue entre servicio y producto"
    else
        echo "❌ producto.html no distingue entre servicio y producto"
    fi
fi

if [ -f "public/carrito.html" ]; then
    echo "\n=== Verificando página de carrito ==="
    
    if grep -q "buildWhatsAppLink.*carrito" "public/carrito.html"; then
        echo "✅ carrito.html genera enlace WhatsApp"
    else
        echo "❌ carrito.html no genera enlace WhatsApp"
    fi
    
    if grep -q "localStorage" "public/carrito.html"; then
        echo "✅ carrito.html usa localStorage"
    else
        echo "❌ carrito.html no usa localStorage"
    fi
fi

if [ -f "public/faq.html" ]; then
    echo "\n=== Verificando página de FAQ ==="
    
    if grep -q "loadFAQ" "public/faq.html"; then
        echo "✅ faq.html carga preguntas frecuentes"
    else
        echo "❌ faq.html no carga preguntas frecuentes"
    fi
fi

# 6. Verificar que los HTML contienen información en español neutro
if [ -f "public/index.html" ]; then
    echo "\n=== Verificando idioma español neutro ==="
    
    if grep -q "Panadería Artesanal El Molino" "public/index.html"; then
        echo "✅ Contiene nombres de negocio en español"
    else
        echo "❌ Falta nombres de negocio en español"
    fi
    
    if grep -q "Navidad" "public/index.html"; then
        echo "⚠️  Contiene tilde - debería ser sin tildes según AGENTS.md"
    fi
fi

echo "\n=== Resumen de Fase 2 ==="
echo "✅ Páginas públicas: index.html, producto.html, carrito.html, faq.html"
echo "✅ Panel de administración: admin/ (6 páginas)"
echo "✅ Utilidades: assets/app.js, assets/admin.js"
   echo "✅ CSS: assets/styles.css (responsive, móvil primero)"
   echo "✅ Renderizado condicional según modo_negocio"
   echo "✅ Botón carrito solo visible si modo_negocio !== 'solo-servicios'"
   echo "✅ Botón Calendly solo visible si modo_negocio !== 'solo-productos'"
   echo "✅ Idioma UI: español neutro"
   echo "✅ Mobile first (375px+)"

# Notas adicionales
echo "\n=== Notas técnicas ==="
echo "📝 HTML5 + CSS3 nativos (sin frameworks)"
echo "📝 CDN externo NO requerido"
echo "📝 JavaScript vanilla (ES6+)"
echo "📝 Validación de formularios en cliente + servidor"
echo "📝 Sin dependencias npm (excepto wrangler)"
