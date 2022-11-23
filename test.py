from timeblocks import TimeBlock
from courses import Course
from schedules import Schedule
from ags import AGS
from graph_test import AGS_Graph

print('Test initialized. Get ready!')

required_courses = [
Course('CSCI 202', 1, TimeBlock("3:00pm", "3:50pm", "TR"), '52638'),
Course('CSCI 205', 1, TimeBlock("9:00am", "9:50am", "MWF"), '50537'),
Course('CSCI 205', 2, TimeBlock("10:00am", "10:50am", "MWF"), '50860'),
Course('CSCI 206', 1, TimeBlock("9:00am", "9:50am", "MWF"), '50120'),
Course('CSCI 206', 2, TimeBlock("11:00am", "11:50am", "MWF"), '50536'),
Course('CSCI 206', 3, TimeBlock("1:00pm", "1:50pm", "MWF"), '54958'),
#Course('CSCI 206L', 60, TimeBlock("8:00am", "9:50am", "T"), '50175'),
#Course('CSCI 206L', 61, TimeBlock("10:00am", "11:50am", "T"), '50447'),
#Course('CSCI 206L', 62, TimeBlock("1:00pm", "2:50pm", "T"), '54025'),
Course('RESC 221', 6, TimeBlock("5:00pm", "6:30pm", "W"), '54690')
]

electives = [
Course('ARST 245', 1, TimeBlock("10:00am", "11:50am", "MW"), '52954'),
Course('ARST 131', 3, TimeBlock("1:00pm", "2:50pm", "MW"), '54547'),
Course('ARST 239', 1, TimeBlock("10:00am", "11:50am", "TR"), '51345'),
Course('EDUC 102', 1, TimeBlock("3:00pm", "4:20pm", "MW"), '55171'),
Course('EDUC 102', 2, TimeBlock("10:00am", "11:20am", "TR"), '55172'),
Course('PSYC 100', 2, TimeBlock("4:00pm", "4:50pm", "MWF"), '55408'),
Course('SOCI 100', 2, TimeBlock("3:00pm", "4:20pm", "MW"), '54479'),
Course('SOCI 100', 3, TimeBlock("12:00pm", "1:20pm", "MW"), '54480'),
Course('SOCI 100', 4, TimeBlock("10:00am", "11:20am", "TR"), '55216')
]

ags = AGS_Graph(required_courses)
print(ags)

schedules = ags.build_schedules()
for schedule in schedules:
    print(schedule)

# ags = AGS(required_courses)

# print('Generating combinations...')
#
# m = ags.make_map()
# ags.build_schedules(m)
#
# print(f"ALL DONE!!! build_schedules() was called {ags.num_calls} times.")