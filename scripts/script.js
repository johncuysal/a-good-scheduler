// =====================================================================================================================
// COMPUTATION MODULE
// =====================================================================================================================

function calcMinutes(timeString) {
    // Given a string 'hh:mm', get the number of minutes past since 00:00.
    let splitList = timeString.split(':'); // e.g. ['14', '56']
    let hour = parseInt(splitList[0]); // e.g. parseInt('14') becomes 14
    let minutes = parseInt(splitList[1]); // e.g. parseInt('56') becomes 56
    return hour * 60 + minutes; // e.g. return 896
}

/**
 * Represents a specific section of a course.
 */
class Course {
    /**
     * Creates a new Course object.
     *
     * @param {string} department - The section's department name.
     * @param {string} level - The section's level.
     * @param {string} section - The section's section number.
     * @param {string} startTime - The section's start time.
     * @param {string} endTime - The section's end time.
     * @param {Array.<string>} daysOfWeek - The section's class days.
     * @param {string} crn - The section's Course Registration Number (CRN).
     * @param {string|null} [electiveNum] - The slot the section is being considered for as an elective. (Leave empty
     * for non-elective sections.)
     * @example
     * const requiredCourse = new Course("CSCI", "204", "3", "15:00", "15:50", ["M", "W", "F"], "12566");
     * const elective = new Course("ARTD", "131", "02", "10:00", "11:50", ["M", "W"], "15845", "1");
     */
    constructor(department, level, section, startTime, endTime, daysOfWeek, crn, electiveNum = null) {
        this.dept = department;
        this.level = level.padStart(3, "0"); // Pad the start with 0's until the string is 3 characters long
        this.name = `${this.dept} ${this.level}`;
        this.section = section.padStart(2, "0"); // Pad the start with 0's until the string is 2 characters long
        this.fStart = startTime;
        this.fEnd = endTime;
        this.start = calcMinutes(startTime); // The section's start time in minutes past midnight
        this.end = calcMinutes(endTime); // The section's end time in minutes past midnight
        this.daysOfWeek = daysOfWeek;
        this.crn = crn.padStart(5, "0");
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
        return `${this.group.padEnd(10, " ")} >> ${this.crn} ${this.dept} ${this.level.padEnd(4, " ")} ${this.section} (${this.fStart} - ${this.fEnd}) ${this.start} - ${this.end} ${this.daysOfWeek.join("|").padEnd(9, " ")}`;
    }

    /**
     * Returns true if this course section overlaps with another course section on the same day.
     *
     * @param {Course} other - The other course section (a Course object) to check for conflicts.
     * @returns {boolean} True if the two course sections overlap on the same day, false otherwise.
     */
    isConflictingWith(other) {
        const daysOverlap = this.daysOfWeek.some(day => other.daysOfWeek.includes(day));
        const timesOverlap = (this.start <= other.start && other.start <= this.end) || (other.start <= this.start && this.start <= other.end)
        return daysOverlap && timesOverlap;
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
    constructor() {
        this.courses = []; // schedules initially have no courses
        this.hasConflict = false; // having no courses means no conflict
    }

    toString() {
        let s = `${"─".repeat(78)}\n`;
        for (let course of this.courses) {
            s += `${course}\n`;
        }
        s += `${"─".repeat(78)}\n`;
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
            let attributeDaysOfWeek = courseDataObject.daysOfWeek;
            let attributeCrn = courseDataObject.crn;
            let courseCopy = new Course(attributeDept, attributeLevel, attributeSection, attributeFStart, attributeFEnd, attributeDaysOfWeek, attributeCrn);
            copiedSchedule.addCourse(courseCopy)
        }
        copiedSchedule.hasConflict = scheduleDataObject.hasConflict; // so, it also has the same conflicts
        return copiedSchedule;
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
            s += `Schedule #${i + 1}:\n${schedulesToShow[i]}`;
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
FUNCTIONS
 */

// =====================================================================================================================
// USER INTERFACE MODULE
// =====================================================================================================================
window.addEventListener('DOMContentLoaded', () => {
    // Important constants that can only be initialized when DOM content loads
    const inputContainer = document.getElementById("input-container");
    const outputContainer = document.getElementById("output-container");
    const addRequiredCourseButton = document.getElementById("add-required-course-button");
    const addElectiveButton = document.getElementById("add-elective-button")
    const clearAllButton = document.getElementById("clear-all-button");
    const submitButton = document.getElementById("submit-button");
    const requiredCourseTemplate = document.getElementById("required-course-template");
    const electiveTemplate = document.getElementById("elective-template");
    const scheduleBoxTemplate = document.getElementById("schedule-box-template");
    let numFormsAdded = 0;

    function main() {
        const courses = getCoursesFromUser();
        const ags = new AGS(courses);
        ags.buildSchedules(ags.getPath());

        console.log(`AGS >> Generated ${ags.nonConflictingSchedules.length} schedules with ${ags.numRecursions} recursive calls.`);
        ags.printSchedules();

        for (let schedule of ags.nonConflictingSchedules) {
            const scheduleBoxTemplateClone = scheduleBoxTemplate.content.cloneNode(true);
            const scheduleBox = scheduleBoxTemplateClone.querySelector(".schedule-box");
            const timetable = scheduleBoxTemplateClone.querySelector(".timetable");
            const scheduleList = scheduleBoxTemplateClone.querySelector(".schedule-list");

            for (let course of schedule.courses) {
                for (let day of course.daysOfWeek) {
                    const courseDiv = document.createElement("div");
                    courseDiv.textContent = course.name;
                    courseDiv.className = "course";
                    courseDiv.style.gridRow = `${(course.start / 5) - 83} / span ${(course.end - course.start) / 5}`;
                    switch (day) {
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
        inputContainer.insertAdjacentHTML('afterend', `<p id="output-message">Generated all ${ags.nonConflictingSchedules.length} possible non-conflicting schedules!<br>Accomplished with ${ags.numRecursions} recursive calls.</p>`);
    }

    function runAGS() {
        document.getElementById('output-message')?.remove(); // Remove the element with ID output-message if it's not null
        outputContainer.innerHTML = '';
        main();
    }

    function getCoursesFromUser() {
        const forms = inputContainer.querySelectorAll("form");
        const courses = [];

        for (let form of forms) {
            const department = form.querySelector(".department-field").value;
            const level = form.querySelector(".level-field").value;
            const section = form.querySelector(".section-field").value;
            const start = form.querySelector(".start-field").value;
            const end = form.querySelector(".end-field").value;

            const checkboxes = form.querySelectorAll('input[type="checkbox"]'); // get all the checkboxes in the form
            const daysOfWeek = []; // create an empty array to store the selected days
            checkboxes.forEach((checkbox) => { // loop through each checkbox
                if (checkbox.checked) { // check if the checkbox is checked
                    daysOfWeek.push(checkbox.value); // add the checkbox value to the daysOfWeek array
                }
            });

            const crn = form.querySelector(".crn-field").value;

            if (form.classList.contains("required-course-form")) {
                const course = new Course(department, level, section, start, end, daysOfWeek, crn);
                courses.push(course);
            } else if (form.classList.contains("elective-form")) {
                const pool = form.querySelector(".pool-field").value;
                const elective = new Course(department, level, section, start, end, daysOfWeek, crn, pool);
                courses.push(elective);
            }
        }

        return courses;
    }

    // EVENT LISTENER: EXTRACT COURSE DATA, MAKE COURSE OBJECTS, RUN AGS
    submitButton.addEventListener("click", function() {
        runAGS();
        document.getElementById('output-message').scrollIntoView({behavior: "smooth", block: "start", inline: "nearest"});
    });

    // ADD REQUIRED COURSES TO INPUT CONTAINER
    function addRequiredCourse(courseType) {
        let clonedNode, newForm;
        if (courseType === "Required") {
            clonedNode = requiredCourseTemplate.content.cloneNode(true);
            newForm = clonedNode.querySelector(".required-course-form");
        } else if (courseType === "Elective") {
            clonedNode = electiveTemplate.content.cloneNode(true);
            newForm = clonedNode.querySelector(".elective-form");

            const newPoolField = newForm.querySelector(".pool-field");
            const newPoolFieldLabel = newForm.querySelector(".pool-field-label");
            newPoolField.id = "pool-field-" + numFormsAdded;
            newPoolFieldLabel.setAttribute('for', newPoolField.id);
            newPoolField.addEventListener('input', function() {
                // Remove any non-numerical characters
                let inputValue = this.value.replace(/[^0-9]/g, '');
                // Limit input to a maximum of 1 numeric characters
                if (inputValue.length > 1) {
                    inputValue = inputValue.slice(0, 1);
                }
                // Set the updated input value
                this.value = inputValue;
            });
        }

        const newDepartmentField = newForm.querySelector(".department-field");
        const newDepartmentFieldLabel = newForm.querySelector(".department-field-label");
        newDepartmentField.id = "department-field-" + numFormsAdded;
        newDepartmentFieldLabel.setAttribute('for', newDepartmentField.id);
        newDepartmentField.addEventListener('input', function() {
            // Remove any non-alphabetical characters
            let inputValue = this.value.replace(/[^a-zA-Z]/g, '');
            // Convert to uppercase and limit to 4 characters
            inputValue = inputValue.toUpperCase();
            // Limit to a maximum of 4 characters
            if (inputValue.length > 4) {
                inputValue = inputValue.slice(0, 4);
            }
            // Set the updated input value
            this.value = inputValue;
        });

        const newLevelField = newForm.querySelector(".level-field");
        const newLevelFieldLabel = newForm.querySelector(".level-field-label");
        newLevelField.id = "level-field-" + numFormsAdded;
        newLevelFieldLabel.setAttribute('for', newLevelField.id);
        newLevelField.addEventListener('input', function() {
            // Remove any non-numerical or non-alphabetical characters
            let inputValue = this.value.replace(/[^0-9a-zA-Z]/g, '');
            // Restrict input to 3 numerical characters or 3 numerical characters followed by 1 alphabetic character
            if (inputValue.length <= 3) {
                inputValue = inputValue.replace(/[^0-9]/g, ''); // only keep digits
            } else {
                inputValue = inputValue.slice(0, 3) + inputValue.slice(3).replace(/[^a-zA-Z]/g, '').slice(0, 1).toUpperCase(); // keep only first 3 digits and then only 1 letter
            }
            // Set the updated input value
            this.value = inputValue;
        });

        const newSectionField = newForm.querySelector(".section-field");
        const newSectionFieldLabel = newForm.querySelector(".section-field-label");
        newSectionField.id = "section-field-" + numFormsAdded;
        newSectionFieldLabel.setAttribute('for', newSectionField.id);
        newSectionField.addEventListener('input', function() {
            // Remove any non-numerical characters
            let inputValue = this.value.replace(/[^0-9]/g, '');
            // Limit input to a maximum of 2 numeric characters
            if (inputValue.length > 2) {
                inputValue = inputValue.slice(0, 2);
            }
            // Set the updated input value
            this.value = inputValue;
        });

        const newStartField = newForm.querySelector(".start-field");
        const newStartFieldLabel = newForm.querySelector(".start-field-label");
        newStartField.id = "start-field-" + numFormsAdded;
        newStartFieldLabel.setAttribute('for', newStartField.id);
        newStartField.addEventListener('input', function() {
            const timeValue = this.value;
            const parts = timeValue.split(':');
            let hours = parseInt(parts[0], 10);
            let minutes = parseInt(parts[1], 10);
            // Round minutes to the nearest multiple of 5
            minutes = Math.round(minutes / 5) * 5;
            if (hours >= 1 && hours <= 7) {
                hours += 12;
            } else if (hours < 8) {
                hours = 8;
            } else if (hours > 22) {
                hours = 22;
            }
            this.value = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        });

        const newEndField = newForm.querySelector(".end-field");
        const newEndFieldLabel = newForm.querySelector(".end-field-label");
        newEndField.id = "end-field-" + numFormsAdded;
        newEndFieldLabel.setAttribute('for', newEndField.id);
        newEndField.addEventListener('input', function() {
            const timeValue = this.value;
            const parts = timeValue.split(':');
            let hours = parseInt(parts[0], 10);
            let minutes = parseInt(parts[1], 10);
            // Round minutes to the nearest multiple of 5
            minutes = Math.round(minutes / 5) * 5;
            if (hours >= 1 && hours <= 7) {
                hours += 12;
            } else if (hours < 8) {
                hours = 8;
            } else if (hours > 22) {
                hours = 22;
            }
            this.value = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        });

        const newMondayField = newForm.querySelector(".monday-field");
        const newMondayFieldLabel = newForm.querySelector(".monday-field-label");
        newMondayField.id = "monday-field-" + numFormsAdded;
        newMondayFieldLabel.setAttribute('for', newMondayField.id);

        const newTuesdayField = newForm.querySelector(".tuesday-field");
        const newTuesdayFieldLabel = newForm.querySelector(".tuesday-field-label");
        newTuesdayField.id = "tuesday-field-" + numFormsAdded;
        newTuesdayFieldLabel.setAttribute('for', newTuesdayField.id);

        const newWednesdayField = newForm.querySelector(".wednesday-field");
        const newWednesdayFieldLabel = newForm.querySelector(".wednesday-field-label");
        newWednesdayField.id = "wednesday-field-" + numFormsAdded;
        newWednesdayFieldLabel.setAttribute('for', newWednesdayField.id);

        const newThursdayField = newForm.querySelector(".thursday-field");
        const newThursdayFieldLabel = newForm.querySelector(".thursday-field-label");
        newThursdayField.id = "thursday-field-" + numFormsAdded;
        newThursdayFieldLabel.setAttribute('for', newThursdayField.id);

        const newFridayField = newForm.querySelector(".friday-field");
        const newFridayFieldLabel = newForm.querySelector(".friday-field-label");
        newFridayField.id = "friday-field-" + numFormsAdded;
        newFridayFieldLabel.setAttribute('for', newFridayField.id);

        const newCrnField = newForm.querySelector(".crn-field");
        const newCrnFieldLabel = newForm.querySelector(".crn-field-label");
        newCrnField.id = "crn-field-" + numFormsAdded;
        newCrnFieldLabel.setAttribute('for', newCrnField.id);
        newCrnField.addEventListener('input', function() {
            // Remove any non-numerical characters
            let inputValue = this.value.replace(/[^0-9]/g, '');
            // Limit input to a maximum of 5 numeric characters
            if (inputValue.length > 5) {
                inputValue = inputValue.slice(0, 5);
            }
            // Set the updated input value
            this.value = inputValue;
        });

        const deleteButton = newForm.querySelector(".delete-button");
        deleteButton.addEventListener('click', () => {
            newForm.remove();
        });

        // Add an event listener to each input field to handle the Enter key press
        const inputFields = newForm.querySelectorAll("input");
        inputFields.forEach(input => {
            input.addEventListener('keydown', e => {
                if (e.key === 'Enter' || e.key === 'ArrowRight' || e.key === ' ') {
                    e.preventDefault();
                    const currentHorizThing = input.closest('.horiz-thing');
                    const nextInput = currentHorizThing.nextElementSibling ?
                        currentHorizThing.nextElementSibling.querySelector('input') :
                        currentHorizThing.parentElement.nextElementSibling.querySelector('.horiz-thing input'); // may be null... fix this later
                    if (nextInput) {
                        nextInput.focus();
                    }
                } else if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    const currentHorizThing = input.closest('.horiz-thing');
                    const prevInput = currentHorizThing.previousElementSibling ?
                        currentHorizThing.previousElementSibling.querySelector('input') :
                        currentHorizThing.parentElement.previousElementSibling.querySelector('.horiz-thing:last-child input');
                    if (prevInput) {
                        prevInput.focus();
                    }
                }
            });
        });

        newForm.id = 'course-form-' + numFormsAdded;
        inputContainer.appendChild(newForm);
        numFormsAdded++;
    }

    // Example courses to add
    const sampleCourses = [
        new Course("CSCI", "315", "01", "08:00", "08:50", ["M", "W", "F"], "10648"),
        new Course("CSCI", "315L", "60", "10:00", "11:50", ["T"], "10650"),
        new Course("CSCI", "311", "01", "10:00", "10:50", ["M", "W", "F"], "11505"),
        new Course("CSCI", "311R", "40", "13:00", "13:50", ["R"], "11507"),
        new Course("ECEG", "101", "01", "14:00", "14:50", ["M", "W", "F"], "10871"),
        new Course("ECEG", "101L", "60", "08:00", "09:50", ["R"], "11006"),
        new Course("ECEG", "101L", "61", "10:00", "11:50", ["R"], "13869"),
        new Course("ARTD", "131", "01", "08:30", "09:50", ["T", "R"], "15666", "1"),
        new Course("ARTD", "131", "02", "10:00", "11:50", ["M", "W"], "15845", "1"),
        new Course("CSCI", "379", "01", "15:00", "15:50", ["M", "W", "F"], "15846", "1")
    ]

    // Add the example courses
    for (let i = 0; i < sampleCourses.length; i++) {
        const course = sampleCourses[i];
        const courseType = course.isElective() ? "Elective" : "Required";
        addRequiredCourse(courseType);

        const form = document.getElementById("course-form-" + i);
        if (course.isElective()) {
            form.querySelector(".pool-field").value = course.electiveNum;
        }
        form.querySelector(".department-field").value = course.dept;
        form.querySelector(".level-field").value = course.level;
        form.querySelector(".section-field").value = course.section;
        form.querySelector(".start-field").value = course.fStart;
        form.querySelector(".end-field").value = course.fEnd;

        const checkboxes = form.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            if (checkbox.classList.contains("monday-field") && course.daysOfWeek.includes("M")) {
                checkbox.checked = true;
            } else if (checkbox.classList.contains("tuesday-field") && course.daysOfWeek.includes("T")) {
                checkbox.checked = true;
            } else if (checkbox.classList.contains("wednesday-field") && course.daysOfWeek.includes("W")) {
                checkbox.checked = true;
            } else if (checkbox.classList.contains("thursday-field") && course.daysOfWeek.includes("R")) {
                checkbox.checked = true;
            } else if (checkbox.classList.contains("friday-field") && course.daysOfWeek.includes("F")) {
                checkbox.checked = true;
            }
        });

        form.querySelector(".crn-field").value = course.crn;
    }

    // Set up event listeners for the adding buttons
    addRequiredCourseButton.addEventListener("click", function() {
        addRequiredCourse("Required");
    });

    addElectiveButton.addEventListener("click", function() {
        addRequiredCourse("Elective");
    });

    // Set up event listener for the clear all button
    clearAllButton.addEventListener('click', () => {
        const requiredCourseForms = inputContainer.querySelectorAll('.required-course-form');
        const electiveForms = inputContainer.querySelectorAll('.elective-form');

        requiredCourseForms.forEach(form => form.remove());
        electiveForms.forEach(form => form.remove());

        document.getElementById('output-message')?.remove(); // Remove the element with ID output-message if it's not null
        outputContainer.innerHTML = '';
    });
});
