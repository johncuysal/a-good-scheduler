import {printDebugMessage} from './helpers.js?v=2.0.5';
import TimeBlock from './TimeBlock.js?v=2.0.5';

/**
 * Represents a specific section of a course.
 */
export default class CourseSection {
    /**
     * Creates a new CourseSection object.
     *
     * @param {string} crn - The section's Course Registration Number (CRN).
     * @param {string} department - The section's department name.
     * @param {string} level - The section's level.
     * @param {string} section - The section's section number.
     * @param {string} title - The official title of the course.
     * @param {Array.<string>} tbStrings - Strings used to build time blocks.
     * @example
     * const requiredCourseSection = new CourseSection('12566', 'CSCI', '204', '3', ['MW 10:00 AM - 11:20 AM', 'R 7:00 PM - 9:50 PM']);
     */
    constructor(crn, department, level, section, title, tbStrings) {
        this.crn = crn.padStart(5, '0'); // Pad the start with 0's until the string is 5 characters long
        this.dept = department;
        this.level = level.padStart(3, '0'); // Pad the start with 0's until the string is 3 characters long
        this.name = `${this.dept} ${this.level}`; // PHYS 211L
        this.corequisiteGroupName = this.name.substring(0, 8); // makes PHYS 211L -> PHYS 211
        this.section = section.padStart(2, '0'); // Pad the start with 0's until the string is 2 characters long
        this.longName = `${this.name}-${this.section}`;
        this.title = title;
        this.tbStrings = tbStrings;
        this.timeBlocks = [];
        for (const tbString of tbStrings) {
            const firstSpaceIndex = tbString.indexOf(' ');
            const daysString = tbString.slice(0, firstSpaceIndex);
            const timeString = tbString.slice(firstSpaceIndex + 1);
            for (const dayString of daysString) {
                this.timeBlocks.push(new TimeBlock(dayString, timeString));
            }
        }
    }

    /**
     * Returns a string representation of the course section.
     *
     * @returns {string} - A string representation of the course section.
     */
    toString() {
        return `${this.name.padEnd(10, ' ')} -> ${this.crn} ${this.dept} ${this.level.padEnd(4, ' ')} ${this.section} ${this.tbStrings}`;
    }

    /**
     * Returns true if this course section overlaps with another course section on the same day.
     *
     * @param {CourseSection} other - The course section to check for conflicts with this course section.
     * @returns {boolean} True if the two course sections overlap on the same day, false otherwise.
     */
    isConflictingWith(other) {
        printDebugMessage(`Checking for a conflict between ${this.longName} and ${other.longName}...`);
        for (let timeBlock of this.timeBlocks) {
            for (let otherTimeBlock of other.timeBlocks) {
                const daysOverlap = timeBlock.day === otherTimeBlock.day;
                const timesOverlap = (timeBlock.startMinute <= otherTimeBlock.startMinute && otherTimeBlock.startMinute <= timeBlock.endMinute) || (otherTimeBlock.startMinute <= timeBlock.startMinute && timeBlock.startMinute <= otherTimeBlock.endMinute);
                if (daysOverlap && timesOverlap) {
                    printDebugMessage(`Conflict detected! ${timeBlock.day} ${timeBlock.startTimeString}-${timeBlock.endTimeString} and ${otherTimeBlock.day} ${otherTimeBlock.startTimeString}-${otherTimeBlock.endTimeString} are conflicting time blocks.`);
                    return true;
                }
            }
        }
        printDebugMessage('No conflict found!')
        return false;
    }
}