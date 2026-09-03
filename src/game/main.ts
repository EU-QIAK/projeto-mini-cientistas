import { Boot } from './scenes/Boot';
import { GameOver } from './scenes/GameOver';
import { Game as MainGame } from './scenes/Game';
import { AUTO, Game } from 'phaser';
import { Preloader } from './scenes/Preloader';
import { HubLabsScene } from './scenes/HubLabsScene';
import { UIScene } from './scenes/overlays/UIScene';
import { DialogueScene } from './scenes/overlays/DialogueScene';

//Biologia//
import { HubLabsBiologia } from './scenes/HubLabsBiologia';
import { UIBiologia } from './scenes/overlays/UIBiologia';
import { BiologiaMinigame } from './scenes/games/BiologiaMinigame';
import { GameOverBio } from './scenes/GameOverBio';

//Odontologia//
import { HubLabsOdontologia } from './scenes/HubLabsOdontologia';
import { UIOdontologia } from './scenes/overlays/UIOdontologia';
import { OdontologiaMinigame } from './scenes/games/OdontologiaMinigame';
import { GameOverOdonto } from './scenes/GameOverOdonto';
import { AlbumScene } from './scenes/AlbumScene';

//Quimica//
import { HubLabsQuimica } from './scenes/HubLabsQuimica';
import { UIQuimica } from './scenes/overlays/UIQuimica';



//  Find out more information about the Game Config at:
//  https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,
    parent: 'game-container', // Mantivemos o seu ID original
    backgroundColor: '#028af8',
    
    // --- MUDANÇA AQUI ---
    scale: {
        mode: Phaser.Scale.RESIZE,
        width: '100%',
        height: '100%'
    },
    // -------------------

    physics: {
        default: 'arcade',
        arcade: {
            debug: false // Mude para true se quiser ver as caixas de colisão durante os testes!
        }
    },

    //temos que inicar as cenas aqui para fazer funcionar
    scene: [
        Boot,
        Preloader,        
        UIScene,
        MainGame,
        GameOver,
        AlbumScene,
        HubLabsScene,
        HubLabsBiologia,
        BiologiaMinigame,
        GameOverBio,
        UIBiologia,
        HubLabsOdontologia,
        UIOdontologia,
        OdontologiaMinigame,
        GameOverOdonto,
        HubLabsQuimica,
        UIQuimica,
        DialogueScene
    ]
}; 

const StartGame = (parent: string) => {
    return new Game({ ...config, parent });
}

export default StartGame;