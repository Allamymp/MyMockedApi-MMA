@echo off
REM Script para Build e Inicio da Aplicacao (Windows)

REM Variaveis de Configuracao
SET FRONTEND_DIR=frontend
SET BACKEND_DIR=backend
SET NODE_PORT=3000

REM Caminho COMPLETO para a pasta dist raiz do Angular dentro do frontend
SET ANGULAR_FULL_DIST_PATH=%CD%\%FRONTEND_DIR%\dist

echo.
echo --- Iniciando o processo de Build e Configuracao ---
echo.

REM 0. Verificar Pre-requisitos (Node.js e npm)
echo ## Verificando pre-requisitos (Node.js e npm)...
where node >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
    echo Erro: Node.js nao encontrado. Por favor, instale-o em https://nodejs.org
    exit /b 1
)
where npm >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
    echo Erro: npm nao encontrado. Ele e instalado com Node.js. Por favor, reinstale Node.js.
    exit /b 1
)
echo Pre-requisitos verificados com sucesso.
echo.

REM 1. Build do Frontend Angular (Condicional com Interacao)
echo ## Verificando e construindo o Frontend Angular...
IF NOT EXIST "%FRONTEND_DIR%" (
    echo Erro: A pasta %FRONTEND_DIR% nao foi encontrada. Certifique-se de que o script esta na pasta mae.
    exit /b 1
)

REM Flag para controle de recompilacao
SET "SHOULD_REBUILD_FRONTEND=true"

REM Verifica se a pasta 'browser' dentro do dist existe para saber se houve um build anterior
IF EXIST "%ANGULAR_FULL_DIST_PATH%\%FRONTEND_DIR%\browser\index.html" (
    echo.
    echo =========================================================================
    echo AVISO: O build do Frontend Angular ja existe em "%ANGULAR_FULL_DIST_PATH%\%FRONTEND_DIR%\browser\".
    echo Isso significa que o frontend que sera servido pode nao ser a versao mais recente das suas alteracoes.
    echo.
    SET /P Choice="Deseja recompilar o Frontend Angular agora? (S/N): "
    IF /I "%Choice%" NEQ "S" IF /I "%Choice%" NEQ "SIM" (
        echo Pulando recompilacao do Frontend. Usando o build existente.
        SET "SHOULD_REBUILD_FRONTEND=false"
    )
)

IF "%SHOULD_REBUILD_FRONTEND%"=="true" (
    :build_frontend_now
    echo Build do Frontend Angular nao encontrado ou recompilacao solicitada. Iniciando compilacao...

    REM Limpar a pasta dist completa do Angular antes de compilar
    echo Tentando limpar a pasta de build anterior: "%ANGULAR_FULL_DIST_PATH%"
    IF EXIST "%ANGULAR_FULL_DIST_PATH%" (
        rmdir /S /Q "%ANGULAR_FULL_DIST_PATH%"
        IF %ERRORLEVEL% NEQ 0 (
            echo.
            echo ERRO FATAL: Nao foi possivel apagar a pasta de build do Angular em "%ANGULAR_FULL_DIST_PATH%".
            echo Por favor, verifique se a pasta nao esta em uso por outro programa (editor, terminal, etc.)
            echo e tente novamente. Talvez seja necessario reiniciar o computador.
            echo.
            pause
            exit /b 1
        ) ELSE (
            echo Pasta de build limpa com sucesso.
        )
    ) else (
        echo A pasta de build "%ANGULAR_FULL_DIST_PATH%" nao existe, sem necessidade de limpeza.
    )


    echo Entrando na pasta: %FRONTEND_DIR%
    pushd "%FRONTEND_DIR%"
    IF %ERRORLEVEL% NEQ 0 (
        echo Erro: Nao foi possivel entrar na pasta %FRONTEND_DIR%.
        exit /b 1
    )

    echo Instalando dependencias do Frontend (se necessario)...
    call npm install
    IF %ERRORLEVEL% NEQ 0 (
        echo Erro: Falha ao instalar dependencias do Frontend.
        popd
        exit /b 1
    )

    echo Gerando build de producao do Frontend...
    call ng build -c production
    IF %ERRORLEVEL% NEQ 0 (
        echo Erro: Falha ao gerar build de producao do Frontend.
        popd
        exit /b 1
    )
    echo Frontend Angular construido com sucesso!
    echo Saindo da pasta: %FRONTEND_DIR%
    popd
    echo.
)

:backend_setup
echo Frontend Angular pronto.
echo.

REM Configuracao e Instalacao de Dependencias do Backend Node.js
echo ## Preparando o Backend Node.js...
IF NOT EXIST "%BACKEND_DIR%" (
    echo Erro: A pasta %BACKEND_DIR% nao foi encontrada. Certifique-se de que o script esta na pasta mae.
    exit /b 1
)
echo Entrando na pasta: %BACKEND_DIR%
pushd "%BACKEND_DIR%"
IF %ERRORLEVEL% NEQ 0 (
    echo Erro: Nao foi possivel entrar na pasta %BACKEND_DIR%.
    exit /b 1
)
echo Instalando dependencias do Backend (se necessario)...
call npm install
IF %ERRORLEVEL% NEQ 0 (
    echo Erro: Falha ao instalar dependencias do Backend.
    popd
    exit /b 1
)
echo Backend Node.js configurado com sucesso!

REM Iniciando o Servidor Node.js no Foreground
echo.
echo ## Iniciando o servidor Node.js no foreground (na porta %NODE_PORT%)...
echo Pressione Ctrl+C para encerrar o servidor.
echo Executando: npm start
call npm start

REM O script nao chegara a este ponto enquanto o servidor estiver rodando.
echo Servidor Node.js encerrado ou falhou ao iniciar.

echo Saindo da pasta: %BACKEND_DIR%
popd
echo.
echo --- Processo Concluido! ---
echo A aplicacao completa (Frontend + API) deve estar disponivel em http://localhost:%NODE_PORT%
echo Aguarde alguns segundos para o servidor iniciar completamente.

exit /b 0