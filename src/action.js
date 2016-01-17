import {ActionType} from './action_type.js';
import {CardinalVectors} from './direction.js';

import {
    Door,
    Solid,
    Combatant,
    Tile,
    Getable,
    Position
} from './component.js';

class Action {
    constructor() {
        this.success = true;
    }

    get type() {
        return this.constructor.type;
    }

    get direct() {
        return true;
    }

    fail() {
        this.success = false;
    }

    shouldReschedule() {
        return true;
    }

    commit() {}
}

export class IndirectAction extends Action {
    get direct() {
        return false;
    }
}

export class Walk extends IndirectAction {
    constructor(entity, direction) {
        super();
        this.entity = entity;
        this.direction = direction;
        this.fromCoord = entity.Position.vec.clone();
        this.toCoord = this.fromCoord.add(CardinalVectors[direction]);
    }

    commit() {
        this.entity.OnLevel.level.scheduleImmediateAction(
            new Move(this.entity, this.toCoord)
        );
    }
}
Walk.type = ActionType.Walk;

export class Teleport extends Action {
    constructor(entity, destination) {
        super();
        this.entity = entity;
        this.destination = destination;
    }

    commit() {
        this.entity.OnLevel.level.scheduleImmediateAction(
            new Move(this.entity, this.destination)
        );
    }
}
Teleport.type = ActionType.Jump;

export class Jump extends Action {
    constructor(entity, path) {
        super();
        this.entity = entity;
        this.path = path;
    }

    commit() {
        this.entity.OnLevel.level.scheduleImmediateAction(
            new JumpPart(this.entity, this, 1)
        );
    }
}
Jump.type = ActionType.Jump;

export class JumpPart extends Action {
    constructor(entity, jump, index) {
        super();
        this.entity = entity;
        this.jump = jump;
        this.index = index;

        this.source = this.entity.Position.vec.clone();
        this.destination = this.jump.path.absoluteArray[this.index];
    }

    commit() {
        this.entity.Position.vec.set(this.destination);
        var nextIndex = this.index + 1;
        if (nextIndex <= this.jump.path.length) {
            this.entity.OnLevel.level.scheduleImmediateAction(
                new JumpPart(this.entity, this.jump, nextIndex)
            );
        }

    }
}
JumpPart.type = ActionType.JumpPart;

export class Move extends Action {
    constructor(entity, destination) {
        super();
        this.entity = entity;
        this.destination = destination;
        this.source = entity.Position.vec.clone();
    }

    commit() {
        this.entity.Position.vec.set(this.destination);
    }
}
Move.type = ActionType.Move;

export class OpenDoor extends Action {
    constructor(entity, door) {
        super();
        this.entity = entity;
        this.door = door;
    }

    commit() {
        this.door.Door.open = true;
        this.door.removeComponent(Solid);
        this.door.Tile.character = '-';
        this.door.Opacity.value = 0;
    }
}
OpenDoor.type = ActionType.OpenDoor;

export class CloseDoor extends Action {
    constructor(entity, door) {
        super();
        this.entity = entity;
        this.door = door;
    }

    commit() {
        this.door.Door.open = false;
        this.door.addComponent(new Solid());
        this.door.Tile.character = '+';
        this.door.Opacity.value = 1;
    }
}
CloseDoor.type = ActionType.CloseDoor;

export class Ascend extends Action {
    constructor(entity, stairs) {
        super();
        this.entity = entity;
        this.stairs = stairs;
    }

    commit() {
        this.entity.OnLevel.level.scheduleImmediateAction(
            new ExitLevel(this.entity, this.stairs.UpStairs.level, this.stairs.UpStairs.coordinates)
        );
    }
}
Ascend.type = ActionType.Ascend;

export class Descend extends Action {
    constructor(entity, stairs) {
        super();
        this.entity = entity;
        this.stairs = stairs;
    }

    commit() {
        this.entity.OnLevel.level.scheduleImmediateAction(
            new ExitLevel(this.entity, this.stairs.DownStairs.level, this.stairs.DownStairs.coordinates)
        );
    }
    
    shouldReschedule() {
        return false;
    }
}
Descend.type = ActionType.Descend;

export class ExitLevel extends Action {
    constructor(entity, level, coordinates) {
        super();
        this.entity = entity;
        this.level = level;
        this.coordinates = coordinates;
    }

    commit() {
        this.entity.OnLevel.level.entities.delete(this.entity);
        this.entity.OnLevel.level = this.level;
        this.entity.Position.vec.set(this.coordinates);
        this.entity.OnLevel.level.entities.add(this.entity);
        
        this.level.scheduleImmediateAction(new EnterLevel(this.entity, this.level, this.coordinates));
    }
}
ExitLevel.type = ActionType.ExitLevel;

export class EnterLevel extends Action {
    constructor(entity, level, coordinates) {
        super();
        this.entity = entity;
        this.level = level;
        this.coordinates = coordinates;
    }

    commit() {
        this.entity.OnLevel.level.scheduleActorTurn(this.entity);
    }
}
EnterLevel.type = ActionType.EnterLevel;

export class MeleeAttack extends Action {
    constructor(entity, target) {
        super();
        this.entity = entity;
        this.attacker = entity;
        this.target = target;
    }
}
MeleeAttack.type = ActionType.MeleeAttack;

export class MeleeAttackDodge extends Action {
    constructor(attack) {
        super();
        this.entity = attack.target;
        this.attack = attack;
        this.attacker = attack.entity;
        this.target = attack.target;
    }
}
MeleeAttackDodge.type = ActionType.MeleeAttackDodge;

export class MeleeAttackHit extends Action {
    constructor(attack, damage) {
        super();
        this.entity = attack.target;
        this.attacker = attack.entity;
        this.target = attack.target;
        this.attack = attack;
        this.damage = damage;
    }

    commit() {
        this.entity.Health.value -= this.damage;
        if (this.entity.Health.value <= 0) {
            this.entity.OnLevel.level.scheduleImmediateAction(new Die(this.entity, this.attack));
        }
    }
}
MeleeAttackHit.type = ActionType.MeleeAttackHit;

export class MeleeAttackBlock extends Action {
    constructor(attack) {
        super();
        this.entity = attack.target;
        this.attack = attack;
        this.attacker = attack.entity;
        this.target = attack.target;
    }
}
MeleeAttackBlock.type = ActionType.MeleeAttackBlock;

export class Die extends Action {
    constructor(entity, attack) {
        super();
        this.entity = entity;
        this.attack = attack;
        this.attacker = attack.entity;
        this.target = attack.target;
    }

    commit() {
        this.entity.removeComponents(Combatant);
        this.entity.Tile.character = '%';
    }
}
Die.type = ActionType.Die;

export class GetItem extends Action {
    constructor(entity, item) {
        super();
        this.entity = entity;
        this.item = item;
    }

    commit() {
        this.item.removeComponent(Position);
        this.entity.Inventory.inventory.insert(this.item);
    }
}
GetItem.type = ActionType.GetItem;

export class DropItem extends Action {
    constructor(entity, index) {
        super();
        this.entity = entity;
        this.index = index;
        this.item = this.entity.Inventory.inventory.get(index);
    }

    commit() {
        this.entity.Inventory.inventory.delete(this.index);
        var vec = this.entity.Position.vec;
        this.item.addComponent(new Position(vec.x, vec.y));
    }
}
DropItem.type = ActionType.DropItem;
