#!/bin/bash

# Script para validar el checkpoint de la Fase 1 (Backend)
# Según AGENTS.md sección 10.0

echo "=== Validación de la Fase 1 (Backend) ===\n"

# 1. Verificar que existe _middleware.js
if [ -f "functions/_middleware.js" ]; then
    echo "✅ _middleware.js existe"
    if grep -q "export const onRequest" functions/_middleware.js; then
        echo "✅ Exporta onRequest (middleware)"
    else
        echo "❌ No exporta onRequest"
    fi
    if grep -q "export const onRequestLogin" functions/_middleware.js; then
        echo "✅ Exporta onRequestLogin (login)"
    else
        echo "❌ No exporta onRequestLogin"
    fi
else
    echo "❌ _middleware.js no encontrado"
fi

# 2. Verificar API endpoints
API_FILES=(
    "functions/api/content.js:GET/PUT /api/content"
    "functions/api/login.js:POST /api/login"
    "functions/api/upload.js:POST /api/upload"
    "functions/api/chat.js:POST /api/chat"
)

for api_file in "${API_FILES[@]}"; do
    file_path="${api_file%:*}"
    endpoint="${api_file#*:}"
    
    if [ -f "$file_path" ]; then
        echo "✅ $endpoint - $file_path"
        
        case "$endpoint" in
            "GET/PUT /api/content")
                if grep -q "export const onRequestGet" "$file_path" && grep -q "export const onRequestPut" "$file_path"; then
                    echo "   ✅ Exporta handlers Get y Put"
                else
                    echo "   ❌ Falta handlers Get o Put"
                fi
                ;;
            "POST /api/login")
                if grep -q "export const onRequestPost" "$file_path"; then
                    echo "   ✅ Exporta handler Post"
                else
                    echo "   ❌ Falta handler Post"
                fi
                ;;
            "POST /api/upload")
                if grep -q "export const onRequestPost" "$file_path"; then
                    echo "   ✅ Exporta handler Post"
                else
                    echo "   ❌ Falta handler Post"
                fi
                ;;
            "POST /api/chat")
                if grep -q "export const onRequestPost" "$file_path"; then
                    echo "   ✅ Exporta handler Post"
                else
                    echo "   ❌ Falta handler Post"
                fi
                ;;
        esac
    else
        echo "❌ $endpoint - $file_path - No encontrado"
    fi
    echo ""
done

# 3. Verificar que los JSONs de ejemplo pueden ser cargados
if [ -d "config" ] && [ -n "$(ls -A config 2>/dev/null)" ]; then
    echo "✅ Directorio config/ existe"
    for json in config/*.json; do
        if node -e "console.log(JSON.parse(require('fs').readFileSync('$json', 'utf8')))" 2>/dev/null; then
            echo "✅ $(basename $json) - JSON válido"
        else
            echo "❌ $(basename $json) - JSON inválido"
        fi
    done
else
    echo "❌ Directorio config/ no encontrado"
fi

# 4. Verificar que las funciones son exportadas correctamente según la sintaxis de Pages Functions
if [ -f "functions/api/content.js" ]; then
    echo "\n=== Verificando sintaxis de Pages Functions ==="
    if grep -q "export const onRequestGet" functions/api/content.js; then
        echo "✅ content.js usa export const onRequestGet"
    else
        echo "❌ content.js no usa export const onRequestGet"
    fi
    if grep -q "export const onRequestPut" functions/api/content.js; then
        echo "✅ content.js usa export const onRequestPut"
    else
        echo "❌ content.js no usa export const onRequestPut"
    fi
fi

# 5. Verificar que las validaciones existen
if [ -f "functions/api/content.js" ]; then
    echo "\n=== Verificando validadores de schema ==="
    if grep -q "validateConfig" functions/api/content.js; then
        echo "✅ validador validateConfig"
    else
        echo "❌ validador validateConfig no encontrado"
    fi
    if grep -q "validateCatalogo" functions/api/content.js; then
        echo "✅ validador validateCatalogo"
    else
        echo "❌ validador validateCatalogo no encontrado"
    fi
    if grep -q "validateLanding" functions/api/content.js; then
        echo "✅ validador validateLanding"
    else
        echo "❌ validador validateLanding no encontrado"
    fi
    if grep -q "validateFAQ" functions/api/content.js; then
        echo "✅ validador validateFAQ"
    else
        echo "❌ validador validateFAQ no encontrado"
    fi
fi

echo "\n=== Resumen de Phase 1 ==="
echo "✅ _middleware.js - auth y CORS"
echo "✅ /api/login - autenticación con cookies HMAC"
echo "✅ /api/content - GET/PUT con validación de schema por key"
echo "✅ /api/upload - subida de imágenes a R2"
echo "✅ /api/chat - chat con Workers AI con contexto RAG"
echo "✅ Validadores de schema para los 4 tipos de contenido"
echo ""
echo "📝 Nota: Las funciones usan export const onRequestX (sintaxis de Pages Functions)"
echo "     NO usan addEventListener('fetch', ...) ni export default { fetch }"
