import { Scene } from 'phaser';

export class HubLabsBiologia extends Scene {
    private background!: Phaser.GameObjects.Image;

    // Containers para posicionamento responsivo e Imagens para animações
    private juliaContainer!: Phaser.GameObjects.Container;
    private juliaImg!: Phaser.GameObjects.Image;
    // ELEMENTOS DA JÚLIA MANTIDOS
    private juliaThoughtBalloon!: Phaser.GameObjects.Image;
    private juliaThoughtText!: Phaser.GameObjects.Text;

    private pasteurContainer!: Phaser.GameObjects.Container;
    private pasteurImg!: Phaser.GameObjects.Image;

    private instructionText!: Phaser.GameObjects.Text;
    private textBgGraphics!: Phaser.GameObjects.Graphics;

    // Variáveis para guardar as posições finais calculadas pelo drawLayout
    private finalJuliaX = 0;
    private finalPasteurX = 0;

    // --- VARIÁVEL DE ÁUDIO E EFEITO ---
    private bgMusic!: Phaser.Sound.BaseSound;
    private pasteurGlow!: Phaser.FX.Glow; // <-- NOVO: Guardamos o brilho aqui para poder animá-lo

    constructor() {
        super('HubLabsBiologia');
    }

    create() {
        this.scene.stop('UIScene');
        this.scene.launch('UIBiologia');

        // ==========================================
        // --- GERENCIAMENTO SEGURO DA MÚSICA ---
        // ==========================================
        if (!this.bgMusic || !this.bgMusic.isPlaying) {
            this.bgMusic = this.sound.add('BiologiaMinigame', { volume: 0.3, loop: true });
            this.bgMusic.play();
        }
        // ==========================================

        const { width, height } = this.scale;

        // 1. Fundo do Laboratório (Sempre tela cheia)
        this.background = this.add.image(width / 2, height / 2, 'backgrounds/menu-laboratorio');
        this.background.postFX.addBlur(0, 2, 2, 1);

        // 2. Criação dos Elementos

        // --- JÚLIA E SEUS BALÕES ---
        this.juliaImg = this.add.image(0, 0, 'julia').setOrigin(0.5, 1);

        this.juliaThoughtBalloon = this.add.image(0, 0, 'balao-pensamento').setOrigin(0.5, 1);

        this.juliaThoughtText = this.add.text(0, 0, 'quem é ele?', {
            fontFamily: 'Fredoka',
            color: '#3d3d3d', 
            align: 'center',
            fontStyle: 'italic'
        }).setOrigin(0.5);

        // Adicionando imagem, balão e texto ao container da Júlia
        this.juliaContainer = this.add.container(0, 0, [this.juliaImg, this.juliaThoughtBalloon, this.juliaThoughtText]);


        // --- PASTEUR ---
        this.pasteurImg = this.add.image(0, 0, 'pasteur').setOrigin(0.5, 1);

        const corRGBPasteur = Phaser.Display.Color.GetColor(15, 77, 147);

        // <-- NOVO: Salvamos o efeito na nossa variável
        this.pasteurGlow = this.pasteurImg.postFX.addGlow(corRGBPasteur, 2, 0, false, 0.1, 12);

        // Container apenas com a imagem do Pasteur (sem balão)
        this.pasteurContainer = this.add.container(0, 0, [this.pasteurImg]);

        // Interação no Pasteur.
        this.pasteurImg.setInteractive({ cursor: 'pointer', pixelPerfect: true });


        // --- TEXTO DE INSTRUÇÃO ---
        this.textBgGraphics = this.add.graphics();
        this.instructionText = this.add.text(0, 0, 'Clique no Louis Pasteur para começar a aventura!', {
            fontFamily: 'Fredoka',
            color: 'rgb(15, 77, 147)',
            align: 'center'
        }).setOrigin(0.5);

        // Esconde o texto inicialmente (aparecerá após a entrada dos personagens)
        this.instructionText.setAlpha(0);
        this.textBgGraphics.setAlpha(0);


        // 3. Aplica o Layout Responsivo (Calcula as posições finais)
        this.drawLayout();

        // 4. Se a tela mudar de tamanho, recalcula tudo
        this.scale.on('resize', () => this.drawLayout());


        // ==========================================
        // --- LÓGICA DE ENTRADA (MÁGICA) ---
        // ==========================================

        this.juliaContainer.setX(-width * 0.5).setAlpha(0);
        this.pasteurContainer.setX(width * 1.5).setAlpha(0);

        // 2. Tweens de Entrada (Fade-in + Slide-in)
        this.tweens.add({
            targets: this.juliaContainer,
            x: this.finalJuliaX, 
            alpha: 1,
            duration: 1200,
            ease: 'Cubic.easeOut' 
        });

        this.tweens.add({
            targets: this.pasteurContainer,
            x: this.finalPasteurX, 
            alpha: 1,
            duration: 1200,
            delay: 300, 
            ease: 'Cubic.easeOut',
            onComplete: () => {
                this.startSceneAnimations();
            }
        });

        // --- INTERAÇÕES DO PASTEUR (Mantidas) ---
        this.pasteurImg.on('pointerover', () => this.pasteurImg.setTint(0xffffff));
        this.pasteurImg.on('pointerout', () => this.pasteurImg.clearTint());

        this.pasteurImg.on('pointerdown', () => {
            this.pasteurImg.disableInteractive();

            const scriptIntro = this.cache.json.get('biologia-intro-script');

            this.scene.pause();

            this.scene.launch('DialogueScene', {
                script: scriptIntro,
                parentScene: 'HubLabsBiologia',
                onComplete: () => {
                    console.log("Diálogo 1 acabou! Fechando cena de diálogo...");

                    this.scene.stop('DialogueScene');

                    this.time.delayedCall(200, () => {

                        const scriptApresentacao = this.cache.json.get('biologia-apresentacao');

                        if (!scriptApresentacao) {
                            console.error("ERRO: O arquivo biologia-apresentacao.json não foi encontrado!");
                            return;
                        }

                        console.log("Iniciando Diálogo 2 (Apresentação)...");
                        this.scene.launch('DialogueScene', {
                            script: scriptApresentacao,
                            parentScene: 'HubLabsBiologia',
                            onComplete: () => {
                                console.log("Apresentação acabou! Partiu jogo!");
                                this.scene.stop('HubLabsBiologia');
                                this.scene.start('BiologiaMinigame');
                            }
                        });

                    }); // Fim do delay
                }
            });
        });

        // --- LIMPEZA AUTOMÁTICA DO ÁUDIO AO SAIR DA CENA ---
        this.events.once('shutdown', () => {
            if (this.bgMusic && this.bgMusic.isPlaying) {
                this.bgMusic.stop();
            }
        });
    }

    private startSceneAnimations() {
        // 1. Aparecer o texto de instrução suavemente
        this.tweens.add({
            targets: [this.instructionText, this.textBgGraphics],
            alpha: { from: 0, to: 1 },
            duration: 900
        });

        // 2. <-- NOVO: Efeito de pulso APENAS na força (outerStrength) do Brilho do Pasteur
        this.tweens.add({
            targets: this.pasteurGlow,
            outerStrength: 7, 
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // 3. Bounce Contínuo no Balão de Pensamento da Júlia
        this.tweens.add({
            targets: [this.juliaThoughtBalloon, this.juliaThoughtText],
            y: '-=10', 
            duration: 600, 
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut' 
        });

        // 4. Efeito de Respiração (Júlia e Pasteur flutuam muito levemente)
        this.tweens.add({
            targets: [this.juliaImg, this.pasteurImg],
            y: 10,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
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
        const baseCharHeight = safeHeight * 0.45;

        // 1. PASTEUR (Fundo Direita)
        const pasteurTargetHeight = baseCharHeight * 1.6;
        const pasteurScale = pasteurTargetHeight / this.pasteurImg.height;
        this.pasteurImg.setScale(pasteurScale);

        const pasteurFloorY = safeY + (safeHeight * 0.90);
        this.finalPasteurX = width * 0.75; 
        this.pasteurContainer.y = pasteurFloorY; 

        // 2. JÚLIA (Frente Esquerda)
        const juliaTargetHeight = baseCharHeight * 1.85;
        const juliaScale = juliaTargetHeight / this.juliaImg.height;
        this.juliaImg.setScale(juliaScale);

        const juliaFloorY = safeY + safeHeight;
        this.finalJuliaX = width * 0.25; 
        this.juliaContainer.y = juliaFloorY; 

        // ==========================================
        // BALÃO E TEXTO DA JÚLIA
        // ==========================================
        this.juliaThoughtBalloon.y = -juliaTargetHeight + 80;
        this.juliaThoughtBalloon.x = -juliaTargetHeight * 0.30;

        const balloonThScale = (juliaTargetHeight * 0.35) / this.juliaThoughtBalloon.height;
        this.juliaThoughtBalloon.setScale(balloonThScale);

        this.juliaThoughtText.setPosition(
            this.juliaThoughtBalloon.x,
            this.juliaThoughtBalloon.y - (this.juliaThoughtBalloon.displayHeight * 0.55)
        );
        this.juliaThoughtText.setFontSize(Math.min(safeHeight * 0.05, 24));

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