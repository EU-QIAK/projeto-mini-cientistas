import { Scene, GameObjects } from 'phaser';

export class UIQuimica extends Scene {
    private uiGraphics!: GameObjects.Graphics;
    private headerTitle!: GameObjects.Text;
    private exitText!: GameObjects.Text;
    private logoImg!: GameObjects.Image;
    private controlsText!: GameObjects.Text; 
    
    private exitButtonZone!: GameObjects.Zone; 

    // Cores mantidas para manter o padrão visual do seu jogo
    private readonly COLORS = {
        backgroundBlue: 0x87ceeb,
        primaryPink: 0xff69b4,
        primaryPinkDark: 0xd1478e,
        fontDark: 0x3d3d3d,
        white: 0xffffff
    };

    constructor() {
        // CORRIGIDO: A chave agora é específica da Química
        super({ key: 'UIQuimica' }); 
    }

    create(): void {
        this.uiGraphics = this.add.graphics();

        this.logoImg = this.add.image(0, 0, 'Logo');

        // Título do Laboratório
        this.headerTitle = this.add.text(0, 0, 'Laboratório de Química', {
            fontFamily: 'Fredoka',
            fontSize: '32px',
            color: '#3d3d3d'
        }).setOrigin(0.5);

        this.exitText = this.add.text(0, 0, 'VOLTAR', {
            fontFamily: 'Fredoka',
            fontSize: '26px',
            color: '#ffffff'
        }).setOrigin(0.5);

    
         // CORRIGIDO: Instruções do Mini-game de Química
        this.controlsText = this.add.text(0, 0, 'Clique nos átomos flutuantes (H, O, C) para combiná-los e formar as moléculas pedidas!', {
            fontFamily: 'Fredoka',
            fontSize: '16px',
            color: '#3d3d3d',
            align: 'center'
        }).setOrigin(0.5);

        this.exitButtonZone = this.add.zone(0, 0, 1, 1).setInteractive({ useHandCursor: true });
        
        // Ação do botão de sair
        this.exitButtonZone.on('pointerdown', () => {

            // Emite um aviso para as outras cenas saberem que o botão foi clicado (segurança extra)
            this.events.emit('btnVoltarClicked');

            // 1. Desliga tudo que for relacionado à Química (CORRIGIDO)
            this.scene.stop('HubLabsQuimica'); // Fecha a cena da Marie Curie
            this.scene.stop('QuimicaMinigame'); // Fecha o Minigame de Química
            this.scene.stop('DialogueScene'); // Fecha a caixa de diálogo se estiver aberta
            
            // 2. Religa a UI genérica (a que tem o botão rosa normal)
            this.scene.launch('UIScene');
            
            // 3. Volta para a tela do carrossel principal (e encerra esta UIQuimica automaticamente)
            this.scene.start('HubLabsScene');
        });

        this.drawUI();

        this.scale.on('resize', () => this.drawUI());
    }

    private drawUI(): void {
        const { width, height } = this.scale;
        this.uiGraphics.clear();

        const headerHeight = height * 0.14;
        const footerHeight = height * 0.09;
        const paddingInterno = 20;

        // Parte superior com a logo
        this.uiGraphics.fillStyle(0x000000, 0.1);
        this.uiGraphics.fillRect(0, 4, width, headerHeight);

        this.uiGraphics.fillStyle(this.COLORS.white, 1);
        this.uiGraphics.fillRect(0, 0, width, headerHeight);

        // Parte inferior com a legenda
        this.uiGraphics.fillStyle(0x000000, 0.1);
        this.uiGraphics.fillRect(0, height - footerHeight + 4, width, footerHeight);

        this.uiGraphics.fillStyle(this.COLORS.white, 1);
        this.uiGraphics.fillRect(0, height - footerHeight, width, footerHeight);        

        // Logo
        const logoTargetHeight = headerHeight * 0.7;
        const logoScale = logoTargetHeight / this.logoImg.height;
        this.logoImg.setScale(logoScale);
        const logoX = (this.logoImg.displayWidth / 2) + paddingInterno;
        const logoY = headerHeight / 2;
        this.logoImg.setPosition(logoX, logoY);

        // Título Principal
        this.headerTitle.setPosition(width / 2, headerHeight / 2);
        this.headerTitle.setFontSize(Math.min(headerHeight * 0.35, 32));

        // Instruções no Footer
        const footerY = height - (footerHeight / 2);
        this.controlsText.setPosition(width / 2, footerY);
        this.controlsText.setFontSize(Math.min(footerHeight * 0.3, 16));

        // Botão de Sair
        const btnW = Math.max(width * 0.10, 90);
        const btnH = headerHeight * 0.5;
        const btnX = width - (btnW / 2) - paddingInterno;
        const btnY = headerHeight / 2;
        const btnRadius = btnH / 2;

        // Sombra do botão
        this.uiGraphics.fillStyle(this.COLORS.primaryPinkDark, 1);
        this.uiGraphics.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2 + 3, btnW, btnH, btnRadius);

        // Corpo do botão
        this.uiGraphics.fillStyle(this.COLORS.primaryPink, 1);
        this.uiGraphics.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, btnRadius);

        this.exitText.setPosition(btnX, btnY);
        this.exitText.setFontSize(Math.min(btnH * 0.4, 18));

        this.exitButtonZone.setPosition(btnX, btnY);
        this.exitButtonZone.setSize(btnW, btnH);
    }
}