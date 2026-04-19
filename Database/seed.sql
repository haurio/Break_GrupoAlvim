-- -----------------------------------------------------------
-- SEED DATA: break
-- -----------------------------------------------------------

-- Insert Lojas / Unidades (Unificado)
INSERT INTO lojas (nome) VALUES 
('Grupo Alvim - Escritório'),
('23194 - Burger King Caldas Novas'),
('23240 - Burger King Sudoeste'),
('23531 - Burger King 706/706 Norte'),
('24820 - Burger King Ceilandia'),
('18915 - Burger King 408 Sul'),
('20415 - Burger King Gilberto Salomão'),
('30784 - Burger King Sobradinho'),
('20212 - Burger King Guara'),
('25261 - Burger King Venâncio Shopping'),
('21583 - Burger King Aguas Clara'),
('32338 - Burger King Unaí'),
('19929 - Burger King 201 Norte'),
('27984 - Burger King Planaltina'),
('30769 - Burger King Ponte Alta'),
('30797 - Burger King Terraço Shopping'),
('31608 - Burger King Noroeste'),
('31614 - Burger King Sambaia 201'),
('31782 - Burger King Gama'),
('15022 - Burger King Valparaiso'),
('32555 - Burger King Estrutural'),
('33104 - Burger King São Sebastião')
ON CONFLICT (nome) DO NOTHING;

-- Insert Categorias
INSERT INTO categorias (nome) VALUES 
('Burgers'),
('Acompanhamentos'),
('Bebidas'),
('Sobremesas')
ON CONFLICT (nome) DO NOTHING;

-- Insert Produtos
INSERT INTO produtos (nome, categoria_id) VALUES 
('Whopper', 1),
('Double Whopper', 1),
('Chicken Royale', 1),
('Big King', 1),
('Burger Vegetal', 1),
('Panado Clássico', 1),
('Batatas Fritas (P)', 2),
('Batatas Fritas (M)', 2),
('Batatas Fritas (G)', 2),
('Nuggets (6 unid.)', 2),
('Salada', 2),
('Coca-Cola (M)', 3),
('Água', 3),
('Sumo Natural', 3),
('Sundae', 4),
('Pie de Maçã', 4)
ON CONFLICT DO NOTHING;

-- Insert Initial Users (Passwords: admin / Brazil_2025)
-- Vinculado à primeira loja inserida (Grupo Alvim - Escritório)
INSERT INTO usuarios (utilizador, nome, email, password_hash, loja_id, cargo_funcao) VALUES 
('admin', 'Administrador Global', 'admin@grupoalvim.pt', '$2b$10$1V1a.eNXsK.S379oyt6I0uAbVyjI.12HWUexe7NdEgxt3yPN/Jh96', 
 (SELECT id FROM lojas WHERE nome = 'Grupo Alvim - Escritório'), 'Administrador'),
('hvieira', 'Haurio Vieira', 'hvieira@grupoalvim.pt', '$2b$10$bkml92ctzFat7ekhYtt1wueU8xKLGdz9acxddGfUj7gaz2L5ChFMW', 
 (SELECT id FROM lojas WHERE nome = 'Grupo Alvim - Escritório'), 'Administrador')
ON CONFLICT (utilizador) DO UPDATE SET 
    password_hash = EXCLUDED.password_hash,
    nome = EXCLUDED.nome,
    email = EXCLUDED.email,
    loja_id = EXCLUDED.loja_id;

-- Insert Mock Collaborators
INSERT INTO colaboradores (nome, loja_id, cargo) 
SELECT 'Ana Silva', (SELECT id FROM lojas WHERE nome = '23194 - Burger King Caldas Novas'), 'Gerente'
WHERE NOT EXISTS (SELECT 1 FROM colaboradores WHERE nome = 'Ana Silva');

INSERT INTO colaboradores (nome, loja_id, cargo) 
SELECT 'Bruno Santos', (SELECT id FROM lojas WHERE nome = '23240 - Burger King Sudoeste'), 'Operador'
WHERE NOT EXISTS (SELECT 1 FROM colaboradores WHERE nome = 'Bruno Santos');
