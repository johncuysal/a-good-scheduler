// =====================================================================================================================
// COMPUTATION MODULE
// =====================================================================================================================

// Constant used for debugging purposes
const inDebugMode = true;

function printDebugMessage(message) {
    if (inDebugMode) {
        console.log(message);
    }
}

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
        this.corequisiteGroupName = this.name.substring(0, 8); // makes PHYS 211L -> PHYS 211
        this.section = section.padStart(2, "0"); // Pad the start with 0's until the string is 2 characters long
        this.longName = `${this.name}-${this.section}`;
        this.title = title;
        this.tbStrings = tbStrings;
        this.timeBlocks = [];
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
        return `${this.group.padEnd(10, " ")} -> ${this.crn} ${this.dept} ${this.level.padEnd(4, " ")} ${this.section} ${this.tbStrings}`;
    }

    /**
     * Returns true if this course section overlaps with another course section on the same day.
     *
     * @param {Course} other - The course section to check for conflicts with this course section.
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
        printDebugMessage("No conflict found!")
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
        printDebugMessage(s);
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
        printDebugMessage(`Call #${this.numRecursions} begins. Slots left to add:`)
        printDebugMessage(groupsToAdd);
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
    const slotContainer = document.getElementById("slot-container");
    const scheduleContainer = document.getElementById("schedule-container");
    const searchBar = document.getElementById("search-bar");
    const searchBarResultContainer = document.getElementById("search-bar-result-container");
    const statusContainer = document.getElementById("status-container");
    const scheduleTemplate = document.getElementById("schedule-template");
    const slotTemplate = document.getElementById("slot-template");
    const slotCandidateTemplate = document.getElementById("slot-candidate-template");

    // Add some Course objects when the page loads up for the first time
    const allCourses = [];
    const allCorequisiteGroups = {};
    getCoursesFromJSON();
    printDebugMessage(`Loaded courses from catalog:`)
    printDebugMessage(allCourses);
    printDebugMessage(`Made corequisite groups:`)
    printDebugMessage(allCorequisiteGroups);
    const candidateCourses = [];
    const excludedCourses = [];

    function runAGS() {
        // Clear all the schedules in the output container.
        scheduleContainer.innerHTML = "";

        // Get the courses from all the course forms and load them into AGS.
        const ags = new AGS(candidateCourses);

        // Make a path and recurse through it to build all possible schedules.
        ags.buildSchedules(ags.getPath());

        // (For debugging purposes) Print the schedules to the console.
        ags.printSchedules();

        addSchedulesToDisplay(ags.nonConflictingSchedules);

        if (ags.nonConflictingSchedules.length === 1) {
            statusContainer.textContent = `${ags.nonConflictingSchedules.length} possible conflict-free schedule:`;
        } else {
            statusContainer.textContent = `${ags.nonConflictingSchedules.length} possible conflict-free schedules:`;
        }
    }

    function addSlot(name, courses) {
        const slotID = name.replace(/\s+/g, "-");
        const clonedSlotTemplate = slotTemplate.content.cloneNode(true);
        const slot = clonedSlotTemplate.querySelector(".slot");
        const slotCandidateContainer = slot.querySelector(".slot-candidate-container");

        slotContainer.appendChild(slot);
        slot.id = slotID;
        slot.querySelector(".slot-name").textContent = name;
        slot.querySelector(".slot-description").textContent = courses[0].title;

        for (let course of courses) {
            const clonedSlotCandidateTemplate = slotCandidateTemplate.content.cloneNode(true);
            const slotCandidate = clonedSlotCandidateTemplate.querySelector(".slot-candidate");
            const slotCandidateToggle = slotCandidate.querySelector(".slot-candidate-toggle");

            slotCandidate.id = course.crn;
            slotCandidateToggle.id = "toggle-" + slotCandidate.id;
            slotCandidate.setAttribute("for", slotCandidateToggle.id);
            slotCandidateContainer.appendChild(slotCandidate);

            slotCandidate.querySelector(".slot-candidate-infobox-value-section-number").textContent = course.section;
            for (const tbString of course.tbStrings) {
                const divElement = document.createElement("div");
                divElement.textContent = tbString;
                slotCandidate.querySelector(".slot-candidate-infobox-value-time-block").appendChild(divElement);
            }

            slotCandidateToggle.addEventListener("change", function() {
                if (this.checked) {
                    slotCandidate.style.color = "white";

                    // Move course from excludedCourses to candidateCourses
                    const index = excludedCourses.indexOf(course);
                    if (index !== -1) {
                        excludedCourses.splice(index, 1);
                        candidateCourses.push(course);
                        printDebugMessage(`${course.longName} was moved from excluded courses to candidate courses.`);
                    }
                } else {
                    slotCandidate.style.color = "gray";

                    // Move course from candidateCourses to excludedCourses
                    const index = candidateCourses.indexOf(course);
                    if (index !== -1) {
                        candidateCourses.splice(index, 1);
                        excludedCourses.push(course);
                        printDebugMessage(`${course.longName} was moved from candidate courses to excluded courses.`);
                    }
                }
                runAGS();
            });
        }

        const slotDeleteButton = slot.querySelector(".slot-delete-button");
        slotDeleteButton.addEventListener("click", function() {
            slot.remove();
            for (let course of courses) {
                const excludedIndex = excludedCourses.indexOf(course);
                if (excludedIndex !== -1) {
                    excludedCourses.splice(excludedIndex, 1);
                    printDebugMessage(`${course.longName} was deleted from excluded courses.`);
                }
                const candidateIndex = candidateCourses.indexOf(course);
                if (candidateIndex !== -1) {
                    candidateCourses.splice(candidateIndex, 1);
                    printDebugMessage(`${course.longName} was deleted from candidate courses.`);
                }
            }
            runAGS();
        });
    }

    function addSchedulesToDisplay(schedules) {
        for (let schedule of schedules) {
            const scheduleBoxTemplateClone = scheduleTemplate.content.cloneNode(true);
            const scheduleBox = scheduleBoxTemplateClone.querySelector(".schedule");
            const timetable = scheduleBoxTemplateClone.querySelector(".timetable");
            const scheduleList = scheduleBoxTemplateClone.querySelector(".schedule-list");

            let scheduleBoxID = "schedule";

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
                scheduleBoxID = `${scheduleBoxID}-${course.crn}`;
            }
            scheduleBox.id = scheduleBoxID;
            scheduleContainer.appendChild(scheduleBox);
        }
    }

    function getCoursesFromJSON() {
        fetch('course_data.json')
            .then(response => response.json())
            .then(data => {
                // Used in check for duplicate CRNs
                const encounteredCRNs = new Set();
                // Iterate through each object in the array

                for (let i = 0; i < data.length; i++) {
                    const courseEntry = data[i]
                    const crn = courseEntry["Crn"][0];
                    if (courseEntry["Crn"].length > 1) {
                        printDebugMessage("Warning! Found more than 1 CRN: " + courseEntry["Crn"].toString())
                    }

                    // Check for duplicate CRNs which would compromise the use of CRNs as unique identifiers.
                    if (encounteredCRNs.has(crn)) {
                        printDebugMessage(`Warning! ${crn} is listed twice in the catalog.`)
                    } else {
                        encounteredCRNs.add(crn);
                    }

                    const courseCode = courseEntry["Course"][0].split(" ");
                    if (courseEntry["Course"].length > 1) {
                        printDebugMessage(`Warning! ${courseCode} has ${courseEntry["Course"].toString()} courses.`);
                    }
                    const department = courseCode[0];
                    const level = courseCode[1];
                    const section = courseCode[2];
                    const title = courseEntry["Title"][0];
                    if (courseEntry["Title"].length > 1) {
                        printDebugMessage(`Warning! ${courseCode} has ${courseEntry["Title"].toString()} titles.`);
                    }
                    let timeBlocks = [];
                    if (courseEntry["Time"] && courseEntry["Time"].length > 0) {
                        timeBlocks = courseEntry["Time"];
                    } else {
                        printDebugMessage(`Warning! Rejected ${courseCode}. It has no time entry.`);
                        continue;
                    }
                    if (courseEntry["Time"].length > 1) {
                        printDebugMessage(`Warning! Detected ${courseEntry["Time"].length} time blocks for ${courseCode}: ${courseEntry["Time"].toString()}.`);
                    }
                    // If any instance of "TBA" is found, the course cannot be used.
                    if (courseEntry["Time"].some(time => time.includes("TBA"))) {
                        printDebugMessage(`Warning! Rejected ${courseCode}. Its time is TBA.`);
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
                    if (!allCorequisiteGroups[course.corequisiteGroupName]["searchTerm"]) {
                        if (course.name === course.corequisiteGroupName) {
                            allCorequisiteGroups[course.corequisiteGroupName]["searchTerm"] = `${course.corequisiteGroupName} — ${course.title}`;
                        }
                    }
                }
            })
            .catch(error => {
                printDebugMessage('JSON file failed to load.', error);
            });
    }

    // Listen for changes in the search field input
    searchBar.addEventListener("input", () => {
        // Extract the currently entered search term
        const searchTerm = searchBar.value.toLowerCase();

        // Check if the search term is empty
        if (searchTerm.trim() === '') {
            // Clear the search results if the search term is empty, and return
            searchBarResultContainer.innerHTML = '';
            return;
        }

        const matchingCorequisiteGroups = {};
        Object.keys(allCorequisiteGroups).forEach((corequisiteName) => {
            try {
                let corequisiteSearchTerm = allCorequisiteGroups[corequisiteName]["searchTerm"];
                if (corequisiteSearchTerm.toLowerCase().includes(searchTerm)) {
                    matchingCorequisiteGroups[corequisiteName] = allCorequisiteGroups[corequisiteName];
                }
            } catch (error) {
                printDebugMessage(`Warning! Corequisite ${corequisiteName} lacks a search term!`)
            }
        });

        // Clear the search results container
        searchBarResultContainer.innerHTML = '';

        // Display the matching elements in the search results container
        Object.keys(matchingCorequisiteGroups).forEach((corequisiteName) => {
            let searchResult = document.createElement("div");
            searchResult.textContent = matchingCorequisiteGroups[corequisiteName]["searchTerm"];
            searchResult.classList.add('search-result');
            searchResult.id = 'corequisite-group-' + corequisiteName.replace(/\s+/g, "-");
            searchBarResultContainer.appendChild(searchResult);

            searchResult.addEventListener("click", () => {
                searchBarResultContainer.style.display = 'none';
                Object.keys(matchingCorequisiteGroups[corequisiteName]).forEach((name) => {
                    const potentialSlotID = name.replace(/\s+/g, "-");
                    /**
                     * The searchTerm attribute for each corequisite group is just for searching, it doesn't include an
                     * actual course list, so use every other attribute. Also, don't add slots that already exist.
                     */
                    if (name !== "searchTerm" && slotContainer.querySelector(`#${potentialSlotID}`) === null) {
                        for (const course of matchingCorequisiteGroups[corequisiteName][name]) {
                            candidateCourses.push(course);
                        }
                        addSlot(name, matchingCorequisiteGroups[corequisiteName][name]);
                    }
                });
                runAGS();
                searchBar.value = "";
                searchBarResultContainer.innerHTML = '';
            });
        });

        searchBarResultContainer.style.display = 'flex';
    });

    searchBar.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
            const firstSearchResult = searchBarResultContainer.querySelector('.search-result');
            if (firstSearchResult) {
                searchBarResultContainer.style.display = 'none';
                let chosenCorequisiteName = firstSearchResult.id.replace("corequisite-group-", "").replace("-", " ");
                /**
                 * The searchTerm attribute for each corequisite group is just for searching, it doesn't include an
                 * actual course list, so use every other attribute. Also, don't add slots that already exist.
                 */
                Object.keys(allCorequisiteGroups[chosenCorequisiteName]).forEach((name) => {
                    const potentialSlotID = name.replace(/\s+/g, "-");
                    /**
                     * The searchTerm attribute for each corequisite group is just for searching, it doesn't include an
                     * actual course list, so use every other attribute. Also, don't add slots that already exist.
                     */
                    if (name !== "searchTerm" && slotContainer.querySelector(`#${potentialSlotID}`) === null) {
                        for (const course of allCorequisiteGroups[chosenCorequisiteName][name]) {
                            candidateCourses.push(course);
                        }
                        addSlot(name, allCorequisiteGroups[chosenCorequisiteName][name]);
                    }
                });
                runAGS();
                searchBar.value = "";
                searchBarResultContainer.innerHTML = '';
            }
        }
    });

    // Add an event listener to the search field that listens for the "blur" event
    searchBar.addEventListener('blur', () => {
        // When the search field loses focus, set the display style of the search results element to "none"
        searchBarResultContainer.style.display = 'none';
    });

    // Add an event listener to the search field that listens for the "focus" event
    searchBar.addEventListener('focus', () => {
        // When the search field gains focus, set the display style of the search results element to "flex"
        searchBarResultContainer.style.display = 'flex';
    });

    // Prevent the default action of the event (which would cause the search field to lose focus when search results are clicked)
    searchBarResultContainer.addEventListener('mousedown', event => {
        event.preventDefault();
    });
});
