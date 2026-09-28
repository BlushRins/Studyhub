---
category: adt-dictionary
level: basic
step: 9
summary: "A hash function turns a key into a bucket number. Good ones are fast, deterministic and spread keys evenly. Covers the division method (your course's last-digit grouping), string hashing, why table sizes should be prime, collisions, and perfect hash functions."
tags: [cis-2101, adt-dictionary, hashing, hash-function, week-8]
course: CIS-2101 Data Structures
updated: 2026-09-28
---

> [!goal] By the end of this note you can
> - Compute hash values with the division method and explain the course's "group by last digit" example.
> - Explain why summing characters is a weak string hash, and what polynomial hashing fixes.
> - Choose a table size, and explain why primes help.
> - Define **synonyms**, **collision**, and **perfect hash function**.

## 1. What a hash function does

A hash function `H(key)` returns an integer in **0 … B−1**, where B is the number of buckets (open hashing) or slots (closed hashing). A good one is:

1. **Deterministic**: the same key always gives the same value. Otherwise you'd never find anything again.
2. **Fast**: O(1), or O(length of the key) for strings.
3. **Uniform**: keys spread evenly across 0 … B−1, so no bucket gets crowded.

The modulo operator `%` does most of the work, as your handout says: `x % B` is always in 0 … B−1 for non-negative x.

## 2. Integer keys: the division method

`H(x) = x % B`

Your *Open Hashing* handout groups integers **by their ones place**, which is `x % 10` with B = 10 groups:

| x | 7 | 12 | 22 | 35 | 41 | 57 | 60 | 92 | 105 |
|---|---|---|---|---|---|---|---|---|---|
| x % 10 | 7 | 2 | 2 | 5 | 1 | 7 | 0 | 2 | 5 |

Group 2 already holds three elements, and groups 3, 4, 6, 8 and 9 are empty. Last-digit grouping is great for learning, because you can hash in your head. But real data is often **not uniform in its last digit**: prices end in 0, 5 or 9, and years in a decade share leading digits. Everything piles into a few buckets.

> [!tip] Make B a prime
> If keys share a common factor with B, they only ever land in the buckets that are multiples of that factor. With B = 10, keys that are all multiples of 5 use just buckets 0 and 5. A **prime** B (say 11 or 13) shares no factor with most key patterns, so it spreads them better. Also avoid B = a power of 2: then `x % B` just keeps the lowest bits and ignores the rest of the key.

Other integer methods you might see: **mid-square** (square the key, take middle digits), **folding** (split the key into parts and add them), and **multiplication** (`floor(B × frac(x × A))` with A ≈ 0.618…, Knuth's suggestion).

## 3. String keys

Strings have to become a number first. Three common ways, from worst to best:

```c title="hashdemo.c"
#include <stdio.h>

#define BUCKETS 13   /* a prime table size */

/* 1. Add up the character codes. Simple, but anagrams always collide. */
unsigned hashSum(const char *s) {
    unsigned h = 0;
    while (*s) h += (unsigned char)*s++;
    return h % BUCKETS;
}

/* 2. Polynomial (Horner's rule): h = h*31 + c. Order now matters. */
unsigned hashPoly(const char *s) {
    unsigned h = 0;
    while (*s) h = h * 31 + (unsigned char)*s++;
    return h % BUCKETS;
}

/* 3. djb2 (Dan Bernstein): h = h*33 + c, starting from 5381. */
unsigned hashDjb2(const char *s) {
    unsigned h = 5381;
    while (*s) h = ((h << 5) + h) + (unsigned char)*s++;   /* h*33 + c */
    return h % BUCKETS;
}

void histogram(const char *name, unsigned (*hash)(const char *),
               const char *words[], int n) {
    int count[BUCKETS] = {0};
    for (int i = 0; i < n; i++) count[hash(words[i])]++;
    printf("%-5s", name);
    for (int b = 0; b < BUCKETS; b++) printf("%3d", count[b]);
    putchar('\n');
}

int main(void) {
    const char *words[] = {"stop", "pots", "tops", "spot", "opts", "post",
                           "listen", "silent", "enlist", "tinsel",
                           "heap", "hash", "set", "list", "queue", "stack",
                           "tree", "graph", "node", "edge"};
    int n = sizeof words / sizeof words[0];

    printf("     ");
    for (int b = 0; b < BUCKETS; b++) printf("%3d", b);
    printf("   <- bucket\n");
    histogram("sum",  hashSum,  words, n);
    histogram("poly", hashPoly, words, n);
    histogram("djb2", hashDjb2, words, n);
    return 0;
}
```

Real output (gcc, 32-bit `unsigned`):

```text
       0  1  2  3  4  5  6  7  8  9 10 11 12   <- bucket
sum    0  1  2  2  1  4  1  1  0  0  1  1  6
poly   0  1  3  2  0  1  0  2  0  3  4  3  1
djb2   0  1  2  0  1  2  1  1  4  2  3  0  3
```

`hashSum` puts all six anagrams of "stop" in bucket 12 and all four anagrams of "listen" in bucket 5: same letters, same sum. The polynomial hashes treat `"stop"` and `"pots"` as different because each character is multiplied by a different power of 31 (or 33). No bucket gets more than 4.

Why the `unsigned` and the `(unsigned char)` casts? Overflow of *unsigned* arithmetic wraps around, which is well-defined and exactly what we want. Signed overflow is undefined. And `char` may be signed, so bytes ≥ 128 would add negative values.

## 4. Collisions are unavoidable

If there are more possible keys than buckets, some keys **must** share a bucket (the pigeonhole principle). It happens far sooner than intuition says. With 365 buckets (birthdays), 23 random keys give a **50%** chance that two collide. That's the *birthday paradox*.

So the question is never "how do I avoid collisions?". It's **"what do I do when one happens?"** The two answers are the next two notes.

Vocabulary from your *Closed Hashing* handout:

| Term | Meaning | Example (H = x % 10) |
|---|---|---|
| **Synonyms** | two or more keys with the same hash value | 12, 22 and 92 (all hash to 2) |
| **Collision** | inserting a key into a position already occupied | inserting 22 when 12 is already at slot 2 |
| **Displacement** | (closed hashing) a key can't sit at its home slot because a **non-synonym** took it | covered in [[Closed Hashing]] |

## 5. Perfect hash functions

A **perfect hash function** maps a *known, fixed* set of keys with **no collisions at all**. It's one of your handout's research topics.

Example: keys {12, 25, 33, 47}.

- `x % 5` → 2, 0, 3, 2: 12 and 47 collide, so not perfect.
- `x % 6` → 0, 1, 3, 5: all different, so **perfect** for these four keys.

It's **minimal perfect** if the table is exactly as big as the key set (4 slots for 4 keys). `x % 6` uses 6 slots, so it's perfect but not minimal.

Where it's used: sets of keys that never change, like a compiler's reserved words or a fixed product catalogue. Tools such as GNU `gperf` search for a perfect function automatically. It's no help when keys are inserted at runtime, because a new key can break it.

## 6. Practice

**Basic.** With `H(x) = x % 10`, hash {18, 28, 3, 13, 40, 99, 108}. Which keys are synonyms?

> [!answer]- Answer
> 18→8, 28→8, 3→3, 13→3, 40→0, 99→9, 108→8. Synonyms: {18, 28, 108} and {3, 13}.

**Basic.** Compute `hashSum("ab")` and `hashSum("ba")` with B = 13 (`'a'` = 97, `'b'` = 98). Then compute `hashPoly` for both, *before* `% 13`.

> [!answer]- Answer
> Sum: 97 + 98 = 195 → 195 % 13 = 0 for **both**, so they collide. Poly: "ab" = 97·31 + 98 = 3105, "ba" = 98·31 + 97 = 3135, which are different. (3105 % 13 = 11 and 3135 % 13 = 2, so they also land in different buckets.)

**Intermediate.** Keys are student numbers that all end in 00 (1200, 3400, 5600, …). Compare B = 100 with B = 101.

> [!answer]- Answer
> With B = 100, every key has `x % 100 == 0`, so everything goes into bucket 0 and you effectively have a linked list. With B = 101 (prime), 1200 → 89, 3400 → 67, 5600 → 45: spread out. The prime ignores the shared factor of 100.

**Advanced.** Find a perfect hash of the form `x % B` for keys {10, 21, 32, 43} with the smallest possible B. Is it minimal?

> [!hint]- Hint
> Try B = 4, 5, 6, … and check for repeated remainders. The keys go up by 11 each time, so what happens when B divides 11, or doesn't?

> [!answer]- Answer
> B = 4: 10→2, 21→1, 32→0, 43→3, all distinct. **Perfect and minimal** (4 keys, 4 slots). It works because consecutive keys differ by 11, and 11 ≡ 3 (mod 4), which steps through every remainder before repeating.

## Next

Collision strategy #1, where each bucket holds a list: [[Open Hashing]].

## References

- Course handouts: *Open Hashing* (grouping by last digit), *Closed Hashing* (synonyms, collision, displacement; perfect hash function as research)
- [Hash function (Wikipedia)](https://en.wikipedia.org/wiki/Hash_function): division, multiplication and folding methods
- [Birthday problem (Wikipedia)](https://en.wikipedia.org/wiki/Birthday_problem)
- [GNU gperf](https://www.gnu.org/software/gperf/): a perfect hash function generator
