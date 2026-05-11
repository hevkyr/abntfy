# Conformidade ABNT — mapeamento normas ↔ código

Este documento descreve, item por item, qual norma é aplicada por cada
parte do gerador. Sempre que uma regra mudar (ou for refinada por uma
errata da ABNT), atualize esta tabela.

## NBR 14724:2011 — Trabalhos acadêmicos: apresentação

| Item                       | Regra                                              | Onde está                 |
|----------------------------|----------------------------------------------------|---------------------------|
| Fonte                      | Times New Roman, 12pt no corpo                     | `abnt.ts → SIZE_BODY`     |
| Citação longa / nota / leg | Fonte 10pt                                         | `abnt.ts → SIZE_SMALL`    |
| Espaçamento de linhas      | 1,5 (corpo); simples (citações longas, refs, leg.) | `LINE_15` / `LINE_1`      |
| Margens                    | 3 cm (sup./esq.) · 2 cm (inf./dir.)                | `generateDocx → page.margin` |
| Recuo de parágrafo         | 1,25 cm                                            | `INDENT_FIRST`            |
| Parágrafo justificado      | Sim                                                | `buildBody`               |
| Capa                       | Instituição, autor, título, cidade, ano            | `buildCover`              |
| Folha de rosto             | Capa + nota de natureza + orientador               | `buildTitlePage`          |
| Paginação                  | Cabeçalho com nº a partir das textuais             | `Header` da segunda seção |

## NBR 6023:2025 — Referências (3ª ed., maio/2025)

| Item                       | Regra                                              | Onde está                 |
|----------------------------|----------------------------------------------------|---------------------------|
| Ordem das entradas         | Alfabética por sobrenome do autor                  | `sortReferences`          |
| Destaque do título         | **Negrito** (recomendado pela 3ª ed.)              | `parseReference`          |
| Espaçamento intra-ref.     | Simples                                            | `LINE_1` em `buildReferences` |
| Espaçamento entre refs.    | Linha em branco (`after: 240`)                     | `buildReferences`         |
| Alinhamento                | Esquerda                                           | `AlignmentType.LEFT`      |
| Disponível em / Acesso em  | Preservados na string original                     | `parseReference`          |

## NBR 6024 — Numeração progressiva

| Item                       | Regra                                              | Onde está                 |
|----------------------------|----------------------------------------------------|---------------------------|
| Níveis 1–4                 | `1`, `1.1`, `1.1.1`, `1.1.1.1`                     | `buildBody → counters`    |
| Caixa alta + negrito       | Aplicado em todos os níveis de seção               | `buildBody → heading`     |
| Espaço antes do título     | 480 twips (~24pt)                                  | `heading.spacing.before`  |
| Espaço depois              | 240 twips (~12pt)                                  | `heading.spacing.after`   |

## NBR 6027 — Sumário

| Item                       | Regra                                              | Onde está                 |
|----------------------------|----------------------------------------------------|---------------------------|
| Título "SUMÁRIO" centralizado | Em caixa alta, negrito                          | `buildToc`                |
| Indicativo numérico        | Reflete a numeração progressiva                    | `buildToc → counters`     |
| Linhas pontilhadas         | Tab stop direito com leader `dot`                  | `buildToc → tabStops`     |
| Indentação por nível       | 8 mm por nível                                     | `buildToc → indent.left`  |

## NBR 6028 — Resumo

| Item                       | Regra                                              | Onde está                 |
|----------------------------|----------------------------------------------------|---------------------------|
| Parágrafo único            | Aceito como `<textarea>` único                     | `AbstractForm`            |
| Espaçamento simples        | `LINE_1`                                           | `buildAbstract`           |
| Palavras-chave             | Em linha separada após o resumo, prefixo em negrito | `buildAbstract`          |
| Abstract / Keywords        | Idem, opcional                                     | `buildAbstract`           |

## NBR 10520 — Citações

| Item                       | Regra                                              | Onde está                 |
|----------------------------|----------------------------------------------------|---------------------------|
| Citação longa (>3 linhas)  | Recuo 4 cm, fonte 10pt, espaço simples, sem aspas  | `buildBody → quote`       |
| Citação autor-data         | Formato `(SOBRENOME, ANO)`                         | `renderCitation`          |
| Marcação no fonte          | `[@SOBRENOME, ANO]`                                | `renderInline` regex      |

## Limitações conhecidas

- **Sumário com nº de página:** o gerador não consegue calcular o número
  de página final no momento da escrita do `.docx` sem usar campos do
  Word; usamos tab stop com leader pontilhado e deixamos o número em
  branco para o Word atualizar via `Ctrl+A` → `F9`.
- **Notas de rodapé:** não suportadas no parser atual; planejado para v2.
- **Equações:** apenas legenda; o conteúdo da equação deve ser inserido
  manualmente no .docx ou via plugin.
- **Anexos / apêndices:** trate como seção de nível 1 com título
  apropriado (`# ANEXO A — ...`).
