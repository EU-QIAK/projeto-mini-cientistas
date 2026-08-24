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
        bg.setAlpha(0.5);
        bg.postFX.addBlur(0, 2, 2, 1);

        // 2. Título da Tela
        this.add.text(width / 2, height * 0.1, 'ÁLBUM DE CIENTISTAS', {
            fontFamily: 'Fredoka', fontSize: '42px', color: '#3d3d3d', fontStyle: 'bold'
        }).setOrigin(0.5);

        // ==========================================
        // 3. BOTÃO VOLTAR (ESTILIZADO E INTERATIVO)
        // ==========================================
        const btnWidth = 140;
        const btnHeight = 50;
        const btnX = 100;
        const btnY = height * 0.08;

        const btnBackContainer = this.add.container(btnX, btnY);

        const btnBackBg = this.add.graphics();
        btnBackBg.fillStyle(0xdc3545, 1); // Vermelho base
        btnBackBg.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 15);
        btnBackBg.lineStyle(3, 0xb02a37); // Borda vermelha mais escura
        btnBackBg.strokeRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 15);

        const btnBackText = this.add.text(0, 0, '⬅ VOLTAR', {
            fontFamily: 'Fredoka', fontSize: '20px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);

        const btnBackZone = this.add.zone(0, 0, btnWidth, btnHeight).setInteractive({ useHandCursor: true });

        btnBackContainer.add([btnBackBg, btnBackText, btnBackZone]);

        // Efeito: Passar o mouse (Hover)
        btnBackZone.on('pointerover', () => {
            btnBackBg.clear();
            btnBackBg.fillStyle(0xc82333, 1); // Fica mais escuro
            btnBackBg.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 15);
            btnBackBg.lineStyle(3, 0xb02a37);
            btnBackBg.strokeRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 15);
            
            this.tweens.add({ targets: btnBackContainer, scale: 1.05, duration: 100 });
        });

        // Efeito: Tirar o mouse
        btnBackZone.on('pointerout', () => {
            btnBackBg.clear();
            btnBackBg.fillStyle(0xdc3545, 1); // Volta pro vermelho original
            btnBackBg.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 15);
            btnBackBg.lineStyle(3, 0xb02a37);
            btnBackBg.strokeRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 15);
            
            this.tweens.add({ targets: btnBackContainer, scale: 1, duration: 100 });
        });

        // Efeito: Clicar no botão
        btnBackZone.on('pointerdown', () => {
            this.tweens.add({
                targets: btnBackContainer,
                scale: 0.9, // Dá uma "afundada" rápida
                duration: 50,
                yoyo: true, // Volta pro tamanho normal
                onComplete: () => {
                    this.scene.start('HubLabsScene'); // Volta para o Carrossel
                    this.scene.launch('UIScene');     // Religa a UI principal
                }
            });
        });

        // ==========================================
        // --- DADOS DO ÁLBUM ---
        // ==========================================
        // Pega a string salva no navegador (ex: "Julia,Pasteur,Pierre")
        const unlockedStr = localStorage.getItem('unlockedCharacters') || 'Julia';
        const unlockedArray = unlockedStr.split(',');

        // Lista de todos os personagens do jogo
        const albumData = [
            { id: 'Julia', nome: 'Júlia', desc: 'Jovem cientista muito curiosa. Sempre pronta para uma nova descoberta!', img: 'julia' },
            { id: 'Pasteur', nome: 'Louis Pasteur', desc: 'Pai da Microbiologia. Nos ensinou sobre a proteção contra bactérias e vírus.', img: 'Pasteur-Icone' },
            { id: 'Pierre', nome: 'Pierre Fauchard', desc: 'Pai da Odontologia Moderna. Cuidou dos nossos sorrisos contra a cárie.', img: 'Pierre-Icone' },
            { id: 'Marie', nome: 'Marie Curie', desc: 'Em breve... Continue explorando os laboratórios para descobrir!', img: 'balao-pensamento' } // Espaço vazio para futuras fases!
        ];

        // ==========================================
        // --- GERADOR DE CARTÕES (GRID) ---
        // ==========================================
        const cardW = width * 0.40;
        const cardH = height * 0.30;
        
        const startX = width * 0.28;
        const startY = height * 0.35;
        const spacingX = width * 0.44;
        const spacingY = height * 0.35;

        // Guarda os cartões para animar depois
        const cards: GameObjects.Container[] = [];

        albumData.forEach((sci, index) => {
            const col = index % 2;
            const row = Math.floor(index / 2);
            
            const x = startX + (col * spacingX);
            const y = startY + (row * spacingY);

            const isUnlocked = unlockedArray.includes(sci.id);

            const cardContainer = this.add.container(x, y);

            // Fundo do Cartão
            const bgCard = this.add.graphics();
            bgCard.fillStyle(isUnlocked ? 0xffffff : 0xcccccc, 0.95);
            bgCard.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 20);
            bgCard.lineStyle(5, isUnlocked ? 0xffc107 : 0x888888); // Borda Dourada se desbloqueado
            bgCard.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 20);

            // Imagem do Personagem
            const icon = this.add.image(-cardW * 0.25, 0, sci.img);
            const iconHeight = cardH * 0.7;
            icon.setScale(iconHeight / icon.height);
            
            // Textos
            const nameText = isUnlocked ? sci.nome : '???';
            const descText = isUnlocked ? sci.desc : 'Personagem bloqueado.\nComplete o respectivo minigame para revelar sua identidade!';
            const textColor = isUnlocked ? '#3d3d3d' : '#666666';

            const nameObj = this.add.text(-cardW * 0.02, -cardH * 0.25, nameText, {
                fontFamily: 'Fredoka', fontSize: '28px', color: textColor, fontStyle: 'bold'
            }).setOrigin(0, 0.5);

            const descObj = this.add.text(-cardW * 0.02, 0, descText, {
                fontFamily: 'Fredoka', fontSize: '18px', color: textColor, wordWrap: { width: cardW * 0.45 }
            }).setOrigin(0, 0.5);

            // Se estiver bloqueado, transforma a imagem numa silhueta preta misteriosa
            if (!isUnlocked) {
                icon.setTint(0x222222); 
            }

            cardContainer.add([bgCard, icon, nameObj, descObj]);
            
            // Prepara para animação
            cardContainer.setScale(0);
            cards.push(cardContainer);
        });

        // 4. Animação de entrada em Cascata (Stagger)
        this.tweens.add({
            targets: cards,
            scale: 1,
            duration: 500,
            ease: 'Back.easeOut',
            stagger: 150
        });
    }
}