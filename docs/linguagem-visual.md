# Linguagem visual

- Unidade de detalhe e contorno de interface: 2 px (`--pixel`); personagens mantêm contornos de 3 px para leitura no tabuleiro.
- Moldura de painel: 4 px (`--pixel-frame`).
- Profundidade de relevo: 4 px (`--pixel-depth`), sombra sem desfoque para baixo e à direita.
- Luz principal: canto superior esquerdo; relevo claro em cima/esquerda, escuro em baixo/direita.
- Painéis: cantos retos; controles com raio discreto de 2 px; preservar formas curvas que identificam personagens.
- Logo: placa com NO TRASH / PARK em letras de grade 5x7, SVG sem fonte externa, alinhado sem rotação.
- Tipografia: monoespaçada nos títulos/controles; textos auxiliares mantêm fonte legível.
- Loja: superfícies discretas, sem relevo forte; amarelo na seleção.
- Estados de foco e seleção permanecem distintos de sombras decorativas.
- O terreno e suas cores permanecem inalterados nesta etapa.

As unidades são pixels CSS, sem filtros sobre a tela inteira. O SVG usa
`crispEdges` para as letras; a geometria pode ser escalada de forma responsiva.
