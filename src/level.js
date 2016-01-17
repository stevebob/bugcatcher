import {mdelay} from './time.js';

import {Schedule} from './schedule.js';

import {SpacialHash} from './spacial_hash.js';

import {EntityMap, EntitySet} from './entity.js';
import {IdMap} from './id_map.js';

import {RendererSystem} from './renderer_system.js';
import {HudSystem} from './hud_system.js';
import {DescriptionSystem} from './description_system.js';
import {CollisionSystem} from './collision_system.js';
import {ObservationSystem} from './observation_system.js';
import {DoorSystem} from './door_system.js';
import {CombatSystem} from './combat_system.js';

import {PlayerCharacter} from './component.js';

export class Level {
    constructor(width, height, entities) {

        this.id = Level.nextId++;

        this.entities = new EntitySet().initialize(entities);
        this.entitySpacialHash = new SpacialHash(width, height, EntitySet).initialize(entities);

        this.width = width;
        this.height = height;

        this.schedule = new Schedule();

        this.rendererSystem = new RendererSystem(this, width, height);
        this.descriptionSystem = new DescriptionSystem(this);
        this.hudSystem = new HudSystem(this);
        this.collisionSystem = new CollisionSystem(this, this.entities, width, height);
        this.observationSystem = new ObservationSystem(this, this.entities, width, height);
        this.doorSystem = new DoorSystem(this, this.entities, width, height);
        this.combatSystem = new CombatSystem(this, this.entities, width, height);
    }

    scheduleActorTurn(entity, relativeTime = 1) {
        this.schedule.scheduleTask(async () => {
            await this.gameStep(entity);
        }, relativeTime);
    }

    scheduleImmediateAction(action, relativeTime = 0) {
        this.schedule.scheduleTask(async () => {
            this.applyAction(action);
            if (action.direct) {
                console.debug('aaaa', this.time);
                this.observationSystem.run(action.entity);
                this.rendererSystem.run(action.entity);
//                await mdelay(100);
            }
        }, relativeTime, /* immediate */ true);
    }

    get time() {
        return this.schedule.absoluteTime;
    }
}
Level.nextId = 0;

Level.prototype.applyAction = function(action) {
    this.collisionSystem.check(action);
    this.doorSystem.check(action);
    this.combatSystem.check(action);

    if (action.success) {
        action.commit();

        this.collisionSystem.update(action);
        this.observationSystem.update(action);
        this.doorSystem.update(action);
        this.combatSystem.update(action);

        this.descriptionSystem.run(action);

        return true;
    }
    return false;
}

Level.prototype.gameStep = async function(entity) {
    this.observationSystem.run(entity);
    this.rendererSystem.run(entity);
    console.debug('bbbb', this.time);
    if (entity.hasComponent(PlayerCharacter)) {
        this.hudSystem.run(entity);
    }

    var action = await entity.Actor.getAction(this, entity);

    await mdelay(1);

    if (this.applyAction(action)) {
        if (action.direct) {
            this.observationSystem.run(entity);
            this.rendererSystem.run(entity);
            console.debug('ccc');
            await mdelay(100);
        }
        if (!action.shouldReschedule()) {
            return;
        }
    }

    this.scheduleActorTurn(entity);
}

Level.prototype.progressSchedule = async function() {
    var entry = this.schedule.pop();
    await entry.task();
}

Level.prototype.flushImmediate = async function() {
    while (this.schedule.hasImmediateTasks()) {
        await this.progressSchedule();
    }
}

export class LevelMap extends IdMap {
    constructor() {
        super(Level);
    }
    *levels() {
        yield* this.keys();
    }
}
