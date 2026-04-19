import { Scene } from 'phaser';

export class HubLabsScene extends Scene {
    private labsCards = [
        { name: 'Química', image: 'labs/quimica' },
        { name: 'Física', image: 'labs/fisica' },
        { name: 'Biologia', image: 'labs/biologia' },
        { name: 'Odontologia', image: 'labs/odonto' },
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
                fontSize: '18px',
                color: '#3d3d3d',
                fontFamily: 'Fredoka'
            }).setOrigin(0.5);

            const textWidth = nameText.getBounds().width;
            const bgWidth = textWidth + 40;
            const bgHeight = 35;
            const radius = bgHeight / 2;
            const tagY = 210;

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
                this.tweens.add({
                    targets: img,
                    scale: { from: 0.85, to: 0.75 },
                    alpha: 1,
                    duration: 1000,
                    yoyo: true,
                    repeat: -1
                });
                this.tweens.add({ targets: tagGroup, alpha: 1, duration: 400 });
            } else {
                img.setScale(0.6).setAlpha(0.6);
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
        } else if (labName === 'Física' || labName === 'Química') {
            this.scene.start('Game');
        } else {
            console.log(`${labName} em desenvolvimento!`);
            // Se estiver em desenvolvimento, apenas fecha o popup
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
        overlay.setInteractive(new Phaser.Geom.Rectangle(-width/2, -height/2, width, height), Phaser.Geom.Rectangle.Contains);

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
}