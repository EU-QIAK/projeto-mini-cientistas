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

    constructor() {
        super('HubLabsScene');
    }

    create() {
        this.cards = [];
        this.currentIndex = 2;
        this.isAnimating = false;

        // Limpeza de listeners para evitar duplicidade
        this.input.keyboard?.removeAllListeners();
        this.input.removeAllListeners();

        const { width, height } = this.scale;

        // Configuração do fundo com desfoque
        const bg = this.add.image(width / 2, height / 2, 'backgrounds/menu-laboratorio');
        bg.setDisplaySize(width, height);
        bg.postFX.addBlur(0, 2, 2, 1);

        // Container principal que move o carrossel
        this.container = this.add.container(width / 2, height / 2);

        this.setupCarousel();
        this.setupControls();
        this.updateCarousel(false);
    }

    private setupCarousel() {
        // Clones para o efeito de loop infinito
        const items = [
            ...this.labsCards.slice(-2),
            ...this.labsCards,
            ...this.labsCards.slice(0, 2)
        ];

        items.forEach((lab, i) => {
            const xPos = (i * this.cardWidth);
            const card = this.add.container(xPos, 0);

            // Imagem do Laboratório
            const img = this.add.image(0, 0, lab.image).setScale(0.7).setAlpha(0.8);
            
            // Texto do nome
            const nameText = this.add.text(0, 0, lab.name, {
                fontSize: '18px',
                color: '#3d3d3d',
                fontFamily: 'Fredoka'
            }).setOrigin(0.5);

            // Fundo da tag com ajuste dinâmico ao texto
            const textWidth = nameText.getBounds().width;
            const bgWidth = textWidth + 40;
            const bgHeight = 35;
            const radius = bgHeight / 2;
            const tagY = 210;

            const tagContainer = this.add.container(0, tagY);
            const nameBg = this.add.graphics();

            // Camada de sombra e fundo da tag
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

        // Animação de movimento do container principal
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

        // Atualização visual dos cards (escala, opacidade e tags)
        this.cards.forEach((card, i) => {
            const isActive = i === this.currentIndex;
            const img = card.list[0] as Phaser.GameObjects.Image;
            const tagGroup = card.list[1] as Phaser.GameObjects.Container;

            this.tweens.killTweensOf(img);
            this.tweens.killTweensOf(tagGroup);

            if (isActive) {
                // Efeito de pulse e opacidade para o item central
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
                // Estado dos itens laterais
                img.setScale(0.6).setAlpha(0.6);
                this.tweens.add({ targets: tagGroup, alpha: 0, duration: 200 });
            }
        });
    }

    private handleInfiniteLoop() {
        // Reposicionamento instantâneo para manter o loop
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
        // Controles de teclado
        this.input.keyboard?.on('keydown-RIGHT', () => this.move(1));
        this.input.keyboard?.on('keydown-LEFT', () => this.move(-1));
        this.input.keyboard?.on('keydown-ENTER', () => this.selectActiveLab());

        // Seleção por clique direto no card ativo
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            const localX = pointer.x - this.container.x;
            const clickedIndex = Math.round(localX / this.cardWidth);
            if (clickedIndex === this.currentIndex) {
                this.selectActiveLab();
            }
        });

        this.events.once('shutdown', () => {
            this.input.keyboard?.removeAllListeners();
        });

        // Detecção de Swipe/Arraste
        this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
            const swipeThreshold = 50;
            if (pointer.upX - pointer.downX > swipeThreshold) this.move(-1);
            else if (pointer.downX - pointer.upX > swipeThreshold) this.move(1);
        });
    }

    private move(delta: number) {
        if (!this.isAnimating) {
            this.currentIndex += delta;
            this.updateCarousel();
        }
    }

    private selectActiveLab() {
    const labName = this.cards[this.currentIndex].getData('name');
    
    if (labName === 'Biologia') {
        // Agora vai para a cena correta da trilha de biologia
        this.scene.start('HubLabsBiologia'); 
    } else if (labName === 'Física' || labName === 'Química') {
        this.scene.start('Game');
    } else {
        console.log(`${labName} em desenvolvimento!`);
    }
}
}
