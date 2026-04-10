import { Scene } from 'phaser';

export class HubLabsBiologia extends Scene {
    private background!: Phaser.GameObjects.Image;

    // Containers para posicionamento responsivo e Imagens para animações
    private juliaContainer!: Phaser.GameObjects.Container;
    private juliaImg!: Phaser.GameObjects.Image;

    private pasteurContainer!: Phaser.GameObjects.Container;
    private pasteurImg!: Phaser.GameObjects.Image;
    private exclamationBalloon!: Phaser.GameObjects.Image; // Nova variável para o balão

    private instructionText!: Phaser.GameObjects.Text;
    private textBgGraphics!: Phaser.GameObjects.Graphics;

    constructor() {
        super('HubLabsBiologia');
    }

    create() {
        const { width, height } = this.scale;

        // 1. Fundo do Laboratório (Sempre tela cheia)
        this.background = this.add.image(width / 2, height / 2, 'backgrounds/menu-laboratorio');
        this.background.postFX.addBlur(0, 2, 2, 1);

        // 2. Criação dos Elementos

        // Júlia (Totalmente visível, sem transparência)
        this.juliaImg = this.add.image(0, 0, 'julia').setOrigin(0.5, 1);
        this.juliaContainer = this.add.container(0, 0, [this.juliaImg]);

        // Pasteur e Balão de Exclamação (Com destaque)
        this.pasteurImg = this.add.image(0, 0, 'pasteur').setOrigin(0.5, 1);
        this.pasteurImg.postFX.addGlow(0xffdd00, 2, 0, false, 0.1, 12); // Brilho para destaque interativo

        // Criando o balão de exclamação. Ancoramos pela base (pés) para facilitar o alinhamento sobre a cabeça
        this.exclamationBalloon = this.add.image(0, 0, 'balao-exclamacao').setOrigin(0.5, 1);

        // Adicionando ambos ao container do Pasteur
        this.pasteurContainer = this.add.container(0, 0, [this.pasteurImg, this.exclamationBalloon]);

        // Interação no Pasteur. O mouse detecta o contorno do personagem.
        this.pasteurImg.setInteractive({ cursor: 'pointer', pixelPerfect: true });

        // Texto e Fundo
        this.textBgGraphics = this.add.graphics();
        this.instructionText = this.add.text(0, 0, 'Clique no Louis Pasteur para começar a aventura!', {
            fontFamily: 'Fredoka',
            color: '#3d3d3d',
            align: 'center'
        }).setOrigin(0.5);

        // 3. Aplica o Layout Responsivo
        this.drawLayout();

        // 4. Se a tela mudar de tamanho, recalcula tudo
        this.scale.on('resize', () => this.drawLayout());

        // --- ANIMAÇÕES E INTERAÇÕES ---

        // 1. NOVO EFEITO: Pulso Suave (Expandir/Desexpandir) no Container INTEIRO do Pasteur
        // Isso fará o Pasteur e o Balão expandirem juntos para um destaque responsivo.
        this.tweens.add({
            targets: this.pasteurContainer,
            scale: 1.12, // Cresce 12% suavemente
            duration: 600, // Mais rápido que a respiração
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut' // Efeito suave de "pop"
        });

        // 2. NOVO EFEITO: Bounce Contínuo apenas no Balão de Exclamação
        this.tweens.add({
            targets: this.exclamationBalloon,
            y: '-=15', // Sobe 15 pixels
            duration: 400, // Rápido
            yoyo: true,
            repeat: -1,
            ease: 'Bounce.easeOut' // Efeito de rebote
        });

        // 3. EFEITO DE RESPIRAÇÃO: Sobe e desce levemente (Mantido para dar vida à cena)
        this.tweens.add({
            targets: [this.juliaImg, this.pasteurImg],
            y: 10, // Sobe 10 pixels relativo ao container
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // 4. INTERAÇÕES DO PASTEUR: Muda a cor ao passar o mouse e inicia o diálogo ao clicar
        this.pasteurImg.on('pointerover', () => this.pasteurImg.setTint(0xffffff));
        this.pasteurImg.on('pointerout', () => this.pasteurImg.clearTint());
       // INTERAÇÕES DO PASTEUR
        this.pasteurImg.on('pointerover', () => this.pasteurImg.setTint(0xffffff));
        this.pasteurImg.on('pointerout', () => this.pasteurImg.clearTint());
        
        // --- CÓDIGO CORRIGIDO BASEADO NO SEU GAME.TS ---
        this.pasteurImg.on('pointerdown', () => {
            // 1. Desativa a interação para o jogador não dar 2 cliques rápidos e travar
            this.pasteurImg.disableInteractive(); 

            // 2. Pega o script (Use o nome do JSON que você quer tocar aqui)
            const script = this.cache.json.get('biologia-intro-script'); 

            // 3. Pausa a cena da Biologia
            this.scene.pause();

            // 4. Lança o Diálogo passando a "bagagem" que ele exige para funcionar
            this.scene.launch('DialogueScene', { 
                script: script, 
                parentScene: 'HubLabsBiologia', 
                onComplete: () => {
                    console.log("Diálogo do Pasteur concluído!");
                    
                    // Quando o diálogo acabar, despausa a tela e devolve o clique
                    this.scene.resume('HubLabsBiologia');
                    this.pasteurImg.setInteractive({ cursor: 'pointer', pixelPerfect: true });
                    
                    // OU, se quiser ir direto para o jogo após a conversa, descomente a linha abaixo:
                    // this.scene.start('NomeDaSuaCenaDoMiniGame'); 
                }
            });
        });
    }

    private drawLayout() {
        const { width, height } = this.scale;

        this.background.setPosition(width / 2, height / 2);
        this.background.setDisplaySize(width, height);

        // --- CÁLCULO DA ÁREA SEGURA ---
        const topUI = height * 0.14;
        const bottomUI = height * 0.09;
        const safeHeight = height - topUI - bottomUI;
        const safeY = topUI; 

        // ==========================================
        // ESTILO POKÉMON: PERSPECTIVA E ESCALA
        // ==========================================
        const baseCharHeight = safeHeight * 0.45; // Altura média de referência

        // 1. PASTEUR (Brock - Fundo Direita) -> MANTIDO INTACTO
        const pasteurTargetHeight = baseCharHeight * 0.95;
        const pasteurScale = pasteurTargetHeight / this.pasteurImg.height;
        this.pasteurImg.setScale(pasteurScale); 

        const pasteurFloorY = safeY + (safeHeight * 0.85); 
        this.pasteurContainer.setPosition(width * 0.75, pasteurFloorY);

        // 2. JÚLIA (Red - Frente Esquerda) -> AJUSTADA
        // Um pouco menor que antes para não estourar a tela, mas ainda claramente na frente
        const juliaTargetHeight = baseCharHeight * 1.85; 
        const juliaScale = juliaTargetHeight / this.juliaImg.height;
        this.juliaImg.setScale(juliaScale);

        // Colada na base da área segura (100%) e mais no canto esquerdo (15%)
        const juliaFloorY = safeY + safeHeight; 
        this.juliaContainer.setPosition(width * 0.25, juliaFloorY);

        // ==========================================
        // BALÃO DO PASTEUR
        // ==========================================
        this.exclamationBalloon.y = -pasteurTargetHeight - 15; 
        const balloonScale = (pasteurTargetHeight * 0.25) / this.exclamationBalloon.height;
        this.exclamationBalloon.setScale(balloonScale);

        // ==========================================
        // TEXTO DE INSTRUÇÃO
        // ==========================================
        const textY = safeY + (safeHeight * 0.10); 
        this.instructionText.setPosition(width / 2, textY);
        this.instructionText.setFontSize(Math.min(safeHeight * 0.08, 32));

        this.textBgGraphics.clear();
        this.textBgGraphics.fillStyle(0xffffff, 0.9);

        const paddingX = 40;
        const paddingY = 20;
        const bgW = this.instructionText.width + paddingX;
        const bgH = this.instructionText.height + paddingY;

        this.textBgGraphics.fillRoundedRect(
            this.instructionText.x - (bgW / 2),
            this.instructionText.y - (bgH / 2),
            bgW,
            bgH,
            bgH / 2 
        );
    }
}