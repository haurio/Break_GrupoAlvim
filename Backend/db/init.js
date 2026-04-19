const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

const initializeDatabase = async () => {
    logger.step('DATABASE_INIT', 'START');
    try {
        logger.info(`Conectando ao PostgreSQL em ${process.env.DB_HOST}:${process.env.DB_PORT} com usuário ${process.env.DB_USER}...`);
        
        // 1. Verificar/Criar banco de dados
        const adminPool = new Pool({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: 'postgres',
        });

        logger.info('Verificando se o banco de dados "break" existe...');
        const res = await adminPool.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [process.env.DB_NAME]);
        
        if (res.rowCount === 0) {
            logger.warn(`Banco de dados "${process.env.DB_NAME}" não encontrado. Criando agora...`);
            await adminPool.query(`CREATE DATABASE ${process.env.DB_NAME}`);
            logger.info(`Banco de dados "${process.env.DB_NAME}" criado com sucesso.`);
        } else {
            logger.info(`Banco de dados "${process.env.DB_NAME}" já existe.`);
        }
        await adminPool.end();

        // 2. Executar Schema
        logger.step('EXECUTE_SCHEMA', 'START');
        const schemaPath = path.join(__dirname, '../../Database/schema.sql');
        logger.info(`Lendo arquivo de schema: ${schemaPath}`);
        
        if (!fs.existsSync(schemaPath)) {
            throw new Error(`Arquivo de schema não encontrado em: ${schemaPath}`);
        }
        
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        logger.info('Executando comandos SQL do schema...');
        await pool.query(schemaSql);

        // Migrações Críticas: Unificação de Empresas e Lojas
        logger.info('Verificando migrações críticas (Unificação)...');
        await pool.query(`
            DO $$ 
            BEGIN 
                -- 1. Unificar Lojas: Adicionar UNIQUE no nome se não existir
                IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lojas_nome_key') THEN
                    ALTER TABLE lojas ADD CONSTRAINT lojas_nome_key UNIQUE (nome);
                END IF;

                -- 2. Migrar Usuários: Renomear empresa_id para loja_id
                IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='usuarios' AND column_name='empresa_id') THEN
                    ALTER TABLE usuarios RENAME COLUMN empresa_id TO loja_id;
                END IF;

                -- 3. Limpar Lojas: Remover empresa_id da tabela lojas
                IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lojas' AND column_name='empresa_id') THEN
                    ALTER TABLE lojas DROP COLUMN empresa_id;
                END IF;

                -- 4. Adicionar observacao se não existir em consumos
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='consumos' AND column_name='observacao') THEN
                    ALTER TABLE consumos ADD COLUMN observacao TEXT;
                END IF;

                -- 5. Alterar data_consumo para TIMESTAMP se for DATE
                IF (SELECT data_type FROM information_schema.columns WHERE table_name='consumos' AND column_name='data_consumo') = 'date' THEN
                    ALTER TABLE consumos ALTER COLUMN data_consumo TYPE TIMESTAMP USING data_consumo::TIMESTAMP;
                END IF;

                -- 6. Adicionar turno em colaboradores se não existir
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='colaboradores' AND column_name='turno') THEN
                    ALTER TABLE colaboradores ADD COLUMN turno VARCHAR(20) DEFAULT 'manha';
                END IF;
            END $$;
        `);

        // Remover tabela empresas se existir após garantir migração de colunas
        await pool.query(`DROP TABLE IF EXISTS empresas CASCADE`);

        logger.step('EXECUTE_SCHEMA', 'SUCCESS');

        // 3. Executar Seed
        logger.step('EXECUTE_SEED', 'START');
        const seedPath = path.join(__dirname, '../../Database/seed.sql');
        logger.info(`Lendo arquivo de seed: ${seedPath}`);
        
        if (!fs.existsSync(seedPath)) {
            logger.warn('Arquivo de seed não encontrado. Pulando etapa de dados iniciais.');
        } else {
            const seedSql = fs.readFileSync(seedPath, 'utf8');
            logger.info('Inserindo dados iniciais (seed)...');
            await pool.query(seedSql);
            logger.step('EXECUTE_SEED', 'SUCCESS');
        }

        logger.info('--- Database Initialization Completed Successfully ---');
        logger.step('DATABASE_INIT', 'COMPLETED');
        process.exit(0);
    } catch (err) {
        logger.error(err, 'DATABASE_INIT_FAILED');
        logger.warn('DICA: Verifique se sua senha no arquivo .env está correta e se o PostgreSQL está rodando.');
        process.exit(1);
    }
};

initializeDatabase();
