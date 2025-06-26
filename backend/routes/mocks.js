const express = require('express');
// Importar os novos nomes de variáveis para diretórios de arquivos e arquivos de índice
const { readIndex, writeIndex, deleteFile, MOCKS_FILES_DIR, MOCKS_INDEX_FILE } = require('../utils/fileUtils');

// Importar as definições de endpoints centralizadas
const { BLOCKED_PATHS, ENDPOINTS } = require('./index');

const router = express.Router();

// Validar caminho para evitar padrões inválidos
const isValidPath = (path) => {
    if (!/^[a-zA-Z0-9_/-]+$/.test(path) || path.includes('://') || path.includes(':') || path.includes('*')) {
        return false;
    }
    for (const blockedPath of BLOCKED_PATHS) {
        if (path.toLowerCase().startsWith(blockedPath.toLowerCase())) {
            return false;
        }
    }
    return true;
};

// Endpoint para criar um mock
router.post('/', async (req, res) => {
    const { method, path: endpointPath, responseStatus, responseHeaders, responseBody } = req.body;

    if (!method || !endpointPath || !responseStatus || !responseBody) {
        return res.status(400).json({ error: 'Campos obrigatórios: method, path, responseStatus, responseBody' });
    }

    const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
    const upperMethod = method.toUpperCase();
    if (!validMethods.includes(upperMethod)) {
        return res.status(400).json({ error: 'Método HTTP inválido. Use: GET, POST, PUT, DELETE, PATCH' });
    }

    if (!isValidPath(endpointPath)) { // Usa a validação atualizada com paths proibidos
        return res.status(400).json({ error: 'Caminho inválido ou reservado. Escolha um caminho diferente.' });
    }

    const mock = {
        method: upperMethod,
        path: endpointPath,
        responseStatus,
        responseHeaders: responseHeaders || { 'Content-Type': 'application/json' },
        responseBody
    };

    const cleanPath = endpointPath.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_');
    const fileName = `${upperMethod}_${cleanPath}_${Date.now()}.json`;
    const filePath = require('path').join(MOCKS_FILES_DIR, fileName); // <<-- Usando MOCKS_FILES_DIR para salvar o arquivo JSON

    const indexKey = `${upperMethod}_${endpointPath}`;

    try {
        const mocksIndex = await readIndex(MOCKS_INDEX_FILE); // <<-- Usando MOCKS_INDEX_FILE
        if (mocksIndex[indexKey]) {
            return res.status(409).json({ error: `Mock com chave ${indexKey} já existe` });
        }
        await require('fs').promises.writeFile(filePath, JSON.stringify(mock, null, 2));
        mocksIndex[indexKey] = filePath;
        await writeIndex(MOCKS_INDEX_FILE, mocksIndex);
        res.status(201).json(mock);
    } catch (error) {
        await deleteFile(filePath);
        res.status(500).json({ error: 'Erro ao salvar o mock: ' + error.message });
    }
});

// Endpoint para listar todos os mocks
router.get('/', async (req, res) => {
    try {
        const mocksIndex = await readIndex(MOCKS_INDEX_FILE); // <<-- Usando MOCKS_INDEX_FILE
        const mockList = Object.keys(mocksIndex);
        res.status(200).json(mockList);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao listar os mocks: ' + error.message });
    }
});

// Endpoint para recuperar um mock específico por sua chave (MÉTODO_PATH)
router.get('/details/:mockKey', async (req, res) => {
    const mockKey = decodeURIComponent(req.params.mockKey);

    try {
        const mocksIndex = await readIndex(MOCKS_INDEX_FILE); // <<-- Usando MOCKS_INDEX_FILE
        const filePath = mocksIndex[mockKey];
        if (!filePath) {
            return res.status(404).json({ error: 'Mock não encontrado' });
        }

        const mock = JSON.parse(await require('fs').promises.readFile(filePath));
        res.status(200).json(mock);
    } catch (error) {
        console.error('Erro ao recuperar o mock:', error.message);
        res.status(500).json({ error: 'Erro ao recuperar o mock: ' + error.message });
    }
});


// Endpoint para deletar um mock específico
router.delete('/:path', async (req, res) => {
    const rawPath = decodeURIComponent(req.params.path);
    console.log(`DELETE /mocks/:path recebido: ${rawPath}`);

    if (!isValidPath(rawPath)) {
        console.warn(`Caminho inválido rejeitado: ${rawPath}`);
        return res.status(400).json({ error: 'Caminho inválido para deleção.' });
    }

    const indexKey = rawPath;
    try {
        const mocksIndex = await readIndex(MOCKS_INDEX_FILE); // <<-- Usando MOCKS_INDEX_FILE
        const filePath = mocksIndex[indexKey];
        if (!filePath) {
            return res.status(404).json({ error: 'Endpoint não encontrado' });
        }
        await deleteFile(filePath);
        delete mocksIndex[indexKey];
        await writeIndex(MOCKS_INDEX_FILE, mocksIndex);
        res.status(200).json({ message: `Mock ${indexKey} deletado com sucesso` });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao deletar o mock: ' + error.message });
    }
});

// Endpoint para deletar todos os mocks
router.delete('/', async (req, res) => {
    try {
        const mocksIndex = await readIndex(MOCKS_INDEX_FILE); // <<-- Usando MOCKS_INDEX_FILE
        for (const [indexKey, filePath] of Object.entries(mocksIndex)) {
            try {
                await deleteFile(filePath);
                console.log(`Arquivo deletado: ${filePath}`);
            } catch (error) {
                console.warn(`Aviso: Não foi possível deletar o arquivo ${filePath}: ${error.message}`);
            }
        }

        // DELETAR ARQUIVOS ÓRFÃOS: Precisa varrer o diretório MOCKS_FILES_DIR
        const files = await require('fs').promises.readdir(MOCKS_FILES_DIR); // <<-- Usando MOCKS_FILES_DIR
        for (const file of files) {
            const filePath = require('path').join(MOCKS_FILES_DIR, file); // <<-- Usando MOCKS_FILES_DIR
            try {
                await deleteFile(filePath);
                console.log(`Arquivo órfão de mock deletado: ${filePath}`);
            } catch (error) {
                console.warn(`Aviso: Não foi possível deletar o arquivo órfão ${filePath}: ${error.message}`);
            }
        }

        await writeIndex(MOCKS_INDEX_FILE, {}); // <<-- Usando MOCKS_INDEX_FILE
        console.log('mocks_index.json redefinido para vazio');

        res.status(200).json({ message: 'Todos os mocks foram deletados com sucesso' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao deletar todos os mocks: ' + error.message });
    }
});

// Middleware para rotas genéricas
async function handleGenericRoute(req, res, next) {
    const cleanPath = req.path.replace(/^\/+/, '');
    const indexKey = `${req.method}_${cleanPath}`;
    console.log(`Processando rota genérica: ${req.method} ${req.path} (indexKey: ${indexKey})`);

    if (!isValidPath(cleanPath)) {
        console.warn(`Tentativa de mock para caminho inválido/reservado: ${req.path}`);
        return next();
    }

    try {
        const mocksIndex = await readIndex(MOCKS_INDEX_FILE); // <<-- Usando MOCKS_INDEX_FILE
        const filePath = mocksIndex[indexKey];
        if (!filePath) {
            return next();
        }
        const mock = JSON.parse(await require('fs').promises.readFile(filePath));
        res.status(mock.responseStatus)
           .set(mock.responseHeaders)
           .send(mock.responseBody);
    } catch (error) {
        console.error('Erro ao processar mock genérico:', error.message);
        res.status(500).json({ error: 'Erro interno ao processar a requisição: ' + error.message });
    }
}

module.exports = router;
module.exports.handleGenericRoute = handleGenericRoute;