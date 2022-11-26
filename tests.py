from ags import AGS
from ags_graph import AGSGraph
import time


def test_ags(courses):
    start = time.time()
    print("▒" * 64)
    print(f"Testing the original AGS...")

    ags = AGS(courses)

    m = ags.make_map()
    ags.build_schedules(m)
    ags.print_schedules()

    print(f"build_schedules() was called {ags.num_calls} times.")

    end = time.time()
    print(f'AGS took {(end - start) * 1000:8f} ms.')
    return ags.schedules


def test_ags_graph(courses):
    start = time.time()
    print("▒" * 64)
    print(f"Testing the graph implementation of AGS...")

    ags_graph = AGSGraph(courses)
    print(ags_graph)

    ags_graph.build_schedules()
    ags_graph.print_schedules()

    end = time.time()
    print(f'AGSGraph took {(end - start) * 1000:8f} ms.')
    return ags_graph.schedules
