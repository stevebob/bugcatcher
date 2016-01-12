import {Heap} from './heap.js';

class ScheduleEntry {
    constructor(task, absoluteTime, sequenceNumber, immediate) {
        this.task = task;
        this.absoluteTime = absoluteTime;
        this.sequenceNumber = sequenceNumber;
        this.immediate = immediate;
    }
}

export class Schedule {
    constructor() {
        this.absoluteTime = 0;
        this.sequenceNumber = 0;
        this.heap = new Heap(Schedule.compare);
    }
    scheduleTask(task, relativeTime, immediate = false) {
        this.heap.insert(new ScheduleEntry(
            task,
            this.absoluteTime + relativeTime,
            this.sequenceNumber,
            immediate
        ));
        ++this.sequenceNumber;
    }

    peek() {
        return this.heap.peek();
    }

    pop() {
        var entry = this.heap.pop();
        this.absoluteTime = entry.absoluteTime;
        return entry;
    }

    get empty() {
        return this.heap.empty;
    }
}
Schedule.compare = (a, b) => {
    if (a.immediate != b.immediate) {
        return b.immediate - a.immediate;
    }
    if (a.absoluteTime != b.absoluteTime) {
        return a.absoluteTime - b.absoluteTime;
    }
    return a.sequenceNumber - b.sequenceNumber;
};

