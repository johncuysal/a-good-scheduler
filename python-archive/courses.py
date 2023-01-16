class Course:
    """Course object class.

    Attributes:
    name (str) -- user-given course name string
    section (int) -- user-given course section integer
    time (TimeBlock) -- course TimeBlock (created from user-given time data)
    crn (str) -- user-given course registration number (unique identifier)
    group (str) -- allows sections of same group to be grouped together

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
        self.group = self.name

    def __repr__(self):
        return f"{f'[{self.crn}] {self.group} → {self.name}-{self.section:02} {self.time}':<60}"

    def __eq__(self, other):
        """Course objects with the same CRN are considered equal."""
        return self.crn == other.crn

    def __hash__(self):
        """Courses with the same CRN will have the same hash."""
        return hash(self.crn)

    """Use end time for the comparison. Used to sort the courses."""

    def __ge__(self, other):
        return self.time.start >= other.time.start

    def __le__(self, other):
        return self.time.start <= other.time.start

    def __gt__(self, other):
        return self.time.start > other.time.start

    def __lt__(self, other):
        return self.time.start < other.time.start


class Elective(Course):
    """Elective subclass of Course superclass. The only difference is that
    electives have a group attribute different from their course name. This
    allows electives of equal interchangeability to be grouped in pools.
    """

    def __init__(self, group, name, section, time_block, crn=''):
        super().__init__(name, section, time_block, crn)
        self.group = f'ELECTIVE {group}'
