class Stack:
    def __init__(self):
        self.head = None
        self.size = 0

    def push(self, value):
        new_node = LLNode(value)
        self.size += 1
        if self.head is None:
            self.head = new_node
        else:
            new_node.next = self.head
            self.head = new_node

    def pop(self):
        if self.size == 0:
            return None
        else:
            pop_value = self.head.value
            self.head = self.head.next
            self.size -= 1
            return pop_value

    def peek(self):
        return self.head.value

    def __len__(self):
        return self.size

    def is_empty(self):
        return self.size == 0


class LLNode:
    def __init__(self, value):
        self.value = value
        self.next = None
