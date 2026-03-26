"""
Endpoint de pesquisa de preços em supermercados.
Por agora retorna dados fictícios (stub).
A integração real com scraping Playwright vem na Fase 4.
"""
from fastapi import APIRouter, Depends, Query

from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.purchase import PriceResult

router = APIRouter(prefix="/prices", tags=["preços"])

# Catálogo fictício: supermercado → lista de produtos
_STUB: dict[str, list[dict]] = {
    "continente": [
        {"nome": "Arroz agulha (1kg)", "preco": 0.89, "unidade": "kg"},
        {"nome": "Arroz carolino (1kg)", "preco": 1.09, "unidade": "kg"},
        {"nome": "Leite meio-gordo (1L)", "preco": 0.75, "unidade": "L"},
        {"nome": "Leite gordo (1L)", "preco": 0.79, "unidade": "L"},
        {"nome": "Café Delta (250g)", "preco": 3.49, "unidade": "un"},
        {"nome": "Café Buondi (250g)", "preco": 2.99, "unidade": "un"},
        {"nome": "Açúcar branco (1kg)", "preco": 1.19, "unidade": "kg"},
        {"nome": "Azeite Gallo (750ml)", "preco": 5.99, "unidade": "un"},
        {"nome": "Farinha trigo (1kg)", "preco": 0.69, "unidade": "kg"},
        {"nome": "Água Luso (1.5L)", "preco": 0.49, "unidade": "un"},
        {"nome": "Manteiga Mimosa (250g)", "preco": 2.19, "unidade": "un"},
        {"nome": "Ovos (12un)", "preco": 2.49, "unidade": "cx"},
        {"nome": "Detergente Ariel (3kg)", "preco": 12.99, "unidade": "un"},
    ],
    "pingo_doce": [
        {"nome": "Arroz agulha (1kg)", "preco": 0.85, "unidade": "kg"},
        {"nome": "Arroz carolino (1kg)", "preco": 0.99, "unidade": "kg"},
        {"nome": "Leite meio-gordo (1L)", "preco": 0.72, "unidade": "L"},
        {"nome": "Leite gordo (1L)", "preco": 0.77, "unidade": "L"},
        {"nome": "Café Delta (250g)", "preco": 3.39, "unidade": "un"},
        {"nome": "Café Pingo Doce (250g)", "preco": 1.89, "unidade": "un"},
        {"nome": "Açúcar branco (1kg)", "preco": 1.09, "unidade": "kg"},
        {"nome": "Azeite Oliveira da Serra (750ml)", "preco": 5.49, "unidade": "un"},
        {"nome": "Farinha trigo (1kg)", "preco": 0.65, "unidade": "kg"},
        {"nome": "Água Monchique (1.5L)", "preco": 0.55, "unidade": "un"},
        {"nome": "Manteiga Anchor (250g)", "preco": 2.49, "unidade": "un"},
        {"nome": "Ovos (12un)", "preco": 2.29, "unidade": "cx"},
        {"nome": "Detergente Skip (3kg)", "preco": 11.49, "unidade": "un"},
    ],
    "intermarcheé": [
        {"nome": "Arroz agulha (1kg)", "preco": 0.79, "unidade": "kg"},
        {"nome": "Leite meio-gordo (1L)", "preco": 0.69, "unidade": "L"},
        {"nome": "Café Intermarché (250g)", "preco": 1.79, "unidade": "un"},
        {"nome": "Açúcar branco (1kg)", "preco": 0.99, "unidade": "kg"},
        {"nome": "Azeite (750ml)", "preco": 4.99, "unidade": "un"},
        {"nome": "Farinha trigo (1kg)", "preco": 0.59, "unidade": "kg"},
        {"nome": "Água (1.5L)", "preco": 0.39, "unidade": "un"},
        {"nome": "Ovos (12un)", "preco": 2.19, "unidade": "cx"},
    ],
    "lidl": [
        {"nome": "Arroz Combino (1kg)", "preco": 0.69, "unidade": "kg"},
        {"nome": "Leite Pilos (1L)", "preco": 0.65, "unidade": "L"},
        {"nome": "Café Bellarom (250g)", "preco": 1.49, "unidade": "un"},
        {"nome": "Açúcar branco (1kg)", "preco": 0.89, "unidade": "kg"},
        {"nome": "Azeite Primadonna (750ml)", "preco": 4.29, "unidade": "un"},
        {"nome": "Farinha trigo (1kg)", "preco": 0.49, "unidade": "kg"},
        {"nome": "Água (1.5L)", "preco": 0.33, "unidade": "un"},
        {"nome": "Manteiga (250g)", "preco": 1.79, "unidade": "un"},
        {"nome": "Ovos (12un)", "preco": 1.99, "unidade": "cx"},
    ],
    "auchan": [
        {"nome": "Arroz agulha (1kg)", "preco": 0.87, "unidade": "kg"},
        {"nome": "Leite meio-gordo (1L)", "preco": 0.73, "unidade": "L"},
        {"nome": "Café (250g)", "preco": 2.89, "unidade": "un"},
        {"nome": "Açúcar branco (1kg)", "preco": 1.05, "unidade": "kg"},
        {"nome": "Azeite (750ml)", "preco": 5.29, "unidade": "un"},
        {"nome": "Farinha trigo (1kg)", "preco": 0.63, "unidade": "kg"},
        {"nome": "Água (1.5L)", "preco": 0.45, "unidade": "un"},
        {"nome": "Ovos (12un)", "preco": 2.39, "unidade": "cx"},
        {"nome": "Detergente (3kg)", "preco": 10.99, "unidade": "un"},
    ],
}

_DATA_ATUALIZACAO = "2026-03-26"


@router.get("/search", response_model=list[PriceResult])
def search_prices(
    supermercado: str = Query(..., description="continente | pingo_doce | intermarche | lidl | auchan"),
    q: str = Query(default="", description="Nome do produto a pesquisar (vazio = todos)"),
    _: User = Depends(get_current_user),
):
    key = supermercado.lower().replace(" ", "_").replace("é", "e").replace("ê", "e")
    catalogo = _STUB.get(key, [])
    q_lower = q.strip().lower()
    resultados = [
        PriceResult(
            supermercado=supermercado,
            nome=item["nome"],
            preco=item["preco"],
            unidade=item["unidade"],
            atualizado_em=_DATA_ATUALIZACAO,
        )
        for item in catalogo
        if not q_lower or q_lower in item["nome"].lower()
    ]
    return resultados
