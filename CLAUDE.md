# mobalance — CLAUDE.md

## Visão Geral
SaaS para pequenas empresas que substitui planilhas Excel na gestão de compras, vendas e lucro mensal.
Nome: **mobalance** | Idioma: Português (PT) | Deploy alvo: Railway

---

## Stack Técnica
| Camada | Tecnologia |
|---|---|
| Backend | Python 3.11 + FastAPI |
| Base de Dados | PostgreSQL 15 |
| ORM | SQLAlchemy 2.x + Alembic (migrações) |
| Autenticação | JWT (python-jose) + bcrypt |
| Frontend | React 18 + Vite + Tailwind CSS |
| Scraping | Playwright (async) |
| Deploy | Railway (backend + DB) + Vercel (frontend) |
| Containerização local | Docker Compose |

---

## Estrutura de Pastas
```
mobalance/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/          # Routers FastAPI (auth, users, purchases, sales, balance, admin)
│   │   ├── core/            # Config, segurança, dependências
│   │   ├── models/          # Modelos SQLAlchemy
│   │   ├── schemas/         # Schemas Pydantic
│   │   ├── services/        # Lógica de negócio
│   │   └── scrapers/        # Scrapers Playwright por fornecedor
│   ├── migrations/          # Alembic migrations
│   ├── tests/
│   ├── main.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/      # Componentes reutilizáveis
│   │   ├── pages/           # Páginas (Dashboard, Compras, Vendas, Balanço, Admin)
│   │   ├── hooks/           # Custom hooks
│   │   ├── services/        # Chamadas à API
│   │   └── store/           # Estado global (Zustand)
│   ├── public/
│   └── package.json
├── scraper/
│   ├── spiders/             # Um spider por fornecedor/mercado
│   └── data/                # Cache local de preços scrapeados
├── docs/
│   ├── api.md
│   └── deploy.md
├── infra/
│   └── railway.toml
├── docker-compose.yml
└── CLAUDE.md
```

---

## Módulos

### Módulo 1 — Compras
- Utilizador pesquisa produto (ex: "café", "leite")
- Sistema mostra preços atualizados via scraping de fornecedores/mercados da região
- Utilizador seleciona produto + quantidade → sistema calcula total
- Registo guardado com data (tabela `purchases`)

### Módulo 2 — Vendas
- Utilizador regista produtos da sua loja: nome, **preço de venda**, unidade (tabela `store_products`)
- O preço de compra vem do Módulo 1 (tabela `purchases`) — NÃO pertence a `store_products`
- Semanalmente/mensalmente indica unidades vendidas
- Sistema calcula receita automaticamente (tabela `sales`)

### Módulo 3 — Balanço Mensal
- Cruza dados de compras e vendas do mês
- Apresenta: total gasto, total receita, lucro líquido, margem %, produto mais lucrativo
- Linguagem simples, não só números (tabela `monthly_balance`)

### Painel de Admin
- Apenas acessível ao superadmin (eu)
- Ver todos os utilizadores registados
- Ativar/desativar acesso manualmente
- Definir data de expiração da subscrição por utilizador

---

## Schema da Base de Dados

Ver ficheiro: `backend/migrations/schema.sql`

Tabelas principais:
- `users` — utilizadores com controlo de acesso e expiração
- `suppliers` — fornecedores/mercados com website para scraping
- `products` — catálogo de produtos genérico
- `supplier_prices` — preços scrapeados por fornecedor
- `store_products` — produtos da loja do utilizador (nome, preço de venda, unidade — sem preço de compra)
- `purchases` — registos de compras
- `sales` — registos de vendas
- `monthly_balance` — resumo mensal calculado

---

## Estado do Projeto

### ✅ Fase 1 — Estrutura Base (COMPLETA)
- [x] Estrutura de pastas criada
- [x] CLAUDE.md criado
- [x] Schema PostgreSQL definido (`backend/migrations/schema.sql`)
- [x] `docker-compose.yml` para PostgreSQL local
- [x] `requirements.txt` base criado
- [x] Ficheiros de configuração base (`main.py`, `.env.example`)

### ✅ Fase 2 — Autenticação e Painel de Admin (COMPLETA)
- [x] Modelos SQLAlchemy (`app/models/user.py`)
- [x] Endpoints de autenticação: `POST /api/v1/auth/register`, `/login`, `/refresh`, `GET /me`
- [x] Middleware JWT + controlo de acesso (`app/core/security.py`, `deps.py`)
- [x] Painel admin: listar utilizadores, ativar/desativar, definir expiração, eliminar
- [x] Alembic configurado com migração inicial (`migrations/versions/001_initial_schema.py`)
- [x] Frontend: página de login/registo, layout base, painel de admin, Zustand auth store

### ✅ Fase 3 — Módulos de Vendas, Gastos e Balanço Mensal (COMPLETA)
- [x] CRUD store_products: nome, preço de venda, unidade, foto (migração 002 + 003)
- [x] Upload de foto por produto (`POST /store-products/{id}/foto`) — servido via `/uploads/`
- [x] Página Produtos: tabela com thumbnail + modal com upload de foto + secção "Registar Vendas da Semana" integrada
- [x] Registo de vendas em lote (`POST /sales/lote`), listagem por mês (`GET /sales`)
- [x] Modelo + endpoints de compras manuais (`GET/POST /purchases`, `DELETE /purchases/{id}`)
- [x] Pesquisa de preços stub (`GET /prices/search?q=`) — carrega todos os produtos no mount, filtra em tempo real no frontend; query vazia retorna tudo
- [x] Botão "Adicionar às compras" pré-preenche o formulário (nome + preço + qtd=1) e faz scroll até ele
- [x] Página Gastos: Parte A (registo manual + lista do mês) + Parte B (lista imediata + filtro live)
- [x] Balanço mensal e semanal: toggle Mensal/Semanal na página; selector de semana com navegação ‹ › e texto "Semana de X a Y de Mês"
- [x] Endpoint `GET /balance?periodo=mensal&mes=3&ano=2026` e `GET /balance?periodo=semanal&semana=13&ano=2026`
- [x] Historico adaptável: `GET /balance/historico?periodo=mensal` → últimos 3 meses; `?periodo=semanal` → últimas 4 semanas
- [x] Schema `PeriodBalance` unificado (mensal + semanal); `MonthBalance` mantido como alias
- [x] Cores dinâmicas no balanço via **inline styles** (evita purge Tailwind em produção):
  positivo → bg #166534 (verde), texto branco, lucro branco, emoji 🟢
  negativo → bg #7f1d1d (vermelho escuro), texto branco, lucro #ef4444 (vermelho vivo), emoji 🔴
  zero → bg #92400e (âmbar escuro), texto branco, emoji ⚠️
- [x] Textos adaptativos por estado do lucro + período (semana/mês)
- [x] Página Produtos — secção "Análise de Vendas": gráfico de barras horizontais (recharts, layout vertical) com quantidade total por produto; barra do mais vendido em verde escuro, restantes em verde claro; cards de destaque "Produto mais vendido" e "Produto menos vendido"
- [x] Backend: `GET /sales/analise` — agrega quantidade e receita por produto (todos os tempos); schema `SaleAnaliseItem`
- [x] Dashboard com dados reais do mês atual + atalhos rápidos
- [x] Navegação: Início | Produtos | Gastos | Balanço | Admin

### ✅ Fase 4 — Preparação para Deploy (COMPLETA)
- [x] `backend/Dockerfile` — Python 3.11-slim, instala deps, copia código, expõe porta 8000
- [x] `backend/start.sh` — `alembic upgrade head` + `uvicorn main:app --host 0.0.0.0`
- [x] `backend/railway.toml` — builder DOCKERFILE, healthcheck `/health`, restart policy
- [x] `frontend/Dockerfile` — build Node 20 → nginx:alpine, serve ficheiros estáticos
- [x] `frontend/nginx.conf` — SPA routing (try_files → index.html), cache headers
- [x] `frontend/railway.toml` — builder DOCKERFILE, healthcheck `/`
- [x] `frontend/src/services/api.ts` — suporta `VITE_API_URL` (Vercel build env var)
- [x] `backend/app/core/config.py` — `ALLOWED_ORIGINS` configurável via env var
- [x] `backend/main.py` — CORS usa `ALLOWED_ORIGINS` do settings
- [x] `README.md` — instruções passo a passo: local dev + Railway + Vercel

### ⏳ Fase 5 — Scraping Real de Preços
- [ ] Spider Playwright por mercado/fornecedor (substituir stub em `/prices/search`)
- [ ] Job agendado de atualização de preços

---

## Como Continuar (Prompt para Próximas Sessões)

```
Lê o CLAUDE.md e continua com a Fase 2 — autenticação e painel de admin.
Lê o CLAUDE.md e continua com a Fase 3 — módulo de vendas e balanço mensal.
Lê o CLAUDE.md e continua com a Fase 4 — scraping do [nome do mercado].
```

---

## Variáveis de Ambiente Necessárias
```env
DATABASE_URL=postgresql://mobalance:mobalance@localhost:5432/mobalance
SECRET_KEY=<chave-secreta-jwt>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
ADMIN_EMAIL=<o-teu-email>
```
