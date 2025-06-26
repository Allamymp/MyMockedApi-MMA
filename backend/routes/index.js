// api_mock/routes/index.js

const API_CONTROL_PREFIX = '/__mma_controlEndpoint_45f7e5d2-b124-4c11-a2b3-8feaaaf4e190';

const ENDPOINTS = {
    // Rotas da API de gerenciamento de Mocks
    mocks: {
        base: `${API_CONTROL_PREFIX}/mocks`,
        list: `${API_CONTROL_PREFIX}/mocks`,
        details: `${API_CONTROL_PREFIX}/mocks/details/:mockKey`,
        create: `${API_CONTROL_PREFIX}/mocks`,
        deleteSingle: `${API_CONTROL_PREFIX}/mocks/:path`,
        deleteAll: `${API_CONTROL_PREFIX}/mocks`,
    },
    // Rotas da API de gerenciamento de Templates
    templates: {
        base: `${API_CONTROL_PREFIX}/templates`,
        list: `${API_CONTROL_PREFIX}/templates`,
        details: `${API_CONTROL_PREFIX}/templates/:name`,
        create: `${API_CONTROL_PREFIX}/templates`,
        deleteSingle: `${API_CONTROL_PREFIX}/templates/:name`,
        deleteAll: `${API_CONTROL_PREFIX}/templates`,
    },
    // NOVO: Rotas de gerenciamento de Logs
    logs: {
        base: `${API_CONTROL_PREFIX}/logs`, // Ex: /__mma_controlEndpoint_.../logs
        listDates: `${API_CONTROL_PREFIX}/logs`, // GET para listar datas
        getLogsByDate: `${API_CONTROL_PREFIX}/logs/:date`, // GET para logs de uma data específica
    },
    ping: '/ping', // Rota de teste de conectividade
};

// Lista de paths que são reservados e não podem ser usados como mocks dinâmicos
const BLOCKED_PATHS = [
    ENDPOINTS.ping,
    ENDPOINTS.mocks.base,
    ENDPOINTS.mocks.details.split('/:mockKey')[0],
    ENDPOINTS.templates.base,
    ENDPOINTS.templates.details.split('/:name')[0],
    ENDPOINTS.logs.base, // <<-- NOVO: Bloquear a base de logs
    // Você pode adicionar mais paths aqui se tiver outras rotas internas ou reservadas
];


module.exports = {
    API_CONTROL_PREFIX,
    ENDPOINTS,
    BLOCKED_PATHS,
};