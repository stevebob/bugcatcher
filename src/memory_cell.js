import {ComponentType} from './component_type.js'
import {ObjectPool} from './object_pool.js';
import {Components} from './component_loader.js';
import {BestTracker} from './best_tracker.js';

class MemoryEntity {
    constructor() {
        this.Position = new Components.Position();
        this.Tile = new Components.Tile();
        this._Name = new Components.Name()
        this._PlayerCharacter = new Components.PlayerCharacter();
        this._Solid = new Components.Solid();
        this._Pushable = new Components.Pushable();
        this.Name = null;
        this.PlayerCharacter = null;
        this.Solid = null;
        this.Pushable = null;
    }

    see(entity, cell) {
        if (entity.Position) {
            this.Position.coordinates = entity.Position.coordinates;
            cell.Position = true;
        }

        if (entity.Tile) {
            this.Tile.character = entity.Tile.character;
            this.Tile.colour = entity.Tile.colour;
            this.Tile.zIndex = entity.Tile.zIndex;
            this.Tile.backgroundColour = entity.Tile.backgroundColour;
            cell.Tile = true;
        }

        if (entity.Name) {
            this._Name.fullName = entity.Name.fullName;
            this._Name.shortName = entity.Name.shortName;
            this.Name = this._Name;
            cell.Name = true;
        } else {
            this.Name = null;
        }

        if (entity.PlayerCharacter) {
            this.PlayerCharacter = this._PlayerCharacter;
            cell.PlayerCharacter = true;
        } else {
            this.PlayerCharacter = null;
        }
        
        if (entity.Solid) {
            this.Solid = this._Solid;
            cell.Solid = true;
        } else {
            this.Solid = null;
        }

        if (entity.Pushable) {
            this.Pushable = this._Pushable;
            cell.Pushable = true;
        } else {
            this.Pushable = null;
        }
    }

    hasComponent(component) {
        return this[component.name] != null;
    }
}

export class MemoryCell extends ObjectPool {
    constructor() {
        super(MemoryEntity);
        this.turn = -1;
        this.clearComponents();
        this.x = null;
        this.y = null;
        this.maxZIndex = new BestTracker((a, b) => {
            return a.Tile.zIndex - b.Tile.zIndex;
        });
    }

    clearComponents() {
        this.Position = false;
        this.Tile = false;
        this.Name = false;
        this.PlayerCharacter = false;
        this.Solid = false;
        this.Pushable = false;
    }

    clear() {
        this.flush();
        this.clearComponents();
        this.maxZIndex.clear();
    }

    hasComponent(component) {
        return this[component.name];
    }

    see(entity) {
        let memoryEntity = this.allocate();
        memoryEntity.see(entity, this);
        this.maxZIndex.insert(memoryEntity);
    }

    get known() {
        return !this.maxZIndex.empty;
    }

    getTopEntity() {
        return this.maxZIndex.get();
    }
}
