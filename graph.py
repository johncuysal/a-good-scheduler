class Graph:
    """
    Graph ADT
    Adjacency list implementation of the graph.
    """

    def __init__(self):
        self.vertices = []  # list of vertices

    def add_vertex(self, value):
        self.vertices.append(Vertex(value))

    """ Return vertex from a given value
    """

    def find_vertex(self, value):
        for vertex in self.vertices:
            if vertex.value == value:
                return vertex
        return None

    """ Add edge between one vertex and another
    """

    def add_edge(self, value1, value2):
        v1 = self.find_vertex(value1)
        v2 = self.find_vertex(value2)
        v1.add_edge(v2)

    """ Remove edge between one vertex and another
    """

    def remove_edge(self, value1, value2):
        v1 = self.find_vertex(value1)
        v2 = self.find_vertex(value2)
        v1.remove_edge(v2)


class Vertex:
    """ Vertex used in the Graph ADT
    """

    def __init__(self, value):
        self._adj = []  # Adjacency list
        self.value = value  # value

    def add_edge(self, other):
        self._adj.append(other)

    def remove_edge(self, other):
        self._adj.remove(other)

    def get_adj_vertex(self):
        return self._adj

    def __eq__(self, other):
        return self.value == other.value

    """ return CRN to represent the vertex
    """

    def __repr__(self):
        return self.value.crn
