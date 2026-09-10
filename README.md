<div align="center">
  
# 🔬 Mini Cientista

**Um ecossistema de minigames educativos desenvolvido para o ensino interativo de ciências.**

[![Play Now](https://img.shields.io/badge/Play_Now-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://projeto-mini-cientistas.vercel.app/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](#)
[![Phaser 3](https://img.shields.io/badge/Phaser_3-E95066?style=for-the-badge&logo=cplusplus&logoColor=white)](#)

[Demonstração ao Vivo](https://projeto-mini-cientistas.vercel.app/) • [Funcionalidades](#-funcionalidades-e-mecânicas) • [Arquitetura Técnica](#-arquitetura-técnica) • [Rodando Localmente](#-rodando-localmente)

</div>

---

## 📖 Sobre o Projeto

O **Mini Cientista** é uma aplicação web gamificada (Single-Page Application) projetada para ensinar conceitos fundamentais de Biologia, Química e Odontologia. Desenvolvido com **TypeScript** e **Phaser 3**, o projeto utiliza uma arquitetura modular orientada a objetos, garantindo alta performance no navegador, escalabilidade de código e uma interface gráfica responsiva.

Os jogadores interagem com grandes figuras históricas da ciência, participam de desafios baseados em tempo e física, e constroem um Álbum de Conquistas dinâmico.

## 🕹️ Módulos Educacionais

A aplicação é dividida em três cenas (Scenes) principais de gameplay, cada uma implementando regras de negócio e lógicas de colisão únicas:

*   **🧪 Laboratório de Química (Marie Curie):** Mecânica de *point-and-click* com validação de arrays dinâmicos. O jogador deve interceptar átomos em movimento na tela para sintetizar moléculas reais (H₂O, CO₂).
*   **🧬 Laboratório de Biologia (Louis Pasteur):** Mecânica de *Drag-and-Drop*. Focado em taxonomia básica, exige que o jogador classifique microrganismos (probióticos vs. patógenos) em zonas de colisão (`DropZones`) específicas.
*   **🦷 Clínica de Odontologia (Pierre Fauchard):** Engine de *Arcade Physics* focada em ação e esquiva. Utiliza *Pathfinding* simplificado onde os inimigos (bactérias da cárie) perseguem ativamente o jogador, que deve coletar itens pela arena.

## 🚀 Funcionalidades e Mecânicas

*   **Sistema de Persistência (LocalStorage):** Gravação em tempo real dos recordes de pontuação (*High Scores*) e controle de desbloqueio de personagens no Álbum do jogador.
*   **Gerenciamento de Cenas Paralelas:** Separação estrita entre Lógica de Jogo e Interface de Usuário (HUD). Cenas de UI rodam em paralelo para garantir que menus suspensos e modais de Game Over não interfiram na física da engine.
*   **Animações e Feedback Visual:** Utilização extensiva de `Tweens` e `Particle Emitters` para transições suaves, *bounces* em botões e recompensas visuais (confetes, bolhas, rastros de movimento).
*   **Design Responsivo:** Lógica de redimensionamento (`setDisplaySize` e `Scale Manager`) para garantir que os elementos vetoriais e *sprites* se ajustem proporcionalmente a diferentes resoluções de tela.

## 🧠 Arquitetura Técnica

O projeto foi estruturado com as melhores práticas de desenvolvimento front-end e game dev:

*   **Linguagem:** TypeScript (Tipagem estática estrita e interfaces).
*   **Game Engine:** Phaser 3 (Renderização WebGL/Canvas).
*   **Build Tool:** Vite (HMR super rápido e empacotamento otimizado para produção).
*   **Asset Management:** Pré-carregamento otimizado de spritesheets, imagens estáticas em formato ícone e faixas de áudio nativas.

## 💻 Rodando Localmente

Para rodar uma cópia local do jogo para testes ou modificações, siga os passos:

**Pré-requisitos:** É necessário ter o [Node.js](https://nodejs.org/) instalado na máquina.

1. **Clone o repositório:**
    ```bash
    git clone [https://github.com/SEU-USUARIO/projeto-mini-cientistas.git](https://github.com/SEU-USUARIO/projeto-mini-cientistas.git)

2. **Acesse o diretório:
    ```Bash
    cd projeto-mini-cientistas

3. **Instale as dependências:***
    ```Bash
    npm install

4. **Inicie o servidor de desenvolvimento Vite:**
    ```Bash
    npm run dev

    Acesse http://localhost:5173 no seu navegador para jogar.

5. **Para compilar para produção:**
    ```Bash
    npm run build
