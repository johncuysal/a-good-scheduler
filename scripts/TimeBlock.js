import {calcMinutes, convert24} from './helpers.js?v=2.0.2';

/**
 * Represents a block of time on a particular day.
 */
export default class TimeBlock {
    /**
     * Creates a TimeBlock object.
     *
     * @param {string} dayString - Formatted as 'M'
     * @param {string} timeString - Formatted as '10:00 AM - 11:20 AM'
     */
    constructor(dayString, timeString) {
        this.day = dayString;
        this.timeString = timeString;
        const timeArray = this.timeString.split(' - ');
        this.startTimeString = timeArray[0];
        this.endTimeString = timeArray[1];
        this.startTimeString24 = convert24(this.startTimeString);
        this.endTimeString24 = convert24(this.endTimeString);
        this.startMinute = calcMinutes(this.startTimeString24);
        this.endMinute = calcMinutes(this.endTimeString24);
    }
}