import {inform, printDebugMessage, warn} from './helpers.js';
import Course from './Course.js';

export function getCoursesFromJSON(allCourses, allCorequisiteGroups) {
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

                // Create a new Course object using the extracted information
                //printDebugMessage(`Creating course ${courseCode} with crn = ${crn}, department = ${department}, level = ${level}, section = ${section}, title = ${title}, timeBlocks = ${timeBlocks}.`)
                const course = new Course(crn, department, level, section, title, timeBlocks);
                allCourses.push(course);

                // The following code sets up corequisiteGroups structure to be easily searched later!
                if (!allCorequisiteGroups[course.corequisiteGroupName]) {
                    // If the corequisite group doesn't exist, create it
                    allCorequisiteGroups[course.corequisiteGroupName] = {};
                }

                if (!allCorequisiteGroups[course.corequisiteGroupName][course.name]) {
                    // If the name group doesn't exist under the corequisite, create it
                    allCorequisiteGroups[course.corequisiteGroupName][course.name] = [];
                }

                // Add the course to the appropriate name group under the corequisite
                allCorequisiteGroups[course.corequisiteGroupName][course.name].push(course);

                // The course whose corequisite name is the same as its name decides the corequisite group's search term
                // But still, have it initially set to a backup with the first course that gets read in that group
                if (!allCorequisiteGroups[course.corequisiteGroupName]['searchTerm']) {
                    allCorequisiteGroups[course.corequisiteGroupName]['searchTerm'] = `${course.corequisiteGroupName} — ${course.title}`;
                }
                // Then, if a course does exist whose name matches the corequisite group name, override that backup (fixes SIGN 101A being the only course of the SIGN 101 corequisite group)
                if (course.name === course.corequisiteGroupName) {
                    allCorequisiteGroups[course.corequisiteGroupName]['searchTerm'] = `${course.corequisiteGroupName} — ${course.title}`;
                }
            }
        })
        .catch(error => {
            printDebugMessage('JSON file failed to load.', error);
        });
}