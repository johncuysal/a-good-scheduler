from courses import Course

class Schedule:
  '''
  Schedule object class.
  '''
  def __init__(self, course_list = []):
    self.courses = course_list
    self.has_conflict = False

  def __repr__(self):
    s = f'{"-"*50}\n'
    for i in range(len(self.courses)):
      s += f'{self.courses[i]}\n'
    s += f'{"-"*50}'
    return s

  def __len__(self):
    return len(self.courses)

  def add_course(self, course):
    self.courses.append(course)