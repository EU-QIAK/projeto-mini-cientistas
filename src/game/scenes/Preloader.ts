import { Scene } from 'phaser';

export class Preloader extends Scene {
    private progressBar!: Phaser.GameObjects.Graphics;
    private progressOutline!: Phaser.GameObjects.Graphics;

    constructor() {
        super('Preloader');
    }

    init() {
        const { width, height } = this.scale;

        // Fundo (usando a logo ou um fundo neutro carregado no Boot)
        this.add.image(width, height, 'background').setDisplaySize(width, height);

        // Fundo (usando a logo ou um fundo neutro carregado no Boot)
        this.add.image(width / 2, height / 2, 'background')
            .setOrigin(0.5) // Define o ponto âncora para o meio exato da imagem
            .setDisplaySize(width, height); // Força a cobrir a tela inteira (opcional, dependendo do tamanho original)

        // Configurações da barra
        const barWidth = 400;
        const barHeight = 24;
        const x = (width - barWidth) / 2;
        const y = height * 0.75; // Posicionada na parte inferior
        const radius = barHeight / 2;

        // Desenho do Contorno (Track da barra)
        this.progressOutline = this.add.graphics();
        // Sombra suave para o contorno
        this.progressOutline.fillStyle(0x000000, 0.1);
        this.progressOutline.fillRoundedRect(x, y + 4, barWidth, barHeight, radius);
        // Fundo do contorno (branco suave)
        this.progressOutline.fillStyle(0xffffff, 0.5);
        this.progressOutline.fillRoundedRect(x, y, barWidth, barHeight, radius);

        // 2. Gráfico da Barra de Progresso
        this.progressBar = this.add.graphics();

        // Texto de Loading
        const loadingText = this.add.text(width / 2, y - 30, 'Carregando Laboratórios...', {
            fontFamily: 'Fredoka',
            fontSize: '20px',
            color: '#3d3d3d'
        }).setOrigin(0.5);

        // Evento de progresso
        this.load.on('progress', (progress: number) => {
            this.progressBar.clear();

            // Cor principal (Rosa do seu botão de Sair para manter a paleta)
            this.progressBar.fillStyle(0xff69b4, 1);

            // Largura mínima para o arredondamento não quebrar no início
            const currentWidth = Math.max(barHeight, barWidth * progress);
            this.progressBar.fillRoundedRect(x, y, currentWidth, barHeight, radius);

            // Atualiza o texto para mostrar a porcentagem
            loadingText.setText(`Carregando Laboratórios... ${Math.round(progress * 100)}%`);
        });
    }

    preload() {
        this.load.setPath('assets');

        // Assets
        this.load.image('logo', 'logo.png');
        this.load.image('Logo', 'logos/Logo.png');
        this.load.image('backgrounds/menu-laboratorio', 'backgrounds/menu-laboratorio.png');
        this.load.image('background BiologiaMinigame', 'backgrounds/fundo-Biologia minigame.png');

        //UI
        this.load.image('balao-exclamacao', 'ui/balao-exclamacao.png');
        this.load.image('balao-pensamento', 'ui/balao-pensamento.png');
        this.load.image('seta-esquerda', 'ui/seta-esquerda.png');
        this.load.image('seta-direita', 'ui/seta-direita.png');

        //icones dos personagens
        this.load.image('Julia-Icone', 'ui/Julia-Icone.png');
        this.load.image('Pasteur-Icone', 'ui/Pasteur-Icone.png');
        this.load.image('Pierre-Icone', 'ui/Pierre-Icone.png');

        // Labs
        this.load.image('labs/quimica', 'labs/quimica.png');
        this.load.image('labs/fisica', 'labs/fisica.png');
        this.load.image('labs/biologia', 'labs/biologia.png');
        this.load.image('labs/odonto', 'labs/odonto.png');
        this.load.image('labs/medicina', 'labs/medicina.png');
        this.load.image('labs/ia', 'labs/ia.png');

        this.load.image('objects/microscopio', 'objects/microscopio.png');

        //microbios do jogo de Biologia
        this.load.image('micro-lamblia', 'objects/microbios/Giardia lamblia.png');
        this.load.image('micro-Influenza', 'objects/microbios/Influenza.png');
        this.load.image('micro-Lactobacillus', 'objects/microbios/Lactobacillus.png');
        this.load.image('micro-Penicillium', 'objects/microbios/Penicillium.png');
        this.load.image('micro-cerevisiae', 'objects/microbios/Saccharomyces cerevisiae.png');
        this.load.image('micro-Salmonella', 'objects/microbios/Salmonella.png');

        //// --- ASSETS DO MINIGAME DE ODONTO ---
        this.load.image('dente', 'objects/Odonto/dente.png');
        this.load.image('bacteria', 'objects/Odonto/bacteria.png');
        this.load.image('pasta', 'objects/Odonto/pasta.png');
        this.load.image('fundo-odontologia', 'backgrounds/fundo-odontologia.png');


        //carregando os sprits dos personagens
        this.load.image('julia', 'characters/julia/julia-scene-pensitive.png'); // Ajuste o nome/caminho se necessário
        this.load.image('pasteur', 'characters/pasteur/pasteur-normal.png');
        this.load.image('pierre', 'characters/pierre/Pierre Fauchard-normal.png');
        this.load.image('Marie', 'characters/Marie/Marie Curie-normal.png');
        
        // Diálogos
        this.load.json('tutorial-script', 'dialogues/tutorial-sistema.json');

        //biologia
        this.load.json('biologia-intro-script', 'dialogues/biologia-intro.json');
        this.load.json('biologia-apresentacao', 'dialogues/biologia-apresentacao.json');
        this.load.json('biologia-final', 'dialogues/biologia-final.json');

        //odontologia
        this.load.json('odontologia-intro', 'dialogues/odontologia-intro.json');
        this.load.json('odontologia-apresentacao', 'dialogues/odontologia-apresentacao.json');
        this.load.json('odontologia-final', 'dialogues/odontologia-final.json');

        //química
        this.load.json('quimica-intro', 'dialogues/quimica-intro.json');
        this.load.json('quimica-final', 'dialogues/quimica-final.json');


        // Portraits
        //Julia
        this.load.image('characters/julia/julia-portrait.png', 'characters/julia/julia-portrait.png');
        this.load.image('characters/julia/julia-feliz.png', 'characters/julia/julia-feliz.png');

        //pastuer
        this.load.image('characters/pasteur/pasteur-portrait.png', 'characters/pasteur/pasteur-portrait.png');
        this.load.image('characters/pasteur/pasteur-serio.png', 'characters/pasteur/pasteur-serio.png');

        //pierre
        this.load.image('characters/pierre/pierre-normal.png', 'characters/pierre/pierre-normal.png');
        this.load.image('characters/pierre/pierre-feliz.png', 'characters/pierre/pierre-feliz.png');

        //marie
        this.load.image('characters/Marie/Marie-normal.png', 'characters/Marie/Marie-normal.png');
        this.load.image('characters/Marie/Marie-feliz.png', 'characters/Marie/Marie-feliz.png');

        // Sons
        this.load.audio('click', 'sounds/click.wav');
        this.load.audio('Carrosel', 'sounds/Carrosel.mp3');

        this.load.audio('BiologiaMinigame', 'sounds/BiologiaMinigame.mp3');
        this.load.audio('Som_Erro', 'sounds/Som_Erro.mp3');
        this.load.audio('Som_Acerto', 'sounds/Som_Acerto.mp3');


        // Fonte
        (this.load as any).font('Fredoka', 'https://fonts.googleapis.com/css2?family=Fredoka:wght@700&display=swap');
    }

    create() {
        // Pequeno delay para o jogador ver a barra cheia antes de mudar
        this.time.delayedCall(200, () => {
            this.scene.start('HubLabsScene');
            this.scene.launch('UIScene');
            this.scene.bringToTop('UIScene');
        });
    }
}