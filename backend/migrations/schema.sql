-- mobalance — Schema PostgreSQL
-- Fase 1: Definição de tabelas

-- Extensão para UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- UTILIZADORES
-- ============================================================
CREATE TABLE users (
    id          SERIAL PRIMARY KEY,
    email       VARCHAR(255) NOT NULL UNIQUE,
    nome        VARCHAR(255) NOT NULL,
    password_hash TEXT NOT NULL,
    ativo       BOOLEAN NOT NULL DEFAULT FALSE,   -- admin ativa manualmente
    is_admin    BOOLEAN NOT NULL DEFAULT FALSE,   -- superadmin flag
    data_expiracao DATE,                          -- NULL = sem expiração definida
    criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- FORNECEDORES / MERCADOS
-- ============================================================
CREATE TABLE suppliers (
    id          SERIAL PRIMARY KEY,
    nome        VARCHAR(255) NOT NULL,
    website     VARCHAR(500),
    regiao      VARCHAR(255),                     -- ex: "Lisboa", "Porto", "Nacional"
    ativo       BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CATÁLOGO DE PRODUTOS (genérico, partilhado)
-- ============================================================
CREATE TABLE products (
    id          SERIAL PRIMARY KEY,
    nome        VARCHAR(255) NOT NULL,
    categoria   VARCHAR(100),                     -- ex: "Mercearia", "Laticínios"
    unidade     VARCHAR(50) NOT NULL DEFAULT 'un',-- ex: "kg", "L", "un", "cx"
    criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PREÇOS DE FORNECEDORES (scraping)
-- ============================================================
CREATE TABLE supplier_prices (
    id          SERIAL PRIMARY KEY,
    supplier_id INTEGER NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    product_id  INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    preco       NUMERIC(10, 2) NOT NULL,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(supplier_id, product_id)               -- um preço por produto/fornecedor
);

-- ============================================================
-- PRODUTOS DA LOJA DO UTILIZADOR
-- ============================================================
CREATE TABLE store_products (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nome            VARCHAR(255) NOT NULL,
    preco_compra    NUMERIC(10, 2) NOT NULL,      -- custo de compra (raramente muda)
    preco_venda     NUMERIC(10, 2) NOT NULL,      -- preço de venda ao cliente
    unidade         VARCHAR(50) NOT NULL DEFAULT 'un',
    ativo           BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, nome)
);

-- ============================================================
-- COMPRAS (módulo 1)
-- ============================================================
CREATE TABLE purchases (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id      INTEGER REFERENCES products(id) ON DELETE SET NULL,   -- produto do catálogo
    supplier_id     INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,  -- fornecedor
    nome_produto    VARCHAR(255),                 -- cópia do nome (caso produto seja removido)
    quantidade      NUMERIC(10, 3) NOT NULL,
    preco_unitario  NUMERIC(10, 2) NOT NULL,
    total           NUMERIC(12, 2) GENERATED ALWAYS AS (quantidade * preco_unitario) STORED,
    data            DATE NOT NULL DEFAULT CURRENT_DATE,
    criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- VENDAS (módulo 2)
-- ============================================================
CREATE TABLE sales (
    id                  SERIAL PRIMARY KEY,
    user_id             INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    store_product_id    INTEGER REFERENCES store_products(id) ON DELETE SET NULL,
    nome_produto        VARCHAR(255),             -- cópia do nome
    quantidade          NUMERIC(10, 3) NOT NULL,
    preco_unitario      NUMERIC(10, 2) NOT NULL,
    total               NUMERIC(12, 2) GENERATED ALWAYS AS (quantidade * preco_unitario) STORED,
    data                DATE NOT NULL DEFAULT CURRENT_DATE,
    periodo             VARCHAR(7),               -- ex: "2025-03" (ano-mês)
    criado_em           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- BALANÇO MENSAL (módulo 3)
-- ============================================================
CREATE TABLE monthly_balance (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mes             SMALLINT NOT NULL CHECK (mes BETWEEN 1 AND 12),
    ano             SMALLINT NOT NULL,
    total_compras   NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total_vendas    NUMERIC(14, 2) NOT NULL DEFAULT 0,
    lucro           NUMERIC(14, 2) GENERATED ALWAYS AS (total_vendas - total_compras) STORED,
    margem          NUMERIC(6, 2) GENERATED ALWAYS AS (
        CASE WHEN total_vendas > 0
             THEN ROUND(((total_vendas - total_compras) / total_vendas) * 100, 2)
             ELSE 0
        END
    ) STORED,
    produto_mais_lucrativo VARCHAR(255),          -- nome do produto
    calculado_em    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, mes, ano)
);

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX idx_purchases_user_data    ON purchases(user_id, data);
CREATE INDEX idx_sales_user_data        ON sales(user_id, data);
CREATE INDEX idx_sales_periodo          ON sales(user_id, periodo);
CREATE INDEX idx_monthly_balance_user   ON monthly_balance(user_id, ano, mes);
CREATE INDEX idx_supplier_prices_prod   ON supplier_prices(product_id);
CREATE INDEX idx_store_products_user    ON store_products(user_id);

-- ============================================================
-- DADOS INICIAIS (seed mínimo)
-- ============================================================
-- Admin inicial (password deve ser alterada via app)
INSERT INTO users (email, nome, password_hash, ativo, is_admin)
VALUES ('admin@mobalance.pt', 'Administrador', 'CHANGE_ME_HASH', TRUE, TRUE);

-- Categorias de produtos comuns
INSERT INTO products (nome, categoria, unidade) VALUES
    ('Café (250g)',      'Mercearia',   'un'),
    ('Leite (1L)',       'Laticínios',  'un'),
    ('Açúcar (1kg)',     'Mercearia',   'kg'),
    ('Azeite (750ml)',   'Mercearia',   'un'),
    ('Farinha (1kg)',    'Mercearia',   'kg'),
    ('Arroz (1kg)',      'Mercearia',   'kg'),
    ('Água (1.5L)',      'Bebidas',     'un'),
    ('Detergente',       'Limpeza',     'un');
