import {Vec2} from './vec2.js';
import {tableIterator} from './util.js';
import {OrdinalDirections, OrdinalDirectionVectors} from './direction.js';
import {MemoryCell} from './memory_cell.js';

import {
    PlayerCharacter,
    Position,
    Opacity,
    Vision,
    Name,
    Tile,
    Memory
} from './component.js';

import {ActionType} from './action_type.js';
import {Grid} from './grid.js';

class ObservationCell {
    constructor(x, y) {
        this.coordinates = new Vec2(x, y);
        this.centre = new Vec2(x + 0.5, y + 0.5);
        this.corners = new Array(4);
        for (let [direction, vector] of tableIterator(OrdinalDirections, OrdinalDirectionVectors)) {
            this.corners[direction] = this.centre.add(vector.divide(2));
        }
        this.maxOpacity = 0;
    }

    update(entities) {
        var maxOpacity = 0;
        for (let e of entities) {
            if (e.hasComponent(Opacity)) {
                maxOpacity = Math.max(maxOpacity, e.Opacity.value);
            }
        }
        this.maxOpacity = maxOpacity;
    }

    get opacity() {
        return this.maxOpacity;
    }

}

export class ObservationSystem {
    constructor(level, numCols, numRows) {
        this.level = level;
        this.numCols = numCols;
        this.numRows = numRows;
        this.grid = new Grid(this.numCols, this.numRows);
   }

    initialize() {
        for (let [i, j] of this.grid.coordinates()) {
            let entities = this.level.entitySpacialHash.get(j, i);
            let cell = new ObservationCell(j, i);
            cell.update(entities);
            this.grid.set(j, i, cell);
        }
 
    }

    run(entity) {
        if (entity.hasComponent(Vision) && entity.hasComponent(Memory)) {
            entity.Memory.turn = this.level.turn;
            let visionDistance = entity.Vision.distance;
            let eyePosition = entity.Position.coordinates;
            for (let observationCell of entity.Actor.observe(eyePosition, visionDistance, this.grid)) {
                let entities = this.level.entitySpacialHash.getCart(observationCell.coordinates);
                let memoryCell = entity.Memory.value.getCart(this.level, observationCell.coordinates);
                memoryCell.clear();
                memoryCell.turn = this.level.turn;
                for (let e of entities) {
                    memoryCell.see(e);
                }
            }
        }
    }

    update(action) {
        var observationCell, entities;

        switch (action.type) {
        case ActionType.OpenDoor:
        case ActionType.CloseDoor:
            observationCell = this.grid.getCart(action.door.Position.coordinates);
            entities = this.level.entitySpacialHash.getCart(observationCell.coordinates);
            observationCell.update(entities);
            break;
        case ActionType.Push:
        case ActionType.Move:
            if (action.entity.hasComponent(Opacity) && action.entity.Opacity != 0) {
                observationCell = this.grid.getCart(action.source);
                entities = this.level.entitySpacialHash.getCart(observationCell.coordinates);
                observationCell.update(entities);
                
                observationCell = this.grid.getCart(action.destination);
                entities = this.level.entitySpacialHash.getCart(observationCell.coordinates);
                observationCell.update(entities);
            }
            break;
        }
    }
}
