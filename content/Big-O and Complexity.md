---
category: foundations
level: fundamentals
step: 2
summary: "Big-O describes how an algorithm's running time or memory grows as the input grows. Six shorthand rules from your handout let you read the Big-O of most C functions straight off the loops."
tags: [cis-2101, big-o, complexity, foundations]
course: CIS-2101 Data Structures
updated: 2026-09-28
---

> [!goal] By the end of this note you can
> - Apply the six Big-O shorthands from your handout to real C code.
> - Tell O(1), O(log n), O(n), O(n log n) and O(n²) apart by looking at loop shapes.
> - Reason about **space** complexity, which decides between bit vectors and lists later.

## What Big-O measures

Big-O answers one question: **as the input size `n` grows, how fast does the work grow?** It ignores the speed of your laptop and the exact number of instructions. It keeps only the growth *shape*.

Formally, `f(n) = O(g(n))` means that for large enough `n`, `f(n)` is at most a constant times `g(n)`. In practice you'll almost never use the formal definition. You'll use the shorthands.

## The six shorthands (from your handout)

1. **Constants don't matter.** `O(2n)` → `O(n)`, `O(500)` → `O(1)`.
2. **Smaller terms don't matter.** `O(n² + 3n + 1)` → `O(n²)`.
3. **Arithmetic is constant time.** `a + b`, `x % 10`, `x << 3` are all O(1).
4. **Variable assignment is constant.**
5. **Array element access is constant.** `arr[i]` is O(1) no matter how big the array is.
6. **Loop length × work inside the loop.** A loop that runs `n` times doing O(1) work is O(n). Nest it inside another `n`-loop and you get O(n²).

## The classes you'll meet in this course

| Big-O | Name | Where it shows up here | n = 1,000 → steps |
|---|---|---|---|
| O(1) | constant | bit-vector `member`, hash lookup (average) | 1 |
| O(log n) | logarithmic | binary search, heap `insert` / `deletemin` | ~10 |
| O(n) | linear | linked-list search, bit-vector union over an array | 1,000 |
| O(n log n) | linearithmic | heap sort | ~10,000 |
| O(n²) | quadratic | union of two **unsorted** lists | 1,000,000 |

The jump from O(n) to O(n²) is the difference between instant and noticeable. From O(n) to O(log n) is the difference between searching a phone book page by page and opening it in the middle.

## Reading Big-O off real code

### O(1): no loop that depends on n

```c
int getThird(int arr[], int n) {
    return (n >= 3) ? arr[2] : -1;   /* one comparison, one access */
}
```

### O(n): one pass

```c
int linearSearch(int arr[], int n, int key) {
    for (int i = 0; i < n; i++)        /* runs up to n times */
        if (arr[i] == key) return i;   /* O(1) work each time */
    return -1;
}
```

### O(log n): the search space halves every step

```c
int binarySearch(int arr[], int n, int key) {   /* arr must be sorted */
    int lo = 0, hi = n - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;           /* avoids int overflow */
        if (arr[mid] == key) return mid;
        if (arr[mid] < key) lo = mid + 1;
        else                hi = mid - 1;
    }
    return -1;
}
```

After 1 step there are n/2 candidates left, after 2 steps n/4, … after k steps n/2ᵏ. It stops when n/2ᵏ = 1, so k = log₂ n.

### O(n²): a loop inside a loop

```c title="duplicates.c" {3-5}
int countDuplicatePairs(int arr[], int n) {
    int pairs = 0;
    for (int i = 0; i < n; i++)
        for (int j = i + 1; j < n; j++)
            if (arr[i] == arr[j]) pairs++;
    return pairs;
}
```

The inner loop runs n−1, then n−2, … then 0 times. That sum is n(n−1)/2 = ½n² − ½n. Drop the constant and the smaller term: **O(n²)**.

## Best, average and worst case

The same function can have different costs depending on the input.

| `linearSearch` | When | Cost |
|---|---|---|
| Best case | key is at `arr[0]` | O(1) |
| Worst case | key is last or missing | O(n) |
| Average case | key equally likely anywhere | ~n/2 → O(n) |

Hash tables are the famous example: **O(1) on average, O(n) in the worst case**. Keep both numbers in mind; exams ask for both.

## Space complexity

Big-O applies to memory too. This matters in the Set unit:

| Set of `n` elements drawn from universe U = {0 … N−1} | Memory |
|---|---|
| Linked list | O(n): one node per element |
| Bit vector | O(N): one bit per *possible* element, even if the set is empty |

A bit vector for students' IDs 0…9,999,999 needs 10 million bits (~1.2 MB) *per set*, even if it holds five students. A list of five students needs five nodes. Neither is "better". It depends on N versus n.

## Practice

**Basic.** What's the Big-O of each?

```c
/* (a) */ for (int i = 0; i < n; i += 2) sum += arr[i];
/* (b) */ for (int i = 0; i < 100; i++) sum += arr[i % n];
/* (c) */ for (int i = 1; i < n; i *= 2) sum++;
```

> [!answer]- Answers
> (a) O(n): n/2 iterations, constants drop.
> (b) O(1): always exactly 100 iterations, whatever `n` is.
> (c) O(log n): `i` doubles, so the loop runs about log₂ n times.

**Intermediate.** Two sets are stored as **unsorted** arrays of sizes n and m. The simplest union copies A, then for each element of B checks whether it's already in the result. What's the cost?

> [!answer]- Answer
> For each of the m elements of B you scan up to n + m result elements: O(m · (n + m)), which is O(n²) when the sizes are similar. You'll see in [[List-Based Sets]] how keeping the lists **sorted** brings this down to O(n + m).

**Advanced.** A loop runs `n` times and each iteration calls `binarySearch` on an array of size `n`. Big-O? And what if the loop instead inserts into a sorted array, shifting elements each time?

> [!answer]- Answer
> n × O(log n) = **O(n log n)**. Inserting into a sorted array costs O(n) per insert (shifting), so n inserts = **O(n²)**.

## Next

Bit-vector sets are built from single bits, so first: [[Bitwise Operations in C]].

## References

- Course handout: `02 Big O Notation.pdf` (the six shorthands)
- [Big O notation (Wikipedia)](https://en.wikipedia.org/wiki/Big_O_notation)
- Aho, Hopcroft & Ullman, *Data Structures and Algorithms*, ch. 1.4–1.5 (running time of programs)
