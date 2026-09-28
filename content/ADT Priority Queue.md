---
category: adt-priority-queue
level: fundamentals
step: 13
summary: "A priority queue is a set with two main operations: insert, and deletemin (remove and return the element with the smallest priority number). Where they show up in real life, and how list-based implementations compare before we reach heaps."
tags: [cis-2101, adt-priority-queue, applications, week-10]
course: CIS-2101 Data Structures
updated: 2026-09-28
---

> [!goal] By the end of this note you can
> - Define the Priority Queue ADT exactly as your handout does.
> - Name real-life applications and explain what "priority" means in each.
> - Compare unsorted-list, sorted-list and bit-vector implementations, and say what they cost.
> - Explain why none of them is good enough, which motivates the partially ordered tree.

## Definition

From your handout: a priority queue is **a set ADT with operations**

| Operation | Does |
|---|---|
| `insert(x, A)` | adds element x to set A, if x is not yet a member |
| `deletemin(A)` | **removes and returns** the smallest element of A, if A is not empty; otherwise the operation fails |

plus `initialize` and `makenull`.

"Smallest" means **highest priority**: priority 1 comes before priority 5. That's why the operation is called deletemin, not deletemax. (A max-priority queue flips it: `deletemax`. More in [[Heaps in Arrays]].)

Each element is usually a *record with a priority*, like a job and its urgency, where the priority decides the order.

## Queue vs priority queue

| | Queue (FIFO) | Priority queue |
|---|---|---|
| Who leaves first | whoever arrived **first** | whoever is **most urgent** |
| Remove operation | `dequeue` | `deletemin` |
| A new arrival can jump ahead? | never | yes, if its priority is higher |

A normal queue is a priority queue where priority = arrival time.

## Real-life applications

| Application | Elements | Priority |
|---|---|---|
| **Process scheduling** (your handout's example) | processes in a time-shared OS | the scheduler runs the highest-priority ready process next |
| Hospital emergency room | patients | triage level: cardiac arrest before a sprained ankle |
| Printer or network queue | jobs, packets | urgent or real-time traffic first |
| Event-driven simulation | future events | event time: always process the earliest next |
| Shortest paths (Dijkstra's, in your final term) | graph vertices | current best-known distance |
| Huffman coding (compression) | trees of characters | frequency: always merge the two rarest |
| Pathfinding in games (A*) | map positions | estimated total cost |

In every one, the question is "what's the most urgent thing **right now**?". It's asked over and over while new items keep arriving.

## Implementations and their costs

Your handout lists five: **bit-vector, linked list, array, cursor-based, and partially ordered tree (POT)**. With n elements:

| Implementation | insert | deletemin | Idea |
|---|---|---|---|
| Unsorted list / array | **O(1)** | O(n) | append anywhere; search for the min when deleting |
| Sorted list | O(n) | **O(1)** | find the right spot on insert; min is at the head |
| Bit vector (priorities = small ints, no duplicates) | **O(1)** | O(N) | set a bit; scan from bit 0 for the first 1 |
| **POT / heap** | **O(log n)** | **O(log n)** | the rest of this track |

Every list-based version makes one operation O(n). With n = 1,000,000 jobs, O(n) versus O(log n) is roughly a million steps versus 20. That's why operating systems and Dijkstra's algorithm use heaps.

## Worked example: an ER triage queue (sorted linked list)

A complete program using the **sorted-list** implementation, which is a different implementation from the POT you'll build. Insert keeps the list ordered, so `deletemin` is just "take the head".

```c title="triage.c" {23-27}
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/* Lower number = more urgent (1 = resuscitation … 5 = non-urgent). */
typedef struct Patient {
    char name[24];
    int  priority;
    struct Patient *next;
} Patient;

typedef Patient *TriageQueue;          /* head = most urgent patient */

/* Insert keeping the list sorted by priority. Equal priorities queue up
   behind each other (first come, first served within a level). O(n). */
void arrive(TriageQueue *q, const char *name, int priority) {
    Patient *p = malloc(sizeof *p);
    if (p == NULL) { perror("malloc"); exit(1); }
    strncpy(p->name, name, sizeof p->name - 1);
    p->name[sizeof p->name - 1] = '\0';
    p->priority = priority;

    Patient **link = q;
    while (*link != NULL && (*link)->priority <= priority)
        link = &(*link)->next;       /* skip everyone as or more urgent */
    p->next = *link;
    *link = p;
}

/* Remove and return the most urgent patient: the head. O(1).
   Returns 0 if the queue is empty. */
int treatNext(TriageQueue *q, Patient *out) {
    if (*q == NULL) return 0;
    Patient *head = *q;
    *out = *head;
    *q = head->next;
    free(head);
    return 1;
}

int main(void) {
    TriageQueue q = NULL;
    arrive(&q, "sprained ankle", 4);
    arrive(&q, "chest pain",     2);
    arrive(&q, "cardiac arrest", 1);
    arrive(&q, "fever",          4);
    arrive(&q, "deep cut",       3);

    Patient p;
    while (treatNext(&q, &p))
        printf("treat: %-15s (priority %d)\n", p.name, p.priority);
    return 0;
}
```

Output:

```text
treat: cardiac arrest  (priority 1)
treat: chest pain      (priority 2)
treat: deep cut        (priority 3)
treat: sprained ankle  (priority 4)
treat: fever           (priority 4)
```

Three details worth copying into your own code:
- The `<=` in `arrive` puts a new patient **behind** everyone with the same priority, so equal priorities stay first-come, first-served. With `<`, the fever patient would cut in front of the sprained ankle.
- `Patient **link` again removes the "insert at head" special case, just as in [[Open Hashing]].
- `treatNext` copies the patient out *before* freeing the node. Returning a pointer to freed memory would be a use-after-free.

> [!note] This isn't strictly a set
> The ADT definition says `insert` adds x only if it's not already a member. A triage queue happily holds two patients with priority 4, because they're different *records*. In practice, priority queues almost always allow duplicate priorities. What must be unique is the element's identity, not its priority.

## Practice

**Basic.** Starting empty, apply: insert 7, insert 3, insert 9, deletemin, insert 1, deletemin, deletemin. What does each deletemin return, and what's left?

> [!answer]- Answer
> The deletemins return **3**, then **1**, then **7**. Left: {9}.

**Intermediate.** Which implementation (unsorted list, sorted list, bit vector, heap) would you choose for each?
(a) 10 print jobs per day, priorities 1–3. (b) a scheduler with 10,000 processes, constant arrivals. (c) exam seat numbers 0–63 to be called in ascending order, each at most once.

> [!answer]- Answer
> (a) Anything works at n = 10, so a sorted list is simplest. (b) A heap: both operations are O(log n). (c) A bit vector in one 64-bit word: insert sets a bit, and deletemin finds the lowest set bit.

**Advanced.** For the unsorted-list implementation, write deletemin as pseudocode. Why does it need **two** pieces of information from its search, not one?

> [!answer]- Answer
> ```text
> deletemin(A):
>     if A is empty: fail
>     minNode ← first node; beforeMin ← none
>     for each node p (tracking its predecessor):
>         if p.priority < minNode.priority: minNode ← p; beforeMin ← predecessor
>     unlink minNode using beforeMin (or move the head if beforeMin is none)
>     return minNode's element
> ```
> You need the minimum *and* the link that points to it (its predecessor, or better, a `Node **`). The value alone isn't enough to unlink it.

## Next

A structure where both operations are O(log n): [[Partially Ordered Trees]].

## References

- Course handout: *CIS 2101 Priority Queue* (definition, operations, implementations, process scheduling)
- Aho, Hopcroft & Ullman, *Data Structures and Algorithms*, §4.10 (priority queues)
- [Priority queue (Wikipedia)](https://en.wikipedia.org/wiki/Priority_queue): applications
