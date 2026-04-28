import { Scene } from 'phaser';

export class HubLabsBiologia extends Scene {
    private background!: Phaser.GameObjects.Image;

    // Containers para posicionamento responsivo e Imagens para animações
    private juliaContainer!: Phaser.GameObjects.Container;
    private juliaImg!: Phaser.GameObjects.Image;
    // NOVOS ELEMENTOS DA JÚLIA
    private juliaThoughtBalloon!: Phaser.GameObjects.Image;
    private juliaThoughtText!: Phaser.GameObjects.Text;

    private pasteurContainer!: Phaser.GameObjects.Container;
    private pasteurImg!: Phaser.GameObjects.Image;
    private exclamationBalloon!: Phaser.GameObjects.Image;

    private instructionText!: Phaser.GameObjects.Text;
    private textBgGraphics!: Phaser.GameObjects.Graphics;

    // Variáveis para guardar as posições finais calculadas pelo drawLayout
    private finalJuliaX = 0;
    private finalPasteurX = 0;

    constructor() {
        super('HubLabsBiologia');
    }

    create() {

        this.scene.stop('UIScene');
        
        this.scene.launch('UIBiologia');

        const { width, height } = this.scale;

        // 1. Fundo do Laboratório (Sempre tela cheia)
        this.background = this.add.image(width / 2, height / 2, 'backgrounds/menu-laboratorio');
        this.background.postFX.addBlur(0, 2, 2, 1);

        // 2. Criação dos Elementos

        // --- JÚLIA E SEUS BALÕES ---
        this.juliaImg = this.add.image(0, 0, 'julia').setOrigin(0.5, 1);

        // NOVO: Criando o balão de pensamento da Júlia
        this.juliaThoughtBalloon = this.add.image(0, 0, 'balao-pensamento').setOrigin(0.5, 1);

        // NOVO: Criando o texto de pensamento
        this.juliaThoughtText = this.add.text(0, 0, 'quem sera ele?', {
            fontFamily: 'Fredoka',
            color: '#3d3d3d', // Mesma cor do texto de instrução
            align: 'center',
            fontStyle: 'italic'
        }).setOrigin(0.5);

        // Adicionando imagem, balão e texto ao container da Júlia
        // A ordem importa: o que é adicionado por último fica na frente.
        this.juliaContainer = this.add.container(0, 0, [this.juliaImg, this.juliaThoughtBalloon, this.juliaThoughtText]);


        // --- PASTEUR E SEUS BALÕES ---
        this.pasteurImg = this.add.image(0, 0, 'pasteur').setOrigin(0.5, 1);
        this.pasteurImg.postFX.addGlow(0xffdd00, 2, 0, false, 0.1, 12);

        this.exclamationBalloon = this.add.image(0, 0, 'balao-exclamacao').setOrigin(0.5, 1);

        this.pasteurContainer = this.add.container(0, 0, [this.pasteurImg, this.exclamationBalloon]);

        // Interação no Pasteur.
        this.pasteurImg.setInteractive({ cursor: 'pointer', pixelPerfect: true });


        // --- TEXTO DE INSTRUÇÃO ---
        this.textBgGraphics = this.add.graphics();
        this.instructionText = this.add.text(0, 0, 'Clique no Louis Pasteur para começar a aventura!', {
            fontFamily: 'Fredoka',
            color: '#3d3d3d',
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
        // --- NOVA LÓGICA DE ENTRADA (MÁGICA) ---
        // ==========================================

        // 1. Configuração Inicial (Fora da tela e transparente)
        // Júlia vem da esquerda
        this.juliaContainer.setX(-width * 0.5).setAlpha(0);
        // Pasteur vem da direita
        this.pasteurContainer.setX(width * 1.5).setAlpha(0);

        // 2. Tweens de Entrada (Fade-in + Slide-in)

        // Entrada da Júlia
        this.tweens.add({
            targets: this.juliaContainer,
            x: this.finalJuliaX, // Posição final calculada no drawLayout
            alpha: 1,
            duration: 1200,
            ease: 'Cubic.easeOut' // Começa rápido, desacelera no final
        });

        // Entrada do Pasteur (com um pequeno atraso para não ser perfeitamente simétrico)
        this.tweens.add({
            targets: this.pasteurContainer,
            x: this.finalPasteurX, // Posição final calculada no drawLayout
            alpha: 1,
            duration: 1200,
            delay: 300, // Atraso de 300ms
            ease: 'Cubic.easeOut',
            onComplete: () => {
                // SÓ INICIA AS OUTRAS ANIMAÇÕES QUANDO A ENTRADA TERMINAR
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

                    // 1. GARANTE QUE A CENA FECHOU TOTALMENTE
                    this.scene.stop('DialogueScene');

                    // 2. Dá um respiro de 0.2 segundos (200ms) antes de abrir a próxima
                    this.time.delayedCall(200, () => {

                        const scriptApresentacao = this.cache.json.get('biologia-apresentacao');

                        // Verifica se o JSON realmente carregou (se não, vai dar erro no F12)
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
    }

    /**
     * Função para iniciar as animações contínuas da cena e o texto de instrução.
     * Chamada apenas após a animação de entrada dos personagens terminar.
     */
    private startSceneAnimations() {
        // 1. Aparecer o texto de instrução suavemente
        this.tweens.add({
            targets: [this.instructionText, this.textBgGraphics],
            alpha: { from: 0, to: 1 },
            duration: 900
        });

        // 2. Efeito Suave de Pulso no Container INTEIRO do Pasteur
        this.tweens.add({
            targets: this.pasteurContainer,
            scale: 1.12,
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // 3. Bounce Contínuo no Balão de Exclamação (Brock)
        this.tweens.add({
            targets: this.exclamationBalloon,
            y: '-=15',
            duration: 400,
            yoyo: true,
            repeat: -1,
            ease: 'Bounce.easeOut'
        });

        // 4. NOVO: Bounce Contínuo no Balão de Pensamento da Júlia
        this.tweens.add({
            targets: [this.juliaThoughtBalloon, this.juliaThoughtText],
            y: '-=10', // Sobe um pouco menos que o de exclamação
            duration: 600, // Um pouco mais lento e suave
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut' // Movimento mais "leve" para pensamento
        });

        // 5. Efeito de Respiração (Júlia e Pasteur sobem/descem)
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

        // 1. PASTEUR (Brock - Fundo Direita)
        const pasteurTargetHeight = baseCharHeight * 1.2;
        const pasteurScale = pasteurTargetHeight / this.pasteurImg.height;
        this.pasteurImg.setScale(pasteurScale);

        const pasteurFloorY = safeY + (safeHeight * 0.90);
        //this.pasteurContainer.setPosition(width * 0.75, pasteurFloorY); // Não setamos a posição direta mais
        this.finalPasteurX = width * 0.75; // Guardamos o X final para a tween
        this.pasteurContainer.y = pasteurFloorY; // O Y pode ser fixo

        // 2. JÚLIA (Red - Frente Esquerda)
        const juliaTargetHeight = baseCharHeight * 1.85;
        const juliaScale = juliaTargetHeight / this.juliaImg.height;
        this.juliaImg.setScale(juliaScale);

        const juliaFloorY = safeY + safeHeight;
        //this.juliaContainer.setPosition(width * 0.25, juliaFloorY); // Não setamos a posição direta mais
        this.finalJuliaX = width * 0.25; // Guardamos o X final para a tween
        this.juliaContainer.y = juliaFloorY; // O Y pode ser fixo

        // ==========================================
        // BALÕES E TEXTOS
        // ==========================================

        // Balão do Pasteur (Exclamação)
        this.exclamationBalloon.y = -pasteurTargetHeight - 15;
        const balloonExScale = (pasteurTargetHeight * 0.40) / this.exclamationBalloon.height;
        this.exclamationBalloon.setScale(balloonExScale);

        // NOVO: Balão da Júlia (Pensamento)
        this.juliaThoughtBalloon.y = -juliaTargetHeight + 80;

        // ---> ESSA É A LINHA QUE EMPURRA PARA A ESQUERDA <---
        this.juliaThoughtBalloon.x = -juliaTargetHeight * 0.30;

        const balloonThScale = (juliaTargetHeight * 0.35) / this.juliaThoughtBalloon.height;
        this.juliaThoughtBalloon.setScale(balloonThScale);

        // NOVO: Texto dentro do balão da Júlia
        this.juliaThoughtText.setPosition(
            this.juliaThoughtBalloon.x,
            this.juliaThoughtBalloon.y - (this.juliaThoughtBalloon.displayHeight * 0.55)
        );
        this.juliaThoughtText.setFontSize(Math.min(safeHeight * 0.05, 24));

        // ==========================================
        // TEXTO DE INSTRUÇÃO (Mantido)
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