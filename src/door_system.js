import {ActionType} from './action_type.js';

import {Position, Collider, Door, Solid} from './component.js';
import {OpenDoor} from './action.js';

export class DoorSystem {
    constructor(level) {
        this.level = level;
    }

    check(action) {
        switch (action.type) {
        case ActionType.Move:
            if (action.entity.hasComponent(Collider)) {
                let toCell = this.level.entitySpacialHash.getCart(action.destination);
                for (let e of toCell.keys()) {
                    if (e.hasComponents(Door, Solid)) {
                        action.fail();

                        this.level.scheduleImmediateAction(new OpenDoor(action.entity, e));
                        break;
                    }
                }
            }
            break;
        case ActionType.JumpPart:
            if (action.entity.hasComponent(Collider)) {
                let toCell = this.level.entitySpacialHash.getCart(action.destination);
                for (let e of toCell.keys()) {
                    if (e.hasComponents(Door, Solid)) {
                        action.fail();
                        break;
                    }
                }
            }
            break;

        }
    }
}
