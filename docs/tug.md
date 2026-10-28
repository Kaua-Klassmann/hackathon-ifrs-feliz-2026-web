# Análise TUG (Timed Up and Go)

A tela `/analysis` aplica o teste TUG com visão computacional no navegador: o
cuidador grava o paciente pela webcam, o MediaPipe extrai a pose frame a frame
e o app calcula tempos, velocidade e cadência — sem enviar nem armazenar vídeo.

## Pipeline

```
webcam → PoseLandmarker (MediaPipe, no browser)
       → FrameSample[] (33 landmarks/frame)      tug-types.ts
       → validação da sessão                     validate-tug.ts
       → métricas descritivas                    tug-metrics.ts
       → apresentação                            analysis/_components/tug-results.tsx
```

Durante a gravação rodam em paralelo, por frame:

- `draw-landmarks.ts` — esqueleto sobre o vídeo, feedback visual pro cuidador.
  Puramente cosmético; a cor vem do token `--success` lido em runtime porque
  canvas não aceita classes CSS.
- `live-phase-tracker.ts` — classifica a fase (sentado / em pé / caminhando /
  virando) em tempo real, só para o log visual. É deliberadamente mais simples
  que a validação: só tem o histórico recente, então detecta a virada por
  reversão de tendência do `torsoScale`, não pelo mínimo global.

`validate-tug.ts` roda uma vez, no fim, com a sequência inteira — pode achar o
ponto exato da virada (menor `torsoScale` = ponto mais distante da câmera).

## Por que só landmarks, sem vídeo

O payload de uma sessão são coordenadas normalizadas, nunca frames de imagem.
Um vídeo de 15–20s pesa ordens de grandeza mais que o JSON dos pontos, e não
armazenar imagem de uma pessoa idosa evita a discussão de privacidade/LGPD.

## Unidades

`x`/`y` dos landmarks são frações do frame (0–1); `z` é profundidade relativa
ao quadril, sem escala real. Portanto **velocidades são "unidades normalizadas
por segundo", não m/s** — servem para comparação relativa. Converter para m/s
exigiria calibrar com uma distância conhecida (os ~3m do percurso do TUG).

A velocidade média usa duas estratégias em `tug-metrics.ts`: média das
velocidades instantâneas (janela de 200ms, robusta a ruído por amostra) e
distância percorrida ÷ tempo das fases de caminhada (`averageByPhaseDistance`,
ainda mais estável) — a segunda é a exibida nos resultados.

## Geometria e critérios

- **Sentado / em pé** — ângulo médio dos joelhos: `< 110°` sentado, `> 155°`
  em pé. Valores intermediários são transição (levantando/sentando).
- **Reta do corredor** — ajustada por PCA (eixo principal) sobre as posições
  do quadril nos frames em pé. Ida e volta são colineares por construção, e a
  posição sentada (quadril mais baixo, fora da linha de caminhada) não
  participa do ajuste.
- **Virada** — o frame em que o quadril está **mais distante do ponto de
  partida ao longo da reta do corredor**, buscado só entre o fim do levantar e
  o início do sentar. O critério anterior (menor `torsoScale`) foi abandonado:
  inclinar o tronco para levantar/sentar encolhe o `torsoScale` mais do que a
  distância, e a "virada" caía em cima da cadeira (Ida engolindo o percurso e
  Volta zerada/negativa). Posição do quadril é imune à inclinação.
- **Desvio lateral** — a câmera fica em ângulo (~35–45°) com o corredor, então
  "andar reto" não é um X fixo: mede-se a distância perpendicular à reta do
  corredor, tolerando `1.5×` o `torsoScale` do frame (estável ao giro do corpo,
  diferente da largura de ombros, que colapsa de perfil) e ignorando ±800ms em
  torno da virada, onde girar é esperado.
- **Percurso mínimo** — a extensão do trajeto ao longo da reta precisa ser de
  pelo menos `2×` o `torsoScale` mediano; sem isso, uma gravação em que o
  paciente só levanta e senta passaria como válida.
- **Passos** — mínimos locais do Y do tornozelo numa série destendenciada por
  janela de tempo (900ms), com proeminência mínima e refratário de 250ms
  (~4 passos/s no máximo). Janelas por tempo, não por índice, para tolerar
  variação de fps.
- **Anti-ruído** — validação por % de frames (não `every()`), suavização por
  média móvel e confirmação de fase por 350–400ms antes de trocar o rótulo.

## Calibração

Os limiares vivem no topo de cada arquivo (`SIT_KNEE_ANGLE_MAX`,
`STEP_MIN_PROMINENCE`, etc.). Para ajustá-los com dados reais em vez de
tentativa e erro, use `debugTugFeatures` (em `validate-tug.ts`) numa gravação
de verdade:

```ts
console.table(debugTugFeatures(samples).map((f) => ({
  t: Math.round(f.timestampMs),
  kneeAngle: Math.round(f.kneeAngle),
  kneeAngleSmoothed: Math.round(f.kneeAngleSmoothed),
})));
```

## Decisões de fluxo

- A gravação começa após um timer de 5 segundos e **encerra sozinha** quando o
  rastreador de fases detecta o paciente sentado por 1,5s contínuos depois de
  já ter caminhado — o botão "Finalizar teste" fica como encerramento manual.
- Ao encerrar (manual ou automático), a captura continua por mais 800ms
  (`STOP_BUFFER_MS`) — garante uma janela final estabilizada (paciente já
  sentado) em vez de depender do timing exato do clique do cuidador.
- O modelo (`pose_landmarker_lite`) e o WASM vêm de CDN e ficam em cache no
  browser após o primeiro uso. `delegate: "GPU"` cai para CPU sozinho.
- **Persistência** (`to-analysis.ts` + `analysis-flow.tsx`): ao concluir um
  teste válido, as métricas são convertidas para as unidades reais das normas
  — o percurso 3m ida + 3m volta = 6m casa com a base `normas_6m_idosos`:
  `time` = ida+volta em segundos, `velocity` = 6 ÷ time (m/s), `steps` e
  `cadence` diretos, `time_to_up` = duração do levantar, `bounce` (TSL 5x) =
  5 × (levantar + sentar) como proxy do teste de sentar-levantar 5×. Valores
  arredondados a 2 casas e limitados a 99.99 (colunas `Decimal(4,2)`).
- **Validação contra a norma antes de salvar**: o fluxo busca
  `GET /metrics/{id_patient}` (norma por idade/sexo) e compara localmente; se
  2+ métricas divergirem mais de 50%, pede para refazer o teste. Após 3
  testes discrepantes seguidos, o resultado é aceito como real. Só então o
  `POST /analysis/{id_patient}` é chamado, e os diffs retornados viram o
  feedback exibido ao cuidador. A rota fake `app/api/tug-sessions` do
  protótipo foi removida; o payload continua sendo só métricas derivadas,
  nunca vídeo (ver LGPD acima).
- `velocity-tracker.ts` (velocidade instantânea decomposta em x/y/z) está sem
  consumidor no fluxo atual — mantido como utilitário para um futuro indicador
  ao vivo; o cálculo por frame que alimentava um ref nunca lido foi removido da
  captura.
