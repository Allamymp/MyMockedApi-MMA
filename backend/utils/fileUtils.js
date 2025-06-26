const fs = require('fs').promises;
const path = require('path');

// Diretório RAIZ para dados de requisições e templates
const REQUISITIONS_DATA_ROOT_DIR = path.join(__dirname, '../requisitions_data');

// Diretórios onde os ARQUIVOS JSON de Mocks e Templates serão SALVOS
const MOCKS_FILES_DIR = path.join(REQUISITIONS_DATA_ROOT_DIR, 'mocks_files');
const TEMPLATES_FILES_DIR = path.join(REQUISITIONS_DATA_ROOT_DIR, 'templates_files');

const INDEXES_DIR = path.join(REQUISITIONS_DATA_ROOT_DIR, 'indexes');

const LOG_ROOT_DIR = path.join(__dirname, '../logs');
const REQUISITIONS_LOG_DIR = path.join(LOG_ROOT_DIR, 'requisitions_log');


 
const MOCKS_INDEX_FILE = path.join(INDEXES_DIR, 'mocks_index.json');
const TEMPLATES_INDEX_FILE = path.join(INDEXES_DIR, 'templates_index.json');


// Função para criar diretórios e arquivos de índice (executada ao iniciar o servidor)
async function initialize() {
    try {
        await fs.mkdir(REQUISITIONS_DATA_ROOT_DIR, { recursive: true });
        await fs.mkdir(MOCKS_FILES_DIR, { recursive: true });
        await fs.mkdir(TEMPLATES_FILES_DIR, { recursive: true });
        await fs.mkdir(INDEXES_DIR, { recursive: true });

        await fs.mkdir(LOG_ROOT_DIR, { recursive: true });
        await fs.mkdir(REQUISITIONS_LOG_DIR, { recursive: true });

        try {
            await fs.access(MOCKS_INDEX_FILE);
        } catch {
            await fs.writeFile(MOCKS_INDEX_FILE, JSON.stringify({}, null, 2));
        }

        try {
            await fs.access(TEMPLATES_INDEX_FILE);
        } catch {
            await fs.writeFile(TEMPLATES_INDEX_FILE, JSON.stringify({}, null, 2));
        }
    } catch (error) {
        throw new Error('Erro ao inicializar diretórios e arquivos: ' + error.message);
    }
}

// Funções utilitárias (readIndex, writeIndex, deleteFile, writeLog)
async function readIndex(indexFile) {
    try {
        const data = await fs.readFile(indexFile, 'utf8');
        if (data.trim() === '') {
            return {};
        }
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return {};
        }
        throw new Error('Erro ao ler o arquivo de índice: ' + error.message);
    }
}

async function writeIndex(indexFile, data) {
    try {
        await fs.writeFile(indexFile, JSON.stringify(data, null, 2));
    } catch (error) {
        throw new Error('Erro ao escrever o arquivo de índice: ' + error.message);
    }
}

async function deleteFile(filePath) {
    try {
        await fs.unlink(filePath);
    } catch (error) {
        if (error.code !== 'ENOENT') {
            throw error;
        }
    }
}

async function writeLog(logEntry) {
    try {
        const MAX_BODY_SIZE = 10240;
        
        if (logEntry.body !== undefined && logEntry.body !== null) {
            let bodyToProcess = logEntry.body;

        
            if (typeof bodyToProcess === 'string') {
                try {
                    bodyToProcess = JSON.parse(bodyToProcess);
                } catch (e) {
                }
            }

             if (typeof bodyToProcess === 'object') {
                const bodyString = JSON.stringify(bodyToProcess);
                if (bodyString.length > MAX_BODY_SIZE) {
                    logEntry.body = { truncated: bodyString.substring(0, MAX_BODY_SIZE - 100) + '... [TRUNCATED]' };
                } else {
                    logEntry.body = bodyToProcess;
                }
            } else if (typeof bodyToProcess === 'string' && bodyToProcess.length > MAX_BODY_SIZE) {
                 logEntry.body = bodyToProcess.substring(0, MAX_BODY_SIZE - 100) + '... [TRUNCATED]';
            }
         }

        const today = new Date().toISOString().split('T')[0];
        const logFile = path.join(REQUISITIONS_LOG_DIR, `log_${today}.json`);    

        let logs = [];
        try {
            const data = await fs.readFile(logFile, 'utf8');
            if (data.trim() === '') {
                logs = [];
            } else {
                logs = JSON.parse(data);
                if (!Array.isArray(logs)) {
                    logs = [];
                }
            }
        } catch (error) {
            if (error.code === 'ENOENT' || error.message.includes('Unexpected end of JSON input')) {
                logs = [];
            } else {
                throw error;
            }
        }

        logs.push(logEntry);
        await fs.writeFile(logFile, JSON.stringify(logs, null, 2));
    } catch (error) {
        console.error('Erro ao escrever log:', error.message);
    }
}

module.exports = {
    initialize,
    readIndex,
    writeIndex,
    deleteFile,
    writeLog,
    REQUISITIONS_DATA_ROOT_DIR,
    MOCKS_FILES_DIR,
    TEMPLATES_FILES_DIR,
    INDEXES_DIR,  
    LOG_ROOT_DIR,  
    REQUISITIONS_LOG_DIR,  
    MOCKS_INDEX_FILE,
    TEMPLATES_INDEX_FILE
};