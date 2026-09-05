import { Scene } from 'phaser';

export class HubLabsQuimica extends Scene {
    private background!: Phaser.GameObjects.Image;

    // Containers para posicionamento responsivo e Imagens para animações
    private juliaContainer!: Phaser.GameObjects.Container;
    private juliaImg!: Phaser.GameObjects.Image;
    private juliaThoughtBalloon!: Phaser.GameObjects.Image;
    private juliaThoughtText!: Phaser.GameObjects.Text;

    private marieContainer!: Phaser.GameObjects.Container;
    private marieImg!: Phaser.GameObjects.Image;

    private instructionText!: Phaser.GameObjects.Text;
    private textBgGraphics!: Phaser.GameObjects.Graphics;

    // Variáveis para guardar as posições finais calculadas pelo drawLayout
    private finalJuliaX = 0;
    private finalMarieX = 0;

    // --- VARIÁVEL DE ÁUDIO E EFEITO ---
    private bgMusic!: Phaser.Sound.BaseSound;
    private marieGlow!: Phaser.FX.Glow;

    constructor() {
        super('HubLabsQuimica');
    }

    create() {
        this.scene.stop('UIScene');
        this.scene.launch('UIQuimica');

        // ==========================================
        // --- GERENCIAMENTO SEGURO DA MÚSICA ---
        // ==========================================
        /*if (!this.bgMusic || !this.bgMusic.isPlaying) {
            this.bgMusic = this.sound.add('QuimicaMinigame', { volume: 0.3, loop: true });
            this.bgMusic.play();
        }*/
        // ==========================================

        const { width, height } = this.scale;

        // 1. Fundo do Laboratório (Sempre tela cheia)
        this.background = this.add.image(width / 2, height / 2, 'backgrounds/menu-laboratorio');
        this.background.postFX.addBlur(0, 2, 2, 1);
        this.background.setTint(0xcce5ff); // Tom levemente azul/esverdeado para Química

        // 2. Criação dos Elementos

        // --- JÚLIA E SEUS BALÕES ---
        this.juliaImg = this.add.image(0, 0, 'julia').setOrigin(0.5, 1);

        this.juliaThoughtBalloon = this.add.image(0, 0, 'balao-pensamento').setOrigin(0.5, 1);

        this.juliaThoughtText = this.add.text(0, 0, 'quem é ela?', {
            fontFamily: 'Fredoka',
            color: '#3d3d3d',
            align: 'center',
            fontStyle: 'italic'
        }).setOrigin(0.5);

        // Adicionando imagem, balão e texto ao container da Júlia
        this.juliaContainer = this.add.container(0, 0, [this.juliaImg, this.juliaThoughtBalloon, this.juliaThoughtText]);


        // --- MARIE CURIE ---
        this.marieImg = this.add.image(0, 0, 'Marie').setOrigin(0.5, 1);

        // Brilho verde-água radioativo
        const corRGB = Phaser.Display.Color.GetColor(46, 204, 113);
        this.marieGlow = this.marieImg.postFX.addGlow(corRGB, 2, 0, false, 0.1, 12);

        // Container apenas com a imagem da Marie (sem balão)
        this.marieContainer = this.add.container(0, 0, [this.marieImg]);

        // Interação na Marie
        this.marieImg.setInteractive({ cursor: 'pointer', pixelPerfect: true });


        // --- TEXTO DE INSTRUÇÃO ---
        this.textBgGraphics = this.add.graphics();
        this.instructionText = this.add.text(0, 0, 'Clique na Marie Curie para começar a aventura!', {
            fontFamily: 'Fredoka',
            color: 'rgb(46, 204, 113)',
            align: 'center'
        }).setOrigin(0.5);

        this.instructionText.setAlpha(0);
        this.textBgGraphics.setAlpha(0);


        // 3. Aplica o Layout Responsivo (Calcula as posições finais com as métricas exatas)
        this.drawLayout();

        // 4. Se a tela mudar de tamanho, recalcula tudo
        this.scale.on('resize', () => this.drawLayout());


        // ==========================================
        // --- LÓGICA DE ENTRADA ---
        // ==========================================

        this.juliaContainer.setX(-width * 0.5).setAlpha(0);
        this.marieContainer.setX(width * 1.5).setAlpha(0);

        this.tweens.add({
            targets: this.juliaContainer,
            x: this.finalJuliaX,
            alpha: 1,
            duration: 1200,
            ease: 'Cubic.easeOut'
        });

        this.tweens.add({
            targets: this.marieContainer,
            x: this.finalMarieX,
            alpha: 1,
            duration: 1200,
            delay: 300,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                this.startSceneAnimations();
            }
        });

        // --- INTERAÇÕES DA MARIE ---
        this.marieImg.on('pointerover', () => this.marieImg.setTint(0xffffff));
        this.marieImg.on('pointerout', () => this.marieImg.clearTint());

        this.marieImg.on('pointerdown', () => {
            this.marieImg.disableInteractive();

            const scriptIntro = this.cache.json.get('quimica-intro');

            if (!scriptIntro) {
                console.error("ERRO: O arquivo quimica-intro.json não foi encontrado!");
                this.scene.start('QuimicaMinigame');
                return;
            }

            // Pausa o laboratório (animações do fundo, etc)
            this.scene.pause();

            // 1º DIÁLOGO: INTRODUÇÃO DA MARIE
            this.scene.launch('DialogueScene', {
                script: scriptIntro,
                parentScene: 'HubLabsQuimica',
                onComplete: () => {
                    console.log("Diálogo 1 (Intro) acabou! Fechando e preparando Apresentação...");
                    this.scene.stop('DialogueScene');

                    // Tempo para o Phaser limpar a cena antes de abrir o próximo diálogo
                    this.time.delayedCall(200, () => {
                        const scriptApresentacao = this.cache.json.get('quimica-apresentacao');

                        if (!scriptApresentacao) {
                            console.error("ERRO: O arquivo quimica-apresentacao.json não foi encontrado!");
                            // Fallback caso esqueça de criar o JSON, vai direto pro jogo
                            this.scene.stop('HubLabsQuimica');
                            this.scene.launch('UIQuimica');
                            this.scene.start('QuimicaMinigame');
                            return;
                        }

                        console.log("Iniciando Diálogo 2 (Apresentação)...");

                        // 2º DIÁLOGO: EXPLICAÇÃO DO MINIGAME
                        this.scene.launch('DialogueScene', {
                            script: scriptApresentacao,
                            parentScene: 'HubLabsQuimica',
                            onComplete: () => {
                                console.log("Apresentação acabou! Partiu minigame!");
                                this.scene.stop('DialogueScene');
                                this.scene.stop('HubLabsQuimica');
                                this.scene.launch('UIQuimica'); 
                                this.scene.start('QuimicaMinigame');
                            }
                        });
                    });
                }
            });
        });

        // --- LIMPEZA AUTOMÁTICA DO ÁUDIO ---
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

        // 2. Efeito de pulso APENAS na força (outerStrength) do Brilho
        this.tweens.add({
            targets: this.marieGlow,
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

        // 4. Efeito de Respiração (Júlia e Marie flutuam muito levemente)
        this.tweens.add({
            targets: [this.juliaImg, this.marieImg],
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

        // 1. MARIE CURIE (Fundo Direita)
        const marieTargetHeight = baseCharHeight * 1.6;
        const marieScale = marieTargetHeight / this.marieImg.height;
        this.marieImg.setScale(marieScale);

        const marieFloorY = safeY + (safeHeight * 0.90);
        this.finalMarieX = width * 0.75;
        this.marieContainer.y = marieFloorY;

        // 2. JÚLIA (Red - Frente Esquerda)
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