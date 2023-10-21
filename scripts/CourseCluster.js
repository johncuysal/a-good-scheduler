/**
 * Represents a collection of course sections all for the same course.
 */
export default class CourseCluster {
    /**
     * Creates a CourseCluster object.
     */
    constructor(name) {
        this.name = name;
        this.courseSections = [];
    }

    /**
     * Adds a course section to the course cluster. The first course section added to the course cluster decides its
     * name attribute.
     *
     * @param {CourseSection} courseSectionToAdd - The course section to add to the course cluster.
     */
    addCourseSection(courseSectionToAdd) {
        this.courseSections.push(courseSectionToAdd);
    }
}