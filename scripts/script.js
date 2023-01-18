/*
HELPER FUNCTIONS
 */

function calcMinutes(timeString) {
    // Given a string 'hh:mm', get the number of minutes past since 00:00.
    let splitList = timeString.split(':'); // e.g. ['14', '56']
    let hour = parseInt(splitList[0]); // e.g. parseInt('14') becomes 14
    let minutes = parseInt(splitList[1]); // e.g. parseInt('56') becomes 56
    return hour * 60 + minutes; // e.g. return 896
}

/*
COURSE, ELECTIVE, AND SCHEDULE CLASS DEFINITIONS
 */

class Course {
    // Course class.
    constructor(department, level, section, fStart, fEnd, days, crn = '') {
        this.dept = department; // e.g. 'CSCI'
        this.level = level; // e.g. '205'
        this.name = `${this.dept} ${this.level}`; // e.g. 'CSCI 205'
        this.section = section; // e.g. '01'
        this.fStart = fStart; // e.g. '09:00'
        this.fEnd = fEnd; // e.g. '09:50'
        this.start = calcMinutes(fStart); // e.g. 540 (in minutes)
        this.end = calcMinutes(fEnd); // e.g. 590 (in minutes)
        this.days = days; // e.g. 'MWF'
        this.crn = crn; // e.g. '50537'
        this.group = this.name; // e.g. 'CSCI 205' (group attribute is the same as name for required courses)
    }

    toString() {
        return `<${this.crn}> ${this.group} → ${this.name}-${this.section.toString().padStart(2, '0')} (${this.fStart} - ${this.fEnd})`;
    }

    isConflictingWith(other) {
        // Returns True if times overlap on the same day.
        for (let day of this.days) { // e.g. for 'M', 'W', and 'F' in 'MWF'
            if (other.days.includes(day)) { // e.g. if 'M' in 'MTW'
                if ((this.start <= other.start && other.start <= this.end) || (other.start <= this.start && this.start <= other.end)) {
                    return true; // this is the case where it's the same day and times overlap
                }
            }
        }
        return false;
    }
}

class Elective extends Course {
    /**
     * Elective subclass of Course superclass. The only difference is that
     * electives have a group attribute different from their course name. This
     * allows electives of equal interchangeability to be grouped in pools.
     */
    constructor(department, level, section, start, end, days, electiveNum, crn = '') {
        super(department, level, section, start, end, days, crn);
        this.group = `ELECTIVE ${electiveNum}`; // e.g. 'ELECTIVE 3' indicates the group this elective is picked from
    }
}

class Schedule {
    // Schedule class.
    constructor() {
        this.courses = []; // schedules initially have no courses
        this.hasConflict = false; // having no courses means no conflict
    }

    toString() {
        let s = `┌${"─".repeat(63)}\n`;
        for (let course of this.courses) {
            s += `│ ${course}\n`;
        }
        s += `└${"─".repeat(63)}`;
        return s;
    }

    addCourse(courseToAdd) {
        for (let course of this.courses) { // for every course currently in the schedule...
            if (courseToAdd.isConflictingWith(course)) { // if it conflicts with the course to add...
                this.hasConflict = true; // mark the schedule as having a conflict
            }
        }
        this.courses.push(courseToAdd); // always add course to schedule regardless
    }

    deepCopy() {
        let copiedSchedule = new Schedule(); // new blank schedule
        let scheduleDataObject = JSON.parse(JSON.stringify(this)); // separate plain JS object holding same attributes as this schedule
        for (let courseDataObject of scheduleDataObject.courses) {
            let attributeDept = courseDataObject.dept;
            let attributeLevel = courseDataObject.level;
            let attributeSection = courseDataObject.section;
            let attributeFStart = courseDataObject.fStart;
            let attributeFEnd = courseDataObject.fEnd;
            let attributeDays = courseDataObject.days;
            let attributeCrn = courseDataObject.crn;
            let courseCopy = new Course(attributeDept, attributeLevel, attributeSection, attributeFStart, attributeFEnd, attributeDays, attributeCrn);
            copiedSchedule.addCourse(courseCopy)
        }
        copiedSchedule.hasConflict = scheduleDataObject.hasConflict; // so, it also has the same conflicts
        return copiedSchedule
    }
}

/*
A GOOD SCHEDULER CLASS AND ITS SCHEDULING ALGORITHM
 */

class AGS {
    /**
     * A Good Scheduler (AGS), the fundamental class that handles the
     *     generation of all course combinations and sorts schedules.
     */
    constructor(suppliedCourses) {
        this.suppliedCourses = suppliedCourses; // list of Course and Elective objects
        this.schedules = []; // initially, no schedules have been generated
        this.nonConflictingSchedules = []; // no non-conflicting schedules either
        this.numRecursions = 0; // initially, buildSchedules() has not been called
    }

    printSchedules(showConflictingSchedules = false) {
        let schedulesToShow = showConflictingSchedules ? this.schedules : this.nonConflictingSchedules;
        let s = "";
        for (let i = 0; i < schedulesToShow.length; i++) {
            s += `\nSchedule #${i + 1}:\n${schedulesToShow[i]}`;
        }
        s += "\n";
        console.log(s);
    }

    addSchedule(schedule) {
        this.schedules.push(schedule); // always add schedule to schedules list
        if (!schedule.hasConflict) {
            this.nonConflictingSchedules.push(schedule); // also add it to the non-conflicting list if applicable
        }
    }

    getPath() {
        let groups = {}; // make a new object to have group attributes as keys and lists of courses as values
        for (let course of this.suppliedCourses) {
            if (course.group in groups) {
                groups[course.group].push(course);
            } else {
                groups[course.group] = [course];
            }
        }
        return Object.values(groups).sort((a, b) => a.length - b.length); // sort the lists by length from least to greatest
    }

    buildSchedules(groupsToAdd, schedule = new Schedule()) {
        this.numRecursions++; // increment the number of times this function has been called

        if (groupsToAdd.length === 0) { // when all groups have been added
            this.addSchedule(schedule); // add the finished schedule to schedules list
        } else {
            let nextGroupToAdd = groupsToAdd[0]; // list of courses with same group attribute
            for (let course of nextGroupToAdd) { // recurse on each possibility from this same-group list
                let localSchedule = schedule.deepCopy()
                localSchedule.addCourse(course); // add it to the newly-created schedule
                this.buildSchedules(groupsToAdd.slice(1), localSchedule); // with the group taken care of, proceed
            }
        }
    }
}

/*
TESTS
 */

function testAGS(courses) {
    console.log("Now testing: AGS...\n");
    const ags = new AGS(courses);
    ags.buildSchedules(ags.getPath());
    console.log(`Successfully generated all ${ags.schedules.length} possible schedules. Check it out:`);
    ags.printSchedules();
    console.log(`buildSchedules() was called ${ags.numRecursions} times.`);
    return ags.schedules;
}

function testCalcMinutes() {
    console.log("▒".repeat(64));
    console.log("Now testing: calcMinutes()");
    for (let hour = 0; hour < 24; hour++) {
        for (let minute = 0; minute < 60; minute++) {
            let timeString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
            let timeInMinutes = calcMinutes(timeString);
            console.log(`${timeString} → ${timeInMinutes}`);
        }
    }
}

/*
MAIN
 */

function main() {
    let johnsCourses = [
        new Course('CSCI', '202', '01', '15:00', '15:50', 'TR', '52638'),
        new Course('CSCI', '205', '01', '09:00', '09:50', 'MWF', '50537'),
        new Course('CSCI', '205', '02', '10:00', '10:50', 'MWF', '50860'),
        new Course('CSCI', '206', '01', '09:00', '09:50', 'MWF', '50120'),
        new Course('CSCI', '206', '02', '11:00', '11:50', 'MWF', '50536'),
        new Course('CSCI', '206', '03', '13:00', '13:50', 'MWF', '54958'),
        // new Course('CSCI', '206L', '60', '08:00', '09:50', 'T', '50175'),
        // new Course('CSCI', '206L', '61', '10:00', '11:50', 'T', '50447'),
        // new Course('CSCI', '206L', '62', '13:00', '14:50', 'T', '54025'),
        // new Elective('ARST', '245', '01', '10:00', '11:50', 'MW', 1, '52954'),
        // new Elective('ARST', '131', '03', '13:00', '14:50', 'MW', 1, '54547'),
        // new Elective('ARST', '239', '01', '10:00', '11:50', 'TR', 1, '51345'),
        // new Elective('EDUC', '102', '01', '15:00', '16:20', 'MW', 1, '55171'),
        // new Elective('EDUC', '102', '02', '10:00', '11:20', 'TR', 1, '55172'),
        // new Elective('PSYC', '100', '02', '16:00', '16:50', 'MWF', 1, '55408'),
        // new Elective('SOCI', '100', '02', '15:00', '16:20', 'MW', 1, '54479'),
        // new Elective('SOCI', '100', '03', '12:00', '13:20', 'MW', 1, '54480'),
        // new Elective('SOCI', '100', '04', '10:00', '11:20', 'TR', 1, '55216'),
        new Course('RESC', '221', '06', '17:00', '18:30', 'W', '54690')
    ]
    testAGS(johnsCourses)
}

/*
EVENT LISTENERS
 */
window.addEventListener('DOMContentLoaded', () => {
    // REDIRECT CONSOLE OUTPUT TO DIV
    const outputDiv = document.getElementById("output");

    console.log = function (message) {
        outputDiv.innerText += message;
    }

    // EVENT LISTENER: EXTRACT COURSE DATA, MAKE COURSE OBJECTS, RUN AGS
    const submitButton = document.getElementById("submit-button");

    submitButton.addEventListener("click", function() {
        main();
    });
});
