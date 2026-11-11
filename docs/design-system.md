# Design system "Matchday"

O visual do FC Clubs Stats é o de uma transmissão esportiva na tela escura: grafite quase
preto, verde de gramado, números grandes em letra condensada e itálica, e selos cortados em
paralelogramo como os letreiros da TV. Os tokens ficam em `src/app/globals.css`; os
componentes base são shadcn/ui (estilo base-nova, Base UI) em `src/components/ui`.

## Voz e conteúdo

- Português do Brasil, informal e direto, como a galera fala no grupo: "Mandar no grupo",
  "Resumo da noite", "Bagre do mês", "Pé calibrado", "Rei do x1".
- Fale de "vocês" e "a galera"; o site não fala de si mesmo.
- Resultados são V, E e D, nunca W/D/L.
- Números no padrão brasileiro: nota "7,3", "76%", datas "04/10", horas "20:47".
- Títulos, rótulos e botões ficam em caixa alta pelo CSS; no texto-fonte, escreva normal.
- Seja honesto com os dados: quando a EA não informa algo, diga em uma frase ("A EA não
  informa lance a lance"). Nunca invente um número.
- Sem emoji na interface. Só os textos que vão para o WhatsApp abrem com ⚽ ou 🏆.

## Cores (tokens em `globals.css`)

| Token | Valor | Uso |
| --- | --- | --- |
| `background` | `#0b0c0e` | fundo da página |
| `card` | `#15171b` | cards, tabelas, painéis (borda 1px `border`) |
| `surface` / `muted` | `#1e2026` | o que fica dentro de um card: chips, tiles, hover |
| `foreground` | `#f2f4f7` | texto principal |
| `muted-foreground` | `#9ba1ac` | texto secundário e metadados |
| `primary` / `win` | `#22c55e` | marca e vitória; texto sobre ele em `primary-foreground` (`#0b0c0e`) |
| `draw` | `#8e949e` | empate |
| `loss` / `destructive` | `#ff5a4f` | derrota e o pior (bagre, nota mais baixa, queda) |
| `border` / `input` | `#2a2d34` / `#3a3e47` | bordas |
| `chart-1` | `#16a34a` | marcas de gráfico (o verde da marca não passa no contraste de gráfico) |
| `pitch`, `pitch-stripe`, `pitch-line` | `#0f1712`, `#121c16`, `#26352c` | gramado da prancheta |

- Só existe tema escuro (`color-scheme: dark`, `theme-color` `#0b0c0e`).
- Cards de destaque inteiros em `primary` (MVP da noite, Bola de Ouro, O cara decisivo, Rei do
  x1): título em `figure`, texto em `primary-foreground` e um ícone grande em contorno a 20%
  vazando pelo canto.
- Destaque secundário: card normal com borda `primary` (Decisivo da noite e do mês).
- Notas por faixa (`RatingBadge`): 8,0+ em `primary` com texto `primary-foreground`;
  7,0–7,9 verde-claro `#86efac` sobre `#12321f`; 6,0–6,9 amarelo `#fcd34d` sobre `#3a2f12`;
  abaixo de 6 rosado `#ffb4ad` sobre `#3a1e1c`.
- Cor nunca vem sozinha: resultado tem letra, fase tem seta e rótulo, nota tem o número.

## Tipografia

- Barlow (`font-sans`) para texto e tabelas; Barlow Condensed (`font-display`) para títulos,
  números e rótulos. Carregadas com `next/font/google` em `src/app/layout.tsx`.
- `figure`: Barlow Condensed 800 itálico, entrelinha 0,9 — números e nomes grandes, em caixa
  alta.
- `kicker`: 13px, 600, espaçamento 0,16em, caixa alta — em `primary` quando abre uma seção,
  em `muted-foreground` quando rotula um valor.
- Título de seção (`SectionHeading`): Barlow Condensed bold em caixa alta, precedido da barra
  verde inclinada (5 × 20px, skew −12°).
- `tabular` para dígitos que se alinham em colunas.

## Formas, bordas e sombras

- Paralelogramo da marca: `clip-slant` (corte de 8px) e `clip-slant-sm` (5px) em botões
  principais, selos V/E/D, logo "FC", selo de posição e "VS" do duelo.
- Cantos quase retos (`--radius` 4px). Arredondado total só em chips, círculos de jogador,
  selos C/P/F/E e barras de comparação.
- Separe com borda, não com sombra. Opcionais (ex.: "Mexer na prancheta") usam borda tracejada.

## Layout

- Conteúdo em até 1152px (`Container`, `max-w-6xl`), margem lateral 16px no celular e 24px a
  partir de `sm`.
- Grades preenchem a linha: nada fica sozinho numa linha (2 colunas no celular, 3 ou 4 no
  computador; escolha o número de colunas pela quantidade de itens).
- Visão geral do clube: coluna principal e lateral devem terminar perto da mesma altura.
- No celular, a navegação do clube vira barra fixa no rodapé com ícone e rótulo.
- Tudo funciona em 390px de largura sem rolagem horizontal; tabelas largas rolam dentro do
  próprio card com a primeira coluna fixa.

## Padrões de componente

- **Logo**: "FC" em `figure` sobre bloco `primary` em `clip-slant`, seguido de "CLUBS STATS".
- **Selo de resultado** (`MatchResult`): V/E/D sobre `win`/`draw`/`loss`, texto em
  `background`, `clip-slant`.
- **StatCard**: `kicker` + número em `figure` + posição no elenco ("1º" em verde) + dica.
- **Comparação lado a lado** (`MatchTeamStats`, `DuelCard`): números em `figure` nas pontas,
  rótulo `kicker` no meio, barras `radius-full`; quem leva vantagem fica em `primary`; em
  "passes errados" e "cartões" vence o menor ("menos é melhor").
- **Botão principal**: `primary`, `clip-slant`, texto em caixa alta condensado, ícone à
  esquerda. Secundário: borda `input`, mesmo texto em `foreground`.
- **Prancheta**: gramado 68 × 105 com faixas e linhas; jogadores em círculos de 38px; linhas de
  química em `primary` com espessura pela quantidade de assistências.
- **Cards do WhatsApp** (`opengraph-image.tsx` com `src/components/og/`): mesma paleta e fontes
  (TTF em `assets/fonts`), moldura com escudo e nome do clube.

## Dados e gráficos

- Colunas com topo arredondado de 4px, no máximo 24px de largura, cor `chart-1`; a ativa vira
  `primary`.
- Rótulo só no maior valor e no último ponto; o resto no tooltip.
- Linha de referência (média) em `muted-foreground`, com rótulo à direita. Uma série por
  gráfico, sem eixo duplo.

## Ícones

- lucide-react em contorno, 16–22px, na cor do texto ao lado.
- Barra do celular: LayoutGrid (Geral), Users (Jogadores), CalendarDays (Partidas), Trophy
  (Recordes), ClipboardList (Formações). Destaques: Star (MVP), Trophy (Bola de Ouro), Zap
  (decisivo), Crown (Rei do x1), Swords (duelo).

## Acessibilidade

- Texto com contraste de 4,5:1 nos fundos em que é usado; foco do teclado em `ring`.
- Gráficos e diagramas com `role="img"` e `aria-label`; seletores com `aria-pressed` ou
  `aria-current`.
