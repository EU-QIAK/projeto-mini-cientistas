import { Scene, Physics, GameObjects, Math as PhaserMath, Time } from 'phaser';

export class QuimicaMinigame extends Scene {
    private atomsGroup!: Physics.Arcade.Group;
    
    private collectedAtoms: { letter: string, sprite: GameObjects.Image, slotIndex: number }[] = [];
    private currentTargetMolecule: 'H2O' | 'CO2' = 'H2O';

    private targetText!: GameObjects.Text;
    private scoreText!: GameObjects.Text;
    private recordeText!: GameObjects.Text;
    private score: number = 0;

    private readonly maxTime: number = 60;
    private timeLeft: number = 60;
    private gameTimer!: Time.TimerEvent;
    private isGameOver: boolean = false;
    
    private timerBarBg!: GameObjects.Graphics;
    private timerBarFill!: GameObjects.Graphics;
    private timerBarWidth!: number;

    private safeHeight!: number;
    private safeY!: number;

    private slotPositions: { x: number, y: number }[] = [];
    private slotRequirements: string[] = []; 
    private slotGraphics!: GameObjects.Graphics;

    constructor() {
        super('QuimicaMinigame');
    }

    init() {
        this.score = 0;
        this.timeLeft = this.maxTime;
        this.isGameOver = false;
        this.collectedAtoms = [];
        this.currentTargetMolecule = 'H2O';
        this.input.enabled = true; 
    }

    create() {
        const { width, height } = this.scale;

        const bg = this.add.image(width / 2, height / 2, 'backgrounds/menu-laboratorio');
        bg.setDisplaySize(width, height);
        bg.setAlpha(0.6);

        const topUI = height * 0.14;
        const bottomUI = height * 0.09;
        this.safeHeight = height - topUI - bottomUI;
        this.safeY = topUI;

        // --- SISTEMA DE RECORDE EM TEMPO REAL ---
        // Busca o recorde salvo no navegador de forma idêntica ao minigame de Biologia
        const recordeAtual = parseInt(localStorage.getItem('quimicaRecorde') || '0');
        const scoreX = width * 0.05; 
        const scoreY = this.safeY + 20;

        const scoreBg = this.add.graphics();
        scoreBg.fillStyle(0xffffff, 0.9);
        scoreBg.fillRoundedRect(scoreX - 20, scoreY - 20, 280, 110, 15);
        scoreBg.lineStyle(3, 0x87ceeb);
        scoreBg.strokeRoundedRect(scoreX - 20, scoreY - 20, 280, 110, 15);

        this.scoreText = this.add.text(scoreX, scoreY, `🏆 Pontos: 0`, {
            fontFamily: 'Fredoka', fontSize: '32px', color: '#3d3d3d', fontStyle: 'bold'
        }).setOrigin(0, 0);

        this.recordeText = this.add.text(scoreX, scoreY + 45, `🌟 Recorde: ${recordeAtual}`, {
            fontFamily: 'Fredoka', fontSize: '24px', color: '#ffb300', fontStyle: 'bold'
        }).setOrigin(0, 0);

        // --- UI PRINCIPAL ---
        this.targetText = this.add.text(width / 2, topUI + 50, 'Monte: Água (H₂O)', {
            fontFamily: 'Fredoka', fontSize: '38px', color: '#000000', fontStyle: 'bold'
        }).setOrigin(0.5);

        this.createTimerBar(width);

        // --- INICIALIZA OS SLOTS DINÂMICOS ---
        this.slotGraphics = this.add.graphics();
        this.updateMoleculeLayout();

        // --- FÍSICA DOS ÁTOMOS ---
        this.atomsGroup = this.physics.add.group({
            bounceX: 1,
            bounceY: 1,
            collideWorldBounds: true
        });

        this.physics.world.setBounds(0, topUI + 180, width, height - topUI - bottomUI - 350);

        this.spawnAtoms();

        this.gameTimer = this.time.addEvent({
            delay: 100, 
            callback: this.updateTimer,
            callbackScope: this,
            loop: true
        });
    }

    // ==================================================
    // LAYOUT DINÂMICO E REQUISITOS DOS SLOTS
    // ==================================================
    private updateMoleculeLayout() {
        const { width } = this.scale;
        const centerX = width / 2;
        const panelHeight = 50; 
        const baseSlotY = this.safeY + this.safeHeight - panelHeight - 90;

        this.slotGraphics.clear();
        this.slotPositions = [];
        this.slotRequirements = [];

        if (this.currentTargetMolecule === 'H2O') {
            const posH1 = { x: centerX - 80, y: baseSlotY + 50 };
            const posH2 = { x: centerX + 80, y: baseSlotY + 50 };
            const posO = { x: centerX, y: baseSlotY - 30 };

            this.slotPositions = [posH1, posH2, posO];
            this.slotRequirements = ['H', 'H', 'O']; 

            this.slotGraphics.lineStyle(8, 0xaaaaaa, 0.8);
            this.slotGraphics.beginPath();
            this.slotGraphics.moveTo(posO.x, posO.y);
            this.slotGraphics.lineTo(posH1.x, posH1.y);
            this.slotGraphics.moveTo(posO.x, posO.y);
            this.slotGraphics.lineTo(posH2.x, posH2.y);
            this.slotGraphics.strokePath();

        } else { // CO2
            const posC = { x: centerX, y: baseSlotY };
            const posO1 = { x: centerX - 120, y: baseSlotY };
            const posO2 = { x: centerX + 120, y: baseSlotY };

            this.slotPositions = [posC, posO1, posO2];
            this.slotRequirements = ['C', 'O', 'O']; 

            this.slotGraphics.lineStyle(6, 0xaaaaaa, 0.8);
            
            this.slotGraphics.beginPath();
            this.slotGraphics.moveTo(posC.x - 30, posC.y - 12);
            this.slotGraphics.lineTo(posO1.x + 30, posO1.y - 12);
            this.slotGraphics.moveTo(posC.x - 30, posC.y + 12);
            this.slotGraphics.lineTo(posO1.x + 30, posO1.y + 12);
            this.slotGraphics.strokePath();

            this.slotGraphics.beginPath();
            this.slotGraphics.moveTo(posC.x + 30, posC.y - 12);
            this.slotGraphics.lineTo(posO2.x - 30, posO2.y - 12);
            this.slotGraphics.moveTo(posC.x + 30, posC.y + 12);
            this.slotGraphics.lineTo(posO2.x - 30, posO2.y + 12);
            this.slotGraphics.strokePath();
        }

        this.slotGraphics.lineStyle(4, 0xffffff, 0.8);
        this.slotGraphics.fillStyle(0xffffff, 0.3);
        this.slotPositions.forEach(pos => {
            this.slotGraphics.fillCircle(pos.x, pos.y, 45);
            this.slotGraphics.strokeCircle(pos.x, pos.y, 45);
        });
    }

    // ==================================================
    // BARRA DE TEMPO NO TOPO
    // ==================================================
    private createTimerBar(width: number) {
        const barHeight = 20;
        this.timerBarWidth = width * 0.5;

        const panelPaddingX = 60; 
        const panelPaddingY = 15;
        const panelWidth = this.timerBarWidth + panelPaddingX;
        const panelHeight = barHeight + panelPaddingY * 2;

        const panelX = (width - panelWidth) / 2;
        const panelY = this.safeY + 110; 

        const panelBg = this.add.graphics();
        panelBg.fillStyle(0xffffff, 0.9);
        panelBg.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 15);
        panelBg.lineStyle(3, 0x87ceeb);
        panelBg.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 15);

        const innerBarX = panelX + 45; 
        const innerBarY = panelY + panelPaddingY;

        this.timerBarBg = this.add.graphics();
        this.timerBarBg.fillStyle(0xe0e0e0, 1);
        this.timerBarBg.fillRoundedRect(innerBarX, innerBarY, this.timerBarWidth, barHeight, 10);

        this.timerBarFill = this.add.graphics();
        this.drawTimerFill(innerBarX, innerBarY, this.timerBarWidth, barHeight, 0x28a745);

        this.add.text(panelX + 20, panelY + (panelHeight / 2), '⏳', { fontSize: '24px' }).setOrigin(0.5);
    }

    private drawTimerFill(x: number, y: number, w: number, h: number, color: number) {
        this.timerBarFill.clear();
        if (w > 0) {
            this.timerBarFill.fillStyle(color, 1);
            this.timerBarFill.fillRoundedRect(x, y, w, h, 10);
        }
    }

    private updateTimer() {
        if (this.isGameOver) return;

        if (this.timeLeft > 0) {
            this.timeLeft -= 0.1;

            const barHeight = 20;
            const panelPaddingX = 60;
            const panelPaddingY = 15;
            const panelWidth = this.timerBarWidth + panelPaddingX;
            const panelHeight = barHeight + panelPaddingY * 2;

            const panelX = (this.scale.width - panelWidth) / 2;
            const panelY = this.safeY + 110; 
            const innerBarX = panelX + 45;
            const innerBarY = panelY + panelPaddingY;

            const percentage = Math.max(0, this.timeLeft / this.maxTime);
            const currentWidth = this.timerBarWidth * percentage;

            let barColor = 0x28a745; 
            if (percentage <= 0.25) barColor = 0xdc3545; 
            else if (percentage <= 0.5) barColor = 0xffc107; 

            this.drawTimerFill(innerBarX, innerBarY, currentWidth, barHeight, barColor);
        } else {
            this.triggerGameOver();
        }
    }

    // ==================================================
    // MECÂNICA DOS ÁTOMOS E ROTEAMENTO INTELIGENTE
    // ==================================================
    private spawnAtoms() {
        if (this.isGameOver) return;

        this.atomsGroup.clear(true, true);

        let atomsToSpawn: string[] = [];
        if (this.currentTargetMolecule === 'H2O') {
            atomsToSpawn = ['H', 'H', 'H', 'O', 'O', 'C'];
        } else {
            atomsToSpawn = ['C', 'C', 'O', 'O', 'O', 'H'];
        }

        const { width } = this.scale;
        const bounds = this.physics.world.bounds;

        atomsToSpawn.forEach(letter => {
            const randomX = PhaserMath.Between(50, width - 50);
            const randomY = PhaserMath.Between(bounds.top + 50, bounds.bottom - 50);

            const atomKey = `atomo-${letter}`;
            const atom = this.atomsGroup.create(randomX, randomY, atomKey) as Physics.Arcade.Image;

            atom.setData('letter', letter);
            atom.setScale(0.10); 
            atom.setInteractive({ useHandCursor: true });

            const velocityX = PhaserMath.Between(-100, 100);
            const velocityY = PhaserMath.Between(-100, 100);
            atom.setVelocity(velocityX === 0 ? 50 : velocityX, velocityY === 0 ? 50 : velocityY);

            atom.on('pointerdown', () => this.collectAtom(atom));
        });
    }

    private collectAtom(atom: Physics.Arcade.Image) {
        if (this.isGameOver || this.collectedAtoms.length >= 3) return;

        const letter = atom.getData('letter');
        let targetSlotIndex = -1;

        for (let i = 0; i < 3; i++) {
            const isOccupied = this.collectedAtoms.some(a => a.slotIndex === i);
            if (!isOccupied && this.slotRequirements[i] === letter) {
                targetSlotIndex = i;
                break;
            }
        }

        if (targetSlotIndex === -1) {
            for (let i = 0; i < 3; i++) {
                const isOccupied = this.collectedAtoms.some(a => a.slotIndex === i);
                if (!isOccupied) {
                    targetSlotIndex = i;
                    break;
                }
            }
        }

        if (targetSlotIndex === -1) return;

        atom.disableBody(true, false);
        atom.disableInteractive();

        const targetPos = this.slotPositions[targetSlotIndex];
        this.collectedAtoms.push({ letter, sprite: atom, slotIndex: targetSlotIndex });

        this.tweens.add({
            targets: atom,
            x: targetPos.x,
            y: targetPos.y,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                if (this.collectedAtoms.length === 3) {
                    this.checkFormula();
                }
            }
        });
    }

    private checkFormula() {
        if (this.isGameOver) return;

        const formula = this.collectedAtoms.map(a => a.letter).sort().join('');
        let isCorrect = false;

        if (this.currentTargetMolecule === 'H2O' && formula === 'HHO') {
            isCorrect = true;
            this.triggerRainEffect();
        } else if (this.currentTargetMolecule === 'CO2' && formula === 'COO') {
            isCorrect = true;
            this.triggerBubbleEffect();
        }

        if (isCorrect) {
            this.score += 10;
            this.scoreText.setText(`🏆 Pontos: ${this.score}`);
            this.tweens.add({ targets: this.scoreText, scale: 1.1, yoyo: true, duration: 150 });

            this.collectedAtoms.forEach(a => {
                a.sprite.setTint(0x00ff00);
                this.tweens.add({ targets: a.sprite, scale: 0, duration: 400, delay: 600, ease: 'Back.easeIn' });
            });

            this.time.delayedCall(1200, () => {
                if (this.isGameOver) return;
                this.resetSlots();
                this.currentTargetMolecule = this.currentTargetMolecule === 'H2O' ? 'CO2' : 'H2O';
                this.targetText.setText(this.currentTargetMolecule === 'H2O' ? 'Monte: Água (H₂O)' : 'Monte: Gás Carbônico (CO₂)');
                this.updateMoleculeLayout();
                this.spawnAtoms();
            });

        } else {
            this.collectedAtoms.forEach(a => {
                a.sprite.setTint(0xff0000);
                this.tweens.add({
                    targets: a.sprite,
                    x: '+=10', duration: 50, yoyo: true, repeat: 4
                });
            });

            this.time.delayedCall(800, () => {
                if (this.isGameOver) return;
                this.resetSlots();
                this.spawnAtoms();
            });
        }
    }

    private resetSlots() {
        this.collectedAtoms.forEach(a => a.sprite.destroy());
        this.collectedAtoms = [];
    }

    // ==================================================
    // FIM DE JOGO E TRANSIÇÃO
    // ==================================================
    private triggerGameOver() {
        this.isGameOver = true;
        this.physics.pause();
        this.gameTimer.remove();

        this.atomsGroup.getChildren().forEach((atom) => {
            atom.disableInteractive();
        });

        // --- SISTEMA DE RECORDE (Local Storage) IDÊNTICO A BIOLOGIA ---
        let recordeAtual = parseInt(localStorage.getItem('quimicaRecorde') || '0');
        let bateuRecorde = false;

        if (this.score > recordeAtual) {
            recordeAtual = this.score;
            localStorage.setItem('quimicaRecorde', recordeAtual.toString());
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
        bg.lineStyle(6, bateuRecorde ? 0xffc107 : 0x87ceeb); 
        bg.strokeRoundedRect(-bgWidth / 2, -bgHeight / 2, bgWidth, bgHeight, 20);

        const titleText = bateuRecorde ? '🎉 NOVO RECORDE! 🎉' : 'TEMPO ESGOTADO!';
        const titleColor = bateuRecorde ? '#ffc107' : '#3d3d3d';

        const title = this.add.text(0, -bgHeight * 0.35, titleText, {
            fontFamily: 'Fredoka', fontSize: '36px', color: titleColor, fontStyle: 'bold'
        }).setOrigin(0.5);

        const popupScoreText = this.add.text(0, -bgHeight * 0.05,
            `Você combinou 🌟 ${this.score / 10} moléculas 🌟\n\nPontuação Atual: ${this.score}\n🏆 Recorde: ${recordeAtual}`, {
            fontFamily: 'Fredoka', fontSize: '26px', color: '#3d3d3d', align: 'center'
        }).setOrigin(0.5);

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
            this.scene.restart();
        });

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
            this.scene.stop('UIQuimica');
            this.scene.launch('UIScene');
            this.scene.start('GameOverQuimica', { score: this.score });
        });

        popup.add([bg, title, popupScoreText, btnRetryBg, btnRetryText, btnRetryZone, btnContBg, btnContText, btnContZone]);

        popup.setScale(0);
        this.tweens.add({
            targets: popup,
            scale: 1,
            duration: 600,
            ease: 'Back.easeOut'
        });
    }

    // ==================================================
    // EFEITOS DE PARTÍCULA
    // ==================================================
    private triggerRainEffect() {
        const { width } = this.scale;
        
        const rainEmitter = this.add.particles(0, 0, 'gota-agua', {
            x: { min: 0, max: width },
            y: -50,
            lifespan: 2000,
            speedY: { min: 450, max: 700 },
            speedX: { min: -25, max: 25 },
            scale: { start: 1.0, end: 0.5 }, 
            quantity: 18,
            blendMode: 'NORMAL'
        });

        this.time.delayedCall(1500, () => {
            rainEmitter.stop();
        });
    }

    private triggerBubbleEffect() {
        const { width, height } = this.scale;
        
        const bubbleEmitter = this.add.particles(0, 0, 'bolha', {
            x: { min: width / 2 - 350, max: width / 2 + 350 },
            y: height + 50, 
            lifespan: 3500, 
            speedY: { min: -200, max: -450 }, 
            speedX: { min: -100, max: 100 },
            scale: { start: 0.4, end: 1.3 },
            alpha: { start: 0.9, end: 0 },
            quantity: 12,
            blendMode: 'ADD'
        });

        this.time.delayedCall(1500, () => {
            bubbleEmitter.stop();
        });
    }
}