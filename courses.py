class Course:
    """Course object class.

    Attributes:
    name (str) -- user-given course name string
    section (int) -- user-given course section integer
    time (TimeBlock) -- course TimeBlock (created from user-given time data)
    crn (str) -- user-given course registration number (unique identifier)

    Methods:
    __init__() --
    __repr__() --
    __eq__() --
    __ge__() --
    __le__() --
    __gt__() --
    __lt__() --
    """

    def __init__(self, name, section, time_block, crn=''):
        self.name = name
        self.section = section
        self.time = time_block
        self.crn = crn

    def __repr__(self):
        # return f'{self.crn} | {self.name}-{self.section:02} {self.time}'
        return 'C' + self.crn

    def __eq__(self, other):
        return self.name == other.name \
               and self.section == other.section \
               and self.time == other.time

    """Use end time for the comparison. Used to sort the courses."""

    def __ge__(self, other):
        return self.time.start >= other.time.start

    def __le__(self, other):
        return self.time.start <= other.time.start

    def __gt__(self, other):
        return self.time.start > other.time.start

    def __lt__(self, other):
        return self.time.start < other.time.start
