# Paridade Figma ↔ código

[← índice](README.md)

A pergunta que esta página responde: **o que no protótipo é normativo e o que é
ilustrativo.**

Resposta curta: **o Figma decide arranjo, o código decide valor.**

---

## O arquivo

| | |
|---|---|
| Arquivo | `3LUtwDtquqn4nUqNtjnrpG` |
| URL | https://www.figma.com/design/3LUtwDtquqn4nUqNtjnrpG/Sem-t%C3%ADtulo |
| Página `design system` | Variáveis, estilos de texto e componentes |
| Página `screens` | Frames das telas e ligações de protótipo |

---

## Mapeamento: nomes idênticos, 1:1

**Uma variável do Figma espelha um token do shadcn, com o mesmo nome.** Nomear
diferente é o que produz drift, porque torna impossível auditar equivalência
lendo os dois lados.

| Figma | Código | |
|---|---|---|
| `color/primary` | `--primary` | ✅ |
| `color/muted-foreground` | `--muted-foreground` | ✅ |
| `radius/3xl` | `--radius-3xl` | ✅ |
| `Azul principal` | `--primary` | ❌ nome inventado |
| `color/brand` | `--primary` | ❌ vocabulário paralelo |

Coleções:

| Coleção | Conteúdo | Modos |
|---|---|---|
| `theme` | `color/*`, `radius/*`, `spacing/*`, `size/*`, `stroke/*` | `light`, `dark` |
| `sonner-defaults` | Valores próprios do toast | `light`, `dark` |

A segunda existe porque o `<Toaster />` do sonner traz CSS próprio e **não**
consome os tokens do app. Mantê-la separada deixa a procedência visível, em vez
de fingir que faz parte do design system.

Cada variável carrega `codeSyntax` WEB apontando para a origem (`var(--input)`,
`sm:w-87.5`), de modo que o mapeamento seja verificável dentro do próprio Figma.

Toda variável precisa existir nos dois modos. Frame que só funciona em um tema não
está pronto.

---

## O que o protótipo NÃO decide

Vem do preset. Se o Figma mostrar diferente, **o Figma está errado**:

| Não decide | Quem decide |
|---|---|
| Valor absoluto de cor | `baseColor` / `theme` do preset |
| Valor de raio em px | `--radius` e a escala derivada |
| Família tipográfica | `font` / `fontHeading` do preset |
| Desenho do glifo de ícone | `iconLibrary` do preset |
| Aparência interna de componente shadcn: altura de botão, anel de foco, padding de input | `src/components/ui/**` |

Corolário: **"no Figma o botão tem 24px de raio e no código deu 26px" não é
bug.** O raio deriva de `--radius`, e a fonte da verdade é o preset. Se 26px está
errado, o que muda é o preset — não o `className` da tela.

---

## O que o protótipo decide

Aqui o Figma é normativo, e divergência no código é bug:

| Decide | Exemplo |
|---|---|
| Layout e arranjo | Duas colunas acima de `lg`, formulário de 350px centralizado |
| Fluxo | Login leva ao cadastro; o que acontece depois do sucesso |
| Hierarquia | Qual ação é primária, o que é secundário |
| Conteúdo | Texto exato de título, rótulo, placeholder, mensagem de erro |
| Quais estados existem | Que a tela precisa cobrir vazio, erro por campo, erro global e loading |
| Ordem e agrupamento | Que "Manter conectado" vem depois da senha e antes do botão |

---

## Direção do fluxo

| Assunto | Fonte de verdade | Por quê |
|---|---|---|
| Token: cor, raio, tipografia, espaçamento | **Código** | O preset é a fonte; o Figma é espelho |
| Aparência de componente shadcn | **Código** | É gerado; o Figma reproduz |
| Layout, fluxo, hierarquia, conteúdo, estados | **Figma** | É onde a decisão de produto é tomada |
| Tela que ainda não existe | **Figma** | Desenha primeiro, implementa depois |
| Tela que existe e vai mudar | **Figma**, com o código atualizado em seguida | Evita que a mudança nasça direto em produção |

### Resolvendo divergência

1. **É valor de token?** O código vence; corrija o Figma. Se o valor do código
   estiver errado, a correção é no preset, e o Figma se atualiza depois.
2. **É layout, fluxo, conteúdo ou estado?** O Figma vence; corrija o código.
3. **Estado existe no código e não no Figma?** O design não cobriu um caso real.
   Desenhe.
4. **Estado existe no Figma e não no código?** Ou é feature não implementada, e
   vira issue, ou é design especulativo, e sai do protótipo.

Divergência não resolvida vira issue. Protótipo e código discordando em silêncio
é como o drift começa.

---

## Política de kit

**Não usamos kit Figma de terceiros.**

Os kits shadcn/ui do Figma Community são mantidos pela comunidade, **não
oficialmente pelo shadcn**. Podem atrasar em relação ao registry, interpretar
tokens de forma própria e não acompanhar troca de preset.

O arquivo deste projeto foi gerado a partir do código, com as variáveis extraídas
do `globals.css` real. Dá mais trabalho de manter, mas o mapeamento é 1:1 e
auditável.

Critérios para adotar um kit no futuro: expor variáveis com os mesmos nomes dos
tokens do shadcn, suportar modos light e dark, e declarar contra qual versão do
registry foi construído.

## Atualização do arquivo

Não há sincronização automática. Sempre que o preset mudar, as variáveis do Figma
precisam ser reconferidas contra o `globals.css` — é o último passo do
[procedimento de troca de preset](01-preset.md#procedimento).

Quando o código muda um texto, um layout ou um estado de tela já prototipada, o
Figma é atualizado no mesmo ciclo. Protótipo desatualizado deixa de ser
referência e passa a ser ruído.

---

## Critérios de pronto para dev

Um frame só vira issue quando cobre:

**Breakpoints**
- [ ] Desktop 1440×1024
- [ ] Mobile 390×844
- [ ] Um terceiro frame, se o comportamento entre 640px e 1024px não for óbvio a partir dos dois

**Estados** — obrigatório para toda tela que carrega ou envia dados
- [ ] Padrão / vazio
- [ ] Preenchido, com conteúdo realista
- [ ] Loading
- [ ] Vazio sem resultado, se houver lista ou filtro
- [ ] Erro por campo, se houver formulário
- [ ] Erro global
- [ ] Sucesso

**Estrutura**
- [ ] Frame nomeada igual à rota
- [ ] Elementos repetidos são instâncias de componente, não frames duplicados
- [ ] Nenhum valor solto: cor, raio e espaçamento ligados a variáveis
- [ ] Ligações de protótipo refletem navegação que existe no código

**Conteúdo**
- [ ] Texto final em pt-BR, não placeholder
- [ ] Mensagens de erro escritas por extenso

**Acessibilidade**
- [ ] Ordem de foco indicada quando não for óbvia pela ordem visual
- [ ] Rótulo acessível definido para todo ícone sem texto

Frame que não cumpre não vira issue — vira comentário no Figma pedindo o que
falta. Descobrir na implementação custa mais caro.
