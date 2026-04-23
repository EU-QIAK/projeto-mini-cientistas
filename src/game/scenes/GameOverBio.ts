import { Scene } from 'phaser';

export class GameOverBio extends Scene {
    private background!: Phaser.GameObjects.Image;
    private gameOverText!: Phaser.GameObjects.Text;
    private restartText!: Phaser.GameObjects.Text;

    constructor() {
        // Importante: a chave deve ser exatamente GameOverBio
        super('GameOverBio');
    }

    create() {
        const { width, height } = this.scale;

        // 1. Fundo com tom esverdeado para Biologia
        this.background = this.add.image(width / 2, height / 2, 'backgrounds/menu-laboratorio');
        this.background.setDisplaySize(width, height);
        this.background.setAlpha(0.4);
        this.background.setTint(0x90ee90); // Aplica um filtro verde claro
        this.background.postFX.addBlur(0, 2, 2, 1);

        // 2. Texto principal com cores de Biologia (Verde)
        this.gameOverText = this.add.text(width / 2, height / 2 - 50, 'Pesquisa Finalizada!', {
            fontFamily: 'Fredoka',
            fontSize: '64px',
            color: '#28a745', 
            stroke: '#ffffff',
            strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5);

        // 3. Instrução clara
        this.restartText = this.add.text(width / 2, height / 2 + 60, 'Clique para ouvir as conclusões do Pasteur', {
            fontFamily: 'Fredoka',
            fontSize: '24px',
            color: '#3d3d3d',
            backgroundColor: '#ffffffaa',
            padding: { x: 15, y: 10 },
            align: 'center'
        }).setOrigin(0.5);

        // Animação suave
        this.tweens.add({
            targets: this.gameOverText,
            scale: 1.05,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // 4. LÓGICA DE TRANSIÇÃO (A MÁGICA)
        this.input.once('pointerdown', () => {
            // Esconde os textos para não poluir o fundo do diálogo
            this.gameOverText.setVisible(false);
            this.restartText.setVisible(false);

            // Busca o script final que você criou
            const scriptFinal = this.cache.json.get('biologia-final');

            // Lança o diálogo
            this.scene.launch('DialogueScene', {
                script: scriptFinal,
                parentScene: 'GameOverBio', // Referência correta para esta cena
                onComplete: () => {
                    // SÓ VOLTA AO HUB QUANDO O DIÁLOGO TERMINAR
                    console.log("Diálogo concluído. Retornando ao Hub...");
                    
                    // Se você usa a UIScene no Hub, lembre-se de lançá-la aqui
                    this.scene.stop('GameOverBio');
                    this.scene.start('HubLabsScene');
                }
            });
        });
    }
}