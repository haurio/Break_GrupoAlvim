const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '../logs');

// Garantir que a pasta de logs existe
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

// Formatar data local para o nome do arquivo (DD_MM_YYYY)
const getLogFileName = () => {
    const now = new Date();
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const y = now.getFullYear();
    return path.join(logDir, `${d}_${m}_${y}.log`);
};

// Limpar logs com mais de 15 dias
const clearOldLogs = () => {
    try {
        const files = fs.readdirSync(logDir);
        const now = Date.now();
        const fifteenDaysMs = 15 * 24 * 60 * 60 * 1000;

        files.forEach(file => {
            const filePath = path.join(logDir, file);
            const stats = fs.statSync(filePath);
            if (now - stats.mtimeMs > fifteenDaysMs) {
                fs.unlinkSync(filePath);
                console.log(`[CLEANUP] Log removido por antiguidade: ${file}`);
            }
        });
    } catch (err) {
        console.error('[ERROR] Falha na limpeza de logs:', err);
    }
};

// Limpar ao iniciar
clearOldLogs();

const writeLog = (msg) => {
    try {
        fs.appendFileSync(getLogFileName(), msg);
    } catch (err) {
        console.error('[ERROR] Falha ao escrever log no arquivo:', err);
    }
};

const logger = {
    info: (message) => {
        const log = `[${new Date().toISOString()}] INFO: ${message}\n`;
        console.log(`\x1b[32m${log}\x1b[0m`); // Green
        writeLog(log);
    },
    warn: (message) => {
        const log = `[${new Date().toISOString()}] WARN: ${message}\n`;
        console.warn(`\x1b[33m${log}\x1b[0m`); // Yellow
        writeLog(log);
    },
    error: (error, context = '') => {
        const msg = error instanceof Error ? error.stack : error;
        const log = `[${new Date().toISOString()}] ERROR: ${context ? context + ' - ' : ''}${msg}\n`;
        console.error(`\x1b[31m${log}\x1b[0m`); // Red
        writeLog(log);
    },
    step: (stepName, status = 'START') => {
        const log = `[${new Date().toISOString()}] STEP: [${stepName}] - ${status}\n`;
        console.log(`\x1b[36m${log}\x1b[0m`); // Cyan
        writeLog(log);
    }
};

module.exports = logger;
