# Veritas API

API REST simples em **Node.js + Express + TypeScript** para:

- autenticação segura de usuários;
- validação de dados de formulários;
- proteção de rotas por token;
- tratamento padronizado de erros.

## Arquitetura (simples e objetiva)

A aplicação segue uma arquitetura em camadas leves dentro do `server.ts`:

1. **Camada HTTP (Express)**
   - Recebe requisições, aplica middlewares e expõe endpoints REST.
2. **Camada de Segurança**
   - Rate limit por IP, cabeçalhos de segurança, hash de senha com PBKDF2 e autenticação via JWT (HS256).
3. **Camada de Validação**
   - Funções de validação para cadastro, login e formulário.
4. **Persistência (SQLite)**
   - Tabelas de `users` e `form_submissions` com `better-sqlite3`.

## Tecnologias sugeridas

- **Node.js** (runtime)
- **TypeScript** (tipagem e manutenção)
- **Express** (API REST)
- **better-sqlite3** (persistência local simples)
- **crypto nativo do Node.js**
  - PBKDF2 para senha
  - assinatura/verificação JWT com HMAC-SHA256
- **dotenv** para configuração via ambiente

## Endpoints principais

### Saúde
- `GET /api/health`
  - Retorna status da API.

### Autenticação
- `POST /api/auth/register`
  - Cadastra usuário (`name`, `email`, `password`).
- `POST /api/auth/login`
  - Autentica usuário e retorna `accessToken` JWT.

### Formulários (protegidos por token)
- `POST /api/forms/validate`
  - Valida payload do formulário sem persistir.
- `POST /api/forms/submit`
  - Valida e salva formulário no banco.
- `GET /api/forms`
  - Lista formulários do usuário autenticado.

## Autenticação (JWT)

Fluxo:
1. Usuário faz login com email/senha.
2. API valida credenciais.
3. API gera JWT com:
   - `sub` (id do usuário),
   - `email`,
   - `iat` e `exp` (expiração).
4. Front-end envia token no header:
   - `Authorization: Bearer <token>`

A API valida:
- estrutura do token,
- assinatura HMAC,
- expiração,
- comparação segura de assinatura (`timingSafeEqual`).

## Estratégias de validação e segurança

### Validação
- Cadastro:
  - nome mínimo,
  - email em formato válido,
  - senha mínima.
- Login:
  - obrigatoriedade de email/senha.
- Formulário:
  - nome mínimo,
  - email válido,
  - idade entre 18 e 120,
  - tamanho máximo da mensagem,
  - aceite obrigatório de termos.

### Segurança
- **Hash de senha** com PBKDF2 + salt aleatório.
- **JWT assinado** com segredo (`JWT_SECRET`).
- **Controle de acesso** via middleware de autenticação.
- **Rate limiting** por IP para reduzir abuso.
- **Headers de segurança** (`X-Frame-Options`, `X-Content-Type-Options`, etc).
- **Tratamento de erro padronizado** com códigos e mensagens claras.
- **Limite de payload JSON** (`100kb`) contra abuso.

## Como executar

```bash
npm install
npm run dev
```

Opcionalmente, configure `.env`:

```env
PORT=3000
JWT_SECRET=troque-este-segredo-em-producao
```

## Exemplo rápido

### Cadastro
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Ana Silva","email":"ana@email.com","password":"senha1234"}'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ana@email.com","password":"senha1234"}'
```

### Validar formulário com token
```bash
curl -X POST http://localhost:3000/api/forms/validate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "fullName":"Ana Silva",
    "email":"ana@email.com",
    "age":28,
    "message":"Gostaria de validar meu formulário",
    "acceptedTerms":true
  }'
```
