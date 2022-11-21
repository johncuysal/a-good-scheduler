from schedules import Schedule
import copy

class AGS:
  '''
  A Good Scheduler (AGS), the fundamental class that handles the generation
  of all course combinations and sorts schedules.

  Attributes:
    required_courses (list) - A list of Course objects required for next
    semester, which means they must be in every schedule generated.
    num_required (int) - The number of unique required coursenames.
    num_calls (int) - Counter variable meant for viewing efficiency.

  Methods:
    build_schedules() - Prints a list of required course schedules.
    make_map() - 
  '''
  def __init__(self, reqs):
    self.required_courses = reqs
    self.num_required = len(set(c.name for c in reqs))
    self.num_calls = 0
    
  def build_schedules(self, to_add, schedule = Schedule()):
    self.num_calls += 1
    
    if to_add == []:
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
    coursename_dict = dict()
    freq_dict = dict()
    b = []
    
    for section in self.required_courses:
      if section.name not in coursename_dict:
        coursename_dict[section.name] = [section]
      else:
        coursename_dict[section.name].append(section)
    for coursename in coursename_dict:
      freq_dict[coursename] = len(coursename_dict[coursename])
      
    i = 1
    while len(b) < self.num_required:
      for coursename in freq_dict:
        if freq_dict[coursename] == i:
          b.append(coursename_dict[coursename])
      i += 1
    return b