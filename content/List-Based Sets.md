---
category: adt-set
level: basic
step: 5
summary: "Sets stored in arrays, linked lists or cursors. Unsorted storage makes union O(n·m); keeping elements sorted lets a two-pointer merge do union, intersection and difference in O(n + m)."
tags: [cis-2101, adt-set, linked-list, merge, week-7]
course: CIS-2101 Data Structures
updated: 2026-09-28
---

> [!goal] By the end of this note you can
> - Implement set rules (no duplicates) on top of an array or linked list.
> - Explain why union of **unsorted** sets costs O(n·m) and of **sorted** sets O(n + m).
> - Trace the two-pointer merge for union, intersection and difference by hand.

## Same storage, different rules

A list-based set uses exactly the structures from the List unit: array, singly linked list, or cursor-based. Only the operation rules change:

- `insert(x, A)` must **check membership first**, because duplicates aren't allowed.
- No operation may depend on *position*. There's no "insert at index 2" for a set.

Two design decisions follow: **unsorted or sorted**, and **array or linked**.

## Cost of each operation

With n = |A| and m = |B|:

| Operation | Unsorted list | Sorted list |
|---|---|---|
| `member(x, A)` | O(n): scan everything | O(n) linked (can stop early); O(log n) sorted **array** with binary search |
| `insert(x, A)` | O(n): membership check, then O(1) append | O(n): find the spot, then insert there |
| `delete(x, A)` | O(n) | O(n) (can stop early) |
| `A ∪ B`, `A ∩ B`, `A − B` | **O(n·m)** | **O(n + m)** |

The last row is why you'd bother sorting.

## Why unsorted union is O(n·m)

With no order to exploit, the only way to know whether an element of B is already in the result is to **look through the result**:

```text
result ← copy of A                         -- O(n)
for each b in B:                           -- m times
    if b is not in result:                 -- O(n + m) scan
        add b to result
```

m × (n + m) scans, which is O(n·m) or worse. With 1,000 elements each, that's about a million comparisons.

## Why sorted union is O(n + m): the two-pointer merge

If both sets are sorted ascending, walk them **together** with one pointer each. At every step, compare the two current elements:

| Case | Union keeps | Intersection keeps | Difference A − B keeps | Then advance |
|---|---|---|---|---|
| `a < b` | a | — | a | pointer in A |
| `a > b` | b | — | — | pointer in B |
| `a == b` | a (once) | a | — | **both** |
| one list ran out | the rest of the other | nothing more | rest of A | — |

Every comparison advances at least one pointer, so the loop runs at most n + m times.

### Trace: A = {1, 4, 6, 9}, B = {2, 4, 9, 10}

| Step | a | b | Compare | Union so far | Intersection so far |
|---|---|---|---|---|---|
| 1 | 1 | 2 | a < b | 1 | — |
| 2 | 4 | 2 | a > b | 1, 2 | — |
| 3 | 4 | 4 | equal | 1, 2, 4 | 4 |
| 4 | 6 | 9 | a < b | 1, 2, 4, 6 | 4 |
| 5 | 9 | 9 | equal | 1, 2, 4, 6, 9 | 4, 9 |
| 6 | — | 10 | A ran out | 1, 2, 4, 6, 9, **10** | 4, 9 |

Result: A ∪ B = {1, 2, 4, 6, 9, 10} and A ∩ B = {4, 9}, and the output comes out **sorted for free**, so it's a valid sorted set too.

## Worked example: `isSubset` with two pointers

The same technique on a different question: is every element of A also in B? (A ⊆ B). Both are sorted arrays.

```c title="subset.c"
#include <stdio.h>

/* Returns 1 if every element of A (size n) is in B (size m).
   Both arrays must be sorted ascending with no duplicates. O(n + m). */
int isSubset(const int A[], int n, const int B[], int m) {
    int i = 0, j = 0;
    while (i < n && j < m) {
        if (A[i] == B[j])      { i++; j++; }  /* found A[i], move on       */
        else if (A[i] > B[j])  { j++; }       /* B[j] is irrelevant to A   */
        else                   { return 0; }  /* A[i] < B[j]: A[i] is missing */
    }
    return i == n;                            /* did we match all of A?    */
}

int main(void) {
    int A[] = {4, 9};
    int B[] = {1, 2, 4, 6, 9, 10};
    int C[] = {4, 5};
    printf("%d\n", isSubset(A, 2, B, 6));   /* 1 */
    printf("%d\n", isSubset(C, 2, B, 6));   /* 0: 5 is missing */
    return 0;
}
```

Why can we return 0 immediately when `A[i] < B[j]`? Because B is sorted: everything after `B[j]` is even bigger, so `A[i]` can't appear later.

## Linked lists vs arrays vs cursors

- **Array (static):** simple and cache-friendly, but capacity is fixed and inserting into a sorted array shifts elements.
- **Array (dynamic):** capacity can grow with `realloc`.
- **Linked list:** no shifting and no fixed capacity, but an extra pointer per element and no binary search.
- **Cursor-based:** a linked list where the "pointers" are array indices into a shared node pool (a *virtual heap*). Same algorithms, but `p->next` becomes `VH.nodes[p].next`.

The merge logic is identical in all of them. Only "advance the pointer" is written differently.

## Practice

**Basic.** Trace the merge on A = {2, 3, 8}, B = {1, 3, 5, 8, 9}. Give A ∪ B, A ∩ B, A − B and how many comparisons were made.

> [!answer]- Answer
> A ∪ B = {1, 2, 3, 5, 8, 9}, A ∩ B = {3, 8}, A − B = {2}. The comparisons go (2,1), (2,3), (3,3), (8,5), (8,8): **5 comparisons**, after which A is exhausted and 9 gets copied over.

**Intermediate: the handout's Practice Exercise 1.** Write `setUnionV1` (unsorted linked lists) and `setUnionV2` (sorted linked lists), then compare their running times. That's your exercise, so here are hints, not code.

> [!hint]- Hint: the data type
> A set as a linked list is exactly your List unit's node definition. Decide whether `Set` is the node pointer itself, or a struct holding the head. That changes whether you return a new list or build into a parameter.

> [!hint]- Hint: V1 (unsorted)
> Copy all of A into the result first. Then, for each node of B, walk the *result* to check membership before appending. Where should you append so you don't walk the list twice?

> [!hint]- Hint: V2 (sorted)
> Use the table above: three cases while both lists have nodes, then copy whatever remains. Keep a pointer to the result's **last** node (or use a `Node **` "tail slot") so every append is O(1). Otherwise V2 quietly becomes O(n²) again.

> [!hint]- Hint: the running-time question
> Count comparisons for two sets of size n. V1 does about n × (the result's size) and V2 does at most 2n. What happens to each when n doubles?

**Advanced.** Write `setDifference` for sorted arrays, returning A − B, using the table above. Then answer this: is `setDifference(A, B)` followed by `setUnion(result, B)` always equal to `setUnion(A, B)`?

> [!answer]- Answer (the reasoning, not the code)
> Yes. (A − B) ∪ B = A ∪ B for any sets, because removing B's elements from A and then adding all of B back gives everything in A or B. Test your implementation against this identity.

## Next

List-based sets pay O(n) even for `member`. When the universe is small, you can do every membership test in O(1): [[Bit-Vector Sets]].

## References

- Course handout: *ADT Set and Bit-Vector* (ADT UID implementations; Practice Exercise 1)
- Aho, Hopcroft & Ullman, *Data Structures and Algorithms*, §4.4 (a linked-list implementation of sets)
- [Merge algorithm (Wikipedia)](https://en.wikipedia.org/wiki/Merge_algorithm)
