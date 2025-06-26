// api_mock/routes/log.js
const express = require('express');
const { readIndex, writeLog, REQUISITIONS_LOG_DIR } = require('../utils/fileUtils');  
const fs = require('fs').promises;  
const path = require('path'); 

const router = express.Router();

// Endpoint para listar as datas de logs disponíveis
router.get('/', async (req, res) => {
    try {
        const files = await fs.readdir(REQUISITIONS_LOG_DIR);
        const logDates = files
            .filter(file => file.startsWith('log_') && file.endsWith('.json'))
            .map(file => file.replace('log_', '').replace('.json', ''))
            .sort((a, b) => b.localeCompare(a));  

        res.status(200).json(logDates);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return res.status(200).json([]);  
        }
        console.error('Erro ao listar datas de logs:', error.message);
        res.status(500).json({ error: 'Erro ao listar datas de logs: ' + error.message });
    }
});

// Endpoint para recuperar o conteúdo de um log de um dia específico
router.get('/:date', async (req, res) => {
    const logDate = req.params.date;  
    const logFile = path.join(REQUISITIONS_LOG_DIR, `log_${logDate}.json`);

    try {
        const data = await fs.readFile(logFile, 'utf8');
        const logs = JSON.parse(data);

        res.status(200).json(logs);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return res.status(404).json({ error: `Log para a data ${logDate} não encontrado.` });
        }
        console.error(`Erro ao recuperar log para data ${logDate}:`, error.message);
        res.status(500).json({ error: 'Erro ao recuperar log: ' + error.message });
    }
});

module.exports = router;