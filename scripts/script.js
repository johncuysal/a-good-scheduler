// =====================================================================================================================
// COMPUTATION MODULE
// =====================================================================================================================

function calcMinutes(timeString) {
    // Given a string "hh:mm", get the number of minutes past since 00:00.
    let splitList = timeString.split(":"); // e.g. ["14", "56"]
    let hour = parseInt(splitList[0]); // e.g. parseInt("14") becomes 14
    let minutes = parseInt(splitList[1]); // e.g. parseInt("56") becomes 56
    return hour * 60 + minutes; // e.g. return 896
}

function convert24(timeStr) {
    const [time, period] = timeStr.split(" ");
    const [hours, minutes] = time.split(":");
    let hours24 = parseInt(hours);
    if (period === "PM" && hours24 !== 12) {
        hours24 += 12;
    } else if (period === "AM" && hours24 === 12) {
        hours24 = 0;
    }
    return hours24.toString().padStart(2, "0") + ":" + minutes;
}

/**
 * Represents a block of time on a particular day.
 */
class TimeBlock {
    /**
     * Creates a TimeBlock object.
     *
     * @param {string} dayString - Formatted as "M"
     * @param {string} timeString - Formatted as "10:00 AM - 11:20 AM"
     */
    constructor(dayString, timeString) {
        this.day = dayString;
        this.timeString = timeString;
        const timeArray = this.timeString.split(" - ");
        this.startTimeString = timeArray[0];
        this.endTimeString = timeArray[1];
        this.startTimeString24 = convert24(this.startTimeString);
        this.endTimeString24 = convert24(this.endTimeString);
        this.startMinute = calcMinutes(this.startTimeString24);
        this.endMinute = calcMinutes(this.endTimeString24);
    }
}

/**
 * Represents a specific section of a course.
 */
class Course {
    /**
     * Creates a new Course object.
     *
     * @param {string} crn - The section's Course Registration Number (CRN).
     * @param {string} department - The section's department name.
     * @param {string} level - The section's level.
     * @param {string} section - The section's section number.
     * @param {string} title - The official title of the course.
     * @param {Array.<string>} tbStrings - Strings used to build time blocks.
     * @param {string|null} [electiveNum] - The slot the section is being considered for as an elective. (Leave empty
     * for non-elective sections.)
     * @example
     * const requiredCourse = new Course("12566", "CSCI", "204", "3", ["MW 10:00 AM - 11:20 AM", "R 7:00 PM - 9:50 PM"]);
     * const elective = new Course("15845", "ARTD", "131", "02", ["MW 8:30 AM - 9:50 AM"], "1");
     */
    constructor(crn, department, level, section, title, tbStrings, electiveNum = null) {
        this.crn = crn.padStart(5, "0");
        this.dept = department;
        this.level = level.padStart(3, "0"); // Pad the start with 0's until the string is 3 characters long
        this.name = `${this.dept} ${this.level}`;
        this.section = section.padStart(2, "0"); // Pad the start with 0's until the string is 2 characters long
        this.longName = `${this.name}-${this.section}`;
        this.title = title;
        this.tbStrings = tbStrings;
        this.timeBlocks = [];
        for (const tb of tbStrings) {
            console.log(typeof tb);
        }
        for (const tbString of tbStrings) {
            const firstSpaceIndex = tbString.indexOf(" ");
            const daysString = tbString.slice(0, firstSpaceIndex);
            const timeString = tbString.slice(firstSpaceIndex + 1);
            for (const dayString of daysString) {
                this.timeBlocks.push(new TimeBlock(dayString, timeString));
            }
        }
        this.electiveNum = electiveNum;
        // If an elective slot number is provided, use an elective group. Else, use the name group.
        this.group = electiveNum ? `ELECTIVE ${electiveNum}` : this.name;
    }

    /**
     * Returns a string representation of the course section.
     *
     * @returns {string} - A string representation of the course section.
     */
    toString() {
        return `${this.group.padEnd(10, " ")} >> ${this.crn} ${this.dept} ${this.level.padEnd(4, " ")} ${this.section} (${this.timeBlocks}`;
    }

    /**
     * Returns true if this course section overlaps with another course section on the same day.
     *
     * @param {Course} other - The course section to check for conflicts with this course section.
     * @returns {boolean} True if the two course sections overlap on the same day, false otherwise.
     */
    isConflictingWith(other) {
        console.log(`Now checking for overlap between ${this.longName} and ${other.longName}`);
        for (let timeBlock of this.timeBlocks) {
            for (let otherTimeBlock of other.timeBlocks) {
                const daysOverlap = timeBlock.day === otherTimeBlock.day;
                const timesOverlap = (timeBlock.startMinute <= otherTimeBlock.startMinute && otherTimeBlock.startMinute <= timeBlock.endMinute) || (otherTimeBlock.startMinute <= timeBlock.startMinute && timeBlock.startMinute <= otherTimeBlock.endMinute);
                if (daysOverlap && timesOverlap) {
                    console.log(`Day overlap: ${timeBlock.day} and ${otherTimeBlock.day}`);
                    console.log(`Time overlap: ${timeBlock.startTimeString}-${timeBlock.endTimeString} and ${otherTimeBlock.startTimeString}-${otherTimeBlock.endTimeString}`);
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Returns true if this course section is being considered as an elective for some elective slot.
     *
     * @returns {boolean} True if the course section is an elective, false otherwise.
     */
    isElective() { return this.electiveNum !== null; }
}

/**
 * Represents a collection of course sections.
 */
class Schedule {
    /**
     * Creates a new Schedule object.
     */
    constructor() {
        this.courses = []; // Initially, a schedule has no courses.
        this.hasConflict = false; // And by extension, no conflicts.
    }

    /**
     * Returns a string representation of the schedule.
     *
     * @returns {string} - A string representation of the schedule.
     */
    toString() {
        let s = `${"─".repeat(78)}\n`;
        for (let course of this.courses) {
            s += `${course}\n`;
        }
        s += `${"─".repeat(78)}\n`;
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
        return copiedSchedule;
    }
}

/**
 * The fundamental class that handles the generation of all possible course combinations.
 */
class AGS {
    /**
     * Creates a new AGS object.
     *
     * @param {Array.<Course>} suppliedCourses - All of the course sections to work with.
     */
    constructor(suppliedCourses) {
        this.suppliedCourses = suppliedCourses; // list of Course objects
        this.schedules = []; // initially, no schedules have been generated
        this.nonConflictingSchedules = []; // no non-conflicting schedules either
        this.numRecursions = 0; // initially, buildSchedules() has not been called
    }

    /**
     * Prints all non-conflicting schedules to the console. If `showConflictingSchedules` is provided as `true`, all
     * schedules will be printed to the console, even conflicting ones.
     *
     * @param {boolean} [showConflictingSchedules] - Whether conflicting schedules should be shown.
     * @returns {void}
     */
    printSchedules(showConflictingSchedules = false) {
        let schedulesToShow = showConflictingSchedules ? this.schedules : this.nonConflictingSchedules;
        let s = "";
        for (let i = 0; i < schedulesToShow.length; i++) {
            s += `Schedule #${i + 1}:\n${schedulesToShow[i]}`;
        }
        s += "\n";
        console.log(s);
    }

    /**
     * Add a schedule to the list of schedules. If it doesn't have a conflict, also add it to the list of
     * non-conflicting schedules too.
     *
     * @param {Schedule} scheduleToAdd - The schedule to add to the list of schedules.
     * @returns {void}
     */
    addSchedule(scheduleToAdd) {
        this.schedules.push(scheduleToAdd); // always add schedule to schedules list
        if (!scheduleToAdd.hasConflict) {
            this.nonConflictingSchedules.push(scheduleToAdd); // also add it to the non-conflicting list if applicable
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
        console.log(groupsToAdd);
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

// =====================================================================================================================
// USER INTERFACE MODULE
// =====================================================================================================================
window.addEventListener('DOMContentLoaded', () => {
    const main = document.querySelector("main");
    const inputContainer = document.getElementById("input-container");
    const outputContainer = document.getElementById("output-container");

    const searchField = document.getElementById("search-field");
    const searchResults = document.getElementById("search-results");
    const courseContainer = document.getElementById("course-container");

    const scheduleBoxTemplate = document.getElementById("schedule-box-template");
    const cboxTemplate = document.getElementById("cbox-template");

    const allCourses = getCoursesFromJSON(); // Add some Course objects when the page loads up for the first time
    const candidateCourses = [];

    let courseFormCounter = 0; // Helps assign a unique ID to each added form

    function removeCBoxes() {
        const cBoxes = inputContainer.querySelectorAll(".cbox");
        cBoxes.forEach(cbox => cbox.remove());
        document.getElementById('output-message')?.remove(); // Remove output-message if it's not null
        outputContainer.innerHTML = "";
    }

    function runAGS() {
        // Remove the output message, if it's present.
        document.getElementById('output-message')?.remove();

        // Clear all the schedules in the output container.
        outputContainer.innerHTML = "";

        // Get the courses from all the course forms and load them into AGS.
        const ags = new AGS(candidateCourses);

        // Make a path and recurse through it to build all possible schedules.
        ags.buildSchedules(ags.getPath());

        // (For debugging purposes) Print a success message and the schedules to the console.
        console.log(`AGS >> Generated ${ags.nonConflictingSchedules.length} schedules with ${ags.numRecursions} recursive calls.`);
        ags.printSchedules();

        addSchedulesToDisplay(ags.nonConflictingSchedules);

        const outputMessage = document.createElement("p");
        outputMessage.id = "output-message";
        outputMessage.textContent = `Generated all ${ags.nonConflictingSchedules.length} possible non-conflicting schedules!\nAccomplished with ${ags.numRecursions} recursive calls.`;
        main.querySelector(".big-column").appendChild(outputMessage);
    }

    function addCBox(course) {
        const clonedNode = cboxTemplate.content.cloneNode(true);
        const cbox = clonedNode.querySelector(".cbox");

        const deleteButton = cbox.querySelector(".delete-button");
        deleteButton.addEventListener("click", () => {
            cbox.remove();
            candidateCourses.splice(candidateCourses.indexOf(course), 1);
            runAGS();
        });

        cbox.id = "cbox-" + courseFormCounter;
        courseContainer.appendChild(cbox);
        courseFormCounter++;

        cbox.querySelector(".cbox-value-crn").textContent = course.crn;
        cbox.querySelector(".cbox-value-department").textContent = course.dept;
        cbox.querySelector(".cbox-value-level").textContent = course.level;
        cbox.querySelector(".cbox-value-section").textContent = course.section;
        cbox.querySelector(".cbox-value-title").textContent = course.title;
        for (const tbString of course.tbStrings) {
            const divElement = document.createElement("div");
            divElement.textContent = tbString;
            cbox.querySelector(".cbox-value-timeblocks").appendChild(divElement);
        }
    }

    function addSchedulesToDisplay(schedules) {
        for (let schedule of schedules) {
            const scheduleBoxTemplateClone = scheduleBoxTemplate.content.cloneNode(true);
            const scheduleBox = scheduleBoxTemplateClone.querySelector(".schedule-box");
            const timetable = scheduleBoxTemplateClone.querySelector(".timetable");
            const scheduleList = scheduleBoxTemplateClone.querySelector(".schedule-list");

            for (let course of schedule.courses) {
                for (let timeBlock of course.timeBlocks) {
                    const courseDiv = document.createElement("div");
                    courseDiv.textContent = course.name;
                    courseDiv.className = "course";
                    courseDiv.style.gridRow = `${(timeBlock.startMinute / 5) - 83} / span ${(timeBlock.endMinute - timeBlock.startMinute) / 5}`;
                    switch (timeBlock.day) {
                        case "M":
                            courseDiv.style.gridColumn = "2 / span 1";
                            break;
                        case "T":
                            courseDiv.style.gridColumn = "3 / span 1";
                            break;
                        case "W":
                            courseDiv.style.gridColumn = "4 / span 1";
                            break;
                        case "R":
                            courseDiv.style.gridColumn = "5 / span 1";
                            break;
                        case "F":
                            courseDiv.style.gridColumn = "6 / span 1";
                            break;
                    }
                    timetable.appendChild(courseDiv);
                }
                const scheduleListItem = document.createElement("div");
                scheduleListItem.classList.add("schedule-list-item");
                scheduleListItem.textContent = `[${course.crn}] ${course.name}-${course.section}`;
                scheduleList.appendChild(scheduleListItem);
            }
            outputContainer.appendChild(scheduleBox);
        }
    }

    function getCoursesFromJSON() {
        let courses = [];
        fetch('course_data.json')
            .then(response => response.json())
            .then(data => {
                // Iterate through each object in the array
                for (let i = 0; i < data.length; i++) {
                    const courseEntry = data[i]
                    const crn = courseEntry["Crn"][0];
                    if (courseEntry["Crn"].length > 1) {
                        console.log("More than 1" + courseEntry["Crn"].toString())
                    }
                    const courseCode = courseEntry["Course"][0].split(" ");
                    if (courseEntry["Course"].length > 1) {
                        console.log("More than 1" + courseEntry["Course"].toString())
                    }
                    const department = courseCode[0];
                    const level = courseCode[1];
                    const section = courseCode[2];
                    const title = courseEntry["Title"][0];
                    if (courseEntry["Title"].length > 1) {
                        console.log("More than 1" + courseEntry["Title"].toString())
                    }
                    let timeBlocks = [];
                    if (courseEntry["Time"] && courseEntry["Time"].length > 0) {
                        timeBlocks = courseEntry["Time"];
                    } else {
                        console.log(courseCode + " has no time entry!");
                        continue;
                    }
                    if (courseEntry["Time"].length > 1) {
                        console.log("Looks like we got more than 1 repeated time block! : " + courseEntry["Time"].toString())
                    }
                    if (courseEntry["Time"][0] === "TBA") {
                        console.log("Time has yet to be announced...")
                        continue;
                    }

                    // Create a new Course object using the extracted information
                    const course = new Course(crn, department, level, section, title, timeBlocks);

                    // Do something with the created course object
                    courses.push(course);
                }
                //addAllCBoxes(courses);
            })
            .catch(error => {
                console.error('Error loading JSON file:', error);
            });
        return courses;
    }

    // Listen for changes in the search field input
    searchField.addEventListener("input", () => {
        // Extract the currently entered search term
        const searchTerm = searchField.value.toLowerCase();

        // Check if the search term is empty
        if (searchTerm.trim() === '') {
            // Clear the search results if the search term is empty, and return
            searchResults.innerHTML = '';
            return;
        }

        const matchingCourses = allCourses.filter(function(course) {
            const searchableString = `${course.name} ${course.title}`.toLowerCase();
            return searchableString.includes(searchTerm);
        });

        // Clear the search results container
        searchResults.innerHTML = '';

        // Display the matching elements in the search results container
        matchingCourses.forEach(course => {
            let searchResult = document.createElement("div");
            searchResult.textContent = `${course.name} ${course.section} — ${course.title}`;
            searchResult.classList.add('search-result')
            searchResults.appendChild(searchResult);

            searchResult.addEventListener("click", () => {
                candidateCourses.push(course);
                addCBox(course);
                runAGS();
            });
        });

        searchResults.style.display = 'flex';
    });

    // Add an event listener to the search field that listens for the "blur" event
    searchField.addEventListener('blur', () => {
        // When the search field loses focus, set the display style of the search results element to "none"
        searchResults.style.display = 'none';
    });

    // Add an event listener to the search field that listens for the "focus" event
    searchField.addEventListener('focus', () => {
        // When the search field gains focus, set the display style of the search results element to "flex"
        searchResults.style.display = 'flex';
    });

    // Prevent the default action of the event (which would cause the search field to lose focus when search results are clicked)
    searchResults.addEventListener('mousedown', event => {
        event.preventDefault();
    });
});
