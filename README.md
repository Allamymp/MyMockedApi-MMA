Com certeza! O texto que acabei de gerar para o README já está formatado em Markdown, pronto para você copiar e colar diretamente no seu arquivo `README.md` no GitHub.

Aqui está ele novamente, no formato Markdown puro:


# My Mocked API (MMA)

![GitHub last commit](https://img.shields.io/github/last-commit/seu-usuario/seu-repositorio?style=flat-square)
![GitHub top language](https://img.shields.io/github/languages/top/seu-usuario/seu-repositorio?style=flat-square)
![GitHub repo size](https://img.shields.io/github/repo-size/seu-usuario/seu-repositorio?style=flat-square)

---

## 💻 Visão Geral

O My Mocked API (MMA) é uma ferramenta para desenvolvimento e testes que permite aos usuários criar e gerenciar endpoints de API mockados e templates de resposta. Ele consiste em uma aplicação **Node.js** para o backend (servidor de mocks e API de controle) e um frontend em **Angular** para a interface de usuário.

---

## ✨ Funcionalidades

* **Criação de Mocks:** Definição de endpoints HTTP com métodos, caminhos, status de resposta, headers e corpos customizados.
* **Gerenciamento de Templates:** Criação e reutilização de templates de corpo de resposta para mocks.
* **Registro de Requisições (Logs):** Visualização detalhada das requisições e respostas que trafegam pelo servidor de mocks.
* **Interface de Usuário (Angular):** Painel intuitivo para gerenciar mocks, templates e logs.

---

## 🛠️ Tecnologias Utilizadas

* **Backend:** Node.js, Express.js, File System (FS) API
* **Frontend:** Angular, Angular Material
* **Gerenciamento de Pacotes:** npm
* **Execução/Build:** Batch Script (`.bat`) para Windows, Shell Script (`.sh`) para Unix-like

---

## 🚀 Como Iniciar

Siga as instruções abaixo para configurar e executar o projeto localmente.

### Pré-requisitos

Certifique-se de ter as seguintes ferramentas instaladas:

* [Node.js](https://nodejs.org/) (versão LTS recomendada)
* [npm](https://www.npmjs.com/) (vem com o Node.js)
* [Angular CLI](https://angular.io/cli) (instale globalmente: `npm install -g @angular/cli@latest`)

### Instalação e Execução

1.  **Clone o repositório:**
    ```bash
    git clone [https://github.com/seu-usuario/seu-repositorio.git](https://github.com/seu-usuario/seu-repositorio.git)
    cd seu-repositorio
    ```

2.  **Execute o Script de Inicialização:**

    * **No Windows:**
        ```bash
        .\start.bat
        ```
        O script irá verificar as dependências, perguntar se deseja recompilar o frontend (se já existir um build), instalar as dependências do backend e iniciar o servidor Node.js.

    * **No Linux / macOS:**
        ```bash
        chmod +x start.sh
        ./start.sh
        ```
        O script irá verificar as dependências, perguntar se deseja recompilar o frontend (se já existir um build), instalar as dependências do backend e iniciar o servidor Node.js.

3.  **Acesse a Aplicação:**
    Após a execução bem-sucedida do script, a aplicação frontend estará disponível em `http://localhost:3000`. Os endpoints de controle da API serão exibidos no console.

---

## 📂 Estrutura do Projeto

.
├── backend/                  # Código fonte do servidor Node.js (API de controle e servidor de mocks)
│   ├── app.js                # Ponto de entrada do servidor
│   ├── routes/               # Definição das rotas da API
│   ├── utils/                # Funções utilitárias (ex: gerenciamento de arquivos, logs)
│   ├── requisitions_data/    # Dados de mocks e templates persistidos
│   ├── logs/                 # Logs de requisições
│   └── package.json          # Dependências do backend
├── frontend/                 # Código fonte da aplicação Angular (interface de usuário)
│   ├── src/                  # Código fonte do Angular
│   ├── dist/                 # Diretório de build do Angular (gerado após ng build)
│   └── package.json          # Dependências do frontend
├── start.bat                 # Script de inicialização para Windows
├── start.sh                  # Script de inicialização para Linux/macOS
└── README.md                 # Este arquivo


---

## 🤝 Contribuição

Contribuições são bem-vindas. Por favor, abra um *issue* para discutir funcionalidades ou melhorias, ou submeta um *pull request*.

---

## 📄 Licença

Este projeto está licenciado sob a [MIT License](https://opensource.org/licenses/MIT) - veja o arquivo `LICENSE` para detalhes.

---

## Contato

* [Allamy Monteiro/GitHub Profile] - `@Allamymp`
* [Email de Contato] - allamympereira@gmail.com
