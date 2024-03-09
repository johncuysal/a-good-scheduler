import CourseCluster from './CourseCluster.js?v=2.0.6';

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
        // If there's no course cluster with the same name as the course section to add, create it
        if (!(this.courseClusters.some(courseCluster => courseCluster.name === courseSectionToAdd.name))) {
            const courseCluster = new CourseCluster(courseSectionToAdd.name);
            this.courseClusters.push(courseCluster);
        }
        // Add the course section to the course cluster of the same name
        const courseCluster = this.courseClusters.find(courseCluster => courseCluster.name === courseSectionToAdd.name);
        courseCluster.addCourseSection(courseSectionToAdd);

        // Now, update the corequisite group's search term
        const clusterWithShortestName = this.courseClusters.reduce((clusterWithShortestName, currentCluster) => {
            if (!clusterWithShortestName || currentCluster.name.length < clusterWithShortestName.name.length) {
                return currentCluster;
            } else {
                return clusterWithShortestName;
            }
        }, null);
        // The first course section in the course cluster with the shortest name decides the corequisite group's search term
        const decidingSection = clusterWithShortestName.courseSections[0];
        this.searchTerm = `${decidingSection.corequisiteGroupName} — ${decidingSection.title}`
    }
}