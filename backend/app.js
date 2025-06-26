const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const { initialize, writeLog } = require('./utils/fileUtils');
const { getLocalIp } = require('./utils/networkUtils');
const mockRoutes = require('./routes/mocks');
const templateRoutes = require('./routes/templates');
const logRoutes = require('./routes/log'); 
const { formatInTimeZone } = require('date-fns-tz');

// Importar as definições de endpoints centralizadas
const { API_CONTROL_PREFIX, ENDPOINTS, BLOCKED_PATHS } = require('./routes/index');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para parsear JSON e habilitar CORS
app.use(cors());
app.use(bodyParser.json());

// Middleware de logging
app.use(async (req, res, next) => {
    const startTime = process.hrtime.bigint();
    const normalizeIp = (ip) => ip === '::1' ? '127.0.0.1' : ip;
    const requestLog = {
        type: 'request',
        timestamp: formatInTimeZone(new Date(), 'America/Recife', "yyyy-MM-dd'T'HH:mm:ss.SSSXXX"),
        sourceIp: normalizeIp(req.ip) || 'unknown',
        method: req.method,
        path: req.path,
        query: req.query,
        headers: req.headers,
        body: req.body || null
    };
    try {
        await writeLog(requestLog);
    } catch (error) {
        console.error('Erro ao salvar log de requisição:', error.message);
    }
    const originalSend = res.send;
    res.send = async function (body) {
        const endTime = process.hrtime.bigint();
        const durationMs = Number((endTime - startTime) / BigInt(1_000_000));
        let parsedBody = body;
        try {
            if (typeof body === 'string' && body.startsWith('{') && body.endsWith('}')) {
                parsedBody = JSON.parse(body);
            }
        } catch (error) { }
        const responseLog = {
            type: 'response',
            timestamp: formatInTimeZone(new Date(), 'America/Recife', "yyyy-MM-dd'T'HH:mm:ss.SSSXXX"),
            destinationIp: normalizeIp(req.ip) || 'unknown',
            status: res.statusCode,
            headers: res.getHeaders(),
            body: parsedBody || null,
            durationMs
        };
        try {
            await writeLog(responseLog);
        } catch (error) {
            console.error('Erro ao salvar log de resposta:', error.message);
        }
        return originalSend.call(this, body);
    };
    next();
});


const ANGULAR_DIST_PATH = path.join(__dirname, '..', 'frontend', 'dist', 'frontend', 'browser');

// Serve os arquivos estáticos da pasta de build do Angular PRIMEIRO
app.use(express.static(ANGULAR_DIST_PATH));

app.get('/api/config', (req, res) => {
    res.json({
        API_CONTROL_PREFIX: API_CONTROL_PREFIX,
        ENDPOINTS: ENDPOINTS,
    });
});

// Rotas da API de GERENCIAMENTO
app.use(ENDPOINTS.mocks.base, mockRoutes);
app.use(ENDPOINTS.templates.base, templateRoutes);
app.use(ENDPOINTS.logs.base, logRoutes); 

// Rota básica de teste
app.get(ENDPOINTS.ping, (req, res) => {
    res.status(200).json({ message: 'Hello World' });
});

// Middleware para servir index.html do Angular para rotas não-API
// Esta rota deve vir DEPOIS de todos os endpoints de API para JSON, mas antes dos mocks dinâmicos
app.get('*', (req, res, next) => {
  if (req.path.startsWith(API_CONTROL_PREFIX) || req.path === ENDPOINTS.ping || req.path === '/api/config') {
    return next();
  }
  res.sendFile(path.join(ANGULAR_DIST_PATH, 'index.html'), (err) => {
    if (err) {
      console.error(`Erro ao servir index.html para ${req.originalUrl}: ${err.message}`);
      res.status(500).json({ error: 'Erro ao carregar a aplicação' });
    }
  });
});

// Inicializar diretórios e arquivos de índice
initialize().then(() => {
    console.log('Diretórios e arquivos de índice inicializados');
}).catch((error) => {
    console.error('Erro ao inicializar:', error);
});

// Rota genérica para capturar todas as requisições (mocks dinâmicos)
const { handleGenericRoute } = require('./routes/mocks');
app.use(handleGenericRoute);

// Iniciar o servidor
app.listen(PORT, '0.0.0.0', () => {
    const ip = getLocalIp();
    console.log(`Servidor Node.js (API + Frontend) rodando em http://${ip}:${PORT}`);
    console.log(`Endpoints de gerenciamento da API em http://${ip}:${PORT}${API_CONTROL_PREFIX}`);
    console.log(`Acesse a aplicação em http://${ip}:${PORT}`);
});