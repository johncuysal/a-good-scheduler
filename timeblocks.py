class TimeBlock:
  '''
  TimeBlock object class.

  Attributes:
    f_start (str) - formatted start time
    f_end (str) - formatted end time
    start (float) - 24-hour-time conversion of f_start
    end (float) - 24-hour-time conversion of f_end
    days (str) - formatted (but unordered) days
    dayset (set) - set of characters from days string

  Methods:
    None
  '''
  def __init__(self, start_time, end_time, days):
    self.f_start = self.format_time(start_time)
    self.f_end = self.format_time(end_time)
    self.start = self.convert_to_24hr(self.f_start)
    self.end = self.convert_to_24hr(self.f_end)
    self.days = days.upper().replace(" ","")
    self.dayset = set([day for day in self.days])

  def __repr__(self):
    return f'({self.f_start} - {self.f_end} on {self.days})'
  
  def __eq__(self, other):
    return self.start == other.start and self.end == other.end and self.dayset == other.dayset

  def is_conflicting_with(self, other):
    are_sharing_a_day = not (self.dayset.isdisjoint(other.dayset))
    are_overlapping = ((self.start <= other.start <= self.end) or (other.start <= self.start <= other.end))
    return are_sharing_a_day and are_overlapping

  def is_later_than(self, other):
    return (self.start > other.start) and (self.end > other.end)

  def is_earlier_than(self, other):
    return (self.start < other.start) and (self.end < other.end)

  def format_time(self, time_string):
    '''
    Standardizes the format of a given time string.
    
    EX: '9:57 am' → '9:57 AM', '2pm' → '2:00 PM', '12:00pm' → '12:00 PM',
    '9:00 AM → 9:00 AM'
    '''
    hour = ""
    mins_past = ""
    if ":" in time_string: # ex: time_string = "9:57pm"
      l = time_string.split(":") # ex: l = ["9", "57pm"]
      hour = l[0] # ex: hour = "9"
      mins_past = f':{l[1][:2]}' # ex: mins_past = ":57"
    else: # ex: time_string = "11pm"
      mins_past = ":00"
      for char in time_string:
        if char.isdigit():
          hour += char
          continue
        break
    capitalized_time_string = time_string.upper()
    if "A" in capitalized_time_string:
      return hour + mins_past + " AM"
    return hour + mins_past + " PM"

  def convert_to_24hr(self, time_string):
    '''
    Converts a standardized time string to a float in the range [0, 24).

    EX: '2:56 PM' → 14.9333, '12:00 AM' → 0.0, '11:59 PM' → 23.98333333
    '''
    time_string_list = time_string.split(":")
    hour = int(time_string_list[0])
    mins_past = int(time_string_list[1][:2])
  
    last_two_characters = time_string[-2:]
    hours = hour + mins_past/60
  
    if last_two_characters.upper() == "PM" and hour < 12:
      hours += 12
    elif last_two_characters.upper() == "AM" and hour == 12:
      hours -= 12
      self.format_time()
    
    return hours