import {printDebugMessage} from './helpers.js';
import Schedule from './Schedule.js';

/**
 * The fundamental class that handles the generation of all possible course section combinations.
 */
export default class GoodScheduler {
    /**
     * Creates a new GoodScheduler object.
     */
    constructor() {
        this.schedules = [];
        this.nonConflictingSchedules = [];
        this.numRecursions = 0;
    }

    /**
     * Prints all non-conflicting schedules to the console. If `showConflictingSchedules` is provided as `true`, all
     * schedules will be printed to the console, even conflicting ones.
     *
     * @param {boolean} [showConflictingSchedules] - Whether conflicting schedules should be shown.
     * @returns {void}
     */
    printSchedules(showConflictingSchedules = false) {
        let schedulesToShow = showConflictingSchedules ? this.schedules : this.nonConflictingSchedules;
        let s = '';
        for (let i = 0; i < schedulesToShow.length; i++) {
            s += `Schedule #${i + 1}:\n${schedulesToShow[i]}`;
        }
        s += '\n';
        printDebugMessage(s);
    }

    /**
     * Add a schedule to the list of schedules. If it doesn't have a conflict, also add it to the list of
     * non-conflicting schedules too.
     *
     * @param {Schedule} scheduleToAdd - The schedule to add to the list of schedules.
     * @returns {void}
     */
    addSchedule(scheduleToAdd) {
        this.schedules.push(scheduleToAdd); // always add schedule to schedules list
        if (!scheduleToAdd.hasConflict) {
            this.nonConflictingSchedules.push(scheduleToAdd); // also add it to the non-conflicting list if applicable
        }
    }

    getPath(courseSections) {
        let groups = {}; // make a new object to have group attributes as keys and lists of course sections as values
        for (let courseSection of courseSections) {
            if (courseSection.name in groups) {
                groups[courseSection.name].push(courseSection);
            } else {
                groups[courseSection.name] = [courseSection];
            }
        }
        return Object.values(groups).sort((a, b) => a.length - b.length); // sort the lists by length from least to greatest
    }

    buildSchedules(groupsToAdd, schedule = new Schedule()) {
        this.numRecursions++; // increment the number of times this function has been called
        printDebugMessage(`Call #${this.numRecursions} begins. Slots left to add:`)
        printDebugMessage(groupsToAdd);
        if (groupsToAdd.length === 0) { // when all groups have been added
            this.addSchedule(schedule); // add the finished schedule to schedules list
        } else {
            let nextGroupToAdd = groupsToAdd[0]; // list of course sections with same group attribute
            for (let courseSection of nextGroupToAdd) { // recurse on each possibility from this same-group list
                let localSchedule = schedule.deepCopy();
                localSchedule.addCourseSection(courseSection); // add it to the newly-created schedule
                this.buildSchedules(groupsToAdd.slice(1), localSchedule); // with the group taken care of, proceed
            }
        }
    }

    findAllSchedules(courseSections) {
        this.schedules = [];
        this.nonConflictingSchedules = [];
        this.numRecursions = 0;
        const path = this.getPath(courseSections);
        this.buildSchedules(path);
        this.printSchedules();
        return this.nonConflictingSchedules;
    }
}