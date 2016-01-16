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
    'Die'
);
