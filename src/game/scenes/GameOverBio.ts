import { Scene } from 'phaser';

export class GameOverBio extends Scene {
    private background!: Phaser.GameObjects.Image;
    private bgMusic!: Phaser.Sound.BaseSound;

    // Variável para guardar a pontuação recebida
    private finalScore: number = 0;

    // Container que vai agrupar toda a nossa interface nova
    private uiContainer!: Phaser.GameObjects.Container;

    constructor() {
        super('GameOverBio');
    }

    // --- NOVA FUNÇÃO: Recebe os dados da cena anterior ---
    init(data: { score?: number }) {
        // Se vier pontuação, guarda ela. Se não, fica 0.
        this.finalScore = data.score || 0;
    }

    create() {
        // ==========================================
        // --- GERENCIAMENTO SEGURO DA MÚSICA ---
        // ==========================================
        if (!this.bgMusic || !this.bgMusic.isPlaying) {
            this.bgMusic = this.sound.add('BiologiaMinigame', { volume: 0.3, loop: true });
            this.bgMusic.play();
        }

        const { width, height } = this.scale;

        // 1. Fundo com tom esverdeado
        this.background = this.add.image(width / 2, height / 2, 'backgrounds/menu-laboratorio');
        this.background.setDisplaySize(width, height);
        this.background.setAlpha(0.4);
        this.background.setTint(0x90ee90);
        this.background.postFX.addBlur(0, 2, 2, 1);

        // ==========================================
        // --- INTERFACE RESPONSIVA (PORCENTAGEM) ---
        // ==========================================
        this.uiContainer = this.add.container(width / 2, height / 2);

        // 1. Caixa Branca Estilizada (Aumentada: agora usa 65% da tela)
        const boxWidth = width * 0.65;
        const boxHeight = height * 0.65;

        const boxBg = this.add.graphics();
        boxBg.fillStyle(0xffffff, 0.95);
        boxBg.fillRoundedRect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight, 20);
        boxBg.lineStyle(6, 0x28a745); // Borda Verde
        boxBg.strokeRoundedRect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight, 20);

        // 2. Coordenadas relativas à altura da caixa
        const titleY = -boxHeight * 0.35;
        const scoreY = -boxHeight * 0.15;
        const lineY = -boxHeight * 0.02;
        const rewardTitleY = boxHeight * 0.12;
        const iconY = boxHeight * 0.28;
        const continueY = (boxHeight / 2) + 40; // Fica do lado de fora, abaixo da caixa

        // Título (Ajusta o tamanho da fonte junto com a tela)
        const titleFontSize = Math.max(24, boxHeight * 0.08); // No mínimo 24px
        const title = this.add.text(0, titleY, 'Pesquisa Finalizada!', {
            fontFamily: 'Fredoka', fontSize: `${titleFontSize}px`, color: '#28a745', fontStyle: 'bold'
        }).setOrigin(0.5);

        // ==========================================
        // --- PONTUAÇÃO (COM ÍCONE DE TROFÉU) ---
        // ==========================================
        const scoreMsgFontSize = Math.max(16, boxHeight * 0.045);
        const scoreMsg = this.add.text(0, scoreY - 15, 'Você conseguiu:', {
            fontFamily: 'Fredoka', fontSize: `${scoreMsgFontSize}px`, color: '#3d3d3d', align: 'center'
        }).setOrigin(0.5);

        const scoreFontSize = Math.max(22, boxHeight * 0.065);
        const scoreLabel = this.add.text(0, scoreY + 20, `${this.finalScore} Pontos!`, {
            fontFamily: 'Fredoka', fontSize: `${scoreFontSize}px`, color: '#3d3d3d', fontStyle: 'bold'
        }).setOrigin(0.5);

        // Posiciona o troféu logo antes do número de pontos
        const trophyIcon = this.add.image(-scoreLabel.width / 2 - 20, scoreY + 20, 'Trofeu');
        trophyIcon.setDisplaySize(scoreFontSize, scoreFontSize);

        // Divisória sutil (Ocupa 60% da largura da caixa)
        const line = this.add.graphics();
        line.lineStyle(2, 0xe0e0e0);
        const lineWidth = boxWidth * 0.6;
        line.lineBetween(-lineWidth / 2, lineY, lineWidth / 2, lineY);

        // ==========================================
        // --- RECOMPENSA (COM ÍCONES DE ESTRELA) ---
        // ==========================================
        const rewardFontSize = Math.max(16, boxHeight * 0.045);
        const rewardTitle = this.add.text(0, rewardTitleY, 'Recompensa Desbloqueada', {
            fontFamily: 'Fredoka', fontSize: `${rewardFontSize}px`, color: '#ffb300', fontStyle: 'bold'
        }).setOrigin(0.5);

        // Estrelas adornando o título
        const starSize = rewardFontSize + 4;
        const starLeft = this.add.image(-rewardTitle.width / 2 - 20, rewardTitleY, 'estrela').setDisplaySize(starSize, starSize);
        const starRight = this.add.image(rewardTitle.width / 2 + 20, rewardTitleY, 'estrela').setDisplaySize(starSize, starSize);

        // ==========================================
        // --- ÍCONE DO PASTEUR (TAMANHO DINÂMICO) --
        // ==========================================
        const pasteurIcon = this.add.image(0, iconY, 'Pasteur-Icone');

        // Define que a imagem vai ocupar no máximo 18% da altura da caixa (deixando ela menor)
        const iconTargetHeight = boxHeight * 0.25;
        const iconScale = iconTargetHeight / pasteurIcon.height;
        pasteurIcon.setScale(iconScale);

        // Efeito de brilho dourado atrás do ícone
        const glowRadius = iconTargetHeight * 0.45;
        const glow = this.add.graphics();

        // 1. Movemos o "eixo" do Graphics para a mesma posição do ícone
        glow.setPosition(0, iconY);
        glow.fillStyle(0xffd700, 0.5);
        // 2. Agora desenhamos o círculo exatamente no centro (0, 0) desse eixo
        glow.fillCircle(0, 0, glowRadius);

        // Botão / Instrução para continuar
        const continueFontSize = Math.max(16, boxHeight * 0.04);
        const continueText = this.add.text(0, continueY, 'Clique na tela para ouvir as conclusões ➔', {
            fontFamily: 'Fredoka', fontSize: `${continueFontSize}px`, color: '#ffffff', backgroundColor: '#28a745', padding: { x: 20, y: 10 }
        }).setOrigin(0.5);

        // Adiciona todos os elementos ao container
        this.uiContainer.add([
            boxBg, title, 
            scoreMsg, scoreLabel, trophyIcon, 
            line, 
            rewardTitle, starLeft, starRight, 
            glow, pasteurIcon, 
            continueText
        ]);

        // --- ANIMAÇÕES ---
        // Faz a caixa pular na tela
        this.uiContainer.setScale(0);
        this.tweens.add({
            targets: this.uiContainer,
            scale: 1,
            duration: 600,
            ease: 'Back.easeOut'
        });

        // Faz o brilho dourado pulsar infinitamente
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
        // --- LÓGICA DE TRANSIÇÃO MANTIDA ---
        // ==========================================
        this.input.once('pointerdown', () => {
            // Esconde TUDO de uma vez para o diálogo aparecer limpo
            this.uiContainer.setVisible(false);

            const scriptFinal = this.cache.json.get('biologia-final');

            this.scene.launch('DialogueScene', {
                script: scriptFinal,
                parentScene: 'GameOverBio',
                onComplete: () => {
                    console.log("Diálogo concluído. Retornando ao Hub...");

                    let unlocked = localStorage.getItem('unlockedCharacters') || 'Julia';

                    if (!unlocked.includes('Pasteur')) {
                        unlocked += ',Pasteur';
                        localStorage.setItem('unlockedCharacters', unlocked);
                    }

                    this.scene.stop('GameOverBio');
                    this.scene.start('HubLabsScene');
                }
            });
        });

        this.events.once('shutdown', () => {
            if (this.bgMusic && this.bgMusic.isPlaying) {
                this.bgMusic.stop();
            }
        });
    }
}