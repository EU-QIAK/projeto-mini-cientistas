import { Scene } from 'phaser';

export class GameOverQuimica extends Scene {
    private background!: Phaser.GameObjects.Image;
    private bgMusic!: Phaser.Sound.BaseSound;

    // Variável para guardar a pontuação recebida
    private finalScore: number = 0;

    // Container que vai agrupar toda a nossa interface
    private uiContainer!: Phaser.GameObjects.Container;

    constructor() {
        super('GameOverQuimica');
    }

    // --- Recebe os dados da cena anterior ---
    init(data: { score?: number }) {
        // Se vier pontuação, guarda ela. Se não, fica 0.
        this.finalScore = data.score || 0;
    }

    create() {
        // ==========================================
        // --- GERENCIAMENTO SEGURO DA MÚSICA ---
        // ==========================================
        if (this.cache.audio.exists('QuimicaMinigame')) {
            if (!this.bgMusic || !this.bgMusic.isPlaying) {
                this.bgMusic = this.sound.add('QuimicaMinigame', { volume: 0.3, loop: true });
                this.bgMusic.play();
            }
        } else {
            console.warn('Aviso: Áudio "QuimicaMinigame" não encontrado. O jogo continuará sem música.');
        }

        const { width, height } = this.scale;

        // 1. Fundo com tom azul claro (tema Química)
        this.background = this.add.image(width / 2, height / 2, 'backgrounds/menu-laboratorio');
        this.background.setDisplaySize(width, height);
        this.background.setAlpha(0.4);
        this.background.setTint(0xcce5ff); 
        this.background.postFX.addBlur(0, 2, 2, 1);

        // ==========================================
        // --- INTERFACE RESPONSIVA (PORCENTAGEM) ---
        // ==========================================
        this.uiContainer = this.add.container(width / 2, height / 2);

        // 1. Caixa Branca Estilizada (65% da tela)
        const boxWidth = width * 0.65;
        const boxHeight = height * 0.65;

        const boxBg = this.add.graphics();
        boxBg.fillStyle(0xffffff, 0.95);
        boxBg.fillRoundedRect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight, 20);
        boxBg.lineStyle(6, 0x2ecc71); // Borda Verde Esmeralda (Química)
        boxBg.strokeRoundedRect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight, 20);

        // 2. Coordenadas relativas à altura da caixa
        const titleY = -boxHeight * 0.35;
        const scoreY = -boxHeight * 0.15;
        const lineY = -boxHeight * 0.02;
        const rewardTitleY = boxHeight * 0.12;
        const iconY = boxHeight * 0.28;
        const continueY = (boxHeight / 2) + 40; 

        // Título
        const titleFontSize = Math.max(24, boxHeight * 0.08);
        const title = this.add.text(0, titleY, 'Experimento Concluído!', {
            fontFamily: 'Fredoka', fontSize: `${titleFontSize}px`, color: '#2ecc71', fontStyle: 'bold'
        }).setOrigin(0.5);

        // Pontuação
        const scoreFontSize = Math.max(20, boxHeight * 0.06);
        const scoreLabel = this.add.text(0, scoreY, `Você conseguiu:\n🌟 ${this.finalScore} Pontos!`, {
            fontFamily: 'Fredoka', fontSize: `${scoreFontSize}px`, color: '#3d3d3d', align: 'center', fontStyle: 'bold'
        }).setOrigin(0.5);

        // Divisória sutil
        const line = this.add.graphics();
        line.lineStyle(2, 0xe0e0e0);
        const lineWidth = boxWidth * 0.6;
        line.lineBetween(-lineWidth / 2, lineY, lineWidth / 2, lineY);

        // Título da Recompensa
        const rewardFontSize = Math.max(16, boxHeight * 0.045);
        const rewardTitle = this.add.text(0, rewardTitleY, '🌟 Recompensa Desbloqueada 🌟', {
            fontFamily: 'Fredoka', fontSize: `${rewardFontSize}px`, color: '#ffb300', fontStyle: 'bold'
        }).setOrigin(0.5);

        // ==========================================
        // --- ÍCONE DA MARIE (TAMANHO DINÂMICO) ---
        // ==========================================
        const rewardIcon = this.add.image(0, iconY, 'Marie-Icone');

        // Define que a imagem vai ocupar no máximo 25% da altura da caixa
        const iconTargetHeight = boxHeight * 0.25;
        const iconScale = iconTargetHeight / rewardIcon.height;
        rewardIcon.setScale(iconScale);

        // Efeito de brilho dourado atrás do ícone
        const glowRadius = iconTargetHeight * 0.45;
        const glow = this.add.graphics();
        glow.setPosition(0, iconY);
        glow.fillStyle(0xffd700, 0.5);
        glow.fillCircle(0, 0, glowRadius);

        // Botão / Instrução para continuar
        const continueFontSize = Math.max(16, boxHeight * 0.04);
        const continueText = this.add.text(0, continueY, 'Clique na tela para ouvir as conclusões ➔', {
            fontFamily: 'Fredoka', fontSize: `${continueFontSize}px`, color: '#ffffff', backgroundColor: '#2ecc71', padding: { x: 20, y: 10 }
        }).setOrigin(0.5);

        // Adiciona todos os elementos ao container
        this.uiContainer.add([boxBg, title, scoreLabel, line, rewardTitle, glow, rewardIcon, continueText]);

        // --- ANIMAÇÕES ---
        this.uiContainer.setScale(0);
        this.tweens.add({
            targets: this.uiContainer,
            scale: 1,
            duration: 600,
            ease: 'Back.easeOut'
        });

        this.tweens.add({
            targets: glow,
            scale: 1.3,
            alpha: 0.1,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // ==========================================
        // --- LÓGICA DE TRANSIÇÃO PARA O DIÁLOGO ---
        // ==========================================
        this.input.once('pointerdown', () => {
            this.uiContainer.setVisible(false);

            // Carrega o script final (certifique-se de ter criado o quimica-final.json)
            const scriptFinal = this.cache.json.get('quimica-final');

            if (!scriptFinal) {
                console.error("ERRO: O arquivo quimica-final.json não foi encontrado!");
                this.unlockCharacterAndReturn();
                return;
            }

            this.scene.launch('DialogueScene', {
                script: scriptFinal,
                parentScene: 'GameOverQuimica',
                onComplete: () => {
                    console.log("Diálogo concluído. Retornando ao Hub...");
                    this.scene.stop('DialogueScene');
                    this.unlockCharacterAndReturn();
                }
            });
        });

        this.events.once('shutdown', () => {
            if (this.bgMusic && this.bgMusic.isPlaying) {
                this.bgMusic.stop();
            }
        });
    }

    private unlockCharacterAndReturn() {
        let unlocked = localStorage.getItem('unlockedCharacters') || 'Julia';

        // Desbloqueia a Marie no Carrossel Principal e no Álbum
        if (!unlocked.includes('Marie')) {
            unlocked += ',Marie';
            localStorage.setItem('unlockedCharacters', unlocked);
        }

        this.scene.stop('GameOverQuimica');
        this.scene.start('HubLabsScene');
    }
}