from timeblocks import TimeBlock

class Course:
  '''
  Course object class.

  Attributes:
    name (str) - user-given course name string
    section (int) - user-given course section integer
    time (TimeBlock) - course TimeBlock (created when user inputs time data for the course)

  Methods:
    None
  '''
  def __init__(self, name, section, time_block, CRN = ''):
    self.name = name
    self.section = section
    self.time = time_block
    self.crn = CRN

  def __repr__(self):
    return f'{self.crn} | {self.name}-{self.section:02} {self.time}'

  def __eq__(self, other):
    return self.name == other.name and self.section == other.section and self.time == other.time

  """
    Use end time for the comparison.
    Used to sort the courses.
  """
  def __ge__(self, other):
    return self.time.end >= other.time.end

  def __le__(self, other):
    return self.time.end <= other.time.end

  def __gt__(self, other):
    return self.time.end > other.time.end

  def __lt__(self, other):
    return self.time.end < other.time.end
