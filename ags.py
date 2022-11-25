from schedules import Schedule
import copy


class AGS:
    """A Good Scheduler (AGS), the fundamental class that handles the
    generation of all course combinations and sorts schedules.

    Attributes:
    required_courses (list) -- A list of Course objects required for next
    semester, which means they must be in every schedule generated.
    num_required (int) -- The number of unique required course names.
    num_calls (int) -- Counter variable meant for viewing efficiency.

    Methods:
    __init__() --
    build_schedules() -- Prints a list of required course schedules.
    make_map() -- Helper function for build_schedules().
    """

    def __init__(self, reqs):
        self.required_courses = reqs
        self.num_required = len(set(c.name for c in reqs))
        self.num_calls = 0

    def build_schedules(self, to_add, schedule=Schedule()):
        self.num_calls += 1

        if not to_add:
            if not schedule.has_conflict:
                print(schedule)
        else:
            for section in to_add[0]:
                local_schedule = copy.deepcopy(schedule)
                for course in local_schedule.courses:
                    if section.time.is_conflicting_with(course.time):
                        local_schedule.has_conflict = True
                local_schedule.add_course(section)
                self.build_schedules(to_add[1:], local_schedule)

    def make_map(self):
        course_name_dict = dict()
        freq_dict = dict()
        b = []

        for section in self.required_courses:
            if section.name not in course_name_dict:
                course_name_dict[section.name] = [section]
            else:
                course_name_dict[section.name].append(section)
        for course_name in course_name_dict:
            freq_dict[course_name] = len(course_name_dict[course_name])

        i = 1
        while len(b) < self.num_required:
            for course_name in freq_dict:
                if freq_dict[course_name] == i:
                    b.append(course_name_dict[course_name])
            i += 1
        return b
