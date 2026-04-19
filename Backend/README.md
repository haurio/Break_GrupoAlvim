# Guia de Execução - Gestão Break

Siga estes passos para rodar o projeto com sucesso.

## 1. Configuração do PostgreSQL
Abra o arquivo [`.env`](./.env) e certifique-se de que a senha em `DB_PASSWORD` é a senha correta do seu PostgreSQL.

## 2. Instalação e Inicialização
No terminal, dentro da pasta `Backend`:
1. Instale as dependências (se ainda não fez):
   ```bash
   npm install
   ```
2. Inicialize as tabelas do banco de dados:
   ```bash
   node db/init.js
   ```
   *Verifique se o terminal mostra "DATABASE_INIT - COMPLETED".*

## 3. Rodar o Servidor
Com o terminal ainda na pasta `Backend`, execute:
```bash
node server.js
```
O terminal deve mostrar `BACKEND ONLINE`.

## 4. Acessar o Projeto
**Importante**: O backend é apenas uma API. Para ver o site você deve abrir o frontend.
1. Abra o arquivo `Public/login.html` no seu navegador.
2. Pressione `F12` e vá na aba **Console** para ver os logs de execução que implementamos.

## Logs
- **Terminal**: Mostra cada passo da execução do servidor.
- **Arquivo**: Verifique o arquivo `app.log` na pasta `Backend` para o histórico completo.
- **Navegador**: Verifique o Console (F12) para ver a comunicação com o banco.
