class Schedule:
    """Schedule object class.

    Attributes:
    courses (list) --
    course_groups (list) --
    has_conflict (bool) --

    Methods:
    __init__() --
    __repr__() --
    __len__() --
    add_course() --
    __contains__() --
    is_valid() --
    """

    def __init__(self, course_list=[]):
        self.courses = course_list
        self.course_groups = []
        self.has_conflict = False

    def __repr__(self):
        s = f'{"-" * 50}\n'
        for i in range(len(self.courses)):
           s += f'{self.courses[i]}\n'
        s += f'{"-" * 50}'

        return s

    def __len__(self):
        return len(self.courses)

    def add_course(self, course):
        self.courses.append(course)
        self.course_groups.append(course.name)

    """Checks if the course is added to the schedule."""

    def __contains__(self, target):
        return target.name in self.course_groups

    """Checks if the schedule is valid."""

    def is_valid(self):
        # Needs to be changed as we add features for the electives etc.
        # 1. Has all required courses
        # 2. More than 3 credits, less than 5 credits
        # 3. Co-requisites (labs, recitations)
        return len(self) == 5
