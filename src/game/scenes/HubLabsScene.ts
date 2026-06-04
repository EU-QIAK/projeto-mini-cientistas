import { Scene } from 'phaser';

export class HubLabsScene extends Scene {
    private labsCards = [
        { name: 'Biologia', image: 'labs/biologia' },     // <--- Agora é o primeiro!
        { name: 'Odontologia', image: 'labs/odonto' },
        { name: 'Química', image: 'labs/quimica' },
        { name: 'Física', image: 'labs/fisica' },
        { name: 'Medicina', image: 'labs/medicina' },
        { name: 'Inteligência Artificial', image: 'labs/ia' }
    ];

    private container!: Phaser.GameObjects.Container;
    private cards: Phaser.GameObjects.Container[] = [];
    private currentIndex = 2;
    private isAnimating = false;
    private cardWidth = 430;

    // --- NOVAS VARIÁVEIS DO POPUP ---
    private isPopupOpen = false;
    private popupContainer!: Phaser.GameObjects.Container;
    private popupText!: Phaser.GameObjects.Text;

    //variável de som
    private bgMusic!: Phaser.Sound.BaseSound;

    constructor() {
        super('HubLabsScene');
    }

    create() {
        this.cards = [];
        this.currentIndex = 2;
        this.isAnimating = false;
        this.isPopupOpen = false;

        this.input.keyboard?.removeAllListeners();
        this.input.removeAllListeners();

        const { width, height } = this.scale;

        const bg = this.add.image(width / 2, height / 2, 'backgrounds/menu-laboratorio');
        bg.setDisplaySize(width, height);
        bg.postFX.addBlur(0, 2, 2, 1);

        this.container = this.add.container(width / 2, height / 2);

        this.setupCarousel();
        this.setupControls();
        this.updateCarousel(false);

        // Cria a interface do Popup (invisível no começo)
        this.createPopupUI();

        // NOVO: Adiciona as setas indicativas do carrossel
        this.createArrows();

        // NOVO: Cria a barra de progresso com os rostinhos desbloqueados!
        this.createProgressionIcons();

        // ==========================================
        // --- GERENCIAMENTO SEGURO DA MÚSICA ---
        // ==========================================

        // 1. Verifica se a música já existe e já está tocando. Se sim, não fazemos nada!
        // Isso evita que a música fique "dobrada" quando o jogador volta de um minigame.
        if (!this.bgMusic || !this.bgMusic.isPlaying) {

            // ATENÇÃO: Verifique se a chave 'Carrosel' é exatamente a mesma que está no Preloader.ts
            this.bgMusic = this.sound.add('Carrosel', { volume: 0.3, loop: true });
            this.bgMusic.play();
        }

        // ==========================================
        // CÓDIGO SECRETO: Digite Z-E-R-A-R para limpar a memória
        // ==========================================

        // 1. Cria o combo com a palavra secreta
        const comboZerar = this.input.keyboard!.createCombo('ZERAR', {
            resetOnWrongKey: true, // Se errar uma letra, a sequência zera
            maxKeyDelay: 0,        // Sem limite de tempo entre as teclas
            resetOnMatch: true
        });

        // 2. Fica escutando para ver se o jogador acertou a sequência
        this.input.keyboard!.on('keycombomatch', (event: Phaser.Input.Keyboard.KeyCombo) => {

            // Verifica se o combo que deu 'match' é o de zerar
            if (event.keyCodes.toString() === comboZerar.keyCodes.toString()) {
                console.log('Código secreto ativado! Zerando progresso...');

                // Limpa o localStorage
                localStorage.removeItem('unlockedCharacters');
                localStorage.removeItem('biologiaRecorde');

                // Recarrega a página para tudo voltar ao início
                window.location.reload();
            }
        });

        this.events.once('shutdown', () => {
            if (this.bgMusic && this.bgMusic.isPlaying) {
                this.bgMusic.stop();
            }
        });

    }

    private setupCarousel() {
        const items = [
            ...this.labsCards.slice(-2),
            ...this.labsCards,
            ...this.labsCards.slice(0, 2)
        ];

        items.forEach((lab, i) => {
            const xPos = (i * this.cardWidth);
            const card = this.add.container(xPos, 0);

            const img = this.add.image(0, 0, lab.image).setScale(0.7).setAlpha(0.8);

            const nameText = this.add.text(0, 0, lab.name, {
                fontSize: '26px',
                color: '#3d3d3d',
                fontFamily: 'Fredoka'
            }).setOrigin(0.5);

            // --- FUNDO DA TAG MODIFICADO ---
            const textWidth = nameText.getBounds().width;

            // 1. LARGURA
            const bgWidth = textWidth + 90;

            // 2. ALTURA
            const bgHeight = 85;

            const radius = bgHeight / 2;

            // MUDEI AQUI: Agora a tag usa a mesma altura que as setas (75% da tela)
            // IMPORTANTE: Como o container principal já está centralizado (height/2),
            // nós precisamos calcular a diferença para descer a tag pro lugar certo.
            const tagY = (this.scale.height * 0.77) - (this.scale.height / 2);

            const tagContainer = this.add.container(0, tagY);
            const nameBg = this.add.graphics();

            nameBg.fillStyle(0x000000, 0.15);
            nameBg.fillRoundedRect((-bgWidth / 2) + 1, (-bgHeight / 2) + 2, bgWidth, bgHeight, radius);
            nameBg.fillStyle(0xffffff, 1);
            nameBg.fillRoundedRect(-bgWidth / 2, -bgHeight / 2, bgWidth, bgHeight, radius);

            tagContainer.add([nameBg, nameText]);
            tagContainer.setAlpha(0);

            card.add([img, tagContainer]);
            card.setData('name', lab.name);

            this.container.add(card);
            this.cards.push(card);
        });
    }

    private updateCarousel(animate = true) {
        if (this.isAnimating) return;

        const targetX = (this.scale.width / 2) - (this.currentIndex * this.cardWidth);

        if (animate) {
            this.isAnimating = true;
            this.tweens.add({
                targets: this.container,
                x: targetX,
                duration: 500,
                ease: 'Cubic.easeOut',
                onComplete: () => {
                    this.isAnimating = false;
                    this.handleInfiniteLoop();
                }
            });
        } else {
            this.container.x = targetX;
        }

        this.cards.forEach((card, i) => {
            const isActive = i === this.currentIndex;
            const img = card.list[0] as Phaser.GameObjects.Image;
            const tagGroup = card.list[1] as Phaser.GameObjects.Container;

            this.tweens.killTweensOf(img);
            this.tweens.killTweensOf(tagGroup);

            if (isActive) {
                // --- ATIVO: Fica Grande, Opaco e Parado ---
                this.tweens.add({
                    targets: img,
                    scale: 0.9, // <--- Maior que os outros! (Ajuste esse número se quiser ainda maior)
                    alpha: 1,
                    duration: 400,
                    ease: 'Power2'
                });
                this.tweens.add({ targets: tagGroup, alpha: 1, duration: 400 });
            } else {
                // --- INATIVO: Fica Pequeno e Semi-transparente ---
                this.tweens.add({
                    targets: img,
                    scale: 0.55, // <--- Menor que o principal
                    alpha: 0.5,  // <--- Mais apagadinho
                    duration: 400,
                    ease: 'Power2'
                });
                this.tweens.add({ targets: tagGroup, alpha: 0, duration: 200 });
            }
        });
    }

    private handleInfiniteLoop() {
        const len = this.labsCards.length;
        if (this.currentIndex < 2) {
            this.currentIndex += len;
            this.updateCarousel(false);
        } else if (this.currentIndex >= len + 2) {
            this.currentIndex -= len;
            this.updateCarousel(false);
        }
    }

    private setupControls() {
        this.input.keyboard?.on('keydown-RIGHT', () => this.move(1));
        this.input.keyboard?.on('keydown-LEFT', () => this.move(-1));
        this.input.keyboard?.on('keydown-ENTER', () => this.requestLabAccess());

        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (this.isPopupOpen) return; // Bloqueia clique no fundo se o popup estiver aberto

            const localX = pointer.x - this.container.x;
            const clickedIndex = Math.round(localX / this.cardWidth);
            if (clickedIndex === this.currentIndex) {
                this.requestLabAccess();
            }
        });

        this.events.once('shutdown', () => {
            this.input.keyboard?.removeAllListeners();
        });

        this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
            if (this.isPopupOpen) return; // Bloqueia swipe se popup estiver aberto

            const swipeThreshold = 50;
            if (pointer.upX - pointer.downX > swipeThreshold) this.move(-1);
            else if (pointer.downX - pointer.upX > swipeThreshold) this.move(1);
        });
    }

    private move(delta: number) {
        // Se o popup estiver aberto, ignora as setas do teclado/swipe
        if (!this.isAnimating && !this.isPopupOpen) {
            this.currentIndex += delta;
            this.updateCarousel();
        }
    }

    // --- NOVA FUNÇÃO: Abre o Popup em vez de ir direto ---
    private requestLabAccess() {
        if (this.isPopupOpen) return;
        this.isPopupOpen = true;

        const labName = this.cards[this.currentIndex].getData('name');

        // Atualiza o texto do popup com o nome do laboratório escolhido
        this.popupText.setText(`Deseja iniciar a aventura no\nLaboratório de ${labName}?`);

        // Animação de entrada do Popup
        this.popupContainer.setActive(true).setVisible(true);
        this.tweens.add({
            targets: this.popupContainer,
            scale: { from: 0.8, to: 1 },
            alpha: { from: 0, to: 1 },
            duration: 300,
            ease: 'Back.easeOut'
        });
    }

    // --- NOVA FUNÇÃO: O Código antigo de transição veio parar aqui ---
    private confirmLabAccess() {
        const labName = this.cards[this.currentIndex].getData('name');

        if (labName === 'Biologia') {
            this.scene.start('HubLabsBiologia');
        } else if (labName === 'Odontologia') {
            // --- CORREÇÃO AQUI: Mudando a chave para o nome completo ---
            this.scene.start('HubLabsOdontologia');
        } else if (labName === 'Física' || labName === 'Química') {
            this.scene.start('Game');
        } else {
            console.log(`${labName} em desenvolvimento!`);
            this.closePopup();
        }
    }

    private closePopup() {
        this.tweens.add({
            targets: this.popupContainer,
            scale: 0.8,
            alpha: 0,
            duration: 200,
            ease: 'Power2',
            onComplete: () => {
                this.popupContainer.setActive(false).setVisible(false);
                this.isPopupOpen = false; // Libera os controles do carrossel novamente
            }
        });
    }

    // --- NOVA FUNÇÃO: Desenha toda a interface do Popup ---
    private createPopupUI() {
        const { width, height } = this.scale;

        this.popupContainer = this.add.container(width / 2, height / 2);
        this.popupContainer.setDepth(100);

        // Película preta semi-transparente
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.7);
        overlay.fillRect(-width / 2, -height / 2, width, height);
        // Intercepta cliques para não vazarem para o carrossel
        overlay.setInteractive(new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height), Phaser.Geom.Rectangle.Contains);

        // Fundo branco do Popup
        const boxWidth = 450;
        const boxHeight = 250;
        const box = this.add.graphics();
        box.fillStyle(0xffffff, 1);
        box.fillRoundedRect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight, 20);
        box.lineStyle(4, 0xff69b4); // Borda rosa da sua UI
        box.strokeRoundedRect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight, 20);

        // Título do Popup
        const titleText = this.add.text(0, -boxHeight * 0.3, 'NOVA AVENTURA!', {
            fontFamily: 'Fredoka', fontSize: '28px', color: '#ff69b4', fontStyle: 'bold'
        }).setOrigin(0.5);

        // Pergunta dinâmica (atualizada em requestLabAccess)
        this.popupText = this.add.text(0, -10, '', {
            fontFamily: 'Fredoka', fontSize: '20px', color: '#3d3d3d', align: 'center'
        }).setOrigin(0.5);

        // --- BOTÃO SIM ---
        const btnSimBg = this.add.graphics();
        btnSimBg.fillStyle(0x28a745, 1); // Verde sucesso
        btnSimBg.fillRoundedRect(-180, 50, 150, 50, 15);

        const btnSimText = this.add.text(-105, 75, 'SIM, VAMOS!', {
            fontFamily: 'Fredoka', fontSize: '20px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);

        const btnSimZone = this.add.zone(-105, 75, 150, 50).setInteractive({ useHandCursor: true });
        btnSimZone.on('pointerdown', () => this.confirmLabAccess());

        // --- BOTÃO NÃO ---
        const btnNaoBg = this.add.graphics();
        btnNaoBg.fillStyle(0x6c757d, 1); // Cinza
        btnNaoBg.fillRoundedRect(30, 50, 150, 50, 15);

        const btnNaoText = this.add.text(105, 75, 'AGORA NÃO', {
            fontFamily: 'Fredoka', fontSize: '20px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);

        const btnNaoZone = this.add.zone(105, 75, 150, 50).setInteractive({ useHandCursor: true });
        btnNaoZone.on('pointerdown', () => this.closePopup());

        // Adiciona tudo ao container principal
        this.popupContainer.add([overlay, box, titleText, this.popupText, btnSimBg, btnSimText, btnSimZone, btnNaoBg, btnNaoText, btnNaoZone]);

        // Esconde o popup no início
        this.popupContainer.setActive(false).setVisible(false);
    }

    // --- NOVA FUNÇÃO: SETAS ANIMADAS DO CARROSSEL ---
    private createArrows() {
        const { width, height } = this.scale;

        // Posição vertical na parte de baixo (85% da tela)
        const arrowY = height * 0.77;

        // --- Seta Esquerda ---
        const leftArrow = this.add.image(width * 0.15, arrowY, 'seta-esquerda')
            .setInteractive({ useHandCursor: true })
            .setDepth(50)
            .setScale(0.35); // <--- MUDEI AQUI: Diminui a seta para 60% do tamanho

        // --- Seta Direita ---
        const rightArrow = this.add.image(width * 0.85, arrowY, 'seta-direita')
            .setInteractive({ useHandCursor: true })
            .setDepth(50)
            .setScale(0.35); // <--- MUDEI AQUI: Diminui a seta para 60% do tamanho

        // --- Eventos de Clique ---
        leftArrow.on('pointerdown', () => {
            if (!this.isPopupOpen) this.move(-1);
        });

        rightArrow.on('pointerdown', () => {
            if (!this.isPopupOpen) this.move(1);
        });

        // --- Animação (Tween) para chamar atenção ---
        this.tweens.add({
            targets: leftArrow,
            x: '-=20', // Move 10 pixels pra esquerda
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.tweens.add({
            targets: rightArrow,
            x: '+=20', // Move 10 pixels pra direita
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    // --- NOVA FUNÇÃO: ÁLBUM DE PROGRESSO (ROSTINHOS) ---
    private createProgressionIcons() {
        const { width, height } = this.scale;

        // 1. Calcula a altura da barra da UIScene para saber onde começar
        const headerHeight = height * 0.18;

        const unlockedString = localStorage.getItem('unlockedCharacters') || 'Julia';
        const unlockedArray = unlockedString.split(',').filter(Boolean);

        // Se não houver progresso, não desenha nada
        if (unlockedArray.length === 0) return;

        // 2. Configurações de layout responsivo
        const paddingX = 100;
        const startY = headerHeight + 50; // Posiciona 50px abaixo da barra da UIScene
        const gap = 130;                   // Espaço entre os centros dos ícones
        const iconTargetScale = 0.20;     // Tamanho final do rostinho

        unlockedArray.forEach((charName, index) => {
            const xPos = paddingX + (index * gap);
            const imgKey = `${charName}-Icone`;

            // --- ESTILO: Círculo de fundo suave para destacar o ícone ---
            const glow = this.add.graphics();
            glow.fillStyle(0xffffff, 0.3);
            glow.fillCircle(xPos, startY, 35);
            glow.setDepth(5); // Garante que fica atrás do ícone, mas acima do fundo

            // --- O ÍCONE ---
            const icon = this.add.image(xPos, startY, imgKey);
            icon.setDepth(6);
            icon.setScale(0); // Começa invisível para a animação

            // Animação de entrada "Pop"
            this.tweens.add({
                targets: [icon, glow],
                scale: { from: 0, to: 1 }, // O glow vai para escala 1, o ícone tratamos abaixo
                duration: 500,
                delay: index * 150,
                ease: 'Back.easeOut',
                onStart: () => {
                    // Ajuste fino da escala final do ícone dentro da tween
                    icon.setScale(0);
                },
                onUpdate: (tween) => {
                    // Dizemos ao TypeScript: "Pode confiar, isso aqui é um número!"
                    const progress = tween.getValue() as number;
                    icon.setScale(progress * iconTargetScale);
                }
            });
        });
    }


}