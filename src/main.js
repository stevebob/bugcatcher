import {getKey, getKeyCode, getChar} from './input.js';
import {Entity} from './entity.js';
import {detectVisibleArea} from './recursive_shadowcast.js';
import {initializeDefaultDrawer, getDefaultDrawer}  from './drawer.js';
import * as Assets from './assets.js';
import * as Config from './config.js';
import {UpStairs, DownStairs, Position, Actor, PlayerCharacter, Timeout, Inventory, Poisoned} from './component.js';
import * as Components from './component.js';
import * as Actions from './action.js';
import {loadComponents} from './component_loader.js';
import {generateLevel} from './level_generator.js';
loadComponents(Components);

import {Level} from './level.js';

let seed = Config.RNG_SEED;
if (seed == null) {
    seed = new Date().getTime();
}
Math.seedrandom(seed);
console.log('RNG_SEED: ', seed);

var entities = [];

var surfaceString = [
'&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&', 
'&                                               &                       &', 
'&  &             &   &  &&               &              &&              &', 
'&   &      &         & &        ######################    &&&&&     &&  &', 
'&    &                          #....................#        &&&    && &', 
'&      &      ###################....................#     &          &&&', 
'&      &      #........#........#....................#           &      &', 
'& &   &       #........#........#....................#            &     &', 
'&             #........#........#....................#             &    &', 
'& &           #.................#..S.....@1..........+                  &', 
'&             #........#........#..>.................#   &   &        & &', 
'&     #############.####........#....................#             &    &', 
'&     #................#.............................#           &      &', 
'&   & #.........................#.*.*................#                  &', 
'&     #................#........#....*...............#    &     & &     &', 
'&     #................#........#..*.................#                  &', 
'&  &  .................#........#....................#          & &     &', 
'&     #................#........#....................#      &         & &', 
'&  &  #................###############.###############      &           &', 
'&     #................#...................#                            &', 
'&     #................#...................#               &   &     &  &', 
'&     ##################...................#            % %%%%          &', 
'&                      #...................#          & %,,,,%          &', 
'&   & &  &             #....................      &     %,,,,% &    &   &', 
'&         &            #...................#       &  & %%%%%%      &   &', 
'&    &&  & &        &  #...................#        &       &           &', 
'&     &    &        &  #...................#                  &     &   &', 
'&      &    &&&        #####################                        &   &', 
'&                                                                       &', 
'&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&', 
];

var dungeonString = [
'%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%',
'%%%%%%,,,,,,,,,,,,,,,,,,,,,,%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%,,,,,,,,%%',
'%%%%%%,%%%%%%%%%%%%%%%%%%%%,%%%%%%%%%%,,,,,,,,,,,,,,,,,,,,,%%%%%%,%%',
'%%%%%%,%%%%%%%%%%%%%%%%%%%%,%%%%%%%%%%,%%%%%%%%%%%%%%%%%%%,%%%%%%,%%',
'%%%%%%,%%%%%%%%%%%%%%%%%%%%,%%%%%%%%%%,%%%%%%%%%%%%%%%%%%%,%%%%%%,%%',
'%%%%%%,%%%%%%%%%%%%%%%%%%%%,%%%%%%%%%%,%%%%%%%%%%%%%%%%%%%,%%%%%%,%%',
'%%%%%%,%%%%%%%%%%%%%%%%%%%%,%%%%%%%%%%,%%%%%%%%%%%%%%%%%%%,%%%%%%,%%',
'%%%%%%,%%%%%%%%%%%%%%%%%%%%,,,,,,,,,,,<,,,,,,,,,,,%%%%%%%%,%%%%%%,%%',
'%%%%%%,%%%%%%%%%%%%%%%%%%%%,%%%%%%%%%%,%%%%%%%%%%,%%%%%%%%,%%%%%%,%%',
'%%%%%%,%%%%%%%%%%%%%%%%%%%%,%%%%%%%%&%,%%%%%%%%%%,%%%%%%%%,%%%%%%,%%',
'%%%%%%,%%%%%%%%%%%%%%%%%%%%,%%%%%%%%&%,%%%%%%%%%%,%%%%%%%%,%%%%%%,%%',
'%%%%%%,%%%%%%%%%%%%%%%%%%%%,%%%%%%%%&%,%%%%%%%%%%,%%%%%%%%,%%%%%%,%%',
'%%%%%%,%%%%%%%%%%%%%%%%%%%%,%%%%%%%%%%,%%%%%%%%%%,%%%%%%%%,%%%%%%,%%',
'%%%%%%,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,%%%%%%,%%',
'%%%%%%,%%%%%%%%%%%%%,%%%%%%%%%%%%%%%%%,%%%%%%%%%%,%%%%%%%%%%%%%%%,%%',
'%%%%%%,%%%%%%%%%%%%%,%%%%%%%%%%%%%%%%%,%%%%%%%%%%,%%%%%%%%%%%%%%%,%%',
'%%%%%%,%%%%%%%%%%%%%,%%%%%%%%%%%%%%%%%,%%%%%%%%%%,%%%%%%%%%%%%%%%,%%',
'%%%%%%,%%%%%%%%%%%%%,%%%%%%%%%%%%%%%%%,%%%%%%%%%%,%%%%%%%%%%%%%%%,%%',
'%%%%%%,%%%%%%%%%%%%%,%%%%%%%%%%%%%%%%%,%%%%%%%%%%,%%%%%%%%%%%%%%%,%%',
'%%%%%%,%%%%%%%%%%%%%,%%%%%%%%%%%%%%%%%,%%%%%%%%%%,%%%%%%%%%%%%%%%,%%',
'%%%%%%,%%%%%%%%%%%%%,%%%%%%%%%%%%%%%%%,%%%%%%%%%%,%%%%%%%%%%%%%%%,%%',
'%%%%%%,%%%%%%%%%%%%%,%%%%%%%%%%%%%%%%%,%%%%%%%%%%,%%%%%%%%%%%%%%%,%%',
'%%%%%%,%%%%%%%%%%%%%,%%%%%%%%%%%%%%%%%,%%%%%%%%%%,%%%%%%%%%%%%%%%,%%',
'%%%%%%,%%%%%%%%%%%%%,%%%%%%%%%%%%%%%%%,,,,,,,,,,,,,,,,,,,,,,,,,,,,%%',
'%%%%%%,%%%%%%%%%%%%%,%%%%%%%%%%%%%%%%%,%%%%%%%%%%%%%%%%%%%%%%%%%%%%%',
'%%%%%%,%%%%%%%%%%%%%,%%%%%%%%%%%%%%%%%,%%%%%%%%%%%%%%%%%%%%%%%%%%%%%',
'%%%%%%,%%%%%%%%%%%%%,%%%%%%%%%%%%%%%%%,%%%%%%%%%%%%%%%%%%%%%%%%%%%%%',
'%%%%%%,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,%%%%%%%%%%%%%%%%%%%%%%%%%%%%%',
'%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%'
];


var surfaceLevel;
var dungeonLevel;

function make(components) {
    return new Entity(components);
}

function initWorld(str) {
    var entities = [];
    for (let i = 0; i < str.length; ++i) {
        let line = str[i];
        for (let j = 0; j < line.length; ++j) {
            let ch = line[j];
            let entity;
            switch (ch) {
            case '&':
                entities.push(make(Assets.tree(j, i)));
                break;
            case '#':
                entities.push(make(Assets.wall(j, i)));
                break;
            case '+':
                entities.push(make(Assets.door(j, i)));
                break;
            case '.':
                entities.push(make(Assets.floor(j, i)));
                break;
            case ' ':
                entities.push(make(Assets.grass(j, i)));
                break;
            case ',':
                entities.push(make(Assets.dirt(j, i)));
                break;
            case '@':
                entities.push(make(Assets.floor(j, i)));
                entities.push(make(Assets.playerCharacter(j, i)));
                break;
            case '*':
                entities.push(make(Assets.floor(j, i)));
                entities.push(make(Assets.boulder(j, i)));
                break;
            case 't':
                entities.push(make(Assets.floor(j, i)));
                entities.push(make(Assets.targetDummy(j, i)));
                break;
            case '1':
                entities.push(make(Assets.floor(j, i)));
                entities.push(make(Assets.beePupa(j, i)));
                break;
            case 'S':
                entities.push(make(Assets.floor(j, i)));
                entities.push(make(Assets.spider(j, i)));
                break;
            case '(':
                entities.push(make(Assets.floor(j, i)));
                entities.push(make(Assets.antLarvae(j, i)));
                break;
            case ')':
                entities.push(make(Assets.floor(j, i)));
                entities.push(make(Assets.grasshopperLarvae(j, i)));
                break;
            case 'g':
                entities.push(make(Assets.floor(j, i)));
                entities.push(make(Assets.grasshopper(j, i)));
                break;
            case 'a':
                entities.push(make(Assets.floor(j, i)));
                entities.push(make(Assets.ant(j, i)));
                break;
            case '%':
                entities.push(make(Assets.dirtWall(j, i)));
                break;
            case '>':
                entities.push(make(Assets.downStairs(j, i)));
                break;
            case '<':
                entities.push(make(Assets.upStairs(j, i)));
                break;
            }
        }
    }
    return entities;
}

var playerCharacter;

function getPlayerCharacter(entities) {
    for (let e of entities) {
        if (e.hasComponent(PlayerCharacter)) {
            return e;
        }
    }

    throw new Error('No player character');
}

async function gameLoop(playerCharacter) {
    var level;
    while (true) {
        level = playerCharacter.Position.level;
        await level.progressSchedule();
        if (!playerCharacter.Actor.alive) {
            break;
        }
    }
    level.observationSystem.run(playerCharacter);
    level.rendererSystem.run(playerCharacter);
    level.hudSystem.run(playerCharacter);
}

$(() => {(async function() {
    (() => {
        initializeDefaultDrawer(Config.WIDTH, Config.HEIGHT, document.getElementById(Config.CANVAS_NAME));

        let firstLevel = new Level(Config.WIDTH, Config.HEIGHT, 0);
        firstLevel.generate();
        playerCharacter = getPlayerCharacter(firstLevel.entities);
        firstLevel.setPlayerCharacter(playerCharacter);


        firstLevel.print("Movement: arrow keys");
        firstLevel.print("Get item: g");
        firstLevel.print("Drop item: d");
        firstLevel.print("Channel item: e");
        firstLevel.print("Use ability: a");
        firstLevel.print("Stop channeling: r");
        firstLevel.print("Close adjacent door: c");
        firstLevel.print("Accept jump: enter");

    })();

    await gameLoop(playerCharacter);

})();})
