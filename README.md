# mobalance

SaaS para pequenas empresas — gestão de compras, vendas e balanço mensal.

**Stack:** FastAPI · PostgreSQL · React 18 · Tailwind CSS · Railway + Vercel

---

## Desenvolvimento local

### Pré-requisitos
- Docker Desktop
- Node.js 20+
- Python 3.11+

### 1. Base de dados (PostgreSQL via Docker)

```bash
docker-compose up -d db
```

A base de dados fica disponível em `localhost:5432`.
PgAdmin (opcional): `http://localhost:5050` — `admin@mobalance.pt` / `mobalance`

### 2. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env            # edita com os teus valores

alembic upgrade head            # aplica as migrações
uvicorn main:app --reload       # http://localhost:8000
```

Documentação da API: `http://localhost:8000/docs`

### 3. Frontend

```bash
cd frontend
npm install
npm run dev                     # http://localhost:5173
```

---

## Deploy — Railway (backend + DB) + Vercel (frontend)

### Pré-requisitos
- Conta Railway: [railway.app](https://railway.app)
- Conta Vercel: [vercel.com](https://vercel.com)
- Railway CLI: `npm install -g @railway/cli` (opcional)

---

### Passo 1 — Criar projeto Railway

1. Acede a [railway.app/new](https://railway.app/new)
2. Escolhe **"Deploy from GitHub repo"** e selecciona este repositório
3. O Railway cria o projecto automaticamente

---

### Passo 2 — Adicionar PostgreSQL

No painel do projecto Railway:
1. Clica **"+ New"** → **"Database"** → **"Add PostgreSQL"**
2. O Railway cria a base de dados e expõe a variável `DATABASE_URL` automaticamente

---

### Passo 3 — Configurar o serviço Backend

1. No painel Railway, clica no serviço do repositório
2. Vai a **"Settings"** → **"Source"** → define **Root Directory** = `backend`
3. O Railway detecta o `railway.toml` e usa o `Dockerfile` automaticamente

**Variáveis de ambiente** (aba "Variables"):

| Variável | Valor |
|---|---|
| `DATABASE_URL` | (gerado automaticamente pelo PostgreSQL add-on) |
| `SECRET_KEY` | gera com `python -c "import secrets; print(secrets.token_hex(32))"` |
| `ALGORITHM` | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `7` |
| `ADMIN_EMAIL` | o teu email de admin |
| `ENVIRONMENT` | `production` |
| `ALLOWED_ORIGINS` | URL do frontend Vercel (passo 5) |

4. Clica **"Deploy"** — o Railway executa `alembic upgrade head` e inicia o servidor

Anota o URL público do backend (ex: `https://mobalance-backend.up.railway.app`).

---

### Passo 4 — Deploy do Frontend no Vercel

1. Acede a [vercel.com/new](https://vercel.com/new) e importa o repositório
2. Em **"Configure Project"**:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Em **"Environment Variables"** adiciona:

| Variável | Valor |
|---|---|
| `VITE_API_URL` | URL do backend Railway (ex: `https://mobalance-backend.up.railway.app`) |

4. Clica **"Deploy"**

---

### Passo 5 — Configurar CORS no Railway

Após o deploy do Vercel ter terminado:

1. Volta ao painel Railway → serviço backend → **"Variables"**
2. Define `ALLOWED_ORIGINS` = URL do Vercel (ex: `https://mobalance.vercel.app`)
3. Railway faz redeploy automático

---

### Passo 6 — Verificar

```bash
# Health check do backend
curl https://mobalance-backend.up.railway.app/health
# → {"status":"ok"}

# Abrir o frontend
open https://mobalance.vercel.app
```

---

## Variáveis de ambiente — resumo

### Backend (`.env` local / Railway Variables)

```env
DATABASE_URL=postgresql://mobalance:mobalance@localhost:5432/mobalance
SECRET_KEY=<gera com secrets.token_hex(32)>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
ADMIN_EMAIL=admin@mobalance.pt
ENVIRONMENT=development
ALLOWED_ORIGINS=https://mobalance.vercel.app
```

### Frontend (`.env.local` / Vercel Environment Variables)

```env
VITE_API_URL=https://mobalance-backend.up.railway.app
```

Em desenvolvimento esta variável não é necessária — o proxy do Vite trata disso.

---

## Estrutura do projecto

```
mobalance/
├── backend/          # FastAPI · Python 3.11
│   ├── Dockerfile
│   ├── railway.toml
│   └── start.sh      # alembic upgrade head + uvicorn
├── frontend/         # React 18 · Vite · Tailwind
│   ├── Dockerfile
│   ├── nginx.conf
│   └── railway.toml
├── docker-compose.yml  # PostgreSQL local
└── README.md
```
