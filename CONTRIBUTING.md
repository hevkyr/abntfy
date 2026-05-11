# Contribuindo com o ABNTfy

Obrigado pelo interesse! Este guia explica como contribuir com correções,
melhorias de norma e novos recursos.

## Como começar

```bash
git clone https://github.com/hevkyr/abntfy.git
cd abntfy
npm install
npm run dev
```

A aplicação abre em <http://localhost:8080>.

## Estrutura de uma contribuição

1. **Issue primeiro** — abra uma issue descrevendo o bug ou a feature
   antes de gastar tempo num PR grande.
2. **Branch** a partir de `main`: `feat/xyz`, `fix/xyz`, `docs/xyz`.
3. **Commits convencionais**: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`.
4. **Testes**: novos comportamentos do parser ou do gerador devem vir com
   teste em `src/test/`. Rode `npm run test` antes do push.
5. **Lint**: `npm run lint` deve passar limpo.

## Mudanças relacionadas a normas ABNT

Quando alterar regras de formatação:

- Cite a norma e o item específico no commit (ex.: `fix(refs): NBR 6023:2025 §8.1.2 — título em negrito`).
- Atualize [`docs/ABNT.md`](docs/ABNT.md) com a regra aplicada.
- Adicione um teste em `src/test/abnt.test.ts` validando o resultado.

## Onde mexer

| Mudança                                | Arquivo principal              |
|----------------------------------------|--------------------------------|
| Regra de formatação .docx              | `src/lib/abnt.ts`              |
| Sintaxe do parser markdown-like        | `src/lib/abnt.ts` → `parseDocument` |
| Pré-visualização (HTML)                | `src/components/LivePreview.tsx` |
| Formulários (capa, resumo, refs)       | `src/components/*Form.tsx`     |
| Layout / cores / tema                  | `src/index.css`, `tailwind.config.ts` |
| Workflow de deploy                     | `.github/workflows/deploy.yml` |

## Código de conduta

Seja gentil. Críticas técnicas são bem-vindas; ataques pessoais não.
