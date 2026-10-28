#!/bin/bash

# Script para validar el checkpoint de la Fase 0 (Bootstrap)
# Según AGENTS.md sección 10.0

echo "=== Validación de la Fase 0 (Bootstrap) ===\n"

# 1. Verificar package.json
if [ -f "package.json" ]; then
    echo "✅ package.json existe"
    if grep -q '"wrangler": "latest"' package.json; then
        echo "✅ wrangler como devDependency"
    else
        echo "❌ wrangler no encontrado en devDependencies"
    fi
    if grep -q '"dev": "wrangler pages dev public"' package.json; then
        echo "✅ Script dev correcto (wrangler pages dev public)"
    else
        echo "❌ Script dev incorrecto"
    fi
    if grep -q '"deploy": "wrangler pages deploy public"' package.json; then
        echo "✅ Script deploy correcto (wrangler pages deploy public)"
    else
        echo "❌ Script deploy incorrecto"
    fi
else
    echo "❌ package.json no encontrado"
fi

# 2. Verificar wrangler.toml
if [ -f "wrangler.toml" ]; then
    echo "\n✅ wrangler.toml existe"
    if grep -q "pages_build_output_dir = \"public\"" wrangler.toml; then
        echo "✅ Formato de Pages (pages_build_output_dir)"
    else
        echo "❌ No usa formato de Pages"
    fi
    if grep -q '[[kv_namespaces]]' wrangler.toml; then
        echo "✅ KV namespace declarado"
    else
        echo "❌ KV namespace no encontrado"
    fi
    if grep -q '[[r2_buckets]]' wrangler.toml; then
        echo "✅ R2 bucket declarado"
    else
        echo "❌ R2 bucket no encontrado"
    fi
    if grep -q '[[r2_buckets]]' wrangler.toml && grep -A 1 '[[r2_buckets]]' wrangler.toml | grep -q 'bucket_name = \"catalogo-fotos\"'; then
        echo "✅ R2 bucket con nombre correcto"
    else
        echo "❌ R2 bucket nombre incorrecto"
    fi
    if grep -q '[[ai]]' wrangler.toml; then
        echo "✅ AI binding declarado"
    else
        echo "❌ AI binding no encontrado"
    fi
else
    echo "❌ wrangler.toml no encontrado"
fi

# 3. Verificar .dev.vars (ADMIN_PASSWORD)
if [ -f ".dev.vars" ]; then
    echo "\n✅ .dev.vars existe"
    if grep -q 'ADMIN_PASSWORD=' .dev.vars; then
        echo "✅ ADMIN_PASSWORD declarado"
    else
        echo "❌ ADMIN_PASSWORD no encontrado en .dev.vars"
    fi
else
    echo "❌ .dev.vars no encontrado"
fi

# 4. Verificar estructura de directorios
if [ -d "config" ]; then
    echo "\n✅ config/ directorio existe"
    if [ -f "config/config.example.json" ] && [ -f "config/catalogo.example.json" ] && [ -f "config/landing.example.json" ] && [ -f "config/faq.example.json" ]; then
        echo "✅ Todos los JSONs de ejemplo en config/"
    else
        echo "❌ Faltan algunos JSONs de ejemplo"
    fi
else
    echo "❌ config/ no encontrado"
fi

# 5. Verificar README.md
if [ -f "README.md" ]; then
    echo "\n✅ README.md existe"
    if grep -q "## Cómo correr en local" README.md; then
        echo "✅ Contains sección de instalación local"
    else
        echo "❌ Falta sección de instalación local"
    fi
    if grep -q "npm install" README.md; then
        echo "✅ Contiene instrucción npm install"
    else
        echo "❌ Falta instrucción npm install"
    fi
    if grep -q "npm run dev" README.md; then
        echo "✅ Contiene instrucción npm run dev"
    else
        echo "❌ Falta instrucción npm run dev"
    fi
else
    echo "❌ README.md no encontrado"
fi

# 6. Verificar .gitignore
if [ -f ".gitignore" ]; then
    echo "\n✅ .gitignore existe"
    if grep -q "node_modules/" .gitignore; then
        echo "✅ node_modules/ excluido"
    else
        echo "❌ node_modules/ no excluido"
    fi
    if grep -q "\.wrangler/" .gitignore; then
        echo "✅ .wrangler/ excluido"
    else
        echo "❌ .wrangler/ no excluido"
    fi
    if grep -q "\.dev.vars" .gitignore; then
        echo "✅ .dev.vars excluido"
    else
        echo "❌ .dev.vars no excluido"
    fi
else
    echo "❌ .gitignore no encontrado"
fi

# 7. Verificar directorios de estructura futura
if [ -d "public" ] && [ -d "functions" ] && [ -d "functions/api" ]; then
    echo "\n✅ Directorios futuros existen (public/, functions/, functions/api/)"
else
    echo "\n⚠️  Directorios futuros no encontrados (serán creados en Fase 1)"
fi

echo "\n=== Validación completada ==="
