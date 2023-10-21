import CourseCluster from './CourseCluster.js';

/**
 * Represents a collection of course clusters that are corequisites.
 */
export default class CorequisiteGroup {
    /**
     * Creates a CorequisiteGroup object.
     */
    constructor(name) {
        this.name = name;
        this.searchTerm = '';
        this.courseClusters = [];
    }

    /**
     * Adds a course section to the corequisite group.
     *
     * @param {CourseSection} courseSectionToAdd - The course section to add to the corequisite group.
     */
    addCourseSection(courseSectionToAdd) {
        if (!(this.courseClusters.some(courseCluster => courseCluster.name === courseSectionToAdd.name))) {
            const courseCluster = new CourseCluster(courseSectionToAdd.name);
            this.courseClusters.push(courseCluster);
        }
        const courseCluster = this.courseClusters.find(courseCluster => courseCluster.name === courseSectionToAdd.name);
        courseCluster.addCourseSection(courseSectionToAdd);

        // Find the CourseCluster with the shortest name
        const shortestCluster = this.courseClusters.reduce((shortest, currentCluster) => {
            if (!shortest || currentCluster.name.length < shortest.name.length) {
                return currentCluster;
            } else {
                return shortest;
            }
        }, null);

        const decidingSection = shortestCluster.courseSections[0];
        this.searchTerm = `${decidingSection.corequisiteGroupName} — ${decidingSection.title}`
    }
}