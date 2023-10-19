export function printDebugMessage(message) {
    const inDebugMode = true;
    if (inDebugMode) {
        console.log(message);
    }
}

export function warn(message) {
    console.warn(message);
}

export function inform(message) {
    console.info(message);
}

export function calcMinutes(timeString) {
    // Given a string "hh:mm", get the number of minutes past since 00:00.
    let splitList = timeString.split(":"); // e.g. ["14", "56"]
    let hour = parseInt(splitList[0]); // e.g. parseInt("14") becomes 14
    let minutes = parseInt(splitList[1]); // e.g. parseInt("56") becomes 56
    return hour * 60 + minutes; // e.g. return 896
}

export function convert24(timeStr) {
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

export function clear(element) {
    element.innerHTML = '';
}

export function setText(element, text) {
    element.textContent = text;
}

/**
 * Clones a <template> element and returns its first child element.
 *
 * @param template - The <template> element to clone.
 * @returns {Element} - The first child element of the cloned <template> element.
 */
export function createElementFromTemplate(template) {
    return template.content.cloneNode(true).firstElementChild;
}

export function hyphenate(string) {
    return string.replace(/\s+/g, '-');
}

export function move(element, source, destination) {
    const index = source.indexOf(element);
    if (index !== -1) {
        source.splice(index, 1);
        destination.push(element);
    }
}