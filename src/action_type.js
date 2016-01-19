import {mkenum} from './util.js';

export const ActionType = mkenum(
    'Move',
    'OpenDoor',
    'CloseDoor',
    'Ascend',
    'Descend',
    'ExitLevel',
    'EnterLevel',
    'MeleeAttack',
    'MeleeAttackDodge',
    'MeleeAttackHit',
    'MeleeAttackBlock',
    'Die',
    'Walk',
    'Teleport',
    'Jump',
    'JumpPart',
    'GetItem',
    'DropItem',
    'Push',
    'PushWalk',
    'CallFunction',
    'RemoveComponent',
    'Wait',
    'Bump',
    'EnterComponentCooldown',
    'ExitComponentCooldown',
    'EnterCooldown',
    'EquipItem',
    'UnequipItem'
);
