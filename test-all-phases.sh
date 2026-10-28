#!/bin/bash

# Comprehensive test script for all phases (0-3)
# Valida que todo funcione en conjunto antes de Phase 4

echo "🧪 === TEST COMPREHENSIVEO DE TODAS LAS FASES ==="
echo "Validando implementaciones de Phase 0-3 antes de Phase 4"
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASS=0
FAIL=0

test_phase() {
    local phase_name="$1"
    local test_script="$2"
    
    echo ""
    echo "${YELLOW}📋 Testing ${phase_name}...${NC}"
    echo "=" * 60
    
    if [ -x "$test_script" ]; then
        if "$test_script"; then
            echo "${GREEN}✅ ${phase_name} passed all tests${NC}"
            PASS=$((PASS + 1))
        else
            echo "${RED}❌ ${phase_name} failed tests${NC}"
            FAIL=$((FAIL + 1))
        fi
    else
        echo "${RED}❌ Test script ${test_script} not found or not executable${NC}"
        FAIL=$((FAIL + 1))
    fi
}

# Test Phase 0
echo "${YELLOW}🚀 Starting comprehensive test suite...${NC}"
echo ""

test_phase "Phase 0 (Bootstrap)" "/home/devops/proyectos/personal-ecommerce/validate-phase0.sh"

# Test Phase 1  
test_phase "Phase 1 (Backend)" "/home/devops/proyectos/personal-ecommerce/validate-phase1.sh"

# Test Phase 2
test_phase "Phase 2 (Frontend Público)" "/home/devops/proyectos/personal-ecommerce/validate-phase2.sh"

# Test Phase 3
test_phase "Phase 3 (Admin UI)" "/home/devops/proyectos/personal-ecommerce/validate-phase3.sh"

echo ""

echo "📊 === RESUMEN DEL TEST COMPLEJO ==="
echo "Phase 0 (Bootstrap): $([ -x '/home/devops/proyectos/personal-ecommerce/validate-phase0.sh' ] && '/home/devops/proyectos/personal-ecommerce/validate-phase0.sh' > /dev/null && echo '✅ PASS' || echo '❌ FAIL')"
echo "Phase 1 (Backend): $([ -x '/home/devops/proyectos/personal-ecommerce/validate-phase1.sh' ] && '/home/devops/proyectos/personal-ecommerce/validate-phase1.sh' > /dev/null && echo '✅ PASS' || echo '❌ FAIL')"
echo "Phase 2 (Frontend): $([ -x '/home/devops/proyectos/personal-ecommerce/validate-phase2.sh' ] && '/home/devops/proyectos/personal-ecommerce/validate-phase2.sh' > /dev/null && echo '✅ PASS' || echo '❌ FAIL')"
echo "Phase 3 (Admin UI): $([ -x '/home/devops/proyectos/personal-ecommerce/validate-phase3.sh' ] && '/home/devops/proyectos/personal-ecommerce/validate-phase3.sh' > /dev/null && echo '✅ PASS' || echo '❌ FAIL')"

echo ""
echo "🎯 ESTADO FINAL:"
if [ $FAIL -eq 0 ]; then
    echo "${GREEN}✅ ALL TESTS PASSED - Ready for Phase 4!${NC}"
    echo ""
    echo "📋 El proyecto está completamente implementado según AGENTS.md:"
    echo "   • ✅ Phase 0 (Bootstrap) - Estructura y configuración"
    echo "   • ✅ Phase 1 (Backend) - API endpoints con validación"
    echo "   • ✅ Phase 2 (Frontend) - Páginas públicas con utilidades"
    echo "   • ✅ Phase 3 (Admin UI) - Panel completo de administración"
    echo ""
    echo "🚀 Próximos pasos:"
    echo "   • Fase 4 - Contenido inicial (Claude Projects, guía para usuario)"
    echo "   • Fase 5 - Guía y pruebas E2E (README completo)"
else
    echo "${RED}❌ Some tests failed - Review issues above${NC}"
    echo ""
    echo "🔧 Problemas reportados:"
    echo "   • $FAIL fase(s) fallaron en las pruebas"
    echo "   • Ver los logs de arriba para detalles"
    echo "   • Corregir antes de proceder con Phase 4"
fi

echo ""
echo "=== Fin de la prueba ==="
exit $((FAIL > 0 ? 1 : 0))