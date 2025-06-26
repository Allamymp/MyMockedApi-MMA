#!/bin/bash

# Script para Build e Inicio da Aplicacao (Linux/macOS)

# --- Variaveis de Configuracao ---
FRONTEND_DIR="frontend"
BACKEND_DIR="backend"
NODE_PORT=3000

# Caminho COMPLETO para a pasta dist raiz do Angular dentro do frontend
# 'pwd' obtém o diretório de trabalho atual
ANGULAR_FULL_DIST_PATH="$(pwd)/${FRONTEND_DIR}/dist"

echo ""
echo "--- Iniciando o processo de Build e Configuracao ---"
echo ""

# --- 0. Verificar Pre-requisitos (Node.js e npm) ---
echo "## Verificando pre-requisitos (Node.js e npm)..."
if ! command -v node &> /dev/null
then
    echo "Erro: Node.js nao encontrado. Por favor, instale-o em https://nodejs.org"
    exit 1
fi
if ! command -v npm &> /dev/null
then
    echo "Erro: npm nao encontrado. Ele e instalado com Node.js. Por favor, reinstale Node.js."
    exit 1
fi
echo "Pre-requisitos verificados com sucesso."
echo ""

# --- 1. Build do Frontend Angular (Condicional com Interacao) ---
echo "## Verificando e construindo o Frontend Angular..."
if [ ! -d "${FRONTEND_DIR}" ]; then
    echo "Erro: A pasta ${FRONTEND_DIR} nao foi encontrada. Certifique-se de que o script esta na pasta mae."
    exit 1
fi

# Flag para controle de recompilacao
SHOULD_REBUILD_FRONTEND="true"

# Verifica se a pasta 'browser' dentro do dist existe para saber se houve um build anterior
# O caminho completo do index.html dentro do build é:
# ANGULAR_FULL_DIST_PATH/frontend/browser/index.html (assumindo que o nome do projeto angular é 'frontend')
if [ -f "${ANGULAR_FULL_DIST_PATH}/${FRONTEND_DIR}/browser/index.html" ]; then
    echo ""
    echo "========================================================================="
    echo "AVISO: O build do Frontend Angular ja existe em \"${ANGULAR_FULL_DIST_PATH}/${FRONTEND_DIR}/browser/\"."
    echo "Isso significa que o frontend que sera servido pode nao ser a versao mais recente das suas alteracoes."
    echo ""
    read -p "Deseja recompilar o Frontend Angular agora? (S/N): " Choice
    Choice=${Choice^^}  
    if [ "$Choice" != "S" ]; then
        echo "Pulando recompilacao do Frontend. Usando o build existente."
        SHOULD_REBUILD_FRONTEND="false"
    fi
fi

if [ "$SHOULD_REBUILD_FRONTEND" = "true" ]; then
    echo "Build do Frontend Angular nao encontrado ou recompilacao solicitada. Iniciando compilacao..."

   
    echo "Tentando limpar a pasta de build anterior: \"${ANGULAR_FULL_DIST_PATH}\""
    if [ -d "${ANGULAR_FULL_DIST_PATH}" ]; then
        rm -rf "${ANGULAR_FULL_DIST_PATH}"
        if [ $? -ne 0 ]; then 
            echo ""
            echo "ERRO FATAL: Nao foi possivel apagar a pasta de build do Angular em \"${ANGULAR_FULL_DIST_PATH}\"."
            echo "Por favor, verifique se a pasta nao esta em uso por outro programa (editor, terminal, etc.)"
            echo "e tente novamente."
            echo ""
            exit 1
        else
            echo "Pasta de build limpa com sucesso."
        fi
    else
        echo "A pasta de build \"${ANGULAR_FULL_DIST_PATH}\" nao existe, sem necessidade de limpeza."
    fi

    # Verifica se o Angular CLI está instalado antes de tentar usá-lo
    echo "Verificando Angular CLI (ng)..."
    if ! command -v ng &> /dev/null
    then
        echo "Erro: Angular CLI (ng) nao encontrado. Por favor, instale-o com: npm install -g @angular/cli@latest"
        exit 1
    fi
    echo "Angular CLI (ng) verificado."

    echo "Entrando na pasta: ${FRONTEND_DIR}"
    if ! pushd "${FRONTEND_DIR}" &> /dev/null; then
        echo "Erro: Nao foi possivel entrar na pasta ${FRONTEND_DIR}."
        exit 1
    fi

    echo "Instalando dependencias do Frontend (se necessario)..."
    npm install
    if [ $? -ne 0 ]; then
        echo "Erro: Falha ao instalar dependencias do Frontend."
        popd &> /dev/null
        exit 1
    fi

    echo "Gerando build de producao do Frontend..."
    ng build -c production
    if [ $? -ne 0 ]; then
        echo "Erro: Falha ao gerar build de producao do Frontend."
        popd &> /dev/null
        exit 1
    fi
    echo "Frontend Angular construido com sucesso!"
    echo "Saindo da pasta: ${FRONTEND_DIR}"
    popd &> /dev/null
    echo ""
fi

echo "Frontend Angular pronto."
echo ""

# --- 2. Configuracao e Instalacao de Dependencias do Backend Node.js ---
echo "## Preparando o Backend Node.js..."
if [ ! -d "${BACKEND_DIR}" ]; then
    echo "Erro: A pasta ${BACKEND_DIR} nao foi encontrada. Certifique-se de que o script esta na pasta mae."
    exit 1
fi
echo "Entrando na pasta: ${BACKEND_DIR}"
if ! pushd "${BACKEND_DIR}" &> /dev/null; then
    echo "Erro: Nao foi possivel entrar na pasta ${BACKEND_DIR}."
    exit 1
fi
echo "Instalando dependencias do Backend (se necessario)..."
npm install
if [ $? -ne 0 ]; then
    echo "Erro: Falha ao instalar dependencias do Backend."
    popd &> /dev/null
    exit 1
fi
echo "Backend Node.js configurado com sucesso!"

# --- 3. Iniciando o Servidor Node.js no Foreground ---
echo ""
echo "## Iniciando o servidor Node.js no foreground (na porta ${NODE_PORT})..."
echo "Pressione Ctrl+C para encerrar o servidor."
echo "Executando: npm start"
npm start

# O script nao chegara a este ponto enquanto o servidor estiver rodando.
echo "Servidor Node.js encerrado ou falhou ao iniciar."

echo "Saindo da pasta: ${BACKEND_DIR}"
popd &> /dev/null
echo ""
echo "--- Processo Concluido! ---"
echo "A aplicacao completa (Frontend + API) deve estar disponivel em http://localhost:${NODE_PORT}"
echo "Aguarde alguns segundos para o servidor iniciar completamente."
echo ""

exit 0