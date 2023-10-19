import Course from './Course.js';

/**
 * Represents a collection of course sections.
 */
export default class Schedule {
    /**
     * Creates a new Schedule object.
     */
    constructor() {
        this.courses = [];
        this.hasConflict = false;
    }

    /**
     * Returns a string representation of the schedule.
     *
     * @returns {string} - A string representation of the schedule.
     */
    toString() {
        let s = `${'─'.repeat(78)}\n`;
        for (let course of this.courses) {
            s += `${course}\n`;
        }
        s += `${'─'.repeat(78)}\n`;
        return s;
    }

    /**
     * Adds a course section to the schedule. If this results in a conflict, {@link hasConflict} is updated.
     *
     * @param {Course} courseToAdd - The course section to add to the schedule.
     * @returns {void}
     */
    addCourse(courseToAdd) {
        for (let existingCourse of this.courses) { // For every course currently in the schedule...
            if (courseToAdd.isConflictingWith(existingCourse)) { // If it conflicts with the course being added...
                this.hasConflict = true; // Mark the schedule as having a conflict, and stop checking for conflicts
                break;
            }
        }
        this.courses.push(courseToAdd);
    }

    /**
     * Returns a deep copy of the schedule.
     *
     * @returns {Schedule} - A deep copy of the schedule.
     */
    deepCopy() {
        let scheduleDataObject = JSON.parse(JSON.stringify(this)); // Plain object holding the schedule's attributes
        let copiedSchedule = new Schedule(); // A new blank schedule.
        for (let courseDataObject of scheduleDataObject.courses) {
            let attributeCrn = courseDataObject.crn;
            let attributeDept = courseDataObject.dept;
            let attributeLevel = courseDataObject.level;
            let attributeSection = courseDataObject.section;
            let attributeTitle = courseDataObject.title;
            let attributeTbStrings = courseDataObject.tbStrings;
            let courseCopy = new Course(attributeCrn, attributeDept, attributeLevel, attributeSection, attributeTitle, attributeTbStrings);
            copiedSchedule.addCourse(courseCopy)
        }
        copiedSchedule.hasConflict = scheduleDataObject.hasConflict;
        return copiedSchedule;
    }
}