from graph import Graph
from schedules import Schedule
from stack import Stack
import copy

"""
Graph implementation
"""


class AGS_Graph:
    def __init__(self, reqs):
        self.graph = Graph()
        self.required_courses = reqs
        self.required_courses.sort()

        # Add vertices
        for course in reqs:
            self.graph.add_vertex(course)

        """ Add an edge from course1 to course2 if 
            1. course1 ends earlier than course2
            2. course1 is not conflicting with course2
            3. course1 and course2 are not the same course's different section
        """
        for course1 in self.required_courses:
            for course2 in self.required_courses:
                if course1 < course2 and \
                        not course1.time.is_conflicting_with(course2.time) \
                        and course1.name != course2.name:
                    self.graph.add_edge(course1, course2)

    """ Print each vertex's adjacent vertices
    """
    def __repr__(self):
        msg = ""
        for vertex in self.graph.vertices:
            msg += vertex.value.crn + " -> "
            for adj in vertex.get_adj_vertex():
                msg += adj.value.crn + ", "

            msg += "\n"

        return msg


    """
    Depth first traversal on the graph to build courses
    """
    def build_schedules(self):
        schedules = [] # list of schedules

        for course in self.required_courses:
            dft_stack = Stack()
            schedule = Schedule([])
            dft_stack.push((self.graph.find_vertex(course), schedule)) # first course

            # dept first traversal from the first course
            while not dft_stack.is_empty():
                course_vertex, schedule = dft_stack.pop()

                schedule.add_course(course_vertex.value)

                for next_course_vertex in course_vertex.get_adj_vertex():
                    # If the course if not a different section of the course that is already in the schedule
                    if next_course_vertex.value not in schedule:
                        built_schedule = copy.deepcopy(schedule)
                        dft_stack.push((next_course_vertex, built_schedule))

                # If the course is not adjacent to any other courses
                # End of the depth-first traversal
                if len(course_vertex.get_adj_vertex()) == 0:
                    if schedule.is_valid(): # Checks if the schedule is valid (in schedules.py)
                        schedules.append(schedule) # add the schedule

        return schedules
