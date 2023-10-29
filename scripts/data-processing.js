import {inform, printDebugMessage, warn} from './helpers.js?v=2.0.3';
import CourseSection from './CourseSection.js?v=2.0.3';
import CorequisiteGroup from './CorequisiteGroup.js?v=2.0.3';

export function getCoursesFromJSON(allCourseSections, allCorequisiteGroups) {
    fetch('course_data.json')
        .then(response => response.json())
        .then(data => {
            // Used in check for duplicate CRNs
            const encounteredCRNs = new Set();
            // Iterate through each object in the array

            for (let i = 0; i < data.length; i++) {
                const courseEntry = data[i]
                const crn = courseEntry['Crn'][0];
                if (courseEntry['Crn'].length > 1) {
                    warn('Warning! Found more than 1 CRN: ' + courseEntry['Crn'].toString())
                }

                // Check for duplicate CRNs which would compromise the use of CRNs as unique identifiers.
                if (encounteredCRNs.has(crn)) {
                    warn(`CRN uniqueness is compromised. ${crn} is listed more than once in the catalog.`)
                } else {
                    encounteredCRNs.add(crn);
                }

                const courseCode = courseEntry['Course'][0].split(' ');
                if (courseEntry['Course'].length > 1) {
                    warn(`Warning! ${courseCode} has ${courseEntry['Course'].toString()} courses.`);
                }
                const department = courseCode[0];
                const level = courseCode[1];
                const section = courseCode[2];
                const title = courseEntry['Title'][0];
                if (courseEntry['Title'].length > 1) {
                    warn(`Warning! ${courseCode} has ${courseEntry['Title'].toString()} titles.`);
                }
                let timeBlocks = [];
                if (courseEntry['Time'] && courseEntry['Time'].length > 0) {
                    timeBlocks = courseEntry['Time'];
                } else {
                    inform(`${courseCode} was rejected because it has no time entry.`);
                    continue;
                }
                if (courseEntry['Time'].length > 1) {
                    warn(`Warning! Detected ${courseEntry['Time'].length} time blocks for ${courseCode}: ${courseEntry['Time'].toString()}.`);
                }
                // If any instance of 'TBA' is found, the course cannot be used.
                if (courseEntry['Time'].some(time => time.includes('TBA'))) {
                    inform(`${courseCode} was rejected because its time is TBA.`);
                    continue;
                }

                // Create a new CourseSection object using the extracted information
                //printDebugMessage(`Creating course ${courseCode} with crn = ${crn}, department = ${department}, level = ${level}, section = ${section}, title = ${title}, timeBlocks = ${timeBlocks}.`)
                const courseSection = new CourseSection(crn, department, level, section, title, timeBlocks);
                allCourseSections.push(courseSection);

                // If a corequisite group doesn't exist with the course section's corequisite group name... create an empty one with that name
                if (!(allCorequisiteGroups.some(corequisiteGroup => corequisiteGroup.name === courseSection.corequisiteGroupName))) {
                    const corequisiteGroup = new CorequisiteGroup(courseSection.corequisiteGroupName);
                    allCorequisiteGroups.push(corequisiteGroup);
                }
                const corequisiteGroup = allCorequisiteGroups.find(corequisiteGroup => corequisiteGroup.name === courseSection.corequisiteGroupName);
                corequisiteGroup.addCourseSection(courseSection);
            }
        })
        .catch(error => {
            printDebugMessage('JSON file failed to load.', error);
        });
}