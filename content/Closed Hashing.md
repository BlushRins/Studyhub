---
category: adt-dictionary
level: intermediate
step: 11
summary: "Closed (internal) hashing stores every element in one fixed array. On a collision, linear hashing tries the next slot, (H(x) + i) % MAX. Covers EMPTY vs DELETED, synonyms and displacement, clustering, quadratic and double hashing, and average search length."
tags: [cis-2101, adt-dictionary, hashing, closed-hashing, linear-probing, week-9]
course: CIS-2101 Data Structures
updated: 2026-09-28
---

> [!goal] By the end of this note you can
> - Trace inserts, searches and deletes with linear hashing, `Hᵢ(x) = (H(x) + i) % MAX`.
> - Explain why deletion must write **DELETED**, never EMPTY, and prove it with a counterexample.
> - Use the handout's terms correctly: synonyms, collision, displacement, packing density.
> - Compute search lengths and the average search length of a table.

> [!warning] Graded work: you write `insert`, `delete` and `member`
> Your *Closed Hashing* handout's Practice Exercise 1 (the character Dictionary with EMPTY and DELETED, `initDictionary`, `insert`, `delete`, `member`) and its search-length challenge are yours. This note gives the rules, pseudocode and fully worked traces on **integer** keys.

## 1. One array, no lists

Closed hashing, also called **internal hashing** or **open addressing** (yes, the names cross over; see the table), keeps every element **inside the array itself**.

| | Open hashing (external) | Closed hashing (internal) |
|---|---|---|
| Other names | separate chaining | open addressing |
| Storage | array of lists; potentially unlimited | one fixed array; **limits the size of the set** |
| Array size | number of groups | **≥ number of elements** |
| `H(x)` gives | the group x belongs to | the **exact slot**, or where to **start searching** |

Your handout's rule of thumb: keep the **packing density** (load factor) α = n / MAX at or below **80%**. [[Hash Table Performance]] shows why.

## 2. Linear hashing

If x's home slot `H(x)` is taken, try the next one, and the next, wrapping around the end of the array like a circular queue:

```text
H₀(x) = H(x)
Hᵢ(x) = (H(x) + i) % MAX        for i = 1, 2, …, MAX − 1
```

### Terms from your handout

| Term | Meaning |
|---|---|
| **Synonyms** | elements with the same hash value (e.g. 23, 43, 13 when H = x % 10) |
| **Collision** | trying to insert x at `H(x)` and finding the slot occupied |
| **Displacement** | x can't use its home slot because a **non-synonym** is sitting there: someone who was pushed there by their own collision |

## 3. Full trace

MAX = 10, `H(x) = x % 10`. Insert 23, 43, 13, 27, 37, 9, 19.

| Insert | H(x) | Probes (slots tried) | Stored at | Note |
|---|---|---|---|---|
| 23 | 3 | 3 | **3** | home slot free |
| 43 | 3 | 3 ✗, 4 | **4** | collision with its synonym 23 |
| 13 | 3 | 3 ✗, 4 ✗, 5 | **5** | two collisions |
| 27 | 7 | 7 | **7** | |
| 37 | 7 | 7 ✗, 8 | **8** | |
| 9 | 9 | 9 | **9** | |
| 19 | 9 | 9 ✗, **0** | **0** | wraps around: (9 + 1) % 10 = 0 |

Final table:

| Slot | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
|---|---|---|---|---|---|---|---|---|---|---|
| Element | 19 | · | · | 23 | 43 | 13 | · | 27 | 37 | 9 |

(· = EMPTY.) Now insert 6: `H(6) = 6`, free, so it goes straight in. Then insert 34: `H(34) = 4`, but slot 4 holds 43, a **non-synonym** of 34 (43 hashes to 3). That's **displacement**: 34 lost its home slot to an element that only ended up there because of its own collision.

## 4. Searching, and when to stop

Probe from `H(x)` exactly as insert did. You stop when:

1. you find x → **found**;
2. you reach an **EMPTY** slot → **not found**, because x would have been placed here or earlier;
3. you've tried all MAX slots → **not found** (the table is full).

`member(33)` on the table above: slot 3 (23), 4 (43), 5 (13), 6 EMPTY → not found after **4 probes**.

## 5. Deletion: why DELETED exists

Delete 43 from the table (slot 4), and suppose we simply write EMPTY there:

| Slot | 3 | 4 | 5 |
|---|---|---|---|
| Element | 23 | **EMPTY** | 13 |

Now search for 13: slot 3 (23, not it), slot 4 is **EMPTY**, stop → *"13 is not in the dictionary."* **Wrong.** 13 is sitting in slot 5. The empty slot broke the probe chain that led to it.

The fix is a third state, a **DELETED** marker (a tombstone):

| Slot state | During search | During insert |
|---|---|---|
| EMPTY | **stop**: not found | can store here |
| DELETED | **keep going**: something may lie beyond | can store here (reuse it) |
| occupied | compare, then keep going | keep going |

With slot 4 = DELETED, `member(13)` probes 3 → 4 (DELETED, continue) → 5 found, in **3 probes**.

> [!note] EMPTY and DELETED must not be valid elements
> Your handout suggests characters like `*` or `#` for a character dictionary: values of the right type that can never be real elements. For non-negative integers, `-1` and `-2` work.

### The rules as pseudocode

```text
member(x, D):
    for i in 0 … MAX−1:
        slot = (H(x) + i) % MAX
        if D[slot] == EMPTY:  return FALSE
        if D[slot] == x:      return TRUE
        -- DELETED or another element: keep probing
    return FALSE

insert(x, D):
    if member(x, D): return                  -- no duplicates
    for i in 0 … MAX−1:
        slot = (H(x) + i) % MAX
        if D[slot] is EMPTY or DELETED:
            D[slot] = x; return
    -- table full: report it

delete(x, D):
    find x exactly as member does
    if found: D[slot] = DELETED
```

> [!question] Why check `member` first in insert?
> If x is already stored *beyond* a DELETED slot and you insert at the first free slot you see, you've created a duplicate. Checking first (or scanning until EMPTY while remembering the first DELETED slot) prevents that.

## 6. Clustering, and better probe sequences

Linear hashing's weakness is **primary clustering**: occupied slots form long runs, and any key that hashes *anywhere* into a run lands at its end and makes it longer. Slots 3–5 and 7–9 in the trace are small clusters already.

| Strategy | i-th probe | Fixes | Watch out for |
|---|---|---|---|
| Linear | `(H(x) + i) % MAX` | — | primary clustering |
| Quadratic | `(H(x) + i²) % MAX` | jumps away from runs | may not reach every slot; use a prime MAX and α ≤ 0.5 |
| Double hashing | `(H₁(x) + i·H₂(x)) % MAX` | different keys take different step sizes | `H₂(x)` must never be 0; MAX prime |

A common second hash: `H₂(x) = 7 − (x % 7)`, which is always 1 … 7, never 0.

## 7. Search length and average search length

Your handout's research topic: the **search length** of a stored element is how many probes it takes to find it. The **average search length (ASL)** is the average over all elements.

From the trace, for elements whose slot is **at or after** their home slot:

**search length = (slot − H(x)) + 1**

| Element | H(x) | Slot | Search length |
|---|---|---|---|
| 23 | 3 | 3 | 1 |
| 43 | 3 | 4 | 2 |
| 13 | 3 | 5 | 3 |
| 27 | 7 | 7 | 1 |
| 37 | 7 | 8 | 2 |
| 9 | 9 | 9 | 1 |
| 19 | 9 | **0** | ? |

19 wrapped: its slot (0) is *less* than its home (9), so the formula gives −8, which is nonsense. From the probe list you know the real answer is 2 (slots 9, 0).

> [!hint]- Challenge hint: one formula for both cases
> The handout asks for a formula that works whether or not the element wrapped. The wrap-around comes from the `% MAX` in the probe sequence. Could the same operator help when you compute the distance from home to slot? Test your idea on 19 (wrapped) and 43 (not wrapped).

With 19's search length included, ASL = (1 + 2 + 3 + 1 + 2 + 1 + 2) / 7 = 12 / 7 ≈ **1.71 probes**.

## 8. A table printer for debugging

When you write your own `insert` and `delete`, being able to *see* the table saves hours. This works for any integer table that uses −1 for EMPTY and −2 for DELETED:

```c title="print_table.c"
#include <stdio.h>

#define MAX     10
#define EMPTY   (-1)
#define DELETED (-2)

/* Prints slot, content, and each element's home slot, e.g. " 4 |  43  (home 3, moved)". */
void printTable(const int T[], int (*hash)(int)) {
    for (int i = 0; i < MAX; i++) {
        printf("%2d | ", i);
        if (T[i] == EMPTY)        printf("  .\n");
        else if (T[i] == DELETED) printf("DEL\n");
        else {
            int home = hash(T[i]);
            printf("%3d  (home %d%s)\n", T[i], home, home == i ? "" : ", moved");
        }
    }
}

static int h(int x) { return x % MAX; }

int main(void) {
    int T[MAX] = {19, EMPTY, EMPTY, 23, DELETED, 13, EMPTY, 27, 37, 9};
    printTable(T, h);
    return 0;
}
```

## 9. Practice

**Basic.** MAX = 11, `H(x) = x % 11`, linear hashing. Insert 22, 1, 13, 11, 24, 33. Give the final table.

> [!answer]- Answer
> 22→0 (slot 0). 1→1 (slot 1). 13→2 (slot 2). 11→0: 0, 1, 2 taken → slot 3. 24→2: 2, 3 taken → slot 4. 33→0: 0–4 taken → slot 5.
> Table: `[22, 1, 13, 11, 24, 33, ·, ·, ·, ·, ·]`: one big cluster from a bad mix of keys.

**Intermediate.** In that table, delete 13 (mark DELETED), then search for 24. List the slots probed. What would go wrong if 13's slot were set to EMPTY?

> [!answer]- Answer
> H(24) = 2 → slot 2 DELETED (continue) → slot 3 (11) → slot 4 (24) found: 3 probes. With EMPTY at slot 2, the search would stop immediately and wrongly report 24 as missing.

**Intermediate.** Why does a closed-hashing insert need to know about DELETED slots, when it could just look for EMPTY ones?

> [!answer]- Answer
> Without reusing DELETED slots, tombstones pile up forever. The table fills with markers, searches get longer, and eventually no EMPTY slots remain even though the dictionary is nearly empty.

**Advanced.** With double hashing `H₁(x) = x % 11`, `H₂(x) = 7 − (x % 7)`, insert 22 then 33 into an empty table of 11. Where does 33 land?

> [!answer]- Answer
> 22 → H₁ = 0 → slot 0. 33 → H₁ = 0 (taken); H₂(33) = 7 − (33 % 7) = 7 − 5 = 2, so the next probe is (0 + 1·2) % 11 = **slot 2**. Linear hashing would have used slot 1.

**Advanced (your exercise): hints for `insert` / `delete` / `member`.**

> [!hint]- Hint: loop bounds
> Loop `i` from 0 while `i < SIZE`, computing the slot as `(H(x) + i) % SIZE`. That bound guarantees termination even when the table is full of DELETED markers.

> [!hint]- Hint: sharing code
> `member` and `delete` walk exactly the same probe sequence with the same stop rule. Some students write one helper that returns the slot index (or −1), then build both on it.

> [!hint]- Hint: test cases that catch the usual bugs
> Insert synonyms until one wraps around the end. Delete an element in the *middle* of a cluster, then search for one after it. Insert a duplicate that sits beyond a DELETED slot. Fill the table completely and try one more insert.

## Next

How fast is "fast", exactly, and what happens as the table fills up? [[Hash Table Performance]].

## References

- Course handout: *Topics: Closed Hashing* (terms, linear hashing formula, packing density, research on perfect hashing and average search length)
- [Open addressing (Wikipedia)](https://en.wikipedia.org/wiki/Open_addressing): linear, quadratic and double hashing
- [Linear probing (Stanford CS166)](https://web.stanford.edu/class/archive/cs/cs166/cs166.1166/lectures/12/Small12.pdf): clustering and Knuth's analysis
- Aho, Hopcroft & Ullman, *Data Structures and Algorithms*, §4.8 (closed hashing)
