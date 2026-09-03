import { Scene } from 'phaser';

export class HubLabsScene extends Scene {
    private labsCards = [
        { name: 'Biologia', image: 'labs/biologia' },     // <--- Agora é o primeiro!
        { name: 'Odontologia', image: 'labs/odonto' },
        { name: 'Química', image: 'labs/quimica' },
        { name: 'Física', image: 'labs/fisica' },
        { name: 'Medicina', image: 'labs/medicina' },
        //{ name: 'Inteligência Artificial', image: 'labs/ia' }
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

        // Adiciona as setas indicativas do carrossel
        this.createArrows();

        // Cria a barra de progresso com os rostinhos desbloqueados
        this.createProgressionIcons();

        // Caixa de instrução no canto superior direito
        this.createInstructionBox();

        // ==========================================
        // --- GERENCIAMENTO SEGURO DA MÚSICA ---
        // ==========================================

        if (!this.bgMusic || !this.bgMusic.isPlaying) {
            if (this.cache.audio.exists('Carrosel')) {
                this.bgMusic = this.sound.add('Carrosel', { volume: 0.3, loop: true });
                this.bgMusic.play();
            }
        }

        // ==========================================
        // CÓDIGO SECRETO: Digite Z-E-R-A-R para limpar a memória
        // ==========================================

        const comboZerar = this.input.keyboard!.createCombo('ZERAR', {
            resetOnWrongKey: true,
            maxKeyDelay: 0,
            resetOnMatch: true
        });

        this.input.keyboard!.on('keycombomatch', (event: Phaser.Input.Keyboard.KeyCombo) => {
            if (event.keyCodes.toString() === comboZerar.keyCodes.toString()) {
                console.log('Código secreto ativado! Zerando progresso...');

                localStorage.removeItem('unlockedCharacters');
                localStorage.removeItem('biologiaRecorde');
                localStorage.removeItem('odontoRecorde');

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

            const textWidth = nameText.getBounds().width;
            const bgWidth = textWidth + 90;
            const bgHeight = 85;
            const radius = bgHeight / 2;

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
                this.tweens.add({
                    targets: img,
                    scale: 1.0,
                    alpha: 1,
                    duration: 400,
                    ease: 'Power2'
                });
                
                this.tweens.add({
                    targets: img,
                    y: -15,
                    duration: 1500,
                    yoyo: true,
                    repeat: -1, 
                    ease: 'Sine.easeInOut'
                });

                this.tweens.add({ targets: tagGroup, alpha: 1, duration: 400 });
            } else {
                this.tweens.add({
                    targets: img,
                    scale: 0.55,
                    alpha: 0.5,
                    y: 0,
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

        let startX = 0;

        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            startX = pointer.x;
        });

        this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
            if (this.isPopupOpen) return;

            const dragDistance = pointer.x - startX;

            if (dragDistance > 50) {
                this.move(-1);
            } else if (dragDistance < -50) {
                this.move(1);
            }
            else if (Math.abs(dragDistance) < 10) {
                const localX = pointer.x - this.container.x;
                const clickedIndex = Math.round(localX / this.cardWidth);
                if (clickedIndex === this.currentIndex) {
                    this.requestLabAccess();
                }
            }
        });

        this.events.once('shutdown', () => {
            this.input.keyboard?.removeAllListeners();
        });
    }

    private move(delta: number) {
        if (!this.isAnimating && !this.isPopupOpen) {
            this.currentIndex += delta;
            this.updateCarousel();
        }
    }

    private requestLabAccess() {
        if (this.isPopupOpen) return;
        this.isPopupOpen = true;

        const labName = this.cards[this.currentIndex].getData('name');

        this.popupText.setText(`Deseja iniciar a aventura no\nLaboratório de ${labName}?`);

        this.popupContainer.setActive(true).setVisible(true);
        this.tweens.add({
            targets: this.popupContainer,
            scale: { from: 0.8, to: 1 },
            alpha: { from: 0, to: 1 },
            duration: 300,
            ease: 'Back.easeOut'
        });
    }

    private confirmLabAccess() {
        const labName = this.cards[this.currentIndex].getData('name');

        if (labName === 'Biologia') {
            this.scene.start('HubLabsBiologia');
        } else if (labName === 'Odontologia') {
            this.scene.start('HubLabsOdontologia');
        } else if (labName === 'Química') {
            // ---> AQUI ESTÁ A CORREÇÃO: Encaminha direto para a cena da Química!
            this.scene.start('HubLabsQuimica');
        } else if (labName === 'Física') {
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
                this.isPopupOpen = false;
            }
        });
    }

    private createPopupUI() {
        const { width, height } = this.scale;

        this.popupContainer = this.add.container(width / 2, height / 2);
        this.popupContainer.setDepth(100);

        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.7);
        overlay.fillRect(-width / 2, -height / 2, width, height);
        overlay.setInteractive(new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height), Phaser.Geom.Rectangle.Contains);

        const boxWidth = 450;
        const boxHeight = 250;
        const box = this.add.graphics();
        box.fillStyle(0xffffff, 1);
        box.fillRoundedRect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight, 20);
        box.lineStyle(4, 0xff69b4); 
        box.strokeRoundedRect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight, 20);

        const titleText = this.add.text(0, -boxHeight * 0.3, 'NOVA AVENTURA!', {
            fontFamily: 'Fredoka', fontSize: '28px', color: '#ff69b4', fontStyle: 'bold'
        }).setOrigin(0.5);

        this.popupText = this.add.text(0, -10, '', {
            fontFamily: 'Fredoka', fontSize: '20px', color: '#3d3d3d', align: 'center'
        }).setOrigin(0.5);

        const btnSimBg = this.add.graphics();
        btnSimBg.fillStyle(0x28a745, 1);
        btnSimBg.fillRoundedRect(-180, 50, 150, 50, 15);

        const btnSimText = this.add.text(-105, 75, 'SIM, VAMOS!', {
            fontFamily: 'Fredoka', fontSize: '20px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);

        const btnSimZone = this.add.zone(-105, 75, 150, 50).setInteractive({ useHandCursor: true });
        btnSimZone.on('pointerdown', () => this.confirmLabAccess());

        const btnNaoBg = this.add.graphics();
        btnNaoBg.fillStyle(0x6c757d, 1);
        btnNaoBg.fillRoundedRect(30, 50, 150, 50, 15);

        const btnNaoText = this.add.text(105, 75, 'AGORA NÃO', {
            fontFamily: 'Fredoka', fontSize: '20px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);

        const btnNaoZone = this.add.zone(105, 75, 150, 50).setInteractive({ useHandCursor: true });
        btnNaoZone.on('pointerdown', () => this.closePopup());

        this.popupContainer.add([overlay, box, titleText, this.popupText, btnSimBg, btnSimText, btnSimZone, btnNaoBg, btnNaoText, btnNaoZone]);
        this.popupContainer.setActive(false).setVisible(false);
    }

    private createArrows() {
        const { width, height } = this.scale;
        const arrowY = height * 0.77;

        const leftArrow = this.add.image(width * 0.15, arrowY, 'seta-esquerda')
            .setInteractive({ useHandCursor: true })
            .setDepth(50)
            .setScale(0.35);

        const rightArrow = this.add.image(width * 0.85, arrowY, 'seta-direita')
            .setInteractive({ useHandCursor: true })
            .setDepth(50)
            .setScale(0.35);

        leftArrow.on('pointerdown', () => {
            if (!this.isPopupOpen) this.move(-1);
        });

        rightArrow.on('pointerdown', () => {
            if (!this.isPopupOpen) this.move(1);
        });

        this.tweens.add({ targets: leftArrow, x: '-=20', duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.tweens.add({ targets: rightArrow, x: '+=20', duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    private createProgressionIcons() {
        const { width, height } = this.scale;
        const headerHeight = height * 0.18;

        const unlockedString = localStorage.getItem('unlockedCharacters') || 'Julia';
        const unlockedArray = unlockedString.split(',').filter(Boolean);

        if (unlockedArray.length === 0) return;

        const paddingX = 100;
        const startY = headerHeight + 50; 
        const gap = 145;                  
        const iconTargetScale = 0.20;     

        unlockedArray.forEach((charName, index) => {
            const xPos = paddingX + (index * gap);
            const imgKey = `${charName}-Icone`;

            const glow = this.add.graphics();
            glow.fillStyle(0xffffff, 0.3);
            glow.fillCircle(xPos, startY, 35);
            glow.setDepth(5); 

            const icon = this.add.image(xPos, startY, imgKey);
            icon.setDepth(6);
            icon.setScale(0); 

            icon.setInteractive({ useHandCursor: true });

            icon.on('pointerdown', () => {
                if (!this.isPopupOpen) { 
                    this.scene.start('AlbumScene');
                }
            });

            icon.on('pointerover', () => {
                this.tweens.add({ targets: icon, scale: iconTargetScale * 1.2, duration: 100 });
            });
            icon.on('pointerout', () => {
                this.tweens.add({ targets: icon, scale: iconTargetScale, duration: 100 });
            });

            this.tweens.add({
                targets: [icon, glow],
                scale: { from: 0, to: 1 }, 
                duration: 500,
                delay: index * 150,
                ease: 'Back.easeOut',
                onStart: () => {
                    icon.setScale(0);
                },
                onUpdate: (tween) => {
                    const progress = tween.getValue() as number;
                    icon.setScale(progress * iconTargetScale);
                }
            });
        });
    }

    private createInstructionBox() {
        const { width, height } = this.scale;

        const headerHeight = height * 0.15;
        const startY = headerHeight + 20;
        const paddingRight = 40; 

        const msgText = this.add.text(0, 0, 'Colecione os Ícones dos\nCientistas históricos!', {
            fontFamily: 'Fredoka',
            fontSize: '20px',
            color: '#3d3d3d',
            align: 'right',
            fontStyle: 'bold'
        }).setOrigin(1, 0); 

        msgText.setPosition(width - paddingRight - 15, startY + 15);

        const boxWidth = msgText.width + 30;
        const boxHeight = msgText.height + 30;
        const boxX = width - paddingRight - boxWidth;
        const boxY = startY;

        const bg = this.add.graphics();
        bg.fillStyle(0xffffff, 0.85); 
        bg.fillRoundedRect(boxX, boxY, boxWidth, boxHeight, 12);
        bg.lineStyle(3, 0x87ceeb);    
        bg.strokeRoundedRect(boxX, boxY, boxWidth, boxHeight, 12);

        const containerBox = this.add.container(0, -15, [bg, msgText]);
        containerBox.setAlpha(0);

        this.tweens.add({
            targets: containerBox,
            alpha: 1,
            y: 0,
            duration: 800,
            ease: 'Power2',
            delay: 300 
        });
    }
}