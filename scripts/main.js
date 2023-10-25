import {printDebugMessage, warn, inform, clear, setText, createElementFromTemplate, hyphenate, move} from './helpers.js';
import {getCoursesFromJSON} from './data-processing.js';
import GoodScheduler from './GoodScheduler.js';

const NUMBER_OF_COLORS = 8;
const colorCount = new Array(NUMBER_OF_COLORS).fill(0);

const allCourseSections = [];
const allCorequisiteGroups = [];
// TODO: Only allow code after getCoursesFromJSON() to run after getCoursesFromJSON() has fully completed.
getCoursesFromJSON(allCourseSections, allCorequisiteGroups);
printDebugMessage(`Loaded ${allCourseSections.length} sections from catalog:`);
printDebugMessage(allCourseSections);
printDebugMessage(`Made ${allCorequisiteGroups.length} corequisite groups:`);
printDebugMessage(allCorequisiteGroups);
const candidateCourseSections = [];
const excludedCourseSections = [];
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

    // Set up event handling for the search bar element and search bar result container element
    setupSearchBarElement(searchBarElement);
    setupSearchBarResultContainerElement(searchBarResultContainerElement);

    /**
     * Compute all possible schedules and update the schedule container element.
     */
    function refreshSchedules() {
        clear(scheduleContainerElement);
        const schedules = scheduler.findAllSchedules(candidateCourseSections);
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
     * @param {Element} slotCandidateToggleElement - The toggle for `slotCandidateElement`.
     * @param {Element} slotCandidateElement - The slot candidate element to be toggled.
     * @param {CourseSection} courseSection - The course section represented by `slotCandidateElement`.
     */
    function setupSlotCandidateToggleElement(slotCandidateToggleElement, slotCandidateElement, courseSection) {
        slotCandidateToggleElement.addEventListener('change', function () {
            if (this.checked) {
                move(courseSection, excludedCourseSections, candidateCourseSections);
                printDebugMessage(`${courseSection.longName} was moved from excluded course sections to candidate course sections.`);
                slotCandidateElement.style.color = 'var(--slot-candidate-text-color-on)';
            } else {
                move(courseSection, candidateCourseSections, excludedCourseSections);
                printDebugMessage(`${courseSection.longName} was moved from candidate course sections to excluded course sections.`);
                slotCandidateElement.style.color = 'var(--slot-candidate-text-color-off)';
            }
            refreshSchedules();
        });
    }

    /**
     * Creates a slot candidate element from a course section.
     *
     * @param {CourseSection} courseSection - The course section to be represented.
     * @returns {Element} - A slot candidate element based on `courseSection`.
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
     * @param {Element} slotDeleteButtonElement - The button element used to delete `slotElement`.
     * @param {number} slotColorIndex - The index of `slotElement`'s color.
     * @param {Element} slotElement - The slot element to be deleted.
     * @param {Array.<CourseSection>} courseSections - The course sections represented by `slotElement`.
     */
    function setupSlotDeleteButtonElement(slotDeleteButtonElement, slotColorIndex, slotElement, courseSections) {
        slotDeleteButtonElement.addEventListener('click', function () {
            colorCount[slotColorIndex] -= 1;

            slotElement.remove();

            for (let courseSection of courseSections) {
                const excludedIndex = excludedCourseSections.indexOf(courseSection);
                if (excludedIndex !== -1) {
                    excludedCourseSections.splice(excludedIndex, 1);
                    printDebugMessage(`${courseSection.longName} was deleted from excluded course sections.`);
                }
                const candidateIndex = candidateCourseSections.indexOf(courseSection);
                if (candidateIndex !== -1) {
                    candidateCourseSections.splice(candidateIndex, 1);
                    printDebugMessage(`${courseSection.longName} was deleted from candidate course sections.`);
                }
            }

            refreshSchedules();
        });
    }

    /**
     * Creates a slot element from an array of course sections.
     *
     * @param {Array.<CourseSection>} courseSections - The course sections to be represented.
     * @returns {Element} - A slot element based on `courseSections`.
     */
    function createSlotElement(courseSections) {
        // Create a new blank slot element from the slot template
        const slotElement = createElementFromTemplate(slotTemplateElement);

        // Get references to the slot element's child elements
        const slotNameElement               = slotElement.querySelector('.slot-name');
        const slotDescriptionElement        = slotElement.querySelector('.slot-description');
        const slotCandidateContainerElement = slotElement.querySelector('.slot-candidate-container');
        const slotDeleteButtonElement       = slotElement.querySelector('.slot-delete-button');

        // Give a unique ID to the slot element
        slotElement.id = hyphenate(courseSections[0].name);

        // Fill child elements with information from the course sections
        setText(slotNameElement, courseSections[0].name);
        setText(slotDescriptionElement, courseSections[0].title);
        for (let courseSection of courseSections) {
            slotCandidateContainerElement.appendChild(createSlotCandidateElement(courseSection));
        }

        // Color the slot element
        const slotColorIndex = colorSlotElement(slotElement);

        // Set up event handling for the slot element's delete button element
        setupSlotDeleteButtonElement(slotDeleteButtonElement, slotColorIndex, slotElement, courseSections);

        return slotElement;
    }

    /**
     * Creates a timetable event element from a time block, labeled with a course section name.
     *
     * @param timeBlock - The time block to be represented.
     * @param courseSectionName - The text to be displayed by the timetable event element.
     * @returns {Element} - A timetable event based on `timeBlock`.
     */
    function createTimetableEventElement(timeBlock, courseSectionName) {
        // Create a new blank timetable event element from the timetable event template
        const timetableEventElement = createElementFromTemplate(timetableEventTemplate);

        // Set the text of the timetable event element
        setText(timetableEventElement, courseSectionName);

        // Style the timetable event element and calculate its position within the grid
        timetableEventElement.style.backgroundColor = document.getElementById(hyphenate(courseSectionName)).style.backgroundColor;
        timetableEventElement.style.gridRow = `${(timeBlock.startMinute / 5) - 83} / span ${(timeBlock.endMinute - timeBlock.startMinute) / 5}`;
        switch (timeBlock.day) {
            case 'M': // Monday
                timetableEventElement.style.gridColumn = '2';
                break;
            case 'T': // Tuesday
                timetableEventElement.style.gridColumn = '3';
                break;
            case 'W': // Wednesday
                timetableEventElement.style.gridColumn = '4';
                break;
            case 'R': // Thursday
                timetableEventElement.style.gridColumn = '5';
                break;
            case 'F': // Friday
                timetableEventElement.style.gridColumn = '6';
                break;
            case 'S': // Saturday
                break;
            case 'U': // Sunday
                break;
        }
        timetableEventElement.style.gridColumn = timetableEventElement.style.gridColumn + ' / span 1';
        return timetableEventElement;
    }

    /**
     * Creates a schedule list item element from a course section.
     *
     * @param {CourseSection} courseSection - The course section to be represented.
     * @returns {Element} - A schedule list item based on `courseSection`.
     */
    function createScheduleListItemElement(courseSection) {
        // Create a new blank schedule list item element from the schedule list item template
        const scheduleListItemElement = createElementFromTemplate(scheduleListItemTemplate);

        // Set the text of the schedule list item element
        setText(scheduleListItemElement, `[${courseSection.crn}] ${courseSection.name}-${courseSection.section}`);

        // Color the schedule list item element
        scheduleListItemElement.style.backgroundColor = document.getElementById(hyphenate(courseSection.name)).style.backgroundColor;

        return scheduleListItemElement;
    }

    /**
     * Creates a schedule element from a schedule.
     *
     * @param {Schedule} schedule - The schedule to be represented.
     * @returns {Element} - A schedule element based on `schedule`.
     */
    function createScheduleElement(schedule) {
        // Create a new blank schedule element from the schedule template
        const scheduleElement = createElementFromTemplate(scheduleTemplateElement);

        // Get references to the schedule element's child elements
        const timetableElement    = scheduleElement.querySelector('.timetable');
        const scheduleListElement = scheduleElement.querySelector('.schedule-list');

        // Add the schedule's course sections to the schedule element
        for (let courseSection of schedule.courseSections) {
            // Add each time block of the course section as a time block element to the timetable element
            for (let timeBlock of courseSection.timeBlocks) {
                timetableElement.appendChild(createTimetableEventElement(timeBlock, courseSection.name));
            }

            // Fill the schedule list element with information from the course section
            scheduleListElement.appendChild(createScheduleListItemElement(courseSection));
        }

        return scheduleElement;
    }

    /**
     * Sets up event handling for a search bar element.
     *
     * @param {Element} searchBarElement - The search bar used to add slots.
     */
    function setupSearchBarElement(searchBarElement) {
        searchBarElement.addEventListener('input', () => {
            // Extract the currently entered search term
            const searchTerm = searchBarElement.value.toLowerCase().trim();

            // If the search term is empty or all whitespace, clear the search result container and don't search
            if (searchTerm === '') {
                clear(searchBarResultContainerElement);
                return;
            }

            // An array to hold the corequisite group objects whose search phrases include the search term
            const matchingCorequisiteGroups = [];

            allCorequisiteGroups.forEach(corequisiteGroup => {
                let corequisiteSearchTerm = corequisiteGroup.searchTerm;
                if (corequisiteSearchTerm.toLowerCase().includes(searchTerm)) {
                    matchingCorequisiteGroups.push(corequisiteGroup);
                }
            });

            clear(searchBarResultContainerElement);

            // Display the matching elements in the search results container
            matchingCorequisiteGroups.forEach(matchingCorequisiteGroup => {
                let searchResult = document.createElement('div');
                setText(searchResult, matchingCorequisiteGroup.searchTerm);
                searchResult.classList.add('search-result');
                searchResult.id = 'corequisite-group-' + hyphenate(matchingCorequisiteGroup.name);
                searchBarResultContainerElement.appendChild(searchResult);

                searchResult.addEventListener('click', () => {
                    searchBarResultContainerElement.style.display = 'none';
                    matchingCorequisiteGroup.courseClusters.forEach(courseCluster => {
                        const potentialSlotID = hyphenate(courseCluster.name);
                        if (slotContainerElement.querySelector(`#${potentialSlotID}`) === null) {
                            courseCluster.courseSections.forEach(courseSection => {
                               candidateCourseSections.push(courseSection);
                            });
                            slotContainerElement.appendChild(createSlotElement(courseCluster.courseSections));
                        }
                    });
                    refreshSchedules();
                    clear(searchBarElement);
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
                    const chosenCorequisiteGroup = allCorequisiteGroups.find(corequisiteGroup => corequisiteGroup.name === chosenCorequisiteName);
                    chosenCorequisiteGroup.courseClusters.forEach(courseCluster => {
                        const potentialSlotID = hyphenate(courseCluster.name);
                        if (slotContainerElement.querySelector(`#${potentialSlotID}`) === null) {
                            courseCluster.courseSections.forEach(courseSection => {
                                candidateCourseSections.push(courseSection);
                            });
                            slotContainerElement.appendChild(createSlotElement(courseCluster.courseSections));
                        }
                    });
                    refreshSchedules();
                    clear(searchBarElement);
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
    }

    /**
     * Sets up event handling for a search bar result container element.
     *
     * Prevents the default handling of the 'mousedown' event to ensure that clicking the search bar result container
     * element does not take focus away from the search bar element.
     *
     * @param searchBarResultContainerElement - The search bar result container used to display search results.
     */
    function setupSearchBarResultContainerElement(searchBarResultContainerElement) {
        searchBarResultContainerElement.addEventListener('mousedown', event => {
            event.preventDefault();
        });
    }
});