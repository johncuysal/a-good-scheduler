import {printDebugMessage, warn, inform, clear, setText, createElementFromTemplate, hyphenate, move} from './helpers.js';
import {getCoursesFromJSON} from './data-processing.js';
import GoodScheduler from './GoodScheduler.js';

const NUMBER_OF_COLORS = 8;
const colorCount = new Array(NUMBER_OF_COLORS).fill(0);

const allCourses = [];
const allCorequisiteGroups = {};
getCoursesFromJSON(allCourses, allCorequisiteGroups);
printDebugMessage('Loaded courses from catalog:');
printDebugMessage(allCourses);
printDebugMessage('Made corequisite groups:');
printDebugMessage(allCorequisiteGroups);
const candidateCourses = [];
const excludedCourses = [];
const scheduler = new GoodScheduler();

window.addEventListener('DOMContentLoaded', () => {
    // Get references to essential elements and templates when the page first loads up
    const slotContainerElement            = document.getElementById('slot-container');
    const scheduleContainerElement        = document.getElementById('schedule-container');
    const searchBarElement                = document.getElementById('search-bar');
    const searchBarResultContainerElement = document.getElementById('search-bar-result-container');
    const statusContainerElement          = document.getElementById('status-container');
    const scheduleTemplateElement         = document.getElementById('schedule-template');
    const slotTemplateElement             = document.getElementById('slot-template');
    const slotCandidateTemplate           = document.getElementById('slot-candidate-template');
    const timetableEventTemplate          = document.getElementById('timetable-event-template');
    const scheduleListItemTemplate        = document.getElementById('schedule-list-item-template');

    /**
     * Compute all possible schedules and update the schedule container element.
     */
    function refreshSchedules() {
        clear(scheduleContainerElement);
        const schedules = scheduler.findAllSchedules(candidateCourses);
        for (let schedule of schedules) {
            scheduleContainerElement.appendChild(createScheduleElement(schedule));
        }
        const numSchedules = schedules.length;
        setText(statusContainerElement, `${numSchedules} possible conflict-free ${numSchedules === 1 ? 'schedule:' : 'schedules:'}`);
    }

    /**
     * Sets the background color of a slot element to the least-used slot color.
     *
     * @param {Element} slotElement - The slot element to color.
     * @returns {number} - The index of the color given to the slot element.
     */
    function colorSlotElement(slotElement) {
        // Find the index of the least-used slot color
        const minimumColorIndex = colorCount.indexOf(Math.min(...colorCount));

        // Set the background color of the slot element
        slotElement.style.backgroundColor = `var(--slot-color-${minimumColorIndex})`;

        // Increment the number of slot elements currently using that color
        colorCount[minimumColorIndex] += 1;

        return minimumColorIndex;
    }

    /**
     * Sets up event handling for a slot candidate toggle element.
     *
     * @param {Element} slotCandidateToggleElement - The toggle for the slot candidate.
     * @param {Element} slotCandidateElement - The slot candidate to be toggled.
     * @param {Course} courseSection - The course section represented by the slot candidate to be toggled.
     */
    function setupSlotCandidateToggleElement(slotCandidateToggleElement, slotCandidateElement, courseSection) {
        slotCandidateToggleElement.addEventListener('change', function () {
            if (this.checked) {
                move(courseSection, excludedCourses, candidateCourses);
                printDebugMessage(`${courseSection.longName} was moved from excluded courses to candidate courses.`);
                slotCandidateElement.style.color = 'var(--slot-candidate-text-color-on)';
            } else {
                move(courseSection, candidateCourses, excludedCourses);
                printDebugMessage(`${courseSection.longName} was moved from candidate courses to excluded courses.`);
                slotCandidateElement.style.color = 'var(--slot-candidate-text-color-off)';
            }
            refreshSchedules();
        });
    }

    /**
     * Creates a slot candidate element from a course section.
     *
     * @param {Course} courseSection - The course section to be represented.
     * @returns {Element} - A slot candidate element based on courseSection.
     */
    function createSlotCandidateElement(courseSection) {
        // Create a new blank slot candidate element from the slot candidate template
        const slotCandidateElement = createElementFromTemplate(slotCandidateTemplate);

        // Get references to the slot candidate element's child elements
        const slotCandidateToggleElement                    = slotCandidateElement.querySelector('.slot-candidate-toggle');
        const slotCandidateInfoboxValueSectionNumberElement = slotCandidateElement.querySelector('.slot-candidate-infobox-value-section-number');
        const slotCandidateInfoboxValueTimeBlockElement     = slotCandidateElement.querySelector('.slot-candidate-infobox-value-time-block');

        // Give unique IDs to the slot candidate element and its toggle element
        slotCandidateElement.id = courseSection.crn;
        slotCandidateToggleElement.id = 'toggle-' + slotCandidateElement.id;
        slotCandidateElement.setAttribute('for', slotCandidateToggleElement.id);

        // Fill infobox value elements with information from the course section
        setText(slotCandidateInfoboxValueSectionNumberElement, courseSection.section);
        for (const tbString of courseSection.tbStrings) {
            const divElement = document.createElement('div');
            setText(divElement, tbString);
            slotCandidateInfoboxValueTimeBlockElement.appendChild(divElement);
        }

        // Set up the toggle element to handle being checked or unchecked
        setupSlotCandidateToggleElement(slotCandidateToggleElement, slotCandidateElement, courseSection);

        return slotCandidateElement;
    }

    /**
     * Sets up event handling for a slot delete button element.
     *
     * @param {Element} slotDeleteButtonElement - The button element used to delete the slot element.
     * @param {number} slotColorIndex - The index of the slot element's color.
     * @param {Element} slotElement - The slot element to be deleted.
     * @param {Array.<Course>} courseSections - The course sections represented by the slot element.
     */
    function setupSlotDeleteButtonElement(slotDeleteButtonElement, slotColorIndex, slotElement, courseSections) {
        slotDeleteButtonElement.addEventListener('click', function () {
            colorCount[slotColorIndex] -= 1;

            slotElement.remove();

            for (let courseSection of courseSections) {
                const excludedIndex = excludedCourses.indexOf(courseSection);
                if (excludedIndex !== -1) {
                    excludedCourses.splice(excludedIndex, 1);
                    printDebugMessage(`${courseSection.longName} was deleted from excluded courses.`);
                }
                const candidateIndex = candidateCourses.indexOf(courseSection);
                if (candidateIndex !== -1) {
                    candidateCourses.splice(candidateIndex, 1);
                    printDebugMessage(`${courseSection.longName} was deleted from candidate courses.`);
                }
            }

            refreshSchedules();
        });
    }

    /**
     * Creates a slot element from an array of course sections.
     *
     * @param {Array.<Course>} courseSections - The course sections to be represented.
     * @returns {Element} - A slot element based on courseSections.
     */
    function createSlotElement(courseSections) {
        // Create a new blank slot element from the slot template
        const slotElement = createElementFromTemplate(slotTemplateElement);

        // Get references to the slot element's child elements
        const slotNameElement               = slotElement.querySelector('.slot-name');
        const slotDescriptionElement        = slotElement.querySelector('.slot-description');
        const slotCandidateContainerElement = slotElement.querySelector('.slot-candidate-container');
        const slotDeleteButtonElement       = slotElement.querySelector('.slot-delete-button');

        // Color the slot element
        const slotColorIndex = colorSlotElement(slotElement);

        // Give a unique ID to the slot element
        slotElement.id = hyphenate(courseSections[0].name);

        // Fill child elements with information from the course sections
        setText(slotNameElement, courseSections[0].name);
        setText(slotDescriptionElement, courseSections[0].title);
        for (let courseSection of courseSections) {
            const slotCandidateElement = createSlotCandidateElement(courseSection);
            slotCandidateContainerElement.appendChild(slotCandidateElement);
        }

        // Set up event handling for the slot element's delete button element
        setupSlotDeleteButtonElement(slotDeleteButtonElement, slotColorIndex, slotElement, courseSections);

        return slotElement;
    }

    /**
     * Creates a timetable event element from a timeblock, labeled with a course name.
     *
     * @param timeBlock
     * @param courseName -
     * @returns {Element}
     */
    function createTimetableEventElement(timeBlock, courseName) {
        const timetableEventElement = createElementFromTemplate(timetableEventTemplate);
        setText(timetableEventElement, courseName);
        timetableEventElement.style.backgroundColor = document.getElementById(hyphenate(courseName)).style.backgroundColor;
        timetableEventElement.style.gridRow = `${(timeBlock.startMinute / 5) - 83} / span ${(timeBlock.endMinute - timeBlock.startMinute) / 5}`;
        switch (timeBlock.day) {
            case 'M':
                timetableEventElement.style.gridColumn = '2 / span 1';
                break;
            case 'T':
                timetableEventElement.style.gridColumn = '3 / span 1';
                break;
            case 'W':
                timetableEventElement.style.gridColumn = '4 / span 1';
                break;
            case 'R':
                timetableEventElement.style.gridColumn = '5 / span 1';
                break;
            case 'F':
                timetableEventElement.style.gridColumn = '6 / span 1';
                break;
        }
        return timetableEventElement;
    }

    /**
     * Creates a schedule element from a schedule.
     *
     * @param {Schedule} schedule - The schedule to be represented.
     * @returns {Element} - A schedule element based on schedule.
     */
    function createScheduleElement(schedule) {
        // Create a new blank schedule element from the schedule template
        const scheduleElement = createElementFromTemplate(scheduleTemplateElement);

        // Get references to the schedule element's child elements
        const timetableElement    = scheduleElement.querySelector('.timetable');
        const scheduleListElement = scheduleElement.querySelector('.schedule-list');

        for (let course of schedule.courses) {
            const scheduleListItem = createElementFromTemplate(scheduleListItemTemplate);
            setText(scheduleListItem, `[${course.crn}] ${course.name}-${course.section}`);
            scheduleListItem.style.backgroundColor = document.getElementById(hyphenate(course.name)).style.backgroundColor;
            scheduleListElement.appendChild(scheduleListItem);

            for (let timeBlock of course.timeBlocks) {
                const timetableEventElement = createTimetableEventElement(timeBlock, course.name);
                timetableElement.appendChild(timetableEventElement);
            }
        }

        return scheduleElement;
    }

    // Listen for changes in the search field input
    searchBarElement.addEventListener('input', () => {
        // Extract the currently entered search term
        const searchTerm = searchBarElement.value.toLowerCase();

        // Check if the search term is empty
        if (searchTerm.trim() === '') {
            clear(searchBarResultContainerElement);
            return;
        }

        const matchingCorequisiteGroups = {};
        Object.keys(allCorequisiteGroups).forEach((corequisiteName) => {
            let corequisiteSearchTerm = allCorequisiteGroups[corequisiteName]['searchTerm'];
            if (corequisiteSearchTerm.toLowerCase().includes(searchTerm)) {
                matchingCorequisiteGroups[corequisiteName] = allCorequisiteGroups[corequisiteName];
            }
        });

        clear(searchBarResultContainerElement);

        // Display the matching elements in the search results container
        Object.keys(matchingCorequisiteGroups).forEach((corequisiteName) => {
            let searchResult = document.createElement('div');
            setText(searchResult, matchingCorequisiteGroups[corequisiteName]['searchTerm']);
            searchResult.classList.add('search-result');
            searchResult.id = 'corequisite-group-' + hyphenate(corequisiteName);
            searchBarResultContainerElement.appendChild(searchResult);

            searchResult.addEventListener('click', () => {
                searchBarResultContainerElement.style.display = 'none';
                Object.keys(matchingCorequisiteGroups[corequisiteName]).forEach((name) => {
                    const potentialSlotID = hyphenate(name);
                    /**
                     * The searchTerm attribute for each corequisite group is just for searching, it doesn't include an
                     * actual course list, so use every other attribute. Also, don't add slots that already exist.
                     */
                    if (name !== 'searchTerm' && slotContainerElement.querySelector(`#${potentialSlotID}`) === null) {
                        for (const course of matchingCorequisiteGroups[corequisiteName][name]) {
                            candidateCourses.push(course);
                        }
                        slotContainerElement.appendChild(createSlotElement(matchingCorequisiteGroups[corequisiteName][name]));
                    }
                });
                refreshSchedules();
                searchBarElement.value = '';
                clear(searchBarResultContainerElement);
            });
        });

        searchBarResultContainerElement.style.display = 'flex';
    });

    searchBarElement.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
            const firstSearchResult = searchBarResultContainerElement.querySelector('.search-result');
            if (firstSearchResult) {
                searchBarResultContainerElement.style.display = 'none';
                let chosenCorequisiteName = firstSearchResult.id.replace('corequisite-group-', '').replace('-', ' ');
                /**
                 * The searchTerm attribute for each corequisite group is just for searching, it doesn't include an
                 * actual course list, so use every other attribute. Also, don't add slots that already exist.
                 */
                Object.keys(allCorequisiteGroups[chosenCorequisiteName]).forEach((name) => {
                    const potentialSlotID = hyphenate(name);
                    /**
                     * The searchTerm attribute for each corequisite group is just for searching, it doesn't include an
                     * actual course list, so use every other attribute. Also, don't add slots that already exist.
                     */
                    if (name !== 'searchTerm' && slotContainerElement.querySelector(`#${potentialSlotID}`) === null) {
                        for (const course of allCorequisiteGroups[chosenCorequisiteName][name]) {
                            candidateCourses.push(course);
                        }
                        slotContainerElement.appendChild(createSlotElement(allCorequisiteGroups[chosenCorequisiteName][name]));
                    }
                });
                refreshSchedules();
                searchBarElement.value = '';
                clear(searchBarResultContainerElement);
            }
        }
    });

    // Add an event listener to the search field that listens for the 'blur' event
    searchBarElement.addEventListener('blur', () => {
        // When the search field loses focus, set the display style of the search results element to 'none'
        searchBarResultContainerElement.style.display = 'none';
    });

    // Add an event listener to the search field that listens for the 'focus' event
    searchBarElement.addEventListener('focus', () => {
        // When the search field gains focus, set the display style of the search results element to 'flex'
        searchBarResultContainerElement.style.display = 'flex';
    });

    // Prevent the default action of the event (which would cause the search field to lose focus when search results are clicked)
    searchBarResultContainerElement.addEventListener('mousedown', event => {
        event.preventDefault();
    });
});