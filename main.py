import copy

"""
HELPER FUNCTIONS
"""


def calc_minutes(time_string):
    """Given a string 'hh:mm', get the number of minutes past since 00:00."""
    split_list = time_string.split(':')  # e.g. ['14', '56']
    hour = int(split_list[0])  # e.g. int('14') becomes 14
    minutes = int(split_list[1])  # e.g. int('56') becomes 56
    return hour * 60 + minutes  # e.g. return 896


"""
COURSE, ELECTIVE, AND SCHEDULE CLASS DEFINITIONS
"""


class Course:
    """Course object class."""

    def __init__(self, department, level, section, f_start, f_end, days, crn=''):
        self.dept = department  # e.g. 'CSCI'
        self.level = level  # e.g. '205'
        self.name = f'{self.dept} {self.level}'  # e.g. 'CSCI 205'
        self.section = section  # e.g. '01'
        self.f_start = f_start  # e.g. '09:00'
        self.f_end = f_end  # e.g. '09:50'
        self.start = calc_minutes(f_start)  # e.g. 540 (in minutes)
        self.end = calc_minutes(f_end)  # e.g. 590 (in minutes)
        self.days = days  # e.g. 'MWF'
        self.crn = crn  # e.g. '50537'
        self.group = self.name  # e.g. 'CSCI 205' (group attribute is the same as name for required courses)

    def __repr__(self):
        return f"{f'<{self.crn}> {self.group} → {self.name}-{self.section:02} ({self.f_start} - {self.f_end})'}"

    def is_conflicting_with(self, other):
        """Returns True if times overlap on the same day."""
        for day in self.days:  # e.g. for 'M', 'W', and 'F' in 'MWF'
            if day in other.days:  # e.g. if 'M' in 'MTW'
                if (self.start <= other.start <= self.end) or (other.start <= self.start <= other.end):
                    return True  # this is the case where it's the same day and times overlap
        return False


class Elective(Course):
    """Elective subclass of Course superclass. The only difference is that
    electives have a group attribute different from their course name. This
    allows electives of equal interchangeability to be grouped in pools.
    """

    def __init__(self, department, level, section, start, end, days, elective_num, crn=''):
        super().__init__(department, level, section, start, end, days, crn)
        self.group = f'ELECTIVE {elective_num}'  # e.g. 'ELECTIVE 3' indicates the group this elective is picked from


class Schedule:
    """Schedule object class."""

    def __init__(self):
        self.courses = []  # schedules initially have no courses
        self.has_conflict = False  # having no courses means no conflict

    def __repr__(self):
        s = f"┌{'─' * 63}\n"
        for course in self.courses:
            s += f'│ {course}\n'
        s += f"└{'─' * 63}"
        return s

    def add_course(self, course_to_add):
        for course in self.courses:  # for every course currently in the schedule...
            if course_to_add.is_conflicting_with(course):  # if it conflicts with the course to add...
                self.has_conflict = True  # mark the schedule as having a conflict
        self.courses.append(course_to_add)  # always add course to schedule regardless


"""
A GOOD SCHEDULER CLASS AND ITS SCHEDULING ALGORITHM
"""


class AGS:
    """A Good Scheduler (AGS), the fundamental class that handles the
    generation of all course combinations and sorts schedules."""

    def __init__(self, supplied_courses):
        self.supplied_courses = supplied_courses  # list of Course and Elective objects
        self.schedules = []  # initially, no schedules have been generated
        self.non_conflicting_schedules = []  # no non-conflicting schedules either
        self.num_recursions = 0  # initially, build_schedules() has not been called

    def print_schedules(self, show_conflicting_schedules=False):
        if show_conflicting_schedules:
            schedules_to_show = self.schedules  # show all schedules if chosen
        else:
            schedules_to_show = self.non_conflicting_schedules  # else only show non-conflicting schedules
        s = ""
        for i in range(len(schedules_to_show)):
            s += f"\nSchedule #{i + 1}:\n{schedules_to_show[i]}"
        s += "\n"
        print(s)

    def add_schedule(self, schedule):
        self.schedules.append(schedule)  # always add schedule to schedules list
        if not schedule.has_conflict:
            self.non_conflicting_schedules.append(schedule)  # also add it to the non-conflicting list if applicable

    def get_path(self):
        groups = dict()  # make a new dictionary to have group attributes as keys and lists of courses as values
        for course in self.supplied_courses:
            if course.group in groups:
                groups[course.group].append(course)
            else:
                groups[course.group] = [course]
        return sorted(groups.values(), key=len)  # sort the lists by length from least to greatest

    def build_schedules(self, groups_to_add, schedule=Schedule()):
        self.num_recursions += 1  # increment the number of times this function has been called

        if not groups_to_add:  # when all groups have been added
            self.add_schedule(schedule)  # add the finished schedule to schedules list
        else:
            next_group_to_add = groups_to_add[0]  # list of courses with same group attribute
            for course in next_group_to_add:  # recurse on each possibility from this same-group list
                local_schedule = copy.deepcopy(schedule)  # make a completely separate schedule object
                local_schedule.add_course(course)  # add it to the schedule
                self.build_schedules(groups_to_add[1:], local_schedule)  # with the group taken care of, proceed


"""
TESTS
"""


def test_ags(courses):
    print("▒" * 64)
    print(f"Now testing: AGS...")
    ags = AGS(courses)
    ags.build_schedules(ags.get_path())
    ags.print_schedules()
    print(f"build_schedules() was called {ags.num_recursions} times.")
    return ags.schedules


def test_calc_minutes():
    print("▒" * 64)
    print(f"Now testing: calc_minutes()")
    for hour in range(24):
        for minute in range(60):
            time_string = f'{hour:02}:{minute:02}'
            time_in_minutes = calc_minutes(time_string)
            print(f'{time_string} → {time_in_minutes}')


"""
MAIN
"""


if __name__ == "__main__":
    johns_courses = [
        Course('CSCI', '202', '01', '15:00', '15:50', 'TR', '52638'),
        Course('CSCI', '205', '01', '09:00', '09:50', 'MWF', '50537'),
        Course('CSCI', '205', '02', '10:00', '10:50', 'MWF', '50860'),
        Course('CSCI', '206', '01', '09:00', '09:50', 'MWF', '50120'),
        Course('CSCI', '206', '02', '11:00', '11:50', 'MWF', '50536'),
        Course('CSCI', '206', '03', '13:00', '13:50', 'MWF', '54958'),
        # Course('CSCI', '206L', '60', '08:00', '09:50', 'T', '50175'),
        # Course('CSCI', '206L', '61', '10:00', '11:50', 'T', '50447'),
        # Course('CSCI', '206L', '62', '13:00', '14:50', 'T', '54025'),
        # Elective('ARST', '245', '01', '10:00', '11:50', 'MW', 1, '52954'),
        # Elective('ARST', '131', '03', '13:00', '14:50', 'MW', 1, '54547'),
        # Elective('ARST', '239', '01', '10:00', '11:50', 'TR', 1, '51345'),
        # Elective('EDUC', '102', '01', '15:00', '16:20', 'MW', 1, '55171'),
        # Elective('EDUC', '102', '02', '10:00', '11:20', 'TR', 1, '55172'),
        # Elective('PSYC', '100', '02', '16:00', '16:50', 'MWF', 1, '55408'),
        # Elective('SOCI', '100', '02', '15:00', '16:20', 'MW', 1, '54479'),
        # Elective('SOCI', '100', '03', '12:00', '13:20', 'MW', 1, '54480'),
        # Elective('SOCI', '100', '04', '10:00', '11:20', 'TR', 1, '55216'),
        Course('RESC', '221', '06', '17:00', '18:30', 'W', '54690')
    ]
    ags_output = test_ags(johns_courses)
