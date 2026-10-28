# O preset

[← índice](README.md)

O design system não é um conjunto de decisões espalhadas pelo código. É um preset
do shadcn: um código portátil que empacota style, cores, tipografia, raio e
biblioteca de ícones.

---

## O preset do projeto

```
b1VlIttI
```

`npx shadcn@latest preset decode b1VlIttI`:

```
Preset
  code         b1VlIttI
  version      b
  style        luma
  baseColor    neutral
  theme        neutral
  chartColor   neutral
  iconLibrary  lucide
  font         inter
  fontHeading  inherit
  radius       default
  menuAccent   subtle
  menuColor    default
  url          https://ui.shadcn.com/create?preset=b1VlIttI
```

Como isso se materializa em `components.json`:

```json
{
  "style": "base-luma",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "rtl": false,
  "menuColor": "default",
  "menuAccent": "subtle"
}
```

Para reconferir:

```bash
npx shadcn@latest preset resolve   # lê o preset a partir do projeto
npx shadcn@latest info             # projeto, config e componentes instalados
```

---

## O que cada campo controla

| Campo | Controla | Onde se manifesta |
|---|---|---|
| `style` | Base dos componentes: primitivos, estrutura, classes | `src/components/ui/**` |
| `baseColor` / `theme` | Valores oklch de `--background`, `--primary`, `--muted`… | `globals.css`, blocos `:root` e `.dark` |
| `chartColor` | `--chart-1` a `--chart-5` | `globals.css` |
| `iconLibrary` | Qual pacote de ícones os componentes gerados importam | `src/components/ui/**` e `src/components/icons.ts` |
| `font` | Família de `--font-sans` | `src/app/layout.tsx` (via `next/font`) e `globals.css` |
| `fontHeading` | `--font-heading`; `inherit` significa igual à sans | `globals.css` → utilitário `font-heading` |
| `radius` | `--radius`, de onde deriva toda a escala | `globals.css` |
| `menuColor` / `menuAccent` | Aparência de menus e itens ativos | `dropdown-menu`, `command`, `sidebar` |

`iconLibrary` é o campo de maior risco: ele reescreve os imports **dentro de
`ui/`** e não toca no código de aplicação. É a razão de existir a regra
[R4](03-regras.md#r4--ícones-só-pela-camada-central).

---

## Trocar de preset

```bash
npx shadcn@latest apply <codigo-do-preset>
```

### O que a troca faz

| Alvo | Efeito |
|---|---|
| `src/app/globals.css` | Bloco de tema reescrito. Tokens customizados em `:root`/`.dark` são preservados; tokens do preset podem ser reordenados |
| `src/components/ui/**` | Todos os componentes regenerados, com a nova style e a nova biblioteca de ícones |
| `src/lib/utils.ts` | **Sobrescrito pela versão do registry.** Qualquer função própria neste arquivo é perdida |
| `components.json` | Atualizado com style e iconLibrary novos |
| `package.json` | Dependências do novo style adicionadas |
| `src/app/**`, `src/components/{form,sidebar}/**` | **Não é tocado** |

### Procedimento

`shadcn apply` **não tem `--dry-run`**. Não há pré-visualização.

1. **Commite tudo antes.** É a única rede de proteção — `src/lib/utils.ts` é
   sobrescrito e trabalho não commitado não tem como ser recuperado.
2. `npx shadcn@latest apply <codigo>`
3. `git diff`, lendo arquivo por arquivo.
4. Conferir `src/lib/utils.ts` — funções próprias precisam ser reintroduzidas.
5. Conferir `globals.css` — tokens fora do preset devem continuar presentes.
6. `npx tsc --noEmit && npm run build`
7. Rodar as [verificações](README.md#verificação).
8. Reconferir as variáveis do Figma contra o `globals.css` — ver
   [05-figma.md](05-figma.md#atualização-do-arquivo).

---

## Apply parcial

```bash
npx shadcn@latest apply <codigo> --only theme
npx shadcn@latest apply <codigo> --only font
npx shadcn@latest apply <codigo> --only theme,font
```

`--only` limita a escrita às partes indicadas. **Use sempre que a intenção for só
recolorir ou só trocar a fonte** — evita regenerar 24 componentes e evita o risco
sobre `src/lib/utils.ts`.

| Intenção | Comando |
|---|---|
| Testar outra paleta, preservando componentes | `--only theme` |
| Trocar a família tipográfica | `--only font` |
| Adotar outro style (muda a estrutura dos componentes) | apply completo |
| Trocar a biblioteca de ícones | apply completo + editar `src/components/icons.ts` |

Tokens definidos fora do preset (ver
[02-tokens.md](02-tokens.md#adicionar-um-token-novo)) não são recoloridos por
`--only theme`. Eles permanecem com o valor que têm.

---

## Comandos da CLI

| Comando | Uso |
|---|---|
| `shadcn add <c> --dry-run` | Mostra o que seria escrito, sem escrever |
| `shadcn add <c> --diff` | Diferença entre o arquivo local e o registry |
| `shadcn add <c> --view` | Conteúdo do arquivo no registry |
| `shadcn docs <c>` | Documentação, API e exemplos do componente |
| `shadcn search` | O que existe no registry |
| `shadcn info` | Estado do projeto e componentes instalados |
| `shadcn eject` | Inlina `shadcn/tailwind.css` e remove a dependência — **não usar**, quebra a portabilidade do preset |

`shadcn add` não sobrescreve arquivo existente sem `--overwrite`, mas rode
`--dry-run` mesmo assim: ele revela as dependências que seriam instaladas junto.

### Verificar se um componente foi alterado

Use `--dry-run`, não diff contra o JSON do registry.

O registry guarda os componentes em forma pré-processada: os ícones aparecem como
`IconPlaceholder` e os utilitários com prefixo `cn-`. A CLI resolve isso na
instalação, conforme o `iconLibrary` e a config do projeto. Comparar o JSON cru
com o arquivo local acusa divergências que não existem.

```bash
# ✅ compara já com as transformações da CLI aplicadas
npx shadcn@latest add card --dry-run     # → skip (identical)

# ❌ acusa falso positivo
curl -s https://ui.shadcn.com/r/styles/base-luma/card.json | diff - src/components/ui/card.tsx
```
