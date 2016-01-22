import {mdelay} from './time.js';
import {DirectionVectors, Directions} from './direction.js';
import {Grid} from './grid.js';
import {Heap} from './heap.js';
import {getDefaultDrawer} from './drawer.js';
import {NoResults} from './exception.js';

class Node {
    constructor(coordinates, direction, cost, heuristic = 0) {
        this.coordinates = coordinates;
        this.direction = direction;
        this.cost = cost;
        this.total = cost + heuristic;
        this.parent = null;
    }
}

class SearchResult {
    constructor(end) {
        this.end = end.coordinates;
        this.cost = end.cost;
        this.vectors = [];
        this.directions = [];
        this.constructArray(end);
    }

    constructArray(node) {
        if (node.parent == null) {
            this.start = node.coordinates;
        } else {
            this.constructArray(node.parent);
            this.vectors.push(node.coordinates);
            this.directions.push(node.direction);
        }
    }
}

export function shortestPathThroughGridUntilPredicate(grid, start, predicate,
                    enterPredicate=()=>{return true},
                    directions,
                    getMoveCost=()=>{return 1}) {

    var priorityQueue = new Heap((a, b) => {return a.total - b.total});
    var visitedSet = new Grid(grid.width, grid.height);
    var seenSet = new Grid(grid.width, grid.height);

    var startNode = new Node(start, null, 0);
    priorityQueue.insert(startNode);
    seenSet.setCart(start, startNode);

    while (!priorityQueue.empty) {
        var currentNode = priorityQueue.pop();
        var currentCell = grid.getCart(currentNode.coordinates);

        if (visitedSet.getCart(currentNode.coordinates) != undefined) {
            // current node has already been visited
            continue;
        }
        
        if (predicate(currentCell, currentNode.coordinates)) {
            return new SearchResult(currentNode);
        }

        for (var [direction, neighbourCoordinates] of
                grid.iterateNeighbourPairs(currentNode.coordinates, directions)) {
            var cell = grid.getCart(neighbourCoordinates);
            if (!enterPredicate(cell, neighbourCoordinates)) {
                continue;
            }

            var node = new Node(neighbourCoordinates, direction,
                currentNode.cost + getMoveCost(grid, currentNode.coordinates, neighbourCoordinates));

            var seenNode = seenSet.getCart(neighbourCoordinates);
            if (seenNode == undefined || node.total < seenNode.total) {
                // either we've never seen this node, or we have, but the new cost is lower
                node.parent = currentNode;
                seenSet.setCart(neighbourCoordinates, node);
                priorityQueue.insert(node);
            }
        }

        visitedSet.setCart(currentNode.coordinates, true);
    }
    throw new NoResults();
}

export function shortestPathThroughGrid(grid, start, end,
                    enterPredicate=()=>{return true},
                    directions,
                    getMoveCost=()=>{return 1},
                    heuristic=(current, destination) => {return current.getDistance(destination)}) {

    var priorityQueue = new Heap((a, b) => {return a.total - b.total});
    var visitedSet = new Grid(grid.width, grid.height);
    var seenSet = new Grid(grid.width, grid.height);

    var startNode = new Node(start, 0, start.getDistance(end));
    priorityQueue.insert(startNode);
    seenSet.setCart(start, startNode);

    while (!priorityQueue.empty) {
        var currentNode = priorityQueue.pop();

        if (currentNode.coordinates.equals(end)) {
            return new SearchResult(currentNode);
        }

        if (visitedSet.getCart(currentNode.coordinates) != undefined) {
            // current node has already been visited
            continue;
        }

        for (var [direction, neighbourCoordinates] of
                grid.iterateNeighbourPairs(currentNode.coordinates, directions)) {

            var cell = grid.getCart(neighbourCoordinates);
            if (!enterPredicate(cell, neighbourCoordinates)) {
                continue;
            }

            var node = new Node(neighbourCoordinates, direction,
                currentNode.cost + getMoveCost(grid, currentNode.coordinates, neighbourCoordinates),
                heuristic(neighbourCoordinates, end));

            var seenNode = seenSet.getCart(neighbourCoordinates);
            if (seenNode == undefined || node.total < seenNode.total) {
                // either we've never seen this node, or we have, but the new cost is lower
                node.parent = currentNode;
                seenSet.setCart(neighbourCoordinates, node);
                priorityQueue.insert(node);
            }
        }

        visitedSet.setCart(currentNode.coordinates, true);
    }
}