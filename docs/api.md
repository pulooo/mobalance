# mobalance — Documentação da API

## Base URL
- Desenvolvimento: `http://localhost:8000`
- Produção: `https://api.mobalance.pt` (Railway)

## Autenticação
JWT Bearer token em todos os endpoints (exceto `/auth/login` e `/auth/register`).

```
Authorization: Bearer <access_token>
```

## Endpoints (planeados)

### Auth
| Método | Rota | Descrição |
|---|---|---|
| POST | `/auth/register` | Registo de utilizador (inativo por default) |
| POST | `/auth/login` | Login, retorna access + refresh token |
| POST | `/auth/refresh` | Renova access token |

### Admin (apenas is_admin=true)
| Método | Rota | Descrição |
|---|---|---|
| GET | `/admin/users` | Lista todos os utilizadores |
| PATCH | `/admin/users/{id}/activate` | Ativa/desativa utilizador |
| PATCH | `/admin/users/{id}/expiration` | Define data de expiração |

### Produtos do Catálogo
| Método | Rota | Descrição |
|---|---|---|
| GET | `/products/search?q=café` | Pesquisa produtos com preços de fornecedores |

### Produtos da Loja (Módulo 2)
| Método | Rota | Descrição |
|---|---|---|
| GET | `/store-products` | Lista produtos da loja do utilizador |
| POST | `/store-products` | Cria produto |
| PATCH | `/store-products/{id}` | Edita produto |
| DELETE | `/store-products/{id}` | Remove produto |

### Compras (Módulo 1)
| Método | Rota | Descrição |
|---|---|---|
| GET | `/purchases` | Lista compras do utilizador |
| POST | `/purchases` | Regista compra |

### Vendas (Módulo 2)
| Método | Rota | Descrição |
|---|---|---|
| GET | `/sales` | Lista vendas |
| POST | `/sales` | Regista venda |

### Balanço (Módulo 3)
| Método | Rota | Descrição |
|---|---|---|
| GET | `/balance/{ano}/{mes}` | Balanço do mês |
| POST | `/balance/{ano}/{mes}/calculate` | Recalcula balanço |
