import { Scene, GameObjects, Input, Time } from 'phaser';

interface MicroorganismoData {
    id: string;
    nome: string;
    texto: string;
    isAmigo: boolean;
    texture: string;
}

export class BiologiaMinigame extends Scene {
    // --- VARIÁVEIS ARCADE ---
    private score: number = 0;
    private readonly maxTime: number = 45; // Tempo total
    private timeLeft: number = 45;
    private gameTimer!: Time.TimerEvent;

    // Variáveis da Barra de Tempo
    private timerBarBg!: GameObjects.Graphics;
    private timerBarFill!: GameObjects.Graphics;
    private timerBarWidth!: number;

    private safeHeight!: number;
    private safeY!: number;

    // UI Elements locais
    private infoText!: GameObjects.Text;
    private scoreText!: GameObjects.Text;
    private recordeText!: GameObjects.Text;
    private infoBoxBg!: GameObjects.Graphics;
    private panelBounds!: { x: number, y: number, w: number, h: number };

    // --- NOVA VARIÁVEL DE ÁUDIO ---
    private bgMusic!: Phaser.Sound.BaseSound;

    private microbesData: MicroorganismoData[] = [
        { id: 'lacto', nome: 'Lactobacillus', texto: 'Oi! Eu sou o Lactobacillus! Moro no iogurte e ajudo sua barriga a funcionar bem!', isAmigo: true, texture: 'micro-Lactobacillus' },
        { id: 'saccha', nome: 'Saccharomyces', texto: 'Olá! Eu sou o fungo Saccharomyces! Eu ajudo a fazer o pão crescer bem fofinho!', isAmigo: true, texture: 'micro-cerevisiae' },
        { id: 'penic', nome: 'Penicillium', texto: 'Sou o Penicillium! Você sabia que de mim veio o primeiro antibiótico para curar doenças?', isAmigo: true, texture: 'micro-Penicillium' },
        { id: 'flu', nome: 'Influenza', texto: 'Achoo! Sou o vírus Influenza. Eu adoro causar gripes e resfriados!', isAmigo: false, texture: 'micro-Influenza' },
        { id: 'giardia', nome: 'Giardia', texto: 'Hehehe! Sou a Giardia. Vivo na água suja e dou uma baita dor de barriga!', isAmigo: false, texture: 'micro-lamblia' },
        { id: 'salmo', nome: 'Salmonella', texto: 'Sou a Salmonella! Fico escondida em comidas cruas e causo intoxicação!', isAmigo: false, texture: 'micro-Salmonella' }
    ];

    constructor() {
        super('BiologiaMinigame');
    }

    init() {
        this.score = 0;
        this.timeLeft = this.maxTime;
        // Reativa a interação caso o jogador esteja vindo do "Tentar Novamente"
        this.input.enabled = true;
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

        this.add.image(width / 2, height / 2, 'background BiologiaMinigame').setAlpha(0.5);

        const topUI = height * 0.14;
        const bottomUI = height * 0.09;
        this.safeHeight = height - topUI - bottomUI;
        this.safeY = topUI;

        // --- INICIA A INTERFACE ---
        this.createDropZones(width);
        this.createInfoPanel(width);
        this.createTimerBar(width);

        for (let i = 0; i < 4; i++) {
            this.spawnSingleMicrobe(width);
        }

        this.setupDragEvents();

        this.gameTimer = this.time.addEvent({
            delay: 100, // Roda a cada 0.1s para a barra de tempo ficar super suave
            callback: this.updateTimer,
            callbackScope: this,
            loop: true
        });

        // --- LIMPEZA AUTOMÁTICA DO ÁUDIO AO SAIR DA CENA ---
        this.events.once('shutdown', () => {
            if (this.bgMusic && this.bgMusic.isPlaying) {
                this.bgMusic.stop();
            }
        });
    }

    // --- DESENHA A BARRA DE TEMPO NA PARTE INFERIOR ---
    private createTimerBar(width: number) {
        const barHeight = 20;
        this.timerBarWidth = width * 0.5; // Deixei a barra um pouco menor para caber no painel

        // Medidas do Painel Branco (Fundo)
        const panelPaddingX = 60; // Espaço extra para o ícone
        const panelPaddingY = 15;
        const panelWidth = this.timerBarWidth + panelPaddingX;
        const panelHeight = barHeight + panelPaddingY * 2;

        const panelX = (width - panelWidth) / 2;
        // Posiciona o painel inteiro 15px acima da base da Safe Area
        const panelY = this.safeY + this.safeHeight - panelHeight - 15;

        // 1. Cria o Painel Branco
        const panelBg = this.add.graphics();
        panelBg.fillStyle(0xffffff, 0.9); // Branco quase totalmente opaco
        panelBg.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 15);
        panelBg.lineStyle(3, 0x87ceeb); // Borda azul clara para combinar
        panelBg.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 15);

        // 2. Coordenadas exatas para a barra interna
        const innerBarX = panelX + 45; // Empurra a barra pra direita para caber a ampulheta
        const innerBarY = panelY + panelPaddingY;

        // Fundo escuro/vazio da barra (o "trilho")
        this.timerBarBg = this.add.graphics();
        this.timerBarBg.fillStyle(0xe0e0e0, 1); // Cinza clarinho
        this.timerBarBg.fillRoundedRect(innerBarX, innerBarY, this.timerBarWidth, barHeight, 10);

        // O preenchimento da barra (Colorida)
        this.timerBarFill = this.add.graphics();
        this.drawTimerFill(innerBarX, innerBarY, this.timerBarWidth, barHeight, 0x28a745);

        // Ícone de Tempo (Ampulheta) da nossa biblioteca
        const timeIcon = this.add.image(panelX + 22, panelY + (panelHeight / 2), 'Timer').setOrigin(0.5);
        timeIcon.setDisplaySize(28, 28);
    }

    private drawTimerFill(x: number, y: number, w: number, h: number, color: number) {
        this.timerBarFill.clear();
        if (w > 0) {
            this.timerBarFill.fillStyle(color, 1);
            this.timerBarFill.fillRoundedRect(x, y, w, h, 10);
        }
    }

    // --- ATUALIZAÇÃO DA BARRA SUAVE NA PARTE INFERIOR ---
    private updateTimer() {
        if (this.timeLeft > 0) {
            this.timeLeft -= 0.1;

            const barHeight = 20;

            // Recalcula as posições baseadas no painel branco
            const panelPaddingX = 60;
            const panelPaddingY = 15;
            const panelWidth = this.timerBarWidth + panelPaddingX;
            const panelHeight = barHeight + panelPaddingY * 2;

            const panelX = (this.scale.width - panelWidth) / 2;
            const panelY = this.safeY + this.safeHeight - panelHeight - 15;

            // Posição exata do "trilho" onde a barra colorida deve crescer
            const innerBarX = panelX + 45;
            const innerBarY = panelY + panelPaddingY;

            // Calcula o tamanho da barra
            const percentage = Math.max(0, this.timeLeft / this.maxTime);
            const currentWidth = this.timerBarWidth * percentage;

            // Muda a cor dependendo do tempo
            let barColor = 0x28a745; // Verde
            if (percentage <= 0.25) barColor = 0xdc3545; // Vermelho
            else if (percentage <= 0.5) barColor = 0xffc107; // Amarelo

            // Desenha o preenchimento no lugar certo
            this.drawTimerFill(innerBarX, innerBarY, currentWidth, barHeight, barColor);

        } else {
            this.endGame();
        }
    }

    private createDropZones(width: number) {
        const zoneHeight = this.safeHeight * 0.75;
        const zoneY = this.safeY + (this.safeHeight / 2);
        const zoneWidth = width * 0.25;

        // Zona Esquerda (Cuidado / Inimigos)
        const zoneLeft = this.add.zone(width * 0.15, zoneY, zoneWidth, zoneHeight).setRectangleDropZone(zoneWidth, zoneHeight);
        zoneLeft.setName('cuidado');

        const graphicsLeft = this.add.graphics();
        graphicsLeft.fillStyle(0xff0000, 0.2);
        graphicsLeft.fillRoundedRect(zoneLeft.x - zoneWidth / 2, zoneLeft.y - zoneHeight / 2, zoneWidth, zoneHeight, 15);
        graphicsLeft.lineStyle(4, 0xff0000, 0.8);
        graphicsLeft.strokeRoundedRect(zoneLeft.x - zoneWidth / 2, zoneLeft.y - zoneHeight / 2, zoneWidth, zoneHeight, 15);
        this.add.text(zoneLeft.x, zoneLeft.y - (zoneHeight / 2) + 20, '⚠️ CUIDADO', { fontFamily: 'Fredoka', fontSize: '24px', color: '#ff0000' }).setOrigin(0.5);

        // Zona Direita (Amigos)
        const zoneRight = this.add.zone(width * 0.85, zoneY, zoneWidth, zoneHeight).setRectangleDropZone(zoneWidth, zoneHeight);
        zoneRight.setName('amigos');

        const graphicsRight = this.add.graphics();
        graphicsRight.fillStyle(0x00ff00, 0.2);
        graphicsRight.fillRoundedRect(zoneRight.x - zoneWidth / 2, zoneRight.y - zoneHeight / 2, zoneWidth, zoneHeight, 15);
        graphicsRight.lineStyle(4, 0x00ff00, 0.8);
        graphicsRight.strokeRoundedRect(zoneRight.x - zoneWidth / 2, zoneRight.y - zoneHeight / 2, zoneWidth, zoneHeight, 15);
        this.add.text(zoneRight.x, zoneRight.y - (zoneHeight / 2) + 20, '💚 AMIGOS', { fontFamily: 'Fredoka', fontSize: '24px', color: '#00ff00' }).setOrigin(0.5);
    }

    private createInfoPanel(width: number) {
        const panelHeight = this.safeHeight * 0.15;
        const panelWidth = width * 0.40;
        const panelY = this.safeY + (this.safeHeight * 0.10);

        this.panelBounds = {
            x: width / 2 - (panelWidth / 2),
            y: panelY - (panelHeight / 2),
            w: panelWidth,
            h: panelHeight
        };

        this.infoBoxBg = this.add.graphics();
        this.drawInfoBox(0xffffff, 0x87ceeb);

        this.infoText = this.add.text(width / 2, panelY, 'O relógio está correndo! Classifique o máximo que conseguir!', {
            fontFamily: 'Fredoka', fontSize: '26px', color: '#3d3d3d', align: 'center', wordWrap: { width: panelWidth * 0.9 }
        }).setOrigin(0.5);

        // --- SISTEMA DE RECORDE EM TEMPO REAL (COM ÍCONES) ---
        const recordeAtual = parseInt(localStorage.getItem('biologiaRecorde') || '0');

        const scoreX = width * 0.05; // 5% da borda esquerda
        const scoreY = this.safeY + 20;

        // Ícone e Texto de Pontuação (Atual)
        const iconTrofeu = this.add.image(scoreX, scoreY, 'Trofeu').setOrigin(0, 0.4);
        iconTrofeu.setDisplaySize(36, 36);

        this.scoreText = this.add.text(scoreX + 45, scoreY, `Pontos: 0`, {
            fontFamily: 'Fredoka', fontSize: '36px', color: '#e7e7e7', fontStyle: 'bold'
        }).setOrigin(0, 0.4);

        // Ícone e Texto de Recorde (Abaixo da Pontuação)
        const iconEstrela = this.add.image(scoreX, scoreY + 30, 'estrela').setOrigin(0, 0.1);
        iconEstrela.setDisplaySize(28, 28);

        this.recordeText = this.add.text(scoreX + 35, scoreY + 30, `Recorde: ${recordeAtual}`, {
            fontFamily: 'Fredoka', fontSize: '28px', color: '#ffd700', fontStyle: 'bold' // Dourado!
        }).setOrigin(0, 0.1);
    }

    private drawInfoBox(fillColor: number, lineColor: number) {
        this.infoBoxBg.clear();
        this.infoBoxBg.fillStyle(fillColor, 0.9);
        this.infoBoxBg.fillRoundedRect(this.panelBounds.x, this.panelBounds.y, this.panelBounds.w, this.panelBounds.h, 15);
        this.infoBoxBg.lineStyle(3, lineColor);
        this.infoBoxBg.strokeRoundedRect(this.panelBounds.x, this.panelBounds.y, this.panelBounds.w, this.panelBounds.h, 15);
    }

    // --- FUNÇÃO QUE GERA UM ÚNICO MICRORGANISMO ---
    private spawnSingleMicrobe(width: number) {
        const data = Phaser.Utils.Array.GetRandom(this.microbesData);

        const targetHeight = this.safeHeight * 0.22;

        const startX = Phaser.Math.Between(width * 0.4, width * 0.6);
        const startY = Phaser.Math.Between(this.safeY + (this.safeHeight * 0.4), this.safeY + (this.safeHeight * 0.8));

        const microbe = this.add.image(startX, startY, data.texture).setInteractive({ cursor: 'pointer' });

        const scaleRatio = targetHeight / microbe.height;
        microbe.setScale(0);
        this.tweens.add({ targets: microbe, scale: scaleRatio, duration: 300, ease: 'Back.easeOut' });

        microbe.setData('info', data);
        microbe.setData('startX', startX);
        microbe.setData('startY', startY);
        microbe.setData('baseScale', scaleRatio);

        this.input.setDraggable(microbe);

        // Movimento de respiração
        const floatTween = this.tweens.add({
            targets: microbe,
            y: startY + Phaser.Math.Between(-20, 20),
            duration: Phaser.Math.Between(1500, 2500),
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        microbe.setData('floatTween', floatTween);

        microbe.on('pointerdown', () => {
            microbe.setTint(0xdddddd);
            this.infoText.setText(data.texto);

            if (data.isAmigo) {
                this.drawInfoBox(0xd4edda, 0x28a745);
            } else {
                this.drawInfoBox(0xf8d7da, 0xdc3545);
            }
        });

        microbe.on('pointerup', () => microbe.clearTint());
    }

    private setupDragEvents() {
        this.input.on('drag', (pointer: Phaser.Input.Pointer, gameObject: GameObjects.Image, dragX: number, dragY: number) => {
            gameObject.x = dragX;
            gameObject.y = dragY;
            gameObject.setDepth(100);

            const tween = gameObject.getData('floatTween');
            if (tween) tween.pause();
        });

        this.input.on('drop', (pointer: Phaser.Input.Pointer, gameObject: GameObjects.Image, dropZone: GameObjects.Zone) => {
            const data: MicroorganismoData = gameObject.getData('info');
            const isAmigoZone = dropZone.name === 'amigos';

            if ((data.isAmigo && isAmigoZone) || (!data.isAmigo && !isAmigoZone)) {
                this.handleCorrectDrop(gameObject, dropZone);
            } else {
                this.handleWrongDrop(gameObject);
            }
        });

        this.input.on('dragend', (pointer: Phaser.Input.Pointer, gameObject: GameObjects.Image, dropped: boolean) => {
            if (!dropped) {
                this.handleWrongDrop(gameObject);
            }
        });
    }

    private handleCorrectDrop(microbe: GameObjects.Image, zone: GameObjects.Zone) {
        microbe.disableInteractive();
        microbe.clearTint();

        // --- ANIMAÇÃO DE ACERTO ---
        this.tweens.add({
            targets: microbe,
            x: zone.x + Phaser.Math.Between(-30, 30),
            y: zone.y + Phaser.Math.Between(-50, 50),
            scale: 0,
            alpha: 0,
            duration: 400,
            ease: 'Back.easeIn',
            onComplete: () => {
                microbe.destroy();

                if (this.timeLeft > 0) {
                    this.spawnSingleMicrobe(this.scale.width);
                }
            }
        });

        this.drawInfoBox(0xffffff, 0x87ceeb);
        this.infoText.setText('Muito bem! +10 Pontos!');

        this.score += 10;
        this.scoreText.setText(`Pontos: ${this.score}`); // Sem Emoji

        this.tweens.add({ targets: this.scoreText, scale: 1.2, yoyo: true, duration: 150 });
    }

    private handleWrongDrop(microbe: GameObjects.Image) {
        const startX = microbe.getData('startX');
        const startY = microbe.getData('startY');

        this.infoText.setText('Ops! Essa caixa é errada. Leia as características na lupa!');
        this.drawInfoBox(0xffffff, 0x87ceeb);

        this.tweens.add({
            targets: microbe,
            x: startX,
            y: startY,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
                const tween = microbe.getData('floatTween');
                if (tween) tween.resume();
            }
        });
    }

    private endGame() {
        this.gameTimer.remove();

        // --- SISTEMA DE RECORDE (Local Storage) ---
        let recordeAtual = parseInt(localStorage.getItem('biologiaRecorde') || '0');
        let bateuRecorde = false;

        if (this.score > recordeAtual) {
            recordeAtual = this.score;
            localStorage.setItem('biologiaRecorde', recordeAtual.toString());
            bateuRecorde = true;
        }

        const { width, height } = this.scale;

        // --- O BLOQUEADOR DE CLIQUES ---
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.7);
        overlay.fillRect(0, 0, width, height);
        overlay.setDepth(200);

        const blockerZone = this.add.zone(width / 2, height / 2, width, height).setInteractive();
        blockerZone.setDepth(200);
        blockerZone.on('pointerdown', (pointer: Phaser.Input.Pointer, localX: number, localY: number, event: Phaser.Types.Input.EventData) => {
            event.stopPropagation();
        });

        const popup = this.add.container(width / 2, height / 2);
        popup.setDepth(201); 
        const bgWidth = width * 0.55;
        const bgHeight = height * 0.55; 
        
        const bg = this.add.graphics();
        bg.fillStyle(0xffffff, 1);
        bg.fillRoundedRect(-bgWidth / 2, -bgHeight / 2, bgWidth, bgHeight, 20);
        bg.lineStyle(6, bateuRecorde ? 0xffc107 : 0x87ceeb); 
        bg.strokeRoundedRect(-bgWidth / 2, -bgHeight / 2, bgWidth, bgHeight, 20);

        // --- TÍTULO ---
        const titleText = bateuRecorde ? 'NOVO RECORDE!' : 'TEMPO ESGOTADO!';
        const titleColor = bateuRecorde ? '#ffc107' : '#3d3d3d';

        const title = this.add.text(0, -bgHeight * 0.35, titleText, {
            fontFamily: 'Fredoka', fontSize: '36px', color: titleColor, fontStyle: 'bold'
        }).setOrigin(0.5);

        const elementsToAdd: any[] = [bg, title];

        // Se bater recorde, coloca estrelas no título!
        if (bateuRecorde) {
            const starL = this.add.image(-title.width / 2 - 30, -bgHeight * 0.35, 'estrela').setDisplaySize(36, 36);
            const starR = this.add.image(title.width / 2 + 30, -bgHeight * 0.35, 'estrela').setDisplaySize(36, 36);
            elementsToAdd.push(starL, starR);
        }

        // --- TEXTOS SEPARADOS (Com ícones ao lado) ---
        const scoreMsg = this.add.text(0, -bgHeight * 0.12, `Você classificou ${this.score / 10} microrganismos`, {
            fontFamily: 'Fredoka', fontSize: '26px', color: '#3d3d3d', align: 'center'
        }).setOrigin(0.5);

        const starMLeft = this.add.image(-scoreMsg.width / 2 - 25, -bgHeight * 0.12, 'estrela').setDisplaySize(26, 26);
        const starMRight = this.add.image(scoreMsg.width / 2 + 25, -bgHeight * 0.12, 'estrela').setDisplaySize(26, 26);

        const currentScoreText = this.add.text(0, -bgHeight * 0.02, `Pontuação Atual: ${this.score}`, {
            fontFamily: 'Fredoka', fontSize: '26px', color: '#3d3d3d', align: 'center'
        }).setOrigin(0.5);

        const recText = this.add.text(20, bgHeight * 0.08, `Recorde: ${recordeAtual}`, {
            fontFamily: 'Fredoka', fontSize: '26px', color: '#3d3d3d', align: 'center', fontStyle: 'bold'
        }).setOrigin(0.5);

        const trophyPopup = this.add.image(-recText.width / 2 - 15, bgHeight * 0.08, 'Trofeu').setDisplaySize(28, 28);

        elementsToAdd.push(scoreMsg, starMLeft, starMRight, currentScoreText, recText, trophyPopup);

        // --- BOTÃO 1: TENTAR NOVAMENTE ---
        const btnRetryW = 240;
        const btnRetryH = 50;
        const btnRetryY = bgHeight * 0.22;

        const btnRetryBg = this.add.graphics();
        btnRetryBg.fillStyle(0x87ceeb, 1); 
        btnRetryBg.fillRoundedRect(-btnRetryW / 2, btnRetryY - btnRetryH / 2, btnRetryW, btnRetryH, 25);

        const btnRetryText = this.add.text(0, btnRetryY, 'TENTAR NOVAMENTE', {
            fontFamily: 'Fredoka', fontSize: '20px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);

        const btnRetryZone = this.add.zone(0, btnRetryY, btnRetryW, btnRetryH).setInteractive({ useHandCursor: true });

        btnRetryZone.on('pointerover', () => { btnRetryBg.fillStyle(0x5ca0d3, 1).fillRoundedRect(-btnRetryW / 2, btnRetryY - btnRetryH / 2, btnRetryW, btnRetryH, 25); });
        btnRetryZone.on('pointerout', () => { btnRetryBg.fillStyle(0x87ceeb, 1).fillRoundedRect(-btnRetryW / 2, btnRetryY - btnRetryH / 2, btnRetryW, btnRetryH, 25); });

        btnRetryZone.on('pointerdown', () => {
            this.input.enabled = true;
            overlay.destroy();
            popup.destroy();
            this.scene.restart();
        });

        elementsToAdd.push(btnRetryBg, btnRetryText, btnRetryZone);

        // --- BOTÃO 2: CONTINUAR ---
        const btnContW = 240;
        const btnContH = 50;
        const btnContY = bgHeight * 0.38;

        const btnContBg = this.add.graphics();
        btnContBg.fillStyle(0xff69b4, 1); 
        btnContBg.fillRoundedRect(-btnContW / 2, btnContY - btnContH / 2, btnContW, btnContH, 25);

        const btnContText = this.add.text(0, btnContY, ' CONTINUAR', {
            fontFamily: 'Fredoka', fontSize: '20px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);

        const btnContZone = this.add.zone(0, btnContY, btnContW, btnContH).setInteractive({ useHandCursor: true });

        btnContZone.on('pointerover', () => { btnContBg.fillStyle(0xd1478e, 1).fillRoundedRect(-btnContW / 2, btnContY - btnContH / 2, btnContW, btnContH, 25); });
        btnContZone.on('pointerout', () => { btnContBg.fillStyle(0xff69b4, 1).fillRoundedRect(-btnContW / 2, btnContY - btnContH / 2, btnContW, btnContH, 25); });

        btnContZone.on('pointerdown', () => {
            this.scene.stop('UIBiologia');
            this.scene.launch('UIScene');
            this.scene.start('GameOverBio', { score: this.score });
        });

        elementsToAdd.push(btnContBg, btnContText, btnContZone);

        // Adiciona tudo ao container
        popup.add(elementsToAdd);

        popup.setScale(0);
        this.tweens.add({
            targets: popup,
            scale: 1,
            duration: 600,
            ease: 'Back.easeOut'
        });
    }
}