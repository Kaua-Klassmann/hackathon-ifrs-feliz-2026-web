# Tokens semânticos

[← índice](README.md)

Um token não descreve uma cor, descreve um **papel**. `--primary` não significa
"preto"; significa "a cor da ação principal" — e no tema escuro ela é quase
branca. Quem escreve `bg-zinc-900` está dizendo "preto", e ganha um botão preto
sobre fundo preto no dark.

---

## A convenção background / foreground

Os tokens vêm em pares. **O token base pinta a superfície; o `-foreground` pinta
o texto e os ícones sobre ela.**

```tsx
// ✅ o par anda junto
<div className="bg-primary text-primary-foreground">Salvar</div>
<div className="bg-muted text-muted-foreground">Rascunho</div>
<div className="bg-card text-card-foreground">…</div>

// ❌ par quebrado: texto de um contexto sobre superfície de outro
<div className="bg-primary text-foreground">Salvar</div>
```

O exemplo errado *quase* funciona no light — os dois são escuros, o contraste é
ruim mas ainda se lê — e desaparece no dark, onde ambos ficam claros. **Par
quebrado é o erro mais comum e o mais difícil de pegar em revisão.**

O par pode ser usado sozinho quando não há superfície própria:

```tsx
// ✅ texto secundário sobre o fundo da página
<p className="text-muted-foreground">Nenhum resultado.</p>
```

### Exceção: `destructive`, `success`, `warning`

Estes três não têm par `-foreground`. O style `base-luma` não define
`--destructive-foreground`, e os tokens do projeto seguem o mesmo formato para
não criar duas convenções concorrentes no mesmo arquivo.

São usados como cor única, de duas formas:

```tsx
// ✅ texto sobre fundo de baixa alfa — a forma padrão
<span className="border-destructive/20 bg-destructive/10 text-destructive">Bloqueado</span>
<span className="border-success/20 bg-success/10 text-success">Ativo</span>

// ✅ fundo sólido com o texto do fundo da página
//    funciona nos dois temas porque a cor e --background invertem juntos
<span className="bg-warning text-background">DEV</span>
```

---

## Quando usar cada token

### Superfícies

| Token | Use quando | Não use quando |
|---|---|---|
| `background` | Fundo da página; a base de tudo | Quer destacar um bloco — isso é `card` |
| `card` | Bloco de conteúdo delimitado, no fluxo da página | Conteúdo flutuante — isso é `popover` |
| `popover` | Conteúdo que flutua sobre a página: dropdown, tooltip, command, select | Bloco fixo no layout |
| `muted` | Superfície discreta e não interativa: zebra de tabela, placeholder, badge neutro | O elemento responde a clique — isso é `secondary` ou `accent` |
| `secondary` | Botão ou controle de ação secundária, clicável | Só decoração de fundo — isso é `muted` |
| `accent` | Estado transitório de item interativo: hover, item de menu focado, linha selecionada | Cor de repouso de um botão — isso é `secondary` |

**`muted` vs `secondary`:** `muted` é passivo, `secondary` é clicável. Um badge
"Rascunho" é `muted`; um botão "Cancelar" é `secondary`.

**`accent` vs `primary`:** `primary` é a ação principal em repouso; `accent` é
"este item está sob o cursor ou selecionado agora". `accent` nunca é a cor de
repouso de um botão.

**`card` vs `popover` vs `background`:** no light os três são brancos e parecem
intercambiáveis. No dark eles divergem. Escolher errado só aparece no tema
escuro.

### Ação e texto

| Token | Use quando |
|---|---|
| `primary` | A única ação principal da tela — ver [04-ux.md](04-ux.md#hierarquia-de-ações) |
| `foreground` | Texto de conteúdo, o padrão |
| `muted-foreground` | Texto de apoio: descrição, legenda, placeholder, rótulo de eixo |
| `destructive` | Ação irreversível (excluir, desativar) e mensagem de erro de validação |
| `success` | Estado positivo persistente ("Ativo", "Sincronizado") |
| `warning` | Estado que pede atenção sem ser falha ("Convite pendente", selo de ambiente) |

`success` e `warning` são tokens do projeto, não do preset — ver
[adicionar um token novo](#adicionar-um-token-novo).

### Estrutura

| Token | Use quando |
|---|---|
| `border` | Toda borda e divisória |
| `input` | Fundo de campo de formulário — o `base-luma` usa `bg-input/50`, não borda |
| `ring` | Anel de foco. Nunca remova sem substituir — ver [04-ux.md](04-ux.md#foco-e-teclado) |
| `sidebar-*` | Somente dentro do `Sidebar`, que tem superfície própria |
| `chart-1..5` | Séries de gráfico. Com `chartColor: neutral` são todos cinza — **não use como cor de status** |

---

## Escala de raio

Tudo deriva de `--radius`, definido pelo preset:

| Utilitário | Cálculo | Valor com `radius: default` |
|---|---|---|
| `rounded-sm` | `--radius × 0.6` | 6px |
| `rounded-md` | `--radius × 0.8` | 8px |
| `rounded-lg` | `--radius` | 10px |
| `rounded-xl` | `--radius × 1.4` | 14px |
| `rounded-2xl` | `--radius × 1.8` | 18px |
| `rounded-3xl` | `--radius × 2.2` | 22px |
| `rounded-4xl` | `--radius × 2.6` | 26px |

```tsx
<div className="rounded-2xl" />      // ✅ acompanha o preset
<div className="rounded-[18px]" />   // ❌ idêntico hoje, congelado para sempre
```

Os dois renderizam igual agora. Quando `radius` mudar no preset, o primeiro
acompanha e o segundo continua com 18px. É assim que um projeto acaba com metade
dos cantos arredondados.

`rounded-full` é a exceção legítima: significa "círculo", não um degrau da escala.
Use em avatar e em indicador circular.

---

## Dark mode

O tema escuro sobrescreve **os mesmos tokens**, via `.dark`. Não existe "versão
dark" de um componente; existe o mesmo componente com valores diferentes.

**Toda decisão visual precisa ser válida nos dois temas.**

O `next-themes` aplica a classe antes do primeiro paint via `<script>` inline.
O React (19.2+) alerta quando um componente renderiza `<script>` no client —
por isso o `ThemeProvider` em `src/components/theme-provider.tsx` passa
`scriptProps` com `type="text/javascript"` no servidor e `type="text/plain"` no
client, o padrão documentado pelo próprio Next em
`node_modules/next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md`.
No load inicial o script executa durante o parse do HTML (sem flash de tema);
em navegação client-side ele é inerte, que é o comportamento correto — scripts
renderizados pelo React nunca executariam de qualquer forma.

```tsx
// ❌ branco a 2,5% é um hover sutil no dark e é invisível no light
<tr className="hover:bg-white/2.5" />

// ✅ o token inverte junto com o tema
<tr className="hover:bg-muted/50" />
```

Regras derivadas:

1. **Nunca use `white`/`black` literais**, nem com alfa. Véu de modal já vem
   resolvido no componente gerado.
2. **Nunca escreva um `dark:` para corrigir cor.** Se precisou, o token está
   errado. `dark:` é aceitável para ajuste estrutural, não cromático.
3. **Teste nos dois temas** antes de considerar a tarefa pronta.

---

## Adicionar um token novo

### Procedimento

1. Definir em `:root` (light) **e** em `.dark`:

```css
:root  { --success: oklch(0.52 0.13 163); }
.dark  { --success: oklch(0.765 0.177 163.223); }
```

2. Expor ao Tailwind no `@theme inline`:

```css
@theme inline {
  --color-success: var(--success);
}
```

3. **Medir contraste antes de fixar o valor.** Cor usada como texto precisa de
   ≥ 4,5:1 contra a superfície onde aparece, nos dois temas. Os equivalentes
   diretos da paleta do Tailwind costumam reprovar: `emerald-600` dá 3,67:1 e
   `amber-600` dá 3,19:1 contra fundo branco. É por isso que `--success` e
   `--warning` deste projeto são mais escuros que a paleta padrão — legibilidade
   antes de vivacidade.

### Quando isto é legítimo e quando não é

Adicione um token quando o **papel** não existe. Não adicione quando o papel
existe e você só não gostou do valor.

| Situação | Veredicto |
|---|---|
| Preciso de cor de sucesso e só existe `destructive` | ✅ papel inexistente |
| Preciso de um cinza um pouco mais claro que `muted` | ❌ use `muted` |
| Este botão precisa ser azul | ❌ ou é `primary`, ou não é ação principal |
| Preciso de 10px de fonte e o menor é 12 | ❌ use `text-xs` |
| Preciso de superfície para um tipo de bloco novo | ⚠️ provavelmente `card`; discuta antes |

**Custo:** tokens fora do preset não são recoloridos por `shadcn apply --only
theme`. Trocar a paleta atualiza os tokens do preset e deixa estes como estão. É
um custo aceitável para poucos tokens; se a lista passar de cerca de cinco, é
sinal de que o projeto está lutando contra o design system, e vale reavaliar a
escolha de preset em vez de continuar acrescentando.

---

## Tipografia

| Utilitário | Origem |
|---|---|
| `font-sans` | `--font-sans` → definido pelo campo `font` do preset, carregado em `layout.tsx` |
| `font-heading` | `--font-heading` → com `fontHeading: inherit`, igual à sans |
| `font-mono` | `--font-mono` |

Tamanhos: escala do Tailwind (`text-xs` a `text-3xl`). Nunca `text-[Npx]`.
Pesos em uso: `font-normal`, `font-medium`, `font-semibold`.

**Título usa `font-medium`**; a hierarquia é marcada pelo tamanho:

| Contexto | Tratamento |
|---|---|
| Entrada de fluxo (login, cadastro) | `text-3xl font-medium` |
| Título de tela dentro do app | `text-2xl font-medium` |
| Tela de status (404, 403, erro) | `text-2xl font-medium` |
| Título de card | `CardTitle` (`text-base font-medium`) |
