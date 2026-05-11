/**
 * Conteúdo de exemplo carregado na primeira visita do usuário.
 * Demonstra todas as marcações suportadas pelo parser ABNTfy.
 */

export const SAMPLE_BODY = `# Introdução

Este documento demonstra a formatação automática segundo a ABNT. Basta escrever em texto livre — o **ABNTfy** cuida das margens, fontes, espaçamentos e numeração de seções.

A norma *NBR 14724* estabelece os princípios gerais para apresentação de trabalhos acadêmicos, enquanto a *NBR 6023:2025* trata especificamente da elaboração de referências [@LAKATOS, 2021].

## Contextualização

Os parágrafos são separados por linha em branco e recebem automaticamente recuo de 1,25 cm. Citações curtas seguem no fluxo do texto entre aspas.

> Citações com mais de três linhas devem ter recuo de 4 cm da margem esquerda, fonte menor que a do texto e espaçamento simples, sem aspas. Esta é uma citação direta longa, automaticamente formatada pelo ABNTfy.

## Objetivos

- Demonstrar listas não-ordenadas
- Validar a numeração progressiva de seções
- Exportar um arquivo .docx pronto para entrega

# Desenvolvimento

A pesquisa seguiu três etapas principais:

1. Levantamento bibliográfico
2. Análise comparativa entre normas
3. Validação prática com exportação de documentos

[fig] Esquema do fluxo de formatação automática ABNT.

[tab] Comparativo entre as edições de 2018 e 2025 da NBR 6023.

# Conclusão

Ao exportar, o arquivo .docx será gerado com fonte Times New Roman 12pt, espaçamento 1,5, margens 3-3-2-2 cm, sumário automático e referências em ordem alfabética [@ABNT, 2025].`;

export const SAMPLE_REFS = `ASSOCIAÇÃO BRASILEIRA DE NORMAS TÉCNICAS. NBR 6023: informação e documentação: referências: elaboração. 3. ed. Rio de Janeiro: ABNT, 2025.
ASSOCIAÇÃO BRASILEIRA DE NORMAS TÉCNICAS. NBR 14724: informação e documentação: trabalhos acadêmicos: apresentação. Rio de Janeiro: ABNT, 2011.
LAKATOS, Eva Maria; MARCONI, Marina de Andrade. Fundamentos de metodologia científica. 9. ed. São Paulo: Atlas, 2021. E-book. Disponível em: https://integrada.minhabiblioteca.com.br. Acesso em: 10 maio 2026.
COMITÊ GESTOR DA INTERNET NO BRASIL. TIC Domicílios 2024. São Paulo: CGI.br, 2024. Disponível em: https://cetic.br/pt/pesquisa/domicilios/. Acesso em: 10 maio 2026.`;

export const SAMPLE_RESUMO = `Este trabalho apresenta uma ferramenta web para formatação automática de documentos acadêmicos segundo a norma ABNT. A solução converte texto livre em um arquivo .docx em conformidade com as normas NBR 14724, 6023, 6024, 6027, 6028 e 10520, eliminando o esforço manual de aplicação de margens, fontes, espaçamentos e numeração progressiva de seções. Os resultados demonstram redução significativa do tempo de formatação e aumento da consistência entre versões.`;

export const SAMPLE_ABSTRACT = `This work presents a web-based tool for automatic formatting of academic documents under the Brazilian ABNT standard. It converts free-form text into a .docx file compliant with NBR 14724, 6023, 6024, 6027, 6028 and 10520, removing the manual effort of applying margins, fonts, spacing and progressive section numbering. Results show significant reduction in formatting time and improved consistency across revisions.`;
