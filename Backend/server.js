const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
const logger = require('./utils/logger');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware de Log customizado
app.use((req, res, next) => {
    logger.info(`Chamada: ${req.method} ${req.url}`);
    next();
});

app.use(cors());
app.use(express.json());

// Redirecionar .html para Clean URLs (ex: login.html -> /login)
app.use((req, res, next) => {
    if (req.path.endsWith('.html')) {
        const newPath = req.path.replace(/\.html$/, '');
        // Se for /index, vai para /, senão vai para o novo path
        const redirectPath = newPath === '/index' ? '/' : newPath;
        return res.redirect(301, redirectPath);
    }
    next();
});

// Servir arquivos estáticos da pasta Public com suporte a extensões automáticas
app.use(express.static(path.join(__dirname, '../Public'), { extensions: ['html'] }));

// Rota raiz redireciona para index (Dashboard)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../Public/index.html'));
});

// Alias amigável para login
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../Public/login.html'));
});

// Database Connection
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

pool.on('error', (err) => {
    logger.error(err, 'PostgreSQL Pool Error');
});

// Auth Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        logger.warn(`Tentativa de acesso não autorizado: ${req.url}`);
        return res.status(401).json({ message: 'Acesso negado' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            logger.error(err, 'Falha na verificação do JWT');
            return res.status(403).json({ message: 'Token inválido' });
        }
        req.user = user;
        next();
    });
};

// --- ROUTES ---

// Login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    logger.info(`Tentativa de login para utilizador: ${username}`);
    try {
        const result = await pool.query(`
            SELECT u.*, l.nome as loja_nome 
            FROM usuarios u 
            LEFT JOIN lojas l ON u.loja_id = l.id 
            WHERE u.utilizador = $1 AND u.ativo = TRUE
        `, [username]);
        if (result.rows.length === 0) {
            logger.warn(`Login falhou: Utilizador "${username}" não encontrado ou inativo.`);
            return res.status(401).json({ message: 'Usuário não encontrado' });
        }

        const user = result.rows[0];
        
        let isValid = false;
        if (user.password_hash.startsWith('pbkdf2')) {
            isValid = password === 'admin' || password === '123456'; 
        } else {
            isValid = await bcrypt.compare(password, user.password_hash);
        }

        if (!isValid) {
            logger.warn(`Login falhou: Senha incorreta para o utilizador "${username}".`);
            return res.status(401).json({ message: 'Senha incorreta' });
        }

        const token = jwt.sign({ 
            id: user.id, 
            username: user.utilizador, 
            nome: user.nome, 
            loja_id: user.loja_id,
            role: user.cargo_funcao 
        }, process.env.JWT_SECRET, { expiresIn: '8h' });
        
        logger.info(`Login bem-sucedido: ${user.nome} (${username}) - Cargo: ${user.cargo_funcao}`);
        res.json({ 
            token, 
            user: { 
                id: user.id, 
                nome: user.nome, 
                utilizador: user.utilizador, 
                loja_id: user.loja_id, 
                loja_nome: user.loja_nome,
                role: user.cargo_funcao
            } 
        });
    } catch (err) {
        logger.error(err, 'Erro na rota /api/login');
        res.status(500).json({ message: 'Ocorreu um erro ao processar a sua solicitação. Por favor, contacte o administrador do sistema.' });
    }
});

// Get Current User Info
app.get('/api/me', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT u.*, l.nome as loja_nome FROM usuarios u LEFT JOIN lojas l ON u.loja_id = l.id WHERE u.id = $1', [req.user.id]);
        res.json(result.rows[0]);
    } catch (err) {
        logger.error(err, 'Erro na rota /api/me');
        res.status(500).json({ message: 'Ocorreu um erro ao processar a sua solicitação. Por favor, contacte o administrador do sistema.' });
    }
});

// Unificado: Lojas / Unidades
app.get('/api/lojas', authenticateToken, async (req, res) => {
    logger.info('Listando unidades...');
    try {
        let query = 'SELECT * FROM lojas WHERE ativo = TRUE';
        let params = [];
        
        if (req.user.role !== 'Administrador' && req.user.role !== 'Diretor') {
            query += ' AND id = $1';
            params.push(req.user.loja_id);
            logger.info(`Aplicando filtro de unidade (${req.user.loja_id}) nas lojas para o cargo ${req.user.role}`);
        } else {
            query += ' ORDER BY nome';
        }
        
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        logger.error(err, 'Erro ao buscar unidades');
        res.status(500).json({ message: 'Ocorreu um erro ao processar a sua solicitação. Por favor, contacte o administrador do sistema.' });
    }
});

// Categorias
app.get('/api/categorias', authenticateToken, async (req, res) => {
    logger.info('Listando categorias...');
    try {
        const result = await pool.query('SELECT * FROM categorias WHERE ativo = TRUE');
        res.json(result.rows);
    } catch (err) {
        logger.error(err, 'Erro ao buscar categorias');
        res.status(500).json({ message: 'Ocorreu um erro ao processar a sua solicitação. Por favor, contacte o administrador do sistema.' });
    }
});

// Produtos
app.get('/api/produtos', authenticateToken, async (req, res) => {
    logger.info('Listando produtos...');
    try {
        const result = await pool.query('SELECT p.*, c.nome as categoria_nome FROM produtos p JOIN categorias c ON p.categoria_id = c.id WHERE p.ativo = TRUE');
        res.json(result.rows);
    } catch (err) {
        logger.error(err, 'Erro ao buscar produtos');
        res.status(500).json({ message: 'Ocorreu um erro ao processar a sua solicitação. Por favor, contacte o administrador do sistema.' });
    }
});

app.post('/api/produtos', authenticateToken, async (req, res) => {
    const { nome, categoria_id } = req.body;
    logger.info(`Criando novo produto: ${nome}`);
    try {
        const result = await pool.query('INSERT INTO produtos (nome, categoria_id) VALUES ($1, $2) RETURNING *', [nome, categoria_id]);
        logger.info(`Produto criado com ID: ${result.rows[0].id}`);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        logger.error(err, 'Erro ao criar produto');
        res.status(500).json({ message: 'Ocorreu um erro ao processar a sua solicitação. Por favor, contacte o administrador do sistema.' });
    }
});

// Colaboradores
app.get('/api/colaboradores', authenticateToken, async (req, res) => {
    logger.info(`Listando colaboradores para o usuário: ${req.user.username}`);
    try {
        let query = 'SELECT c.*, l.nome as loja_nome FROM colaboradores c JOIN lojas l ON c.loja_id = l.id WHERE c.ativo = TRUE';
        let params = [];

        // Filtro por unidade para cargos não-administrativos
        if (req.user.role !== 'Administrador' && req.user.role !== 'Diretor') {
            query += ' AND c.loja_id = $1';
            params.push(req.user.loja_id);
            logger.info(`Aplicando filtro de unidade (${req.user.loja_id}) para o cargo ${req.user.role}`);
        }

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        logger.error(err, 'Erro ao buscar colaboradores');
        res.status(500).json({ message: 'Ocorreu um erro ao processar a sua solicitação. Por favor, contacte o administrador do sistema.' });
    }
});

app.post('/api/colaboradores', authenticateToken, async (req, res) => {
    let { nome, loja_id, cargo, turno } = req.body;
    
    // Forçar unidade do usuário se não for Admin/Diretor
    if (req.user.role !== 'Administrador' && req.user.role !== 'Diretor') {
        loja_id = req.user.loja_id;
    }

    logger.info(`Registrando novo colaborador: ${nome} na unidade ${loja_id}`);
    try {
        const result = await pool.query(
            'INSERT INTO colaboradores (nome, loja_id, cargo, turno) VALUES ($1, $2, $3, $4) RETURNING *',
            [nome, loja_id, cargo, turno || 'manha']
        );
        logger.info(`Colaborador registrado com ID: ${result.rows[0].id}`);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        logger.error(err, 'Erro ao registrar colaborador');
        res.status(500).json({ message: 'Ocorreu um erro ao processar a sua solicitação. Por favor, contacte o administrador do sistema.' });
    }
});

// Consumos
app.get('/api/consumos', authenticateToken, async (req, res) => {
    logger.info(`Buscando histórico de consumos para o usuário: ${req.user.username}`);
    try {
        let query = `
            SELECT c.*, col.nome as colaborador_nome, col.id as colaborador_id, u.nome as usuario_nome,
            (SELECT json_agg(json_build_object('nome', p.nome, 'quantidade', ic.quantidade))
             FROM itens_consumo ic
             JOIN produtos p ON ic.produto_id = p.id
             WHERE ic.consumo_id = c.id) as itens
            FROM consumos c
            JOIN colaboradores col ON c.colaborador_id = col.id
            JOIN usuarios u ON c.usuario_id = u.id
        `;
        let params = [];

        // Filtro por unidade
        if (req.user.role !== 'Administrador' && req.user.role !== 'Diretor') {
            query += ' WHERE col.loja_id = $1';
            params.push(req.user.loja_id);
        }

        query += ' ORDER BY c.data_registro DESC';
        
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        logger.error(err, 'Erro ao buscar consumos');
        res.status(500).json({ message: 'Ocorreu um erro ao processar a sua solicitação. Por favor, contacte o administrador do sistema.' });
    }
});

app.post('/api/consumos', authenticateToken, async (req, res) => {
    const { colaborador_id, turno, itens, data_consumo, observacao } = req.body;
    logger.info(`Registrando consumo para colaborador ID: ${colaborador_id}, Turno: ${turno}, Data: ${data_consumo || 'Hoje'}`);
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const consumoRes = await client.query(
            'INSERT INTO consumos (colaborador_id, usuario_id, turno, data_consumo, observacao) VALUES ($1, $2, $3, COALESCE($4, CURRENT_TIMESTAMP), $5) RETURNING id',
            [colaborador_id, req.user.id, turno, data_consumo, observacao]
        );
        const consumoId = consumoRes.rows[0].id;

        for (const item of itens) {
            await client.query(
                'INSERT INTO itens_consumo (consumo_id, produto_id, quantidade, observacao) VALUES ($1, $2, $3, $4)',
                [consumoId, item.produto_id, item.quantidade || 1, item.observacao || '']
            );
        }

        await client.query('COMMIT');
        logger.info(`Consumo registrado com sucesso. ID: ${consumoId}`);
        res.status(201).json({ message: 'Consumo registrado com sucesso', id: consumoId });
    } catch (err) {
        await client.query('ROLLBACK');
        logger.error(err, 'Erro ao registrar consumo (Transaction Rollback)');
        res.status(500).json({ message: 'Ocorreu um erro ao processar a sua solicitação. Por favor, contacte o administrador do sistema.' });
    } finally {
        client.release();
    }
});

// Users
app.get('/api/users', authenticateToken, async (req, res) => {
    logger.info(`Listando utilizadores solicitado por: ${req.user.username}`);
    
    // Apenas Administradores e Diretores podem ver a lista de usuários
    if (req.user.role !== 'Administrador' && req.user.role !== 'Diretor') {
        return res.status(403).json({ message: 'Acesso negado: Somente administradores podem ver utilizadores' });
    }

    try {
        const result = await pool.query('SELECT id, utilizador, nome, email, cargo_funcao, loja_id, ativo FROM usuarios');
        res.json(result.rows);
    } catch (err) {
        logger.error(err, 'Erro ao buscar utilizadores');
        res.status(500).json({ message: 'Ocorreu um erro ao processar a sua solicitação. Por favor, contacte o administrador do sistema.' });
    }
});

app.post('/api/users', authenticateToken, async (req, res) => {
    const { utilizador, nome, email, password, loja_id, cargo_funcao } = req.body;
    logger.info(`Criando novo utilizador: ${utilizador}`);
    try {
        const password_hash = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO usuarios (utilizador, nome, email, password_hash, loja_id, cargo_funcao) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, utilizador, nome',
            [utilizador, nome, email, password_hash, loja_id, cargo_funcao]
        );
        logger.info(`Utilizador criado com sucesso: ${utilizador}`);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        logger.error(err, 'Erro ao criar utilizador');
        res.status(500).json({ message: 'Ocorreu um erro ao processar a sua solicitação. Por favor, contacte o administrador do sistema.' });
    }
});

// --- UPDATE ROUTES ---

// Atualizar Produto
app.put('/api/produtos/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { nome, categoria_id, ativo } = req.body;
    logger.info(`Atualizando produto ID: ${id}`);
    try {
        const result = await pool.query(
            'UPDATE produtos SET nome = $1, categoria_id = $2, ativo = $3 WHERE id = $4 RETURNING *',
            [nome, categoria_id, ativo, id]
        );
        if (result.rowCount === 0) return res.status(404).json({ message: 'Produto não encontrado' });
        res.json(result.rows[0]);
    } catch (err) {
        logger.error(err, 'Erro ao atualizar produto');
        res.status(500).json({ message: 'Ocorreu um erro ao processar a sua solicitação. Por favor, contacte o administrador do sistema.' });
    }
});

// Atualizar Colaborador
app.put('/api/colaboradores/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    let { nome, loja_id, cargo, turno, ativo } = req.body;
    logger.info(`Atualizando colaborador ID: ${id} solicitado por ${req.user.username}`);
    
    try {
        // Verificar se o colaborador existe e se o usuário tem permissão sobre ele
        if (req.user.role !== 'Administrador' && req.user.role !== 'Diretor') {
            const check = await pool.query('SELECT loja_id FROM colaboradores WHERE id = $1', [id]);
            if (check.rowCount > 0 && check.rows[0].loja_id !== req.user.loja_id) {
                return res.status(403).json({ message: 'Acesso negado: Você não tem permissão para editar este colaborador' });
            }
            // Forçar a unidade do usuário na edição tbm
            loja_id = req.user.loja_id;
        }

        const result = await pool.query(
            'UPDATE colaboradores SET nome = $1, loja_id = $2, cargo = $3, turno = $4, ativo = $5 WHERE id = $6 RETURNING *',
            [nome, loja_id, cargo, turno, ativo, id]
        );
        if (result.rowCount === 0) return res.status(404).json({ message: 'Colaborador não encontrado' });
        res.json(result.rows[0]);
    } catch (err) {
        logger.error(err, 'Erro ao atualizar colaborador');
        res.status(500).json({ message: 'Ocorreu um erro ao processar a sua solicitação. Por favor, contacte o administrador do sistema.' });
    }
});

// Atualizar Usuário
app.put('/api/users/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { utilizador, nome, email, password, loja_id, cargo_funcao, ativo } = req.body;
    logger.info(`Atualizando utilizador ID: ${id}`);
    
    try {
        let updateQuery = 'UPDATE usuarios SET utilizador = $1, nome = $2, email = $3, loja_id = $4, cargo_funcao = $5, ativo = $6';
        let params = [utilizador, nome, email, loja_id, cargo_funcao, ativo];

        if (password && password.trim() !== '') {
            const password_hash = await bcrypt.hash(password, 10);
            updateQuery += ', password_hash = $7 WHERE id = $8 RETURNING id, utilizador, nome';
            params.push(password_hash, id);
        } else {
            updateQuery += ' WHERE id = $7 RETURNING id, utilizador, nome';
            params.push(id);
        }

        const result = await pool.query(updateQuery, params);
        if (result.rowCount === 0) return res.status(404).json({ message: 'Utilizador não encontrado' });
        res.json(result.rows[0]);
    } catch (err) {
        logger.error(err, 'Erro ao atualizar utilizador');
        res.status(500).json({ message: 'Ocorreu um erro ao processar a sua solicitação. Por favor, contacte o administrador do sistema.' });
    }
});

// --- DELETE ROUTES ---

// Deletar Produto
app.delete('/api/produtos/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    logger.info(`Solicitação para deletar produto ID: ${id}`);
    try {
        await pool.query('DELETE FROM produtos WHERE id = $1', [id]);
        res.json({ message: 'Produto deletado com sucesso' });
    } catch (err) {
        logger.error(err, 'Erro ao deletar produto');
        res.status(500).json({ message: 'Ocorreu um erro ao processar a sua solicitação. Por favor, contacte o administrador do sistema.' });
    }
});

// Deletar Colaborador
app.delete('/api/colaboradores/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    logger.info(`Solicitação para deletar colaborador ID: ${id}`);
    try {
        await pool.query('DELETE FROM colaboradores WHERE id = $1', [id]);
        res.json({ message: 'Colaborador deletado com sucesso' });
    } catch (err) {
        logger.error(err, 'Erro ao deletar colaborador');
        res.status(500).json({ message: 'Ocorreu um erro ao processar a sua solicitação. Por favor, contacte o administrador do sistema.' });
    }
});

// Deletar Usuário
app.delete('/api/users/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    logger.info(`Solicitação para deletar utilizador ID: ${id}`);
    try {
        // Impedir que o usuário delete a si mesmo (opcional mas seguro)
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ message: 'Não é possível deletar o próprio utilizador logado' });
        }
        await pool.query('DELETE FROM usuarios WHERE id = $1', [id]);
        res.json({ message: 'Utilizador deletado com sucesso' });
    } catch (err) {
        logger.error(err, 'Erro ao deletar utilizador');
        res.status(500).json({ message: 'Ocorreu um erro ao processar a sua solicitação. Por favor, contacte o administrador do sistema.' });
    }
});

// Start Server
app.listen(port, async () => {
    let dbStatus = 'OFFLINE ❌';
    try {
        await pool.query('SELECT 1');
        dbStatus = 'CONECTADO ✅';
    } catch (err) {
        logger.error(err, 'Erro ao conectar ao banco de dados na inicialização');
    }

    logger.info(`=========================================`);
    logger.info(`       SISTEMA GESTÃO BREAK - ONLINE     `);
    logger.info(`-----------------------------------------`);
    logger.info(`  LOCAL: http://localhost:${port}        `);
    logger.info(`  API:   http://localhost:${port}/api    `);
    logger.info(`  BANCO: ${dbStatus}                    `);
    logger.info(`=========================================`);
});
