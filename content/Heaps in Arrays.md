---
category: adt-priority-queue
level: intermediate
step: 16
summary: "A heap is the array implementation of a POT. Store the tree level by level, and the index formulas 2i+1, 2i+2 and (i−1)/2 replace pointers. Covers insert and deletemin in array terms, min-heap vs max-heap, the bugs to avoid, and tools to test your own implementation."
tags: [cis-2101, adt-priority-queue, heap, min-heap, max-heap, week-11]
course: CIS-2101 Data Structures
updated: 2026-09-28
---

> [!goal] By the end of this note you can
> - Convert between a POT drawing and its array, and compute parent and child indices.
> - Trace insert and deletemin directly on the array, using `lastNdx`.
> - Explain the difference between a min-heap and a max-heap, and what flips.
> - Test your own heap with a property checker, and avoid the three classic bugs.

> [!warning] Graded work: you write `insert` and `deletemin`
> Your Priority Queue practical is yours. This note gives the rules, array-level traces, pseudocode and **testing tools**, but not the finished functions.

## 1. The idea: a POT with no pointers

Your slides call a **heap** the *array implementation of a POT*. Number the nodes level by level, left to right, starting at 0, and store node *k* at `elem[k]`:

![Min-heap tree and its array](assets/heap-array.svg "The POT 1 / 3 2 / 7 6 9 8 stored level by level: index 1's children are at 3 and 4")

The class definition from the *Heap Sort* handout:

```c
#define SIZE 10
typedef struct {
    int elem[SIZE];
    int lastNdx;      /* index of the LAST element; -1 when the heap is empty */
} HeapList;
```

Why this works: characteristics 2 and 3 of a POT (balanced, filled left to right) mean the tree has **no gaps** in level order. So the array has no holes, and "lowest level, far right" is simply `elem[lastNdx]`.

## 2. The index formulas (0-based)

| From node at index i | Index |
|---|---|
| Left child | `2*i + 1` |
| Right child | `2*i + 2` |
| Parent | `(i - 1) / 2` (integer division) |
| Is i a leaf? | when `2*i + 1 > lastNdx` |
| Last internal node | `(lastNdx - 1) / 2` |

Check against the slides' heap `3 4 9 6 5 9 10 10 18 7` (lastNdx = 9): index 1 holds 4, and its children are at 3 and 4, holding 6 and 5 ✓. Index 4 holds 5, and its parent is (4 − 1)/2 = 1, which holds 4 ✓. The slides ask *"Can you see a pattern?"*, and these formulas are that pattern.

> [!warning] 1-based textbooks
> Many books (including Aho, Hopcroft & Ullman) start the array at index **1**, where the children are `2i` and `2i+1` and the parent is `i/2`. Your class uses **0-based** formulas. Mixing the two is the most common heap bug.

## 3. Insert, in array terms

```text
insert(x, H):
    if H is full: fail
    lastNdx = lastNdx + 1
    C = lastNdx;  elem[C] = x                  -- "lowest level, far right"
    while C > 0 and elem[parent(C)] > elem[C]:  -- POT broken with the parent
        swap elem[parent(C)] and elem[C]
        C = parent(C)
```

### Trace: insert 3 into `2 6 4 9 7 5 8` (lastNdx = 6)

| Step | Array (index 0 → 7) | C | P = (C−1)/2 | Compare |
|---|---|---|---|---|
| place | `2 6 4 9 7 5 8 3` | 7 | 3 | elem[3] = 9 > 3: swap |
| swap | `2 6 4 3 7 5 8 9` | 3 | 1 | elem[1] = 6 > 3: swap |
| swap | `2 3 4 6 7 5 8 9` | 1 | 0 | elem[0] = 2 ≤ 3: **stop** |

That's the same result as the tree trace in [[Partially Ordered Trees]], now as index arithmetic. It's also how the slides' *"Insert 2 in the Heap"* animation uses P and C arrows.

## 4. Deletemin, in array terms

```text
deletemin(H):
    if H is empty: fail
    min = elem[0]
    elem[0] = elem[lastNdx];  lastNdx = lastNdx − 1   -- last element to the root
    P = 0
    loop:
        L = 2P+1;  R = 2P+2
        if L > lastNdx: stop                             -- P is a leaf
        S = L
        if R <= lastNdx and elem[R] < elem[L]: S = R    -- the smaller child
        if elem[P] <= elem[S]: stop                      -- POT holds
        swap elem[P] and elem[S];  P = S
    return min
```

### Trace: deletemin on `2 3 4 6 7 5 8 9` (lastNdx = 7)

| Step | Array | P | L, R | Smaller child | Action |
|---|---|---|---|---|---|
| take min = 2, move last (9) to root | `9 3 4 6 7 5 8` | 0 | 1, 2 → 3, 4 | 3 at [1] | swap |
| | `3 9 4 6 7 5 8` | 1 | 3, 4 → 6, 7 | 6 at [3] | swap |
| | `3 6 4 9 7 5 8` | 3 | 7, 8 → out of range | — | leaf: **stop** |

Returns **2**; lastNdx is now 6.

## 5. Min-heap vs max-heap

From your *Heap Sort* handout:

| Type | POT property | Root holds | Operations | Heap sort in place gives |
|---|---|---|---|---|
| **MinHeap** | Priority(parent) **≤** Priority(child) | minimum | insert, deletemin | **descending** order |
| **MaxHeap** | Priority(parent) **≥** Priority(child) | maximum | insert, deletemax | **ascending** order |

Converting one into the other means flipping **every** comparison: `>` in bubble-up, `<` when choosing the child (you now want the *larger* one), and `<=` in the stop test. Miss one and the heap still "works" on small tests, then fails on larger ones.

> [!tip] Max-heap without new code
> Store `-x` in a min-heap and negate on the way out: deletemin then returns the largest original value. It's handy for a quick test, but in an exam write the real comparisons.

## 6. The three classic bugs

> [!bug] Right child that doesn't exist
> `2P+2` may be past `lastNdx`. Comparing against it reads leftover garbage from an earlier deletemin, and can pull a deleted value back into the heap. **Check `R <= lastNdx`** before looking at `elem[R]`.

> [!bug] Off-by-one between lastNdx and count
> `lastNdx` is an **index** (−1 when empty); a count would be 0 when empty. If you mix them, you either lose the last element or read one past it. Decide which one you store and use it consistently. Your class uses `lastNdx`.

> [!bug] Swapping with the larger child
> The heap passes small tests and quietly breaks on larger ones. Always pick the smaller child in a min-heap, and the larger one in a max-heap.

## 7. Tools for testing your implementation

A header with index helpers, a **POT property checker** and a **level printer**, plus a test driver that calls *your* functions. None of this implements insert or deletemin for you. It tells you when yours is wrong.

```c title="heap_tools.h"
#ifndef HEAP_TOOLS_H
#define HEAP_TOOLS_H
#include <stdbool.h>
#include <stdio.h>

#define SIZE 15

typedef struct {
    int elem[SIZE];
    int lastNdx;          /* index of the last element; -1 when empty */
} Heap;

/* Index arithmetic for a 0-based array heap. */
static inline int parentOf(int i) { return (i - 1) / 2; }
static inline int leftOf(int i)   { return 2 * i + 1; }
static inline int rightOf(int i)  { return 2 * i + 2; }

/* Checks the POT property everywhere: every parent <= each existing child. */
static inline bool isMinHeap(const Heap *h) {
    for (int i = 1; i <= h->lastNdx; i++)
        if (h->elem[parentOf(i)] > h->elem[i]) {
            printf("  POT broken: parent %d at [%d] > child %d at [%d]\n",
                   h->elem[parentOf(i)], parentOf(i), h->elem[i], i);
            return false;
        }
    return true;
}

/* Prints the heap level by level: "3 | 4 9 | 6 5 9 10". */
static inline void printLevels(const Heap *h) {
    int levelEnd = 0;                        /* last index of the current level */
    for (int i = 0; i <= h->lastNdx; i++) {
        printf("%d", h->elem[i]);
        if (i == levelEnd && i != h->lastNdx) {
            printf(" | ");
            levelEnd = 2 * levelEnd + 2;     /* next level ends at 2*end + 2 */
        } else if (i != h->lastNdx) {
            putchar(' ');
        }
    }
    putchar('\n');
}
#endif
```

`isMinHeap` only needs one loop: every node except the root has exactly one parent, so checking each child against its parent checks every parent-child pair. On the slides' heap, `printLevels` prints `3 | 4 9 | 6 5 9 10 | 10 18 7`.

```c title="test_heap.c"
#include <assert.h>
#include "heap_tools.h"

/* ---- Your functions (write these in your own file) ---- */
void initHeap(Heap *h);
void insert(Heap *h, int x);
int  deletemin(Heap *h);          /* return the minimum; decide what empty returns */

int main(void) {
    Heap h;
    initHeap(&h);
    assert(h.lastNdx == -1);

    int in[] = {10, 4, 15, 20, 0, 8, 3, 7, 12};
    for (int i = 0; i < 9; i++) {
        insert(&h, in[i]);
        assert(isMinHeap(&h));                /* property holds after every insert */
    }
    printLevels(&h);
    assert(h.lastNdx == 8);

    int expected[] = {0, 3, 4, 7, 8, 10, 12, 15, 20};
    for (int i = 0; i < 9; i++) {
        int m = deletemin(&h);
        assert(m == expected[i]);             /* comes out in ascending order */
        assert(isMinHeap(&h));
    }
    assert(h.lastNdx == -1);
    puts("All heap checks passed.");
    return 0;
}
```

Build: `gcc -std=c11 -Wall -Wextra -fsanitize=address your_heap.c test_heap.c -o t && ./t`. AddressSanitizer catches reads past `lastNdx` that plain `gcc` misses.

## 8. Practice

**Basic.** In a 0-based heap with lastNdx = 12: what are the children of index 5? The parent of index 12? Is index 6 a leaf?

> [!answer]- Answer
> Children of 5: 11 and 12. Parent of 12: (12 − 1)/2 = 5. Index 6: its left child would be 13 > 12, so **yes, it's a leaf**.

**Intermediate.** Insert 1 into the array `3 6 4 9 7 5 8` (lastNdx = 6). Show the array after each swap.

> [!answer]- Answer
> Place at [7]: `3 6 4 9 7 5 8 1`. Parent [3] = 9 > 1: swap → `3 6 4 1 7 5 8 9`. Parent [1] = 6 > 1: swap → `3 1 4 6 7 5 8 9`. Parent [0] = 3 > 1: swap → `1 3 4 6 7 5 8 9`. C = 0: stop.

**Intermediate.** Deletemin on `1 3 4 6 7 5 8 9`, as an array trace.

> [!answer]- Answer
> min = 1. Last (9) to the root: `9 3 4 6 7 5 8`, lastNdx = 6. Children 3 and 4 → swap with [1]: `3 9 4 6 7 5 8`. Children of [1] are [3] = 6 and [4] = 7 → swap with [3]: `3 6 4 9 7 5 8`. [3] has no children (7 > 6): stop.

**Advanced.** Turn the slides' min-heap `3 4 9 6 5 9 10 10 18 7` into a **max-heap** property check. Which single character in `isMinHeap` changes?

> [!answer]- Answer
> The `>` in `h->elem[parentOf(i)] > h->elem[i]` becomes `<`. A max-heap is broken when a parent is **smaller** than its child.

**Advanced (your practical): hints.**

> [!hint]- Hint: full and empty checks
> Full: `lastNdx == SIZE - 1`. Empty: `lastNdx == -1`. Decide what deletemin returns on an empty heap (a sentinel like −1, or a success flag through a pointer) *before* you write it, and document it.

> [!hint]- Hint: fewer writes than swaps
> The slides' `temp` box shows the trick. Instead of swapping at every level, hold the moving element in `temp`, **shift** parents down (or children up) into the gap, and write `temp` once at the end. It's the same result with about half the writes.

## Next

Build a heap from a whole unsorted array in O(n), then sort with it: [[Heapify and Heap Sort]].

## References

- Course handouts: *CIS 2101 Priority Queue*, slides 20–25 (array implementation, index pattern, insert trace); *Heap Sort* (HeapList, MinHeap vs MaxHeap table)
- [Binary heap (Wikipedia)](https://en.wikipedia.org/wiki/Binary_heap): array representation, 0- and 1-based formulas
- Aho, Hopcroft & Ullman, *Data Structures and Algorithms*, §4.11
