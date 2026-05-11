# ABNTfy

> **O LaTeX da norma brasileira, sem precisar aprender LaTeX.**
>
> Formatador automático de trabalhos acadêmicos em norma ABNT
> (NBR 14724 · 6023:2025 · 6024 · 6027 · 6028 · 10520) — exporta `.docx`
> pronto para entrega, em segundos.

[![Deploy](https://github.com/hevkyr/abntfy/actions/workflows/deploy.yml/badge.svg)](https://github.com/hevkyr/abntfy/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Built with React](https://img.shields.io/badge/react-18-149eca.svg)](https://react.dev)
[![Vite](https://img.shields.io/badge/vite-5-646cff.svg)](https://vitejs.dev)

🌐 **Demo ao vivo:** <https://hevkyr.github.io/abntfy/>

---

## ✨ Recursos

- 📄 **Capa & folha de rosto** geradas automaticamente a partir dos metadados
- 📚 **Sumário automático** (NBR 6027) com numeração progressiva
- 📝 **Resumo + Abstract** (NBR 6028) com palavras-chave
- 🔢 **Numeração de seções** até 4 níveis (NBR 6024) — `1`, `1.1`, `1.1.1`, `1.1.1.1`
- 💬 **Citações longas** com recuo de 4 cm, fonte 10pt e espaçamento simples (NBR 10520)
- 📐 **Citação autor-data** com `[@AUTOR, ANO]` resolvida contra as referências
- 🖼️ **Figuras, tabelas e equações** com legendas e numeração automática
- 📋 **Listas** ordenadas (`1.`) e não-ordenadas (`-`/`*`)
- 📖 **Referências** ordenadas alfabeticamente, título em **negrito** (NBR 6023:2025)
- ✏️ **Marcação inline**: `**negrito**`, `*itálico*`, `_itálico_`
- 🖥️ **Pré-visualização** "papel A4" antes de exportar
- 📊 **Estatísticas em tempo real** — palavras, páginas, seções, citações, referências
- 🌗 **Tema escuro** acadêmico, totalmente responsivo
- 🚀 **Deploy automatizado** no GitHub Pages via GitHub Actions
- ⚡ **100% client-side** — seus dados nunca saem do navegador

## 🎯 Sintaxe rápida

```text
# Título               → seção 1
## Subtítulo           → seção 1.1
### Sub-subtítulo      → seção 1.1.1

> Citação longa...     → recuo 4 cm, fonte 10pt

- item de lista        → bullet
1. item ordenado       → 1., 2., 3....

[fig] legenda          → numerada (Figura 1, 2…)
[tab] legenda          → numerada (Tabela 1, 2…)
[eq]  legenda          → numerada (Equação 1, 2…)

**negrito** *itálico* [@LAKATOS, 2021]
```

## 🚀 Publicar no GitHub Pages

Este repositório já está pré-configurado para `https://hevkyr.github.io/abntfy/`.

1. Crie o repositório `abntfy` na sua conta `hevkyr` (se ainda não existir).
2. Em **Settings → Pages**, defina **Source = GitHub Actions**.
3. Faça o push para `main`:

   ```bash
   git init
   git add .
   git commit -m "feat: initial commit"
   git branch -M main
   git remote add origin https://github.com/hevkyr/abntfy.git
   git push -u origin main
   ```

4. O workflow `.github/workflows/deploy.yml` builda com `npm run build`
   e publica `dist/` no GitHub Pages automaticamente.

### Para outro usuário ou repositório

Edite **um único valor** em `vite.config.ts`:

```ts
base: "/SEU-REPO/",
```

E em `public/404.html`, ajuste `segmentCount = 1` se o repositório
não estiver no formato `usuario.github.io/repo/`.

## 💻 Rodar localmente

```bash
npm install
npm run dev      # http://localhost:8080
npm run build    # gera dist/
npm run preview  # serve dist/ localmente
npm run test     # testes unitários (Vitest)
npm run lint
```

## 🏗️ Stack

| Camada      | Tecnologia                                  |
|-------------|---------------------------------------------|
| Framework   | [React 18](https://react.dev) + [Vite 5](https://vitejs.dev) (SPA) |
| Linguagem   | TypeScript estrito                          |
| UI          | [shadcn/ui](https://ui.shadcn.com) + Tailwind CSS 3 |
| Roteamento  | `react-router-dom` v6 com `basename` automático |
| Geração docx| [`docx`](https://docx.js.org) + `file-saver`|
| Testes      | [Vitest](https://vitest.dev) + Testing Library |
| Hospedagem  | GitHub Pages (Actions)                      |

## 📁 Estrutura

```text
src/
├── components/
│   ├── AbstractForm.tsx     # Resumo + Abstract (NBR 6028)
│   ├── BodyEditor.tsx       # Editor markdown-like
│   ├── CoverForm.tsx        # Folha de rosto
│   ├── LivePreview.tsx      # Pré-visualização "papel A4"
│   ├── ReferencesEditor.tsx # Editor + preview de referências
│   └── ui/                  # Primitivas shadcn/ui
├── data/samples.ts          # Conteúdo de exemplo
├── lib/abnt.ts              # ★ Núcleo de formatação ABNT
├── pages/
│   ├── Index.tsx            # Aplicação principal
│   └── NotFound.tsx
└── test/                    # Testes unitários
docs/
└── ABNT.md                  # Mapeamento detalhado normas → código
```

## 📐 Conformidade

Veja [`docs/ABNT.md`](docs/ABNT.md) para o mapeamento completo entre cada
norma ABNT e a regra aplicada no gerador.

## 🤝 Contribuindo

Veja [`CONTRIBUTING.md`](CONTRIBUTING.md). PRs e issues são muito bem-vindos.

## 📄 Licença

[MIT](LICENSE) © [hevkyr](https://github.com/hevkyr)
