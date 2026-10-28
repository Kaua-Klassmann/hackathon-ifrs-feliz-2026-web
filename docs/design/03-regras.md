# Regras

[← índice](README.md)

Duas categorias, e a diferença importa:

- **Inegociáveis** — quebrar é bug, não há escape hatch. São as que protegem a
  compatibilidade com o preset e o dark mode.
- **Preferências** — valem a pena, mas têm saída documentada.

Se tudo fosse inegociável, nada seria seguido.

---

# Inegociáveis

## R1 — Cor só por token semântico

**Por quê:** cor literal ou da paleta crua não acompanha o preset nem inverte no
dark. Fica congelada no valor em que foi escrita.

```tsx
// ❌
<span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" />
<div style={{ color: "#e7000b" }} />
<tr className="hover:bg-white/2.5" />

// ✅
<span className="bg-success/10 text-success" />
<div className="text-destructive" />
<tr className="hover:bg-muted/50" />
```

Alfa sobre token (`bg-success/10`, `border-destructive/20`) é permitido — o token
continua sendo a fonte da cor.

**Verificação:**
```bash
grep -rnE '\b(bg|text|border|ring|fill|stroke|divide|outline|placeholder)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(50|[1-9]00|950)\b|#[0-9a-fA-F]{3,8}\b|rgba?\(|oklch\(' \
  src --include='*.tsx' --include='*.ts' | grep -v 'src/components/ui/'
grep -rnE '\b(bg|text|border|ring|fill)-(white|black)(/[0-9.]+)?\b' \
  src --include='*.tsx' | grep -v 'src/components/ui/'
```
Ambos vazios.

---

## R2 — Sem raio, fonte ou tamanho arbitrário

**Por quê:** valor entre colchetes congela o que deveria derivar de `--radius` ou
da escala tipográfica.

```tsx
// ❌
<div className="rounded-[18px]" />
<span className="text-[10px]" />
<h1 className="text-[28px] leading-[34px]" />

// ✅
<div className="rounded-2xl" />
<span className="text-xs" />
<h1 className="text-3xl" />
```

**Exceção sancionada:** valores arbitrários de **layout** são permitidos —
`grid-cols-[1fr_auto]`, `w-[calc(100%-2rem)]`. Não são tokens de design.
`rounded-full` também é permitido: descreve forma, não um degrau da escala.

**Verificação:**
```bash
grep -rnE '\b(rounded|text|font|border|leading|tracking)-\[' \
  src --include='*.tsx' | grep -v 'src/components/ui/'
```
Vazio.

---

## R3 — Não editar o interior de `src/components/ui/**`

**Por quê:** esses arquivos são gerados pela CLI e regenerados na troca de
preset. Edição feita ali desaparece sem aviso e sem conflito de merge.

```tsx
// ❌ editar a variante dentro de src/components/ui/button.tsx
default: "bg-blue-600 text-white hover:bg-blue-700",

// ✅ compor por className no ponto de uso
<Button className="w-full">Entrar</Button>

// ✅ ou encapsular num wrapper próprio, fora de ui/
// src/components/form/submit-button.tsx
export function SubmitButton({ pending, ...props }: Props) {
  return <Button type="submit" disabled={pending} {...props} />;
}
```

**Verificação:**
```bash
npx shadcn@latest add alert-dialog avatar badge button card checkbox collapsible \
  command dialog dropdown-menu field input-group input kbd label pagination \
  select separator sheet sidebar skeleton sonner table tabs textarea tooltip \
  --dry-run -y
```
Todos os arquivos devem sair como `skip (identical)`.

Não use diff contra o JSON do registry para verificar isso — ele produz falsos
positivos. O motivo está em
[01-preset.md](01-preset.md#verificar-se-um-componente-foi-alterado).

---

## R4 — Ícones só pela camada central

**Por quê:** `iconLibrary` é campo do preset. Trocá-lo reescreve os imports dentro
de `ui/` e deixa o código de aplicação com a biblioteca antiga. O resultado é duas
linguagens visuais na mesma tela — o `X` do Dialog de uma biblioteca, o `LogOut`
do menu de outra — sem nenhum erro de build avisando.

```tsx
// ❌
import { Globe, LogOut } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ✅
import { Globe, LogOut } from "@/components/icons";
import type { Icon } from "@/components/icons";
```

O acoplamento não é só de import: `type Icon` existe porque a estrutura de
navegação é tipada nele. Tipo vindo da biblioteca de ícones é acoplamento igual.

**Ícone novo:** acrescente o re-export em `src/components/icons.ts` e importe de
lá. Nunca importe direto "só desta vez".

**Verificação:**
```bash
grep -rn 'lucide-react' src --include='*.tsx' --include='*.ts' \
  | grep -v 'src/components/ui/' | grep -v 'src/components/icons.ts'
```
Vazio. Os únicos dois lugares autorizados são `src/components/ui/**`, gerado pela
CLI, e `src/components/icons.ts`.

---

## R5 — Usar o componente shadcn existente antes de criar um novo

**Por quê:** o componente instalado já resolve acessibilidade, foco, dark mode e
estados. A reimplementação local não resolve, e ninguém lembra de manter.

Instalados: `alert-dialog` `avatar` `badge` `button` `card` `checkbox`
`collapsible` `command` `dialog` `dropdown-menu` `field` `input-group` `input`
`kbd` `label` `pagination` `select` `separator` `sheet` `sidebar` `skeleton`
`sonner` `table` `tabs` `textarea` `tooltip`.

```tsx
// ❌ div com aparência de badge
<div className="inline-flex rounded-md border px-2 py-1 text-xs">Ativo</div>

// ✅
<Badge variant="outline">Ativo</Badge>
```

Antes de criar qualquer componente:

```bash
npx shadcn@latest search          # o que existe no registry
npx shadcn@latest docs <nome>     # API e exemplos
```

**Verificação:** o diff introduz um componente cujo papel já existe em
`src/components/ui/`. Se existe, use o existente ou justifique no PR.

---

## R6 — Rodar a CLI em modo de inspeção antes de escrever

**Por quê:** `add` instala dependências não óbvias, e `apply` não tem
`--dry-run` e sobrescreve `src/lib/utils.ts`.

```bash
# ❌
npx shadcn@latest add dialog -y --overwrite

# ✅
npx shadcn@latest add dialog --dry-run
npx shadcn@latest add dialog --diff
npx shadcn@latest add dialog --view
npx shadcn@latest add dialog
```

Para `apply`, o procedimento está em
[01-preset.md](01-preset.md#procedimento). O passo 1 é commitar tudo.

**Verificação:** por revisão do PR. É a única regra que não se checa lendo o
diff do código — mas o estrago aparece nele.

---

# Preferências, com escape hatch

## P1 — Kebab-case no arquivo, export nomeado

`status-screen.tsx` exportando `StatusScreen`.

**Escape hatch:** arquivos exigidos pela convenção do Next (`page.tsx`,
`layout.tsx`, `error.tsx`, `not-found.tsx`) usam `export default` — é requisito do
framework.

---

## P2 — Página fina, componentes em `_components/`

`page.tsx` monta e delega; a lógica de UI fica em `_components/` ao lado da rota.

**Escape hatch:** telas com menos de ~40 linhas podem viver no próprio `page.tsx`.

---

## P3 — Não sobrescrever tamanho de componente por `className`

```tsx
// ⚠️ briga com a variante
<Button size="icon-sm" className="size-8 rounded-md" />

// ✅
<Button size="icon-sm" />
```

**Escape hatch:** densidade específica de uma tela é aceitável se for consistente
dentro da tela inteira e estiver na escala do Tailwind — `h-7` passa,
`h-[30px]` não.

---

## P4 — UI em pt-BR, código em inglês

Todo texto visível ao usuário em português. Identificadores, nomes de arquivo,
comentários e mensagens de commit em inglês.

```tsx
// ✅
<Button type="submit">{isSubmitting ? "Entrando..." : "Entrar"}</Button>
const isSubmitting = form.formState.isSubmitting;
```

**Escape hatch:** anglicismos consolidados em software brasileiro permanecem em
inglês quando traduzir soa artificial — `Dashboard`, `CRM`, `Kanban`, `Chat`,
`E-commerce`, `Workspace`, `Status`.

**Verificação:** leitura do diff. É a única regra desta página sem verificação
automática, e por isso é preferência e não regra.
