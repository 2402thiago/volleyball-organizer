# Volleyball Organizer System

Um sistema para organizar jogos de vôlei com funcionalidades para avaliação de jogadores, cálculo de consenso e geração automática de times equilibrados.

## Funcionalidades

- **Importação de participantes**: Carrega jogadores a partir de um arquivo CSV com nome, foto e gênero
- **Interface de avaliadores**: Três avaliadores pré-definidos (Thiago, Ramon, Douglas) podem atribuir nível e ranking a cada jogador
- **Cálculo de consenso**: O sistema calcula o consenso como:
  - Nível: moda (valor mais frequente) entre os três avaliadores
  - Ranking: média aritmética entre os três avaliadores
- **Override de admin**: O administrador pode editar diretamente os valores de consenso
- **Geração automática de times**: Cria 4 times de 6 jogadores cada, respeitando:
  - Exatamente 1 jogador de cada nível por time (Capitão, Levantador M, Levantador F, M1, F1, M2/F2)
  - Pelo menos 1 mulher por time
  - Distribuição equilibrada de habilidades usando algoritmo de "snake draft"
- **Edição manual de times**: O admin pode ajustar os times gerados com validação em tempo real das regras
- **Autenticação e controle de acesso**:
  - Avaliadores: Acesso apenas às suas respectivas rotas de avaliação
  - Admin: Acesso às páginas de consenso e gerenciamento de times
  - Login obrigatório para acesso ao sistema

## Tecnologias

- **Frontend**: Next.js 14 (App Router) com TypeScript e Tailwind CSS
- **Backend**: API Routes do Next.js
- **Banco de dados**: 
  - Desenvolvimento: SQLite (via better-sqlite3)
  - Produção: Vercel Postgres
- **Deploy**: Vercel
- **Autenticação**: Cookies com middleware de proteção de rotas

## Setup Local

### Pré-requisitos

- Node.js 18+ ou 20+
- npm ou yarn
- Git

### Instalação

1. Clone o repositório:
   ```bash
   git clone <repository-url>
   cd volleyball-organizer
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure as variáveis de ambiente:
   Copie o arquivo `.env.example` para `.env` e preencha:
   ```env
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=sua_senha_aqui
   ```

   Para as credenciais dos avaliadores, o sistema usa:
   - Thiago / Thiago
   - Ramon / Ramon  
   - Douglas / Douglas

4. Execute o banco de dados e importe os participantes:
   ```bash
   npm run import-participants
   ```
   Isso criará o banco de dados SQLite local e importará os 63 participantes do arquivo `participants.csv`

5. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

   O aplicativo estará disponível em http://localhost:3000

### Estrutura de Rotas

- `/` - Página inicial (redireciona para login)
- `/login` - Página de login
- `/logout` - Página de logout
- `/evaluator/thiago` - Interface do avaliador Thiago
- `/evaluator/ramon` - Interface do avaliador Ramon
- `/evaluator/douglas` - Interface do avaliador Douglas
- `/consensus` - Visualização e edição de consenso (admin apenas)
- `/teams` - Geração e gerenciamento de times (admin apenas)

## Deploy no Vercel

### Pré-requisitos

- Conta no Vercel
- Projeto vinculado ao repositório Git
- Banco de dados Postgres configurado no Vercel

### Passos

1. Faça push do código para o repositório Git conectado ao Vercel
2. No painel do Vercel, configure as variáveis de ambiente:
   - `POSTGRES_URL`: String de conexão do Vercel Postgres
   - `ADMIN_USERNAME`: Nome de usuário do admin
   - `ADMIN_PASSWORD`: Senha do admin
3. O Vercel detectará automaticamente que é um projeto Next.js e fará o build
4. Após o deploy bem-sucedido, acesse a URL fornecida pelo Vercel

### Scripts Úteis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria a versão de produção
- `npm run start` - Inicia o servidor de produção
- `npm run lint` - Executa o ESLint
- `npm run import-participants` - Importa participantes do CSV para o banco de dados

## Estrutura do Banco de Dados

### Tabelas

1. **participants**
   - id (UUID, PK)
   - name (VARCHAR)
   - photo_url (TEXT, nullable)
   - gender (CHAR: 'M' ou 'F')
   - created_at (TIMESTAMP)

2. **evaluations**
   - id (UUID, PK)
   - participant_id (UUID, FK para participants)
   - evaluator_name (VARCHAR: 'Thiago', 'Ramon' ou 'Douglas')
   - level (VARCHAR: um dos 6 níveis)
   - ranking (INTEGER >= 1)
   - created_at (TIMESTAMP)
   - Constraint única: (participant_id, evaluator_name)

3. **team_assignments**
   - id (UUID, PK)
   - participant_id (UUID, FK para participants)
   - team_number (INTEGER: 1-4)
   - position_in_team (VARCHAR: nível do jogador no time)
   - assigned_at (TIMESTAMP)
   - Constraint única: (participant_id, team_number)

4. **participant_consensus**
   - participant_id (UUID, PK, FK para participants)
   - consensus_level (VARCHAR)
   - average_ranking (DECIMAL)
   - updated_at (TIMESTAMP)

## Algoritmo de Geração de Times

1. **Seleção de participantes**: 
   - Busca todos os participantes com dados de consenso
   - Para cada nível, seleciona os top 4 jogadores com melhor ranking (menor valor = melhor)

2. **Distribuição equilibrada (Snake Draft)**:
   - Ordena os níveis em uma sequência fixa
   - Para o primeiro nível, atribui aos times 1→2→3→4
   - Para o segundo nível, atribui aos times 4→3→2→1 (reverso)
   - Continua alternando a direção para cada nível subsequente
   - Isso distribui os melhores jogadores uniformemente entre os times

3. **Validação de gênero**:
   - Após a distribuição inicial, verifica se cada time tem pelo menos uma mulher
   - Se algum time não tiver, tenta trocar jogadores entre times mantendo a restrição de nível
   - Se não for possível satisfazer a restrição de gênero, o algoritmo falha e mostra uma mensagem de erro

## Variáveis de Ambiente

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `POSTGRES_URL` | String de conexão do Vercel Postgres | `postgres://user:pass@host:port/db` |
| `ADMIN_USERNAME` | Nome de usuário do administrador | `admin` |
| `ADMIN_PASSWORD` | Senha do administrador | `s3cr3t` |

## Contribuindo

1. Faça um fork do repositório
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Faça commit das suas alterações (`git commit -m 'Add some AmazingFeature'`)
4. Faça push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## Contato

Seu Nome - [seuemail@exemplo.com](mailto:seuemail@exemplo.com)

Link do Projeto: [https://github.com/seuusuario/volleyball-organizer](https://github.com/seuusuario/volleyball-organizer)

<!-- Last redeploy trigger: 2026-08-13 19:22:32 -->
