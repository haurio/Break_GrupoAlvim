-- -----------------------------------------------------------
-- DATABASE: break
-- SYSTEM: Gestão Break (Grupo Alvim)
-- DIALECT: PostgreSQL
-- -----------------------------------------------------------

-- 1. Lojas / Unidades (Unificado)
CREATE TABLE IF NOT EXISTS lojas (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Categorias de Produtos
CREATE TABLE IF NOT EXISTS categorias (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Produtos
CREATE TABLE IF NOT EXISTS produtos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    categoria_id INT NOT NULL REFERENCES categorias(id) ON DELETE CASCADE,
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Colaboradores
CREATE TABLE IF NOT EXISTS colaboradores (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    loja_id INT NOT NULL REFERENCES lojas(id) ON DELETE RESTRICT,
    cargo VARCHAR(100), -- Ex: Gerente, Operador, etc.
    turno VARCHAR(20) DEFAULT 'manha', -- Manhã, Tarde, Noite
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Usuários do Dashboard
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    utilizador VARCHAR(50) NOT NULL UNIQUE,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    loja_id INT REFERENCES lojas(id) ON DELETE SET NULL, -- Vinculado a uma unidade/loja
    cargo_funcao VARCHAR(100), -- Ex: Administrador, Gerente, etc.
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Registro de Consumos
CREATE TABLE IF NOT EXISTS consumos (
    id SERIAL PRIMARY KEY,
    colaborador_id INT NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
    usuario_id INT NOT NULL REFERENCES usuarios(id), -- Quem registrou
    data_consumo TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    turno VARCHAR(20) NOT NULL, -- Manhã, Tarde, Noite
    observacao TEXT,
    data_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Itens do Consumo (Produtos específicos)
CREATE TABLE IF NOT EXISTS itens_consumo (
    id SERIAL PRIMARY KEY,
    consumo_id INT NOT NULL REFERENCES consumos(id) ON DELETE CASCADE,
    produto_id INT NOT NULL REFERENCES produtos(id),
    quantidade INT NOT NULL DEFAULT 1,
    observacao TEXT
);
