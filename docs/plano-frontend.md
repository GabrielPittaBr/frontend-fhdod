# Plano do Front-end — Sistema de Satisfação Hospitalar (FHDOD)

10/11/2026 · Escopo: **só o front-end**, com dados mockados (o backend ainda não existe)

## 1. Para que serve este documento

Este plano é para o agente que vai construir o front-end. Ele diz **o que precisa existir**, **quais regras não podem ser quebradas** e **onde há liberdade criativa**. O visual de cada tela não está desenhado de propósito: cores, tipografia, composição e detalhes de interação ficam com quem constrói, dentro das regras abaixo.

### Documentos de referência (somente leitura)

Ficam em `D:\Trabalhos\FHDOD\docs\`, fora deste repositório:

| Documento | Use para |
| --- | --- |
| `Plano de Desenvolvimento - Sistema de Satisfação Hospitalar (FHDOD).md` | Regras de negócio, contrato dos endpoints (que os mocks imitam), seções "Front-end" e "Autenticação, perfis e permissões" |
| `Personas FHDOD.pdf` | Sônia (paciente, 68 anos, tablet/totem), Camila (acompanhante, 33 anos, celular) e Renata (Ouvidoria, 43 anos, dashboard) |
| `Atividade_Experiencia_do_Paciente.docx` | Requisitos da atividade e rubrica de avaliação |

Se este plano e o Plano de Desenvolvimento discordarem numa **regra de negócio**, vale o Plano de Desenvolvimento. Este documento só adapta o front para funcionar sem backend.

## 2. Regras de trabalho

### Skills e plugin obrigatórios

| Ferramenta | Quando usar |
| --- | --- |
| Plugin **frontend-design** (`frontend-design:frontend-design`) | Antes de escrever a primeira tela, para definir a direção visual (tipografia, cor, composição) e evitar a cara de template genérico |
| **Taste skill** (`design-taste-frontend`) | Durante a construção e na checagem final no navegador. Aplique os princípios anti-genéricos (um sistema visual só, texto com voz própria, microinterações discretas). Esta skill foi pensada para sites institucionais: **ignore o que é de landing page** (hero, fotos de banco, shaders, seções de marketing). Isto é um app de pesquisa, um painel de gestão e uma tela de TV |
| **Web design guidelines** (`web-design-guidelines`) | Ao terminar cada área (pesquisa, totem, painel, TV), para revisar acessibilidade e UX. Corrija o que ela apontar ou registre por que não corrigiu |

### Registro das alterações

- **Toda alteração** é registrada num arquivo `.md` dentro de `docs/registros/`.
- **Este plano fica só em `docs/`** e não é usado como diário: nada de anotar progresso aqui. Se uma decisão mudar o plano, registre a mudança em `docs/registros/` explicando o porquê.
- Um arquivo por sessão de trabalho ou entrega, com o nome `AAAA-MM-DD-NN-assunto.md` (ex.: `2026-11-11-01-fundacao-do-projeto.md`).
- Esse registro conta pontos na atividade ("Registro do processo e justificativas"), então as justificativas precisam ser claras e ligadas a uma persona ou regra.

Modelo de cada registro:

```markdown
# <O que foi feito, em uma linha>

Data · Autor (pessoa ou agente)

## O que foi feito
## Decisões e por quê
(cite a persona ou a regra que justifica cada decisão)
## Ferramentas e skills usadas
## O que mudou em relação ao plano
## Pendências e dúvidas
```

### Outras regras

- Trabalhe neste repositório (`frontend-fhdod`). Ele faz o papel do `fhdod-satisfacao-web` do Plano de Desenvolvimento.
- `pnpm` como gerenciador de pacotes. O `package.json` atual é só um esqueleto do `npm init` (com `"type": "commonjs"`): substitua pelo do Vite, mantendo nome, descrição e os campos do repositório.
- O logo está em `assets/img/logo.png`. Leve-o para dentro de `src/` ou `public/` e use-o.
- TypeScript em modo `strict`. Commits no padrão Conventional Commits, com a descrição em português (`feat(pesquisa): escala de rostinhos`).

## 3. Escopo

**Entra agora:**

1. Pesquisa do paciente no celular, tablet e computador (`/s/:setor`)
2. Pesquisa em modo totem (`/totem/:setor`)
3. Painel da gestão: login, dashboard, respostas, pedidos de retorno e cadastros
4. TV Wall (`/tv#<token>`)
5. Camada de dados mockada que imita a API

**Fica de fora:**

- Backend, banco, Docker, Caddy e deploy (o build precisa estar pronto para hospedagem estática, mas publicar não faz parte deste plano)
- Geração de tipos a partir do `openapi.json` (ainda não existe)
- Tudo o que o Plano de Desenvolvimento marca como fase 2 ou 3: status da Ouvidoria, e-mails, escalas e equipes, configurações, auditoria, SSE, WhatsApp, fila offline do totem

## 4. Stack

A mesma do Plano de Desenvolvimento, com um ajuste por não haver API:

| Ferramenta | Uso |
| --- | --- |
| React + Vite + TypeScript | Base |
| React Router | Rotas, com cada área carregada sob demanda (`lazy`) |
| TanStack Query | Todas as leituras e envios passam por ele, mesmo com mock, para os estados de carregamento e erro já existirem |
| Zustand | Sessão do usuário, só em memória |
| Tailwind CSS + shadcn/ui | Interface |
| React Hook Form + Zod | Formulários, com mensagens em português |
| TanStack Table | Tabelas do painel |
| Recharts | Gráficos do painel e da TV |
| lucide-react | Ícones de interface (**nunca** para os rostinhos da escala) |
| date-fns | Datas em pt-BR |
| qrcode.react | QR Codes dos setores |
| Vitest | Testes |

**Ajuste:** `openapi-typescript` e `openapi-fetch` ficam para quando a API existir. Até lá, os tipos são escritos à mão (seção 5).

Bibliotecas extras só se resolverem algo que poucas linhas não resolvem (ex.: arrastar e soltar na ordem das perguntas). Registre cada uma adicionada e o porquê.

## 5. Dados mockados

O objetivo é que, quando a API ficar pronta, **só a camada de chamadas mude**. Nenhuma tela deve saber que o dado é falso.

### Como organizar

```text
componente → hook (TanStack Query) → features/<assunto>/api.ts → src/mocks/
```

- Só os arquivos `features/*/api.ts` importam de `src/mocks/`. Componentes, páginas e hooks nunca importam mocks diretamente.
- Cada função de `api.ts` corresponde a um endpoint do Plano de Desenvolvimento (ex.: `buscarPesquisa(slug)` ↔ `GET /publico/setores/:slug/pesquisa`).
- Os mocks devolvem o mesmo formato da API: `{ data }`, listas com `{ data, meta: { pagina, porPagina, total } }` e erros no formato `{ erro: { codigo, mensagem, detalhes, requestId } }`, lançados como um erro com o status HTTP (400, 401, 403, 404, 409, 429).
- Tipos em `src/lib/api/tipos.ts`, escritos à mão com os **mesmos nomes de campo do contrato** (`chaveIdempotencia`, `dataAtendimento`, `turnoId`, `valorNumero`, `nps`, `classificacao`, `tokenComplemento` etc.). Depois serão trocados pelo `schema.d.ts` gerado.
- Latência simulada (algo entre 200 e 600 ms), para os estados de carregamento aparecerem de verdade.
- Um jeito simples de forçar falha (por exemplo, um parâmetro na URL), para testar as telas de erro e o reenvio da pesquisa.

### O que o mock precisa simular

As regras que, no sistema real, ficam **só na API** ficam **só dentro de `src/mocks/`**, nunca nos componentes:

- Classificação da resposta (NORMAL, BAIXA, BAIXISSIMA) com os limites da tabela de configurações do Plano de Desenvolvimento: escala 1–5 baixa ≤ 3, baixíssima = 1; NPS baixa ≤ 6, baixíssima ≤ 2; vale a pior entre o NPS e as notas.
- Cálculo do NPS: % de promotores (9–10) menos % de detratores (0–6).
- Permissões por perfil e escopo por setor (gestor e visualizador só veem os seus setores).
- Telefone sempre mascarado nas listas; o número completo só em "revelar telefone".
- Idempotência: a mesma `chaveIdempotencia` enviada duas vezes devolve a resposta já gravada.
- Token de complemento de uso único, válido por 30 minutos.

O front só **exibe** a classificação que o mock devolve. Nada de recalcular nota baixa em componente.

### Persistência

- **A resposta enviada na pesquisa precisa aparecer no dashboard e na TV.** É exigência da atividade. Para isso, o "banco" do mock (dados iniciais + respostas novas) fica salvo no `localStorage`, com uma ação para restaurar os dados iniciais (visível só no painel, para a demonstração).
- Isso simula o servidor. Não confunda com o **estado da pesquisa**, que nunca é salvo no navegador (ver modo totem).
- Limitação conhecida: só funciona no mesmo navegador. Registre isso.

### Dados iniciais

Gerados com semente fixa, para os números serem os mesmos a cada carga:

| Dado | Conteúdo |
| --- | --- |
| Setores | Pronto Atendimento (`pronto-atendimento`), Internação, Raio-X e mais 2 ou 3; **um inativo**, para testar a tela de pesquisa indisponível |
| Categorias | Recepção, Triagem, Enfermagem, Médico, Higiene e Limpeza, Estrutura, Tempo de Espera |
| Turnos | Manhã, Tarde e Noite, com horários provisórios (a Noite atravessa a meia-noite) |
| Perguntas | 4 a 8 por setor, na ordem da jornada, misturando os tipos ESCALA_1_5, SIM_NAO, MULTIPLA_ESCOLHA e TEXTO; **um setor com mais de 8 ativas**, para mostrar o aviso |
| Respostas | Alguns meses de histórico (centenas a pouco mais de mil), canais WEB e TOTEM, todos os turnos, maioria positiva e uma parte baixa, para o dashboard ter o que mostrar |
| Comentários | Os quatro tipos (ELOGIO, RECLAMACAO, SUGESTAO, OUTRO), com elogios em quantidade |
| Pedidos de retorno | Alguns, com telefones claramente fictícios |
| Usuários | Um por perfil (SUPER_ADMIN, GESTOR, OUVIDORIA, VISUALIZADOR), um gestor com dois setores e um usuário com troca de senha obrigatória. Credenciais falsas, no arquivo de seed |
| Telas de TV | Uma ativa, com token conhecido para a demonstração, e uma inativa |
| Configurações | Os limites, tempos do totem e o texto do NPS da tabela do Plano de Desenvolvimento |

Nenhum dado real: nomes, telefones e comentários são inventados.

## 6. Rotas

| Rota | Área | Quem acessa |
| --- | --- | --- |
| `/s/:setor` | Pesquisa (celular, tablet, computador) | Público |
| `/totem/:setor` | Pesquisa em modo totem | Público, no aparelho do setor |
| `/tv#<token>` | TV Wall | Quem tem o link da tela |
| `/login` | Entrada do painel | Público |
| `/painel` | Dashboard | Todos os perfis |
| `/painel/respostas` | Respostas e comentários | Super Admin, Gestor, Ouvidoria |
| `/painel/contatos` | Pedidos de retorno | Super Admin, Ouvidoria |
| `/painel/setores` | Setores, links e QR Codes | Super Admin |
| `/painel/setores/:id/perguntas` | Perguntas do setor | Super Admin e Gestor do setor |
| `/painel/cadastros` | Categorias e turnos | Super Admin |
| `/painel/usuarios` | Usuários e seus setores | Super Admin |
| `/painel/tv` | Telas de TV Wall | Super Admin |

Também precisam existir: troca de senha (tela ou modal, obrigatória no primeiro acesso), página 404, página de acesso negado e a tela de setor inexistente ou inativo na pesquisa.

O acesso às rotas e aos menus depende da **lista de permissões** que o `/auth/me` do mock devolve (ex.: `respostas:ver`), não do nome do perfil. A tabela de permissões está no Plano de Desenvolvimento.

O build é uma SPA estática: links diretos como `/s/pronto-atendimento` (que vêm do QR Code) precisam abrir corretamente depois do build, inclusive ao recarregar a página.

## 7. Pesquisa do paciente (`/s/:setor`)

É a parte mais importante. Atende Sônia (pouca familiaridade digital) e Camila (responde à noite, pelo celular). Os códigos entre parênteses são as telas do fluxo e do mock citadas nas personas.

### Etapas

1. **Abertura (P00).** Logo, nome do setor vindo da URL, aviso de que é anônimo e rápido, botão para começar. Sem cadastro, sem senha. Setor inexistente ou inativo mostra uma mensagem amigável, nunca uma tela de erro técnica.
2. **Data e turno (D02).** Botões "Hoje", "Ontem" e "Outra data" (data futura não é permitida), depois os turnos em botões. A data é a do **atendimento**, não a do envio (dor da Camila).
3. **Perguntas do setor (D03).** Uma por tela, na ordem que vem do mock. "Pular" sempre visível. Escala e sim/não avançam com um toque, depois de mostrar por um instante o que foi escolhido. Texto livre tem botão para continuar e contador de 500 caracteres. Deve existir um jeito de voltar à pergunta anterior.
4. **NPS de 0 a 10 (D05).** Obrigatório, sem "Pular", texto vindo do mock. Botões grandes, em duas linhas no celular, com legenda nas pontas ("Nada provável" e "Muito provável"). O toque **seleciona** e um botão "Enviar avaliação" **confirma**: protege a Sônia de um toque acidental. É nesse momento que a resposta é gravada.
5. **Complemento.** Depende da classificação devolvida pelo mock:
   - **Baixa ou baixíssima (D07):** "Quer contar o que aconteceu?" (comentário com tipo: elogio, reclamação, sugestão ou outro) e "Quer que o hospital entre em contato?" (telefone com máscara brasileira e consentimento explícito, nunca marcado de antemão, dizendo quem verá o número).
   - **Normal (D08):** "Quer deixar um elogio ou uma sugestão?". Elogio tem o mesmo destaque que reclamação.
   - Tudo opcional. Se a pessoa sair aqui, a avaliação já está salva.
6. **Agradecimento.** Mensagem curta que deixe claro que **a avaliação foi enviada** (objetivo da Sônia: ter certeza de que terminou).

### Regras da pesquisa

- **Barra de progresso** por proporção, sem "3 de 12".
- O paciente **nunca vê** termos internos: nada de "NPS", "classificação baixa" ou "detrator". Ele só percebe que a pergunta seguinte mudou.
- **Envio seguro:** uma `chaveIdempotencia` é gerada no início de cada pesquisa e reaproveitada se o envio falhar e a pessoa tentar de novo. Mensagem de erro clara, com botão para tentar de novo, sem perder o que foi respondido. (`crypto.randomUUID()` só existe em HTTPS ou localhost; tenha um plano B.)
- Duplo toque no "Enviar" não pode gerar dois envios.
- **Perguntas puladas** não entram no envio.
- O estado da pesquisa fica num `useReducer` dentro de `useFluxoPesquisa`, como manda o Plano de Desenvolvimento.

### Escala de rostinhos (1 a 5) — requisito obrigatório

Os rostinhos precisam ser **emojis coloridos**, não ícones de linha. Pessoas de qualquer idade devem entender a escala só de olhar.

- **Proibido:** ícones monocromáticos (lucide `Smile`, `Frown` e afins) e o emoji do sistema (cada aparelho desenha de um jeito, e totens costumam ter fontes antigas).
- **Use ilustrações coloridas em arquivo local** no projeto, todas do mesmo conjunto. Sugestão: **Microsoft Fluent Emoji** (licença MIT), a mesma família usada nas personas, o que mantém a coerência com o material da dupla. Outro conjunto serve, desde que livre e com a licença citada no registro.
- Cada nível tem **rosto + texto + cor de apoio**: 1 Muito ruim, 2 Ruim, 3 Regular, 4 Bom, 5 Muito bom, indo do vermelho ao verde. A informação nunca depende só da cor.
- Ordem de 1 a 5 sempre na mesma direção, em todas as telas.
- Estado selecionado bem visível antes de avançar.
- Para leitor de tela, um grupo de opções com rótulos completos (ex.: "4, Bom").
- Os mesmos rostinhos podem aparecer no painel e na TV, para a escala ser reconhecível em todo o sistema.

A cor nos botões do NPS é opcional. Se usar, siga a mesma lógica dos rostinhos.

## 8. Modo totem (`/totem/:setor`)

Mesma pesquisa, com estas diferenças (atende a Sônia, no tablet do hospital):

- **Sem a etapa de data e turno:** vale a data de hoje e o turno do horário atual, calculado com os horários do mock (inclusive o turno da noite, que passa da meia-noite).
- Canal enviado como `TOTEM`.
- **Reinício automático** no agradecimento: contagem regressiva visível (15 s por padrão, vindo do mock) e um botão para começar uma nova avaliação na hora.
- **Inatividade:** 60 s sem toque no meio da pesquisa mostra "Ainda está aí?"; sem resposta em 10 s, volta ao início.
- Ao reiniciar, **todo o estado é apagado**. Nada da pesquisa vai para `localStorage`, `sessionStorage` ou URL: o próximo paciente não pode ver nada do anterior.
- Tela cheia ao primeiro toque, tela sempre acesa (Screen Wake Lock, quando o navegador permitir) e sem zoom, seleção de texto ou rolagem acidental.
- **O bloqueio de zoom vale só no totem.** Na pesquisa pelo celular, o zoom do navegador precisa continuar funcionando (acessibilidade).
- Alvos de toque ainda maiores que no celular; pensado para tablet deitado e em pé e para tela vertical de totem.

## 9. Painel da gestão (`/painel`)

Atende principalmente a Renata (Ouvidoria): ela domina planilhas e filtros, mas não quer uma ferramenta complexa.

### Login e sessão

- E-mail e senha, validados com Zod, mensagens em português.
- Token só em memória (Zustand). Ao recarregar, a sessão é recuperada pelo "refresh" do mock.
- Usuário com troca de senha obrigatória vai direto para a troca (mínimo 10 caracteres, letras e números).
- Enquanto for mock, a tela de login pode oferecer um atalho de demonstração para entrar como cada perfil, útil na apresentação. Esse atalho some quando a API chegar.

### Layout

- Menu lateral mostrando **só** o que o usuário pode acessar; no celular e no tablet, vira menu recolhível.
- Cabeçalho com nome, perfil, setores do usuário (quando não for todos) e sair.
- Painel claro; tema escuro é opcional.

### Dashboard

- **Filtros no topo:** período, base da data (atendimento ou envio), setor, turno e canal. Ficam na **URL**, para a mesma visão poder ser compartilhada e a exportação sair igual à tela.
- **Cartões:** NPS, total de respostas, promotores, neutros, detratores e notas baixas. **O NPS aparece sempre ao lado do número de respostas** (dor da Renata: nota sem tamanho de amostra). Com amostra pequena, avise.
- **Gráficos:** NPS por setor, evolução (dia, semana ou mês), média e % de notas 4 e 5 por categoria, ranking de melhores e piores pontos.
- Clicar num setor do gráfico aplica o filtro daquele setor (navegar do hospital até o setor e o turno, como pede a atividade).
- **Comentários recentes,** com elogios e reclamações no mesmo destaque e filtro por tipo.
- Recarrega os dados a cada 60 s.
- Estados de carregamento, vazio (filtro sem resultado) e erro em cada bloco.
- **Exportação:** "Excel" baixa um CSV gerado pelo mock com os filtros atuais (abre no Excel; no sistema real virá da API em `.xlsx`). "PDF" pode ficar desabilitado com o aviso de que chega com a API. Registre essa decisão.

### Respostas (`/painel/respostas`)

- Tabela com filtros, ordenação e paginação: data do atendimento, setor, turno, canal, NPS, classificação, se tem comentário e se pediu retorno.
- Detalhe de cada resposta (página, painel lateral ou modal): perguntas e notas como o paciente viu, comentário e telefone mascarado.

### Pedidos de retorno (`/painel/contatos`)

- Lista com setor, data, classificação, comentário e telefone mascarado (ex.: `•••• 0042`).
- Botão "Revelar telefone", só para quem tem `contatos:ver`, avisando que a ação fica registrada.
- No MVP, todo pedido tem o status NOVO; o fluxo de status é da fase 2.

### Setores (`/painel/setores`)

- Criar, editar (nome, slug, descrição), ativar e desativar. Slug repetido mostra erro de conflito (409).
- Para cada setor: link da pesquisa, link do totem, botão para copiar e **QR Code pronto para imprimir** (folha com o QR, o nome do setor e um convite curto para avaliar).

### Perguntas do setor (`/painel/setores/:id/perguntas`)

- Lista ordenável por arrastar, **e também** por botões ou teclado (arrastar sozinho não é acessível).
- Criar e editar: texto, categoria, tipo e opções (quando for múltipla escolha). Ativar e desativar; nada é apagado.
- Mudar o tipo de uma pergunta que já tem respostas é bloqueado, com explicação: cria-se outra pergunta.
- Aviso, sem bloquear, quando passar de 8 perguntas ativas.
- **Prévia no formato do celular,** reaproveitando os mesmos componentes da pesquisa.

### Cadastros, usuários e telas de TV

- **Categorias e turnos** (`/painel/cadastros`): listar, criar, editar e desativar.
- **Usuários** (`/painel/usuarios`): criar com senha provisória (mostrada uma vez), editar nome e perfil, escolher setores, ativar e desativar, redefinir senha.
- **Telas de TV** (`/painel/tv`): criar uma tela mostra o link com o token **uma única vez**, com botão de copiar; desativar faz o link parar de funcionar.

## 10. TV Wall (`/tv#<token>`)

Tela pública, em corredores e recepções.

- Token lido da parte da URL depois do `#`. Token inválido ou tela desativada mostra uma mensagem simples, sem detalhe técnico.
- Tela cheia, tema escuro, números grandes, legíveis a alguns metros.
- Alterna a cada 15 s entre: visão geral (NPS e total do mês), NPS por setor, evolução e destaques positivos. Algum indicador discreto de qual visão está na tela e quanto falta para a próxima.
- Atualiza os dados a cada 30 s. Se a rede cair, mantém os últimos números e mostra o horário da última atualização.
- **Nunca mostra comentários, reclamações, telefones ou qualquer dado pessoal.** O mock da TV nem devolve esses campos.
- Precisa ficar bem em TV Full HD e 4K, deitada.

## 11. Dispositivos e responsividade

Tudo precisa funcionar no celular, no tablet e no computador. Nenhuma tela pode ter rolagem horizontal da página.

| Dispositivo | Tamanhos para testar | Principal uso |
| --- | --- | --- |
| Celular | 360×740, 390×844 | Pesquisa pelo QR Code (Camila); painel em consulta rápida |
| Tablet em pé | 768×1024, 820×1180 | Pesquisa e totem (Sônia) |
| Tablet deitado | 1024×768, 1280×800 | Totem, painel |
| Totem vertical | 1080×1920 | Totem |
| Computador | 1366×768, 1440×900, 1920×1080 | Painel (Renata) |
| TV | 1920×1080, 3840×2160 | TV Wall |

- A pesquisa é desenhada primeiro para o celular e cresce para as outras telas, sem esticar botões até ficarem estranhos em tela grande.
- No painel em tela pequena, tabelas viram cartões ou rolam dentro do próprio bloco, e os gráficos se ajustam à largura.
- Teste tanto com toque quanto com mouse e teclado.

## 12. Acessibilidade e linguagem

- Contraste nível AA da WCAG em todo o sistema, inclusive sobre as cores dos rostinhos.
- Na pesquisa: botões de 48 a 54 px no mínimo, bem espaçados, e texto com pelo menos 18 px.
- Poucos elementos por tela na pesquisa.
- Navegação completa por teclado, foco sempre visível e rótulos para leitor de tela (o shadcn/ui ajuda).
- `lang="pt-BR"` e respeito a `prefers-reduced-motion`.
- Contagens regressivas anunciadas ao leitor de tela uma vez, não a cada segundo.
- **Texto da pesquisa:** frases curtas, tratamento por "você", sem jargão, sem siglas. Perguntas concretas (dor da Sônia: perguntas abstratas).
- **Texto do painel:** direto e com números explicados (o que é NPS, de quantas respostas veio a média).
- Datas, números e telefones no formato brasileiro.

## 13. Identidade visual e liberdade criativa

**Fixo:**

- Logo da FHDOD (vermelho, em `assets/img/logo.png`). Em fundo escuro (TV), garanta que ele continue legível.
- Visual que passe calma e confiança, adequado a um hospital, e que não pareça template genérico.
- Contraste AA e os requisitos da escala de rostinhos.

**Fica a critério de quem constrói:** paleta, tipografia, espaçamentos, cantos, sombras, composição de cada tela, ilustrações, animações, textos de interface (dentro do tom acima), como o painel e a TV organizam os gráficos, estados vazios e de carregamento.

**Um ponto para resolver com cuidado:** o vermelho da marca é a mesma cor do "Muito ruim" da escala e costuma ser lido como erro. Decida como separar a cor da marca das cores de avaliação e de alerta, e registre a decisão.

Não há mock do Figma para seguir: a liberdade visual é total, respeitando só o que está em "Fixo" acima.

## 14. Desempenho

- Cada área (pesquisa, totem, painel, TV) é carregada só quando acessada. Quem abre a pesquisa pelo QR Code **não baixa** Recharts, TanStack Table nem nada do painel.
- A pesquisa precisa abrir rápido em 4G: fontes do sistema ou uma fonte leve, ícones em SVG e as imagens dos rostinhos pequenas (de preferência SVG) e carregadas logo na abertura, para não "piscarem" na primeira pergunta.

## 15. Estrutura de pastas

Siga a estrutura do repositório do front-end descrita no Plano de Desenvolvimento (`src/app`, `src/components`, `src/features/<assunto>`, `src/lib`, `src/stores`, `src/styles`), com estes acréscimos:

```text
src/
├── mocks/            # "banco" simulado, seed, regras que seriam da API e persistência
│   └── seed/         # setores, perguntas, usuários, respostas geradas
├── lib/api/tipos.ts  # tipos do contrato, à mão até existir o openapi.json
└── assets/emojis/    # ilustrações coloridas da escala de 1 a 5
docs/
├── plano-frontend.md # este plano
└── registros/        # um .md por sessão de trabalho
```

## 16. Ordem sugerida

1. **Fundação:** Vite, TypeScript, Tailwind, shadcn/ui, rotas com carregamento sob demanda, tipos e camada de mock. Direção visual definida com o plugin frontend-design. Primeiro registro.
2. **Pesquisa no celular,** com todos os caminhos (nota baixa, nota normal, pular tudo, erro no envio).
3. **Modo totem.**
4. **Login, layout do painel e dashboard.** Confirmar que uma resposta nova aparece nos números.
5. **Respostas e pedidos de retorno.**
6. **TV Wall.**
7. **Cadastros:** setores com QR Code, perguntas, categorias e turnos, usuários, telas de TV.
8. **Revisão final** com `web-design-guidelines` e a checagem da taste skill no navegador, em todos os tamanhos da seção 11.

Pesquisa e totem vêm primeiro porque são o que o paciente usa e o que a atividade mais cobra.

## 17. Como saber que está pronto

- [ ] Fluxo completo da pesquisa no celular e no totem, dos dois lados: nota baixa (com comentário e telefone) e nota normal (com elogio)
- [ ] Pesquisa que pula todas as perguntas e responde só o NPS é aceita
- [ ] Erro no envio mostra mensagem e reenvia sem duplicar a resposta
- [ ] Totem reinicia sozinho, volta ao início por inatividade e não deixa rastro do paciente anterior
- [ ] Uma resposta enviada aparece no dashboard e na TV
- [ ] Cada perfil vê só os seus menus e os dados dos seus setores
- [ ] Telefone mascarado em todo lugar, revelado só por quem tem permissão
- [ ] TV sem nenhum comentário ou dado pessoal
- [ ] Rostinhos coloridos, com texto, iguais em todos os aparelhos
- [ ] Sem rolagem horizontal em 360 px; testado em todos os tamanhos da seção 11
- [ ] Contraste AA, navegação por teclado e leitor de tela nas telas da pesquisa
- [ ] Revisão com `web-design-guidelines` feita, com os apontamentos corrigidos ou justificados
- [ ] Links diretos (`/s/...`, `/totem/...`, `/tv#...`) abrem depois do build, inclusive ao recarregar
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build` sem erros
- [ ] Testes mínimos: as etapas de `useFluxoPesquisa` (pular, NPS obrigatório, reinício) e as regras do mock (classificação e cálculo do NPS)
- [ ] Registros em `docs/registros/` cobrindo tudo o que foi feito e decidido

## 18. Pontos em aberto (não inventar)

Estes itens dependem do hospital. Use o valor provisório do mock e anote no registro:

- Horários oficiais dos turnos (o totem depende deles para escolher o turno sozinho)
- Texto final da pergunta do NPS
- Quem pode ver os telefones (o padrão é Ouvidoria e Super Admin)
- Limite de dias para trás na escolha de "Outra data"
- Perguntar se quem responde é paciente ou acompanhante: é um "ponto a investigar" da persona Camila e **não está no contrato**. Não implemente sem confirmação.
