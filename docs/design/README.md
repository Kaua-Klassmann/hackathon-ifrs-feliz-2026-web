# Design e UI

Fonte única de verdade visual do frontend. Quem vai tocar em código de UI lê
[03-regras.md](03-regras.md) antes.

Escopo: design e interface. Arquitetura, estado e dados estão fora — contrato de
API em [`../api-contract.md`](../api-contract.md).

---

## Índice

| Arquivo | Assunto |
|---|---|
| [01-preset.md](01-preset.md) | O preset, o que ele controla, como trocar |
| [02-tokens.md](02-tokens.md) | Tokens semânticos, quando usar cada um, raio, dark mode |
| [03-regras.md](03-regras.md) | Regras inegociáveis e preferências, com verificação |
| [04-ux.md](04-ux.md) | Padrões de comportamento: loading, vazio, erro, formulário, foco |
| [05-figma.md](05-figma.md) | O que no protótipo é normativo e o que é ilustrativo |

---

## Fundamento

O design system deste projeto é um **preset do shadcn**: um código portátil que
empacota style, cores, tipografia, raio e biblioteca de ícones. Aplicar outro
preset reconfigura o projeto inteiro — inclusive reescrevendo os componentes já
instalados em `src/components/ui/`.

O código de aplicação, porém, **não é tocado por essa troca**. Daí decorre a
regra que sustenta todas as outras:

> Todo valor visual escrito à mão no código de aplicação é um valor que a troca
> de preset não vai atualizar.

Um `bg-emerald-500` continua verde depois de trocar a paleta. Um `rounded-[18px]`
continua com 18px depois de trocar o raio. Um `import { Globe } from
"lucide-react"` continua importando lucide depois de trocar a biblioteca de
ícones. É por isso que as regras de [03-regras.md](03-regras.md) são restrições, e
não conselhos.

---

## Regras inegociáveis

Detalhadas com exemplos em [03-regras.md](03-regras.md).

| # | Regra |
|---|---|
| **R1** | Cor só por token semântico |
| **R2** | Sem raio, fonte ou tamanho arbitrário `[...]` |
| **R3** | Não editar o interior de `src/components/ui/**` |
| **R4** | Ícones só via `@/components/icons` |
| **R5** | Usar o componente shadcn existente antes de criar um novo |
| **R6** | Rodar a CLI com `--dry-run`/`--diff`/`--view` antes de escrever |

Somada a elas: **toda decisão visual precisa ser válida em light e dark**, porque
os dois temas sobrescrevem os mesmos tokens.

---

## Verificação

Os cinco primeiros comandos devem retornar **vazio**; o sexto, `skip (identical)`
para todos os arquivos.

```bash
# R1 — paleta crua do Tailwind, hex, rgb, oklch literal
grep -rnE '\b(bg|text|border|ring|fill|stroke|divide|outline|placeholder)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(50|[1-9]00|950)\b|#[0-9a-fA-F]{3,8}\b|rgba?\(|oklch\(' \
  src --include='*.tsx' --include='*.ts' | grep -v 'src/components/ui/'

# R1 — white/black literais, inclusive com alfa
grep -rnE '\b(bg|text|border|ring|fill)-(white|black)(/[0-9.]+)?\b' \
  src --include='*.tsx' | grep -v 'src/components/ui/'

# R2 — valores arbitrários de design
grep -rnE '\b(rounded|text|font|border|leading|tracking)-\[' \
  src --include='*.tsx' | grep -v 'src/components/ui/'

# R4 — import direto de biblioteca de ícones
grep -rn 'lucide-react' src --include='*.tsx' --include='*.ts' \
  | grep -v 'src/components/ui/' | grep -v 'src/components/icons.ts'

# dark: usado para corrigir cor — inspecionar cada ocorrência
grep -rnE 'dark:(bg|text|border|ring)-' src --include='*.tsx' \
  | grep -v 'src/components/ui/'

# R3 — componentes gerados idênticos ao registry
npx shadcn@latest add alert-dialog avatar badge button card checkbox collapsible \
  command dialog dropdown-menu field input-group input kbd label pagination \
  select separator sheet sidebar skeleton sonner spinner table tabs textarea tooltip \
  --dry-run -y

npx tsc --noEmit && npm run build
```
