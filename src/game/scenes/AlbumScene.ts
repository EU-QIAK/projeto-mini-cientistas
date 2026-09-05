import { Scene, GameObjects } from 'phaser';

export class AlbumScene extends Scene {
    constructor() {
        super('AlbumScene');
    }

    create() {
        // Pausa qualquer UI sobreposta para limpar a tela
        this.scene.stop('UIScene');

        const { width, height } = this.scale;

        // 1. Fundo do Laboratório (borrado para dar foco ao álbum)
        const bg = this.add.image(width / 2, height / 2, 'backgrounds/menu-laboratorio');
        bg.setDisplaySize(width, height);
        bg.setAlpha(0.6);
        bg.postFX.addBlur(0, 3, 3, 1);

        // Película escura sutil para destacar os cartões brancos
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.2);
        overlay.fillRect(0, 0, width, height);

        // 2. Título da Tela Estilizado (Combinando com o Hub)
        const titleText = this.add.text(width / 2, height * 0.12, 'ÁLBUM DE CIENTISTAS', {
            fontFamily: 'Fredoka', fontSize: '48px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);
        titleText.setStroke('#ff69b4', 6); // Contorno rosa choque
        titleText.setShadow(0, 4, 'rgba(0,0,0,0.3)', 4, false, true);

        // ==========================================
        // 3. BOTÃO VOLTAR (ESTILO TRILHAS - ROSA)
        // ==========================================
        const btnWidth = 160;
        const btnHeight = 55;
        const btnX = 130;
        const btnY = height * 0.12;

        const btnBackContainer = this.add.container(btnX, btnY);

        const btnBackBg = this.add.graphics();
        btnBackBg.fillStyle(0xff69b4, 1); // Rosa das trilhas
        btnBackBg.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 25);
        btnBackBg.lineStyle(3, 0xffffff); // Borda branca
        btnBackBg.strokeRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 25);

        const btnBackText = this.add.text(0, 0, '⬅ VOLTAR', {
            fontFamily: 'Fredoka', fontSize: '22px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);

        const btnBackZone = this.add.zone(0, 0, btnWidth, btnHeight).setInteractive({ useHandCursor: true });

        btnBackContainer.add([btnBackBg, btnBackText, btnBackZone]);

        // Efeitos Hover e Clique
        btnBackZone.on('pointerover', () => {
            btnBackBg.clear();
            btnBackBg.fillStyle(0xd1478e, 1); // Rosa mais escuro no hover
            btnBackBg.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 25);
            btnBackBg.lineStyle(3, 0xffffff);
            btnBackBg.strokeRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 25);
            this.tweens.add({ targets: btnBackContainer, scale: 1.05, duration: 100 });
        });

        btnBackZone.on('pointerout', () => {
            btnBackBg.clear();
            btnBackBg.fillStyle(0xff69b4, 1); // Volta pro rosa original
            btnBackBg.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 25);
            btnBackBg.lineStyle(3, 0xffffff);
            btnBackBg.strokeRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 25);
            this.tweens.add({ targets: btnBackContainer, scale: 1, duration: 100 });
        });

        btnBackZone.on('pointerdown', () => {
            this.tweens.add({
                targets: btnBackContainer, scale: 0.9, duration: 50, yoyo: true,
                onComplete: () => {
                    this.scene.start('HubLabsScene'); 
                    this.scene.launch('UIScene'); 
                }
            });
        });

        // ==========================================
        // --- DADOS DO ÁLBUM ---
        // ==========================================
        const unlockedStr = localStorage.getItem('unlockedCharacters') || 'Julia';
        const unlockedArray = unlockedStr.split(',');

        const albumData = [
            { id: 'Julia', nome: 'Júlia', desc: 'A Jovem Cientista! Muito curiosa e sempre pronta para uma nova e incrível descoberta pelo mundo da ciência.', img: 'Julia-Icone' },
            { id: 'Pasteur', nome: 'Louis Pasteur', desc: 'O Pai da Microbiologia! Nos ensinou como a higiene nos protege contra bactérias e os vírus.', img: 'Pasteur-Icone' },
            { id: 'Pierre', nome: 'Pierre Fauchard', desc: 'Pai da Odontologia Moderna! Revolucionou as ferramentas de cuidar dos nossos sorrisos contra a cárie.', img: 'Pierre-Icone' },
            { id: 'Marie', nome: 'Marie Curie', desc: 'Uma Gênia da Ciência! A primeira mulher a ganhar Prêmios Nobel, explorou os mistérios dos átomos e da radioatividade.', img: 'Marie-Icone' }
        ];

        // ==========================================
        // --- GERADOR DE CARTÕES (COLECIONÁVEIS) ---
        // ==========================================
        const cardW = width * 0.40;
        const cardH = height * 0.28;
        
        const startX = width * 0.28;
        const startY = height * 0.38;
        const spacingX = width * 0.44;
        const spacingY = height * 0.35;

        const cards: GameObjects.Container[] = [];

        albumData.forEach((sci, index) => {
            const col = index % 2;
            const row = Math.floor(index / 2);
            
            const x = startX + (col * spacingX);
            const y = startY + (row * spacingY);

            const isUnlocked = unlockedArray.includes(sci.id);
            const cardContainer = this.add.container(x, y);

            // Fundo do Cartão (Estilo Carta Brilhante)
            const bgCard = this.add.graphics();
            bgCard.fillStyle(isUnlocked ? 0xffffff : 0xcccccc, 1);
            bgCard.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 20);
            
            // Borda: Rosa se desbloqueado, Cinza se bloqueado
            bgCard.lineStyle(5, isUnlocked ? 0xff69b4 : 0x999999); 
            bgCard.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 20);

            // Imagem do Personagem
            const iconKey = this.textures.exists(sci.img) ? sci.img : (sci.id === 'Julia' ? 'julia' : 'balao-pensamento');
            const icon = this.add.image(-cardW * 0.25, 0, iconKey);
            const iconHeight = cardH * 0.75;
            icon.setScale(iconHeight / icon.height);
            
            // Textos
            const nameText = isUnlocked ? sci.nome : 'Cientista Misterioso';
            const descText = isUnlocked ? sci.desc : 'Personagem bloqueado.\nComplete os minigames dos laboratórios para revelar sua identidade!';
            const titleColor = isUnlocked ? '#ff69b4' : '#666666';
            const descColor = isUnlocked ? '#3d3d3d' : '#666666';

            const nameObj = this.add.text(-cardW * 0.03, -cardH * 0.25, nameText, {
                fontFamily: 'Fredoka', fontSize: '32px', color: titleColor, fontStyle: 'bold'
            }).setOrigin(0, 0.5);

            const descObj = this.add.text(-cardW * 0.03, 0, descText, {
                fontFamily: 'Fredoka', fontSize: '20px', color: descColor, wordWrap: { width: cardW * 0.46 }
            }).setOrigin(0, 0.5);

            // Silhueta para os não desbloqueados
            if (!isUnlocked) {
                icon.setTint(0x222222); 
            } else {
                const circleBg = this.add.graphics();
                circleBg.fillStyle(0x87ceeb, 0.2); 
                circleBg.fillCircle(-cardW * 0.25, 0, iconHeight * 0.55);
                cardContainer.add(circleBg);
            }

            cardContainer.add([bgCard, icon, nameObj, descObj]);
            
            // Sombra sutil para o cartão inteiro (profundidade)
            const shadow = this.add.graphics();
            shadow.fillStyle(0x000000, 0.15);
            shadow.fillRoundedRect((-cardW / 2) + 5, (-cardH / 2) + 8, cardW, cardH, 20);
            
            const finalCard = this.add.container(x, y, [shadow, cardContainer]);
            finalCard.setScale(0);

            cardContainer.setPosition(0,0);
            shadow.setPosition(0,0);

            cards.push(finalCard);
        });

        // 4. Animação de entrada em Cascata com "Bounce"
        this.tweens.add({
            targets: cards,
            scale: 1,
            duration: 600,
            ease: 'Back.easeOut',
            stagger: 150
        });
    }
}