import Phaser from 'phaser';

export class DialogueScene extends Phaser.Scene {
    private script: any;
    private onComplete: (() => void);
    private parentSceneKey: string; 
    
    private spriteLeft: Phaser.GameObjects.Image;
    private spriteRight: Phaser.GameObjects.Image;
    private dialogueText: Phaser.GameObjects.Text;
    private nameText: Phaser.GameObjects.Text;
    private nameBubble: Phaser.GameObjects.Graphics;
    private overlay: Phaser.GameObjects.Graphics;
    private choiceButtons: Phaser.GameObjects.Container[] = [];
    private typingEvent: Phaser.Time.TimerEvent | null = null;
    private isTyping: boolean = false;

    constructor() {
        super({ key: 'DialogueScene' });
    }

    init(data: { script: any, onComplete: () => void, parentScene: string }) {
        this.script = data.script;
        this.onComplete = data.onComplete;
        this.parentSceneKey = data.parentScene;
    }

    create() {
        const { width, height } = this.cameras.main;

        this.overlay = this.add.graphics();
        this.overlay.fillStyle(0x000000, 0.7).fillRect(0, 0, width, height);
        this.overlay.setInteractive(new Phaser.Geom.Rectangle(0, 0, width, height), Phaser.Geom.Rectangle.Contains);

        this.setupUI();
        this.fadeInCharacters();
        this.showNode('start');
    }

    private setupUI() {
        const { width, height } = this.cameras.main;

        // Variáveis para posicionamento dinâmico
        const boxWidth = width * 0.85;       // 85% da largura da tela
        const boxHeight = height * 0.22;     // 22% da altura da tela
        const boxX = (width - boxWidth) / 2; // Centralizado horizontalmente
        const boxY = height * 0.72;          // Posicionado na parte inferior (72% do topo)
        const padding = width * 0.03;        // Padding dinâmico baseado na largura
        const fontSize = `${Math.round(height * 0.035)}px`; // Fonte escala com a altura
        const avatarHeight = height * 0.72; // Altura do avatar baseado na altura da tela

        const leftKey = this.script.actors.left.texture;
        const rightKey = this.script.actors.right.texture;

        // Sprites 
        const charScale = (height / 1080) * 0.8;

        this.spriteLeft = this.add.image(width * 0.20, avatarHeight, leftKey)
            .setOrigin(0.5, 1)
            .setScale(charScale)
            .setAlpha(0)
            .setDepth(10); 

        this.spriteRight = this.add.image(width * 0.80, avatarHeight, rightKey)
            .setOrigin(0.5, 1)
            .setScale(charScale)
            .setAlpha(0)
            .setDepth(10);

        // Caixa de diálogo
        const box = this.add.graphics();
        box.fillStyle(0xFFFFFF, 0.9).lineStyle(4, 0x3D3D3D);
        box.fillRoundedRect(boxX, boxY, boxWidth, boxHeight, 15);
        box.strokeRoundedRect(boxX, boxY, boxWidth, boxHeight, 15);
        box.setDepth(5);

        // Texto do diálogo
        this.dialogueText = this.add.text(boxX + padding, boxY + padding, '', {
            fontFamily: 'Fredoka', 
            fontSize: fontSize, 
            color: '#3D3D3D', 
            wordWrap: { width: boxWidth - (padding * 2) }
        }).setDepth(15);

        this.nameBubble = this.add.graphics().setDepth(15);
        this.nameText = this.add.text(0, 0, '', { 
            fontFamily: 'Fredoka', 
            fontSize: `${Math.round(height * 0.03)}px`, 
            color: '#FFFFFF', 
            fontStyle: 'bold' 
        }).setDepth(16);
    }

    private fadeInCharacters() {
        this.tweens.add({
            targets: [this.spriteLeft, this.spriteRight],
            alpha: { from: 0, to: 1 },
            duration: 500,
            ease: 'Power2'
        });
    }

   private showNode(nodeKey: string) {
        if (nodeKey === 'end' || !this.script.nodes[nodeKey]) return this.end();

        const node = this.script.nodes[nodeKey];
        const isLeft = node.speaker === 'left';
        
        // =======================================================
        // NOVO: SISTEMA DE TROCA DE EXPRESSÃO (SPRITE)
        // Se o JSON tiver a propriedade "changeTexture", ele troca a imagem
        // =======================================================
        if (node.changeTexture) {
            if (isLeft) {
                // setTexture é o comando do Phaser para trocar a imagem de um objeto que já existe na tela
                this.spriteLeft.setTexture(node.changeTexture); 
            } else {
                this.spriteRight.setTexture(node.changeTexture);
            }
        }
        // =======================================================

        // Destaque visual (Tint)
        this.spriteLeft.setTint(isLeft ? 0xFFFFFF : 0x888888);
        this.spriteRight.setTint(isLeft ? 0x888888 : 0xFFFFFF);
        
        this.updateNameTag(isLeft ? this.script.actors.left.name : this.script.actors.right.name, isLeft);
        this.clearChoices();

        this.startTyping(node.text, () => {
            if (node.choices) {
                this.createChoices(node.choices);
            } else {
                this.overlay.once('pointerdown', () => this.showNode(node.next));
            }
        });
    }

    private startTyping(text: string, callback: () => void) {
        if (this.typingEvent) this.typingEvent.destroy();
        this.isTyping = true;
        this.dialogueText.setText('');
        let charIndex = 0;

        this.typingEvent = this.time.addEvent({
            delay: 40,
            repeat: text.length - 1,
            callback: () => {
                this.dialogueText.text += text[charIndex];
                                
                if (text[charIndex] !== ' ' && this.cache.audio.exists('click')) {
                    this.sound.play('click', { volume: 0.5 });
                }
                
                charIndex++;
                if (charIndex === text.length) {
                    this.isTyping = false;
                    callback();
                }
            }
        });

        this.overlay.once('pointerdown', () => {
            if (this.isTyping) {
                this.typingEvent?.destroy();
                this.dialogueText.setText(text);
                this.isTyping = false;
                callback();
            }
        });
    }

    private updateNameTag(name: string, isLeft: boolean) {
        const { width, height } = this.cameras.main;
        
        // Cálculos relativos
        const boxWidth = width * 0.85;
        const boxX = (width - boxWidth) / 2;
        const boxY = height * 0.72;
        
        const tagWidth = width * 0.2;
        const tagHeight = height * 0.05;
        const nameX = isLeft ? (boxX + 20) : (boxX + boxWidth - tagWidth - 20);
        const nameY = boxY - (tagHeight / 2);

        this.nameText.setText(name);
        this.nameBubble.clear().fillStyle(0xFF69B4).fillRoundedRect(nameX, nameY, tagWidth, tagHeight, 15);
        
        // Centraliza o texto dentro da tag
        this.nameText.setPosition(
            nameX + (tagWidth - this.nameText.width) / 2, 
            nameY + (tagHeight - this.nameText.height) / 2
        );
    }

    private createChoices(choices: any[]) {
        const { width, height } = this.cameras.main;
        const fontSize = `${Math.round(height * 0.028)}px`;

        // Queremos centralizar o bloco inteiro de botões na tela.
        // Primeiro, vamos calcular onde é o meio exato entre os bonecos
        const centerX = width / 2;
        
        // Vamos colocar os botões um pouco acima da caixa de diálogo
        // A caixa de diálogo começa em height * 0.72. Vamos colocar os botões centrados perto dos 45% da altura
        const startY = height * 0.45; 

        choices.forEach((choice, i) => {
            const txt = this.add.text(0, 0, choice.text, { 
                fontFamily: 'Fredoka', fontSize: fontSize, color: '#FFF', fontStyle: 'bold' 
            });

            // Cria um padding dinâmico para os botões não ficarem muito espremidos
            const btnWidth = Math.max(width * 0.25, txt.width + 60); 
            const btnHeight = height * 0.07;
            const espacamentoVertical = 20; // Espaço entre um botão e outro

            const bg = this.add.graphics();
            bg.fillStyle(0xFF69B4).fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, btnHeight / 2);
            bg.lineStyle(3, 0xD1478E).strokeRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, btnHeight / 2);

            // Posicionamento no CENTRO da tela (centerX)
            // Calculamos o Y para empilhar os botões a partir do startY
            const btnY = startY + (i * (btnHeight + espacamentoVertical));

            // container com depth alto para garantir que fique acima de tudo
            const container = this.add.container(centerX, btnY);
            container.add([bg, txt.setOrigin(0.5)]);
            container.setDepth(20); 
            
            // Adiciona a interatividade
            container.setSize(btnWidth, btnHeight);
            container.setInteractive({ useHandCursor: true })
                     .on('pointerover', () => bg.setAlpha(0.8)) // Feedback visual extra ao passar o mouse
                     .on('pointerout', () => bg.setAlpha(1))
                     .on('pointerdown', () => this.showNode(choice.target));

            this.choiceButtons.push(container);
        });
        
        // Ajuste opcional: Se houverem muitas escolhas (ex: 3 ou 4), o bloco pode ficar desalinhado.
        // Se quiser que o bloco todo fique centralizado no meio independente de quantas escolhas tenham, 
        // a matemática seria puxar todos um pouco para cima baseado no número total de botões.
        // Mas para 2 opções, o cálculo acima já fica visualmente muito bom!
    }

    private clearChoices() {
        this.choiceButtons.forEach(b => b.destroy());
        this.choiceButtons = [];
    }

    private end() {
        // Efeito de fade-out antes de fechar
        this.tweens.add({
            targets: [this.spriteLeft, this.spriteRight, this.overlay, this.dialogueText, this.nameBubble, this.nameText],
            alpha: 0,
            duration: 300,
            onComplete: () => {
                if (this.onComplete) this.onComplete();
                
                // Retoma a cena anterior se ela foi pausada
                if (this.parentSceneKey) {
                    this.scene.resume(this.parentSceneKey);
                }
                
                // Fecha esta cena e remove da hierarquia ativa
                this.scene.stop();
            }
        });
    }
}