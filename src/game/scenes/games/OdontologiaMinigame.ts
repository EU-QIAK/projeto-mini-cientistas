import { Scene, GameObjects, Physics, Time, Math as PhaserMath } from 'phaser';

export class OdontologiaMinigame extends Scene {
    // --- VARIÁVEIS DO JOGO ---
    private score: number = 0;
    private maxTime: number = 30;
    private timeLeft: number = 30;

    // --- ELEMENTOS FÍSICOS ---
    private player!: Physics.Arcade.Sprite;
    private enemiesGroup!: Physics.Arcade.Group;
    private collectiblesGroup!: Physics.Arcade.Group;

    // --- EFEITOS E CONTROLE ---
    private trailEmitter!: GameObjects.Particles.ParticleEmitter;
    private isFollowing: boolean = false;

    // --- UI (HUD) ---
    private scoreText!: GameObjects.Text;
    private recordText!: GameObjects.Text;
    private gameTimer!: Time.TimerEvent;

    // Variáveis da Barra de Tempo
    private timerBarBg!: GameObjects.Graphics;
    private timerBarFill!: GameObjects.Graphics;
    private timerBarWidth!: number;

    private isGameOver: boolean = false;

    // Área Segura e Arena do Jogo
    private safeY: number = 0;
    private safeHeight: number = 0;
    private gameArea!: { x: number, y: number, w: number, h: number };

    constructor() {
        super('OdontologiaMinigame');
    }

    init() {
        this.score = 0;
        this.timeLeft = this.maxTime;
        this.isGameOver = false;
        this.isFollowing = false;
    }

    create() {
        const { width, height } = this.scale;

        // ==========================================
        // 1. CÁLCULO DA ÁREA SEGURA E DA ARENA
        // ==========================================
        const topUI = height * 0.14;
        const bottomUI = height * 0.09;
        this.safeY = topUI;
        this.safeHeight = height - topUI - bottomUI;

        this.gameArea = {
            w: width * 0.85,
            h: this.safeHeight * 0.80,
            x: 0, y: 0
        };
        this.gameArea.x = (width - this.gameArea.w) / 2;
        this.gameArea.y = this.safeY + (this.safeHeight - this.gameArea.h) / 2;

        try {
            this.physics.world.setBounds(this.gameArea.x, this.gameArea.y, this.gameArea.w, this.gameArea.h);
        } catch (e) {
            console.error("ERRO: Física não habilitada no config!");
            return;
        }

        const bgImage = this.add.image(width / 2, this.safeY + (this.safeHeight / 2), 'fundo-odontologia');
        bgImage.setDisplaySize(width, this.safeHeight); 
        bgImage.setDepth(0); 

        const areaBg = this.add.graphics();
        areaBg.fillStyle(0xffffff, 0.2);
        areaBg.fillRoundedRect(this.gameArea.x, this.gameArea.y, this.gameArea.w, this.gameArea.h, 20);
        areaBg.lineStyle(4, 0x87ceeb, 0.8);
        areaBg.strokeRoundedRect(this.gameArea.x, this.gameArea.y, this.gameArea.w, this.gameArea.h, 20);
        areaBg.setDepth(1);

        // ==========================================
        // 2. JOGADOR (TAMANHO RESPONSIVO: 15%)
        // ==========================================
        this.player = this.physics.add.sprite(this.gameArea.x + (this.gameArea.w / 2), this.gameArea.y + (this.gameArea.h / 2), 'dente');

        const playerTargetHeight = this.safeHeight * 0.15;
        const playerScale = playerTargetHeight / this.player.height;
        this.player.setScale(playerScale);

        const playerRadius = (this.player.width / 2) * 0.15;
        this.player.body?.setCircle(playerRadius, (this.player.width / 2) - playerRadius, (this.player.height / 2) - playerRadius);

        this.player.setCollideWorldBounds(true);
        this.player.setDrag(300);
        this.player.setDepth(10); 

        // ==========================================
        // 3. CONTROLE DE 1 CLIQUE
        // ==========================================
        this.input.on('pointerdown', () => {
            this.isFollowing = true;
        });

        // ==========================================
        // 4. RASTRO DE PARTÍCULAS (BRILHANTE E MÁGICO)
        // ==========================================
        this.trailEmitter = this.add.particles(0, 0, 'dente', {
            scale: { start: playerScale * 1.4, end: 0 }, 
            alpha: { start: 0.2, end: 0 }, 
            lifespan: 500,
            speed: 0,
            blendMode: 'ADD',      
            tint: 0x87ceeb,        
            emitting: false
        });
        this.trailEmitter.startFollow(this.player);
        this.trailEmitter.setDepth(5);

        // ==========================================
        // 5. GRUPOS DE FÍSICA E SPAWN
        // ==========================================
        this.enemiesGroup = this.physics.add.group();
        this.collectiblesGroup = this.physics.add.group();

        for (let i = 0; i < 4; i++) {
            this.spawnCollectible();
        }

        for (let i = 0; i < 3; i++) {
            this.spawnEnemy();
        }

        this.physics.add.overlap(this.player, this.collectiblesGroup, this.collectItem, undefined, this);
        this.physics.add.collider(this.player, this.enemiesGroup, this.hitEnemy, undefined, this);

        // ==========================================
        // 6. INTERFACE (PONTUAÇÃO + RECORDE COM ÍCONES)
        // ==========================================
        let recordeAtual = parseInt(localStorage.getItem('odontoRecorde') || '0');

        const scoreBg = this.add.graphics();
        scoreBg.fillStyle(0xffffff, 0.7);
        scoreBg.fillRoundedRect(20, this.safeY + 20, 240, 85, 10);
        scoreBg.setDepth(20); 

        // Ícone e Texto de Pontos
        const iconTrofeu = this.add.image(35, this.safeY + 43, 'Trofeu').setOrigin(0, 0.5);
        iconTrofeu.setDisplaySize(30, 30).setDepth(20);
        
        this.scoreText = this.add.text(75, this.safeY + 28, `Pontos: 0`, {
            fontFamily: 'Fredoka', fontSize: '30px', color: '#3d3d3d', fontStyle: 'bold'
        });
        this.scoreText.setDepth(20);

        // Ícone e Texto de Recorde
        const iconEstrela = this.add.image(35, this.safeY + 80, 'estrela').setOrigin(0, 0.5);
        iconEstrela.setDisplaySize(22, 22).setDepth(20);

        this.recordText = this.add.text(70, this.safeY + 68, `Recorde: ${recordeAtual}`, {
            fontFamily: 'Fredoka', fontSize: '22px', color: '#ffb300', fontStyle: 'bold'
        });
        this.recordText.setDepth(20);

        this.createTimerBar(width);

        this.gameTimer = this.time.addEvent({
            delay: 100,
            callback: this.updateTimer,
            callbackScope: this,
            loop: true
        });

        // ==========================================
        // 7. EVENTOS DE ENCERRAMENTO SEGURO
        // ==========================================
        const uiScene = this.scene.get('UIOdontologia');
        if (uiScene) {
            uiScene.events.once('btnVoltarClicked', () => {
                this.scene.stop('OdontologiaMinigame');
            });
        }
    }

    update() {
        if (this.isGameOver) return;

        // --- MOVIMENTO DO JOGADOR ---
        const pointer = this.input.activePointer;

        if (this.isFollowing) {
            let targetX = pointer.x;
            let targetY = pointer.y;

            if (targetX < this.gameArea.x) targetX = this.gameArea.x;
            if (targetX > this.gameArea.x + this.gameArea.w) targetX = this.gameArea.x + this.gameArea.w;
            if (targetY < this.gameArea.y) targetY = this.gameArea.y;
            if (targetY > this.gameArea.y + this.gameArea.h) targetY = this.gameArea.y + this.gameArea.h;

            const distance = PhaserMath.Distance.Between(this.player.x, this.player.y, targetX, targetY);

            if (distance > 10) {
                this.physics.moveTo(this.player, targetX, targetY, 350);
                this.trailEmitter.emitting = true;
            } else {
                this.player.setVelocity(0);
                this.trailEmitter.emitting = false;
            }
        }

        // --- INTELIGÊNCIA DAS BACTÉRIAS ---
        this.enemiesGroup.getChildren().forEach((bactObj: any) => {
            const bacteria = bactObj as Physics.Arcade.Sprite;
            const distanceToPlayer = PhaserMath.Distance.Between(bacteria.x, bacteria.y, this.player.x, this.player.y);

            if (distanceToPlayer < 150) {
                const chaseSpeed = bacteria.getData('speed') || 80;
                this.physics.moveToObject(bacteria, this.player, chaseSpeed);
                bacteria.rotation = PhaserMath.Angle.Between(bacteria.x, bacteria.y, this.player.x, this.player.y);
            } else {
                bacteria.rotation += 0.02;
            }
        });
    }

    // ==========================================
    // --- LÓGICA DE SPAWN (RESPONSIVA) ---
    // ==========================================

    private spawnCollectible() {
        const margin = 30;

        const x = PhaserMath.Between(this.gameArea.x + margin, this.gameArea.x + this.gameArea.w - margin);
        const y = PhaserMath.Between(this.gameArea.y + margin, this.gameArea.y + this.gameArea.h - margin);

        const pasta = this.collectiblesGroup.create(x, y, 'pasta') as Physics.Arcade.Sprite;

        const pastaScale = (this.safeHeight * 0.15) / pasta.height;
        pasta.setScale(pastaScale);
        pasta.setDepth(6);

        const radius = (pasta.width / 2) * 0.8;
        pasta.body?.setCircle(radius, (pasta.width / 2) - radius, (pasta.height / 2) - radius);

        this.tweens.add({
            targets: pasta,
            y: '-=10',
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    private spawnEnemy() {
        const margin = 30;

        let x, y;
        do {
            x = PhaserMath.Between(this.gameArea.x + margin, this.gameArea.x + this.gameArea.w - margin);
            y = PhaserMath.Between(this.gameArea.y + margin, this.gameArea.y + this.gameArea.h - margin);
        } while (PhaserMath.Distance.Between(x, y, this.player.x, this.player.y) < 200);

        const bacteria = this.enemiesGroup.create(x, y, 'bacteria') as Physics.Arcade.Sprite;

        const bacteriaScale = (this.safeHeight * 0.15) / bacteria.height;
        bacteria.setScale(bacteriaScale);
        bacteria.setDepth(7); 

        const radius = (bacteria.width / 2) * 0.7;
        bacteria.body?.setCircle(radius, (bacteria.width / 2) - radius, (bacteria.height / 2) - radius);

        bacteria.setCollideWorldBounds(true);
        bacteria.setBounce(1, 1);

        let vx = PhaserMath.Between(-80, 80);
        let vy = PhaserMath.Between(-80, 80);
        if (vx === 0) vx = 40;
        if (vy === 0) vy = 40;
        bacteria.setVelocity(vx, vy);

        bacteria.setData('speed', PhaserMath.Between(50, 100));
    }

    // ==========================================
    // --- INTERAÇÕES E PONTUAÇÃO ---
    // ==========================================

    private collectItem(player: any, pasta: any) {
        pasta.destroy();
        this.score++;
        this.scoreText.setText(`Pontos: ${this.score}`);

        this.tweens.add({ targets: this.scoreText, scale: 1.2, yoyo: true, duration: 100 });

        this.spawnCollectible();

        if (this.score > 0 && this.score % 15 === 0) {
            this.spawnEnemy();
        }
    }

    private hitEnemy() {
        if (this.isGameOver) return;
        this.isGameOver = true;

        this.physics.pause();
        this.trailEmitter.emitting = false;
        this.isFollowing = false;

        this.player.setTint(0xff0000);
        this.tweens.add({
            targets: this.player,
            scale: 0,
            angle: 180,
            duration: 500,
            ease: 'Back.easeIn'
        });

        this.gameTimer.remove();

        this.time.delayedCall(500, () => {
            this.showResultPopup(false);
        });
    }

    // ==========================================
    // --- SISTEMA DA BARRA DE TEMPO (COM ÍCONE) ---
    // ==========================================

    private createTimerBar(width: number) {
        const barHeight = 20;
        this.timerBarWidth = width * 0.5;

        const panelPaddingX = 60;
        const panelPaddingY = 15;
        const panelWidth = this.timerBarWidth + panelPaddingX;
        const panelHeight = barHeight + panelPaddingY * 2;

        const panelX = (width - panelWidth) / 2;
        const panelY = this.safeY + this.safeHeight - panelHeight - 15;

        const panelBg = this.add.graphics();
        panelBg.fillStyle(0xffffff, 0.9);
        panelBg.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 15);
        panelBg.lineStyle(3, 0x87ceeb);
        panelBg.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 15);
        panelBg.setDepth(20);

        const innerBarX = panelX + 45;
        const innerBarY = panelY + panelPaddingY;

        this.timerBarBg = this.add.graphics();
        this.timerBarBg.fillStyle(0xe0e0e0, 1);
        this.timerBarBg.fillRoundedRect(innerBarX, innerBarY, this.timerBarWidth, barHeight, 10);
        this.timerBarBg.setDepth(20);

        this.timerBarFill = this.add.graphics();
        this.drawTimerFill(innerBarX, innerBarY, this.timerBarWidth, barHeight, 0x28a745);
        this.timerBarFill.setDepth(20);

        // Substituído o emoji de ampulheta pelo ícone
        const timeIcon = this.add.image(panelX + 22, panelY + (panelHeight / 2), 'Timer').setOrigin(0.5);
        timeIcon.setDisplaySize(28, 28);
        timeIcon.setDepth(20);
    }

    private drawTimerFill(x: number, y: number, w: number, h: number, color: number) {
        this.timerBarFill.clear();
        if (w > 0) {
            this.timerBarFill.fillStyle(color, 1);
            this.timerBarFill.fillRoundedRect(x, y, w, h, 10);
        }
    }

    private updateTimer() {
        if (this.timeLeft > 0) {
            this.timeLeft -= 0.1;

            const barHeight = 20;
            const panelPaddingX = 60;
            const panelPaddingY = 15;
            const panelWidth = this.timerBarWidth + panelPaddingX;
            const panelHeight = barHeight + panelPaddingY * 2;

            const panelX = (this.scale.width - panelWidth) / 2;
            const panelY = this.safeY + this.safeHeight - panelHeight - 15;

            const innerBarX = panelX + 45;
            const innerBarY = panelY + panelPaddingY;

            const percentage = Math.max(0, this.timeLeft / this.maxTime);
            const currentWidth = this.timerBarWidth * percentage;

            let barColor = 0x28a745;
            if (percentage <= 0.25) barColor = 0xdc3545;
            else if (percentage <= 0.5) barColor = 0xffc107;

            this.drawTimerFill(innerBarX, innerBarY, currentWidth, barHeight, barColor);

        } else {
            this.isGameOver = true;
            this.physics.pause();
            this.trailEmitter.emitting = false;
            this.isFollowing = false;
            this.gameTimer.remove();
            this.showResultPopup(true);
        }
    }

    // ==========================================
    // --- POPUP DE RESULTADO (COM ÍCONES) ---
    // ==========================================

    private showResultPopup(isWin: boolean) {
        let recordeAtual = parseInt(localStorage.getItem('odontoRecorde') || '0');
        let bateuRecorde = false;

        if (this.score > recordeAtual) {
            recordeAtual = this.score;
            localStorage.setItem('odontoRecorde', recordeAtual.toString());
            bateuRecorde = true;
        }

        const { width, height } = this.scale;

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
        bg.lineStyle(6, bateuRecorde ? 0xffc107 : (isWin ? 0x28a745 : 0xdc3545));
        bg.strokeRoundedRect(-bgWidth / 2, -bgHeight / 2, bgWidth, bgHeight, 20);

        // TÍTULO SEM EMOJI
        const titleText = bateuRecorde ? 'NOVO RECORDE!' : (isWin ? 'DENTE SALVO!' : 'AI, QUE DOR!');
        const titleColor = bateuRecorde ? '#ffc107' : (isWin ? '#28a745' : '#dc3545');

        const title = this.add.text(0, -bgHeight * 0.35, titleText, {
            fontFamily: 'Fredoka', fontSize: '36px', color: titleColor, fontStyle: 'bold'
        }).setOrigin(0.5);

        const elementsToAdd: any[] = [bg, title];

        // Adiciona estrelas ao redor do título apenas se bateu recorde
        if (bateuRecorde) {
            const starL = this.add.image(-title.width / 2 - 30, -bgHeight * 0.35, 'estrela').setDisplaySize(36, 36);
            const starR = this.add.image(title.width / 2 + 30, -bgHeight * 0.35, 'estrela').setDisplaySize(36, 36);
            elementsToAdd.push(starL, starR);
        }

        // TEXTOS DE PONTUAÇÃO E RECORDE (Separados e com Ícones)
        const scoreMsg = this.add.text(0, -bgHeight * 0.12, 'Você coletou:', {
            fontFamily: 'Fredoka', fontSize: '26px', color: '#3d3d3d', align: 'center'
        }).setOrigin(0.5);

        const scoreValue = this.add.text(0, -bgHeight * 0.02, `${this.score} Pastas de Dente`, {
            fontFamily: 'Fredoka', fontSize: '26px', color: '#3d3d3d', align: 'center', fontStyle: 'bold'
        }).setOrigin(0.5);

        // Estrelas ladelando o valor da pontuação
        const starMLeft = this.add.image(-scoreValue.width / 2 - 25, -bgHeight * 0.02, 'estrela').setDisplaySize(26, 26);
        const starMRight = this.add.image(scoreValue.width / 2 + 25, -bgHeight * 0.02, 'estrela').setDisplaySize(26, 26);

        const recText = this.add.text(20, bgHeight * 0.08, `Recorde: ${recordeAtual}`, {
            fontFamily: 'Fredoka', fontSize: '26px', color: '#3d3d3d', align: 'center', fontStyle: 'bold'
        }).setOrigin(0.5);

        // Troféu ao lado do texto de recorde
        const trophyPopup = this.add.image(-recText.width / 2 - 15, bgHeight * 0.08, 'Trofeu').setDisplaySize(28, 28);

        elementsToAdd.push(scoreMsg, scoreValue, starMLeft, starMRight, recText, trophyPopup);

        // --- BOTÃO 1: TENTAR NOVAMENTE ---
        const btnRetryW = 240;
        const btnRetryH = 50;
        const btnRetryY = isWin ? bgHeight * 0.22 : bgHeight * 0.30;

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
            this.scene.restart();
        });

        elementsToAdd.push(btnRetryBg, btnRetryText, btnRetryZone);

        // --- BOTÃO 2: CONTINUAR (CRIADO APENAS SE VENCER) ---
        if (isWin) {
            const btnContW = 240;
            const btnContH = 50;
            const btnContY = bgHeight * 0.38;

            const btnContBg = this.add.graphics();
            btnContBg.fillStyle(0x28a745, 1);
            btnContBg.fillRoundedRect(-btnContW / 2, btnContY - btnContH / 2, btnContW, btnContH, 25);

            const btnContText = this.add.text(0, btnContY, 'CONTINUAR', {
                fontFamily: 'Fredoka', fontSize: '20px', color: '#ffffff', fontStyle: 'bold'
            }).setOrigin(0.5);

            const btnContZone = this.add.zone(0, btnContY, btnContW, btnContH).setInteractive({ useHandCursor: true });

            btnContZone.on('pointerover', () => { btnContBg.fillStyle(0x1e7e34, 1).fillRoundedRect(-btnContW / 2, btnContY - btnContH / 2, btnContW, btnContH, 25); });
            btnContZone.on('pointerout', () => { btnContBg.fillStyle(0x28a745, 1).fillRoundedRect(-btnContW / 2, btnContY - btnContH / 2, btnContW, btnContH, 25); });

            btnContZone.on('pointerdown', () => {
                this.scene.stop('UIOdontologia');
                this.scene.launch('UIScene');
                this.scene.start('GameOverOdonto', { score: this.score });
            });

            elementsToAdd.push(btnContBg, btnContText, btnContZone);
        }

        popup.add(elementsToAdd);

        popup.setScale(0);
        this.tweens.add({ targets: popup, scale: 1, duration: 600, ease: 'Back.easeOut' });
    }
}