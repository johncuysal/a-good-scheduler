def format_time(time_string):
    """Standardizes the format of a given time string and returns it.

    Examples:
    '9:57 am' → '9:57 AM'
    '2pm' → '2:00 PM'
    '12:00pm' → '12:00 PM'
    '9:00 AM → '9:00 AM'
    """
    hour = ""
    if ":" in time_string:  # ex: time_string = "9:57pm"
        split_list = time_string.split(":")  # ex: l = ["9", "57pm"]
        hour = split_list[0]  # ex: hour = "9"
        minutes_past = f':{split_list[1][:2]}'  # ex: minutes_past = ":57"
    else:  # ex: time_string = "11pm"
        minutes_past = ":00"
        for char in time_string:
            if char.isdigit():
                hour += char
                continue
            break
    capitalized_time_string = time_string.upper()
    if "A" in capitalized_time_string:
        return hour + minutes_past + " AM"
    return hour + minutes_past + " PM"


def convert_to_24hr(time_string):
    """Converts a standardized time string to a float in the range [0, 24).

    Examples:
    '2:56 PM' → 14.9333
    '12:00 AM' → 0.0
    '11:59 PM' → 23.98333333
    """
    time_string_list = time_string.split(":")
    hour = int(time_string_list[0])
    minutes_past = int(time_string_list[1][:2])

    last_two_characters = time_string[-2:]
    hours = hour + minutes_past / 60

    if last_two_characters.upper() == "PM" and hour < 12:
        hours += 12
    elif last_two_characters.upper() == "AM" and hour == 12:
        hours -= 12

    return hours


class TimeBlock:
    """TimeBlock object class.

    Attributes:
    f_start (str) -- Formatted start time.
    f_end (str) -- Formatted end time.
    start (float) -- 24-hour-time conversion of f_start.
    end (float) -- 24-hour-time conversion of f_end.
    days (str) -- Formatted (but unordered) days string.
    day_set (set) -- Set of characters from days string.

    Methods:
    __init__() --
    __repr__() --
    __eq__() --
    is_conflicting_with() -- True if two given time blocks collide.
    is_before() -- True if time block's start is before the other's start.
    is_after() -- True if time block's start is after the other's start.
    """
    def __init__(self, start_time, end_time, days):
        self.f_start = format_time(start_time)
        self.f_end = format_time(end_time)
        self.start = convert_to_24hr(self.f_start)
        self.end = convert_to_24hr(self.f_end)
        self.days = days.upper().replace(" ", "")
        self.day_set = set([day for day in self.days])

    def __repr__(self):
        return f'({self.f_start} - {self.f_end} on {self.days})'

    def __eq__(self, other):
        return self.start == other.start \
               and self.end == other.end \
               and self.day_set == other.day_set

    def is_conflicting_with(self, other):
        """Checks for collision."""
        are_sharing_a_day = not (self.day_set.isdisjoint(other.day_set))
        are_overlapping = ((self.start <= other.start <= self.end)
                           or (other.start <= self.start <= other.end))
        return are_sharing_a_day and are_overlapping

    def is_before(self, other):
        """Checks for precession based on start times."""
        return self.start < other.start

    def is_after(self, other):
        """Checks for succession based on start times."""
        return other.start < self.start
