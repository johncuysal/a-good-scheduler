import CourseSection from './CourseSection.js?v=2.0.6';

/**
 * Represents a collection of course sections.
 */
export default class Schedule {
    /**
     * Creates a new Schedule object.
     */
    constructor() {
        this.courseSections = [];
        this.hasConflict = false;
    }

    /**
     * Returns a string representation of the schedule.
     *
     * @returns {string} - A string representation of the schedule.
     */
    toString() {
        let s = `${'─'.repeat(78)}\n`;
        for (let courseSection of this.courseSections) {
            s += `${courseSection}\n`;
        }
        s += `${'─'.repeat(78)}\n`;
        return s;
    }

    /**
     * Adds a course section to the schedule. If this results in a conflict, {@link hasConflict} is updated.
     *
     * @param {CourseSection} courseSectionToAdd - The course section to add to the schedule.
     * @returns {void}
     */
    addCourseSection(courseSectionToAdd) {
        for (let existingCourseSection of this.courseSections) { // For every course section currently in the schedule...
            if (courseSectionToAdd.isConflictingWith(existingCourseSection)) { // If it conflicts with the course section being added...
                this.hasConflict = true; // Mark the schedule as having a conflict, and stop checking for conflicts
                break;
            }
        }
        this.courseSections.push(courseSectionToAdd);
    }

    /**
     * Returns a deep copy of the schedule.
     *
     * @returns {Schedule} - A deep copy of the schedule.
     */
    deepCopy() {
        let scheduleDataObject = JSON.parse(JSON.stringify(this)); // Plain object holding the schedule's attributes
        let copiedSchedule = new Schedule(); // A new blank schedule.
        for (let courseDataObject of scheduleDataObject.courseSections) {
            let attributeCrn = courseDataObject.crn;
            let attributeDept = courseDataObject.dept;
            let attributeLevel = courseDataObject.level;
            let attributeSection = courseDataObject.section;
            let attributeTitle = courseDataObject.title;
            let attributeTbStrings = courseDataObject.tbStrings;
            let courseSectionCopy = new CourseSection(attributeCrn, attributeDept, attributeLevel, attributeSection, attributeTitle, attributeTbStrings);
            copiedSchedule.addCourseSection(courseSectionCopy)
        }
        copiedSchedule.hasConflict = scheduleDataObject.hasConflict;
        return copiedSchedule;
    }
}