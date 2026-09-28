---
category: foundations
level: basic
step: 3
summary: "See how a Boolean array becomes a packed word: read binary positions, build masks, trace each operation, and avoid C's shift and promotion traps."
tags: [cis-2101, bitwise, binary, c, foundations]
course: CIS-2101 Data Structures
updated: 2026-09-28
---

> [!goal] After this lesson
> You can read an 8-bit drawing, build a mask for an element, trace AND/OR/XOR/NOT, translate set operations into word operations, and explain when the packed representation is useful.

## 1. Why bits belong in a data structures course

Aho's Chapter 4 §4.3 represents a set as a Boolean array: **slot `i` is true exactly when `i` is a member**. If the universe is small enough to fit in a computer word, the same yes/no values can be packed into individual bits, allowing union, intersection, and difference to act on the whole word at once (supplied PDF pp. 140–143).

There are two layers here:

| Representation | What `A[3]` means | Storage for 8 possible IDs |
|---|---|---|
| `int A[8]` | The fourth **integer cell** is 0 or 1. | Typically 32 bytes if `int` is 4 bytes. |
| `bool A[8]` | The fourth **Boolean cell** is false or true. | Typically 8 bytes if `bool` is 1 byte. |
| One 8-bit word | **Bit 3** of a single word is 0 or 1. | 1 byte on an 8-bit-byte machine. |

The first two are **arrays of cells**; the last is **one packed value**. `A[i] || B[i]` makes sense for cell arrays. `A | B` combines the bits of packed words. This distinction explains the `int SET[MAX]` whiteboard in [[Bit-Vector Union (Lecture)]].

> [!question]- What would change if the universe grew to 100 IDs?
> One 8-bit word would not be enough. You could use an array of several unsigned words, with each ID mapped to a word index and a bit position, or use a different data structure. The model stays a Set; the representation changes.

## 2. Read a word from right to left

The following is an **8-bit drawing**. C's byte size is given by `CHAR_BIT` in `<limits.h>`; do not assume every C implementation has 8-bit bytes.

```text
bit position   7  6  5  4  3  2  1  0
place value  128 64 32 16  8  4  2  1
value 45      0  0  1  0  1  1  0  1
              └────── 32 + 8 + 4 + 1 = 45
```

So the low eight bits of `45` are `0010 1101`. Four bits form a hexadecimal digit: `0010` is `2`; `1101` is `D`; therefore the value is `0x2D`.

**As a set:** if bit `i` says whether ID `i` is present, `0x2D` represents `{0, 2, 3, 5}`. The bit position is the **element**, while the power of two is the bit's **numeric contribution**. Confusing those two is a common source of mistakes.

## 3. Build one mask

A **mask** selects the bit you want. `1u << k` starts with bit 0 set and shifts it to bit `k`:

```text
k = 0:  0000 0001
k = 3:  0000 1000
k = 5:  0010 0000
```

The `u` makes the left operand unsigned. For a valid shift count, this is the value `2^k`. Use `unsigned` values for the packed word too.

> [!warning] Check a variable bit position *before* shifting
> A negative shift count, or a count at least as large as the promoted left operand's width, gives undefined behavior in C. `1u << 32` is not safe just because your machine has a 32-bit `unsigned int`. All fixed positions below are small and valid; a function accepting arbitrary IDs must check its range first.

## 4. Learn four operations by tracing one bit

Start with `x = 0010 1101` (45). Each row applies to the result of the previous row.

| Goal | Expression | Trace of the low 8 bits | Decimal |
|---|---|---|---:|
| Set bit 4 | `x |= 1u << 4` | `0010 1101 \| 0001 0000 = 0011 1101` | 61 |
| Clear bit 3 | `x &= ~(1u << 3)` | `0011 1101 & 1111 0111 = 0011 0101` | 53 |
| Toggle bit 0 | `x ^= 1u << 0` | `0011 0101 ^ 0000 0001 = 0011 0100` | 52 |
| Test bit 2 | `(x & (1u << 2)) != 0` | `0011 0100 & 0000 0100 = 0000 0100` | true |

```text
SET:     0 | 1 = 1      CLEAR: 1 & 0 = 0
TOGGLE:  1 ^ 1 = 0      TEST:  1 & 1 = 1
```

`~mask` has many leading 1s in an `unsigned int`; the table shows only the low eight, because those are the positions we are tracking.

## 5. Run an original example: sensor status flags

This example is about device status, not a course Set exercise. It uses known-safe bit positions and prints the result of the trace above.

```c title="sensor_flags.c"
#include <stdbool.h>
#include <stdio.h>

enum { STATUS_READY = 2, STATUS_ALERT = 3, STATUS_LOGGING = 4 };

int main(void) {
    unsigned int flags = 0x2Du;                /* low 8 bits: 0010 1101 */

    flags |= 1u << STATUS_LOGGING;             /* set bit 4  -> 61 */
    flags &= ~(1u << STATUS_ALERT);            /* clear bit 3 -> 53 */
    flags ^= 1u << 0;                          /* toggle bit 0 -> 52 */

    bool ready = (flags & (1u << STATUS_READY)) != 0;
    printf("value=%u ready=%s\n", flags, ready ? "yes" : "no");
    return 0;
}
```

Compile **from the directory containing `sensor_flags.c`**:

```bash
cc -std=c11 -Wall -Wextra -Wpedantic sensor_flags.c -o sensor_flags
./sensor_flags
```

Expected output: `value=52 ready=yes`.

## 6. Connect bitwise logic to set logic

Let `A = {0, 2, 5}` and `B = {2, 3, 7}`. As low eight bits:

```text
position   7 6 5 4 3 2 1 0
A         0 0 1 0 0 1 0 1   = 0x25
B         1 0 0 0 1 1 0 0   = 0x8C
OR        1 0 1 0 1 1 0 1   = 0xAD  union
AND       0 0 0 0 0 1 0 0   = 0x04  intersection
A & ~B    0 0 1 0 0 0 0 1   = 0x21  A minus B
```

**Explain, do not memorize:** an element belongs to `A ∪ B` when it appears in **either** set, so OR is the right rule. It belongs to `A ∩ B` when it appears in **both**, so AND fits. It belongs to `A − B` when it is in A **and not** B.

> [!important] `|` and `||` answer different questions
> `A | B` combines corresponding bits of packed words. `A || B` reduces each *whole operand* to one truth value: with two nonzero words, the result is simply `1`, losing almost all membership information. For `int A[8]` and `int B[8]` whose cells are constrained to 0 or 1, `A[i] || B[i]` correctly computes one result cell at a time.

## 7. C traps worth recognizing

**Precedence:** `==` binds tighter than `&`. Write `(x & mask) == 0`, not `x & mask == 0`.

**Promotion:** a small `unsigned char` is commonly promoted to `int` before `~`. Do not expect `~byte` to be automatically limited to eight bits. If the intended result is stored back in an 8-bit byte, cast after complementing or apply an 8-bit mask. In a general program, use `CHAR_BIT` rather than assuming eight.

**Signed shifts:** build masks from `1u`, not signed `1`. Check an arbitrary `k` before shifting.

**Outside the universe:** element `k` is not valid just because you can form `1u << k`. Your ADT contract still decides which elements exist; storage width and universe size are different concepts.

## 8. Reasoning practice

**A. Predict.** With `x = 0x2D`, what is `(x & (1u << 4)) != 0`? Which bit in the diagram proves it?

> [!answer]- Check
> False. Position 4 is 0 in `0010 1101`; ANDing with `0001 0000` gives 0.

**B. Debug.** Why can this function give the wrong answer even for a valid `k`?

```c
int is_set(unsigned int x, unsigned int k) {
    return x & 1u << k == 1u;
}
```

> [!hint]- First inspect precedence
> `<<` happens before `==`, and `==` happens before `&`. Add parentheses to expose what the compiler actually evaluates. Then ask whether a nonzero mask result must equal the number 1.

> [!answer]- Check
> It parses as `x & ((1u << k) == 1u)`. For most `k`, that comparison is false, so the function tests `x & 0`. Even after fixing parentheses, the selected bit yields `2^k`, not always 1. The meaningful test is `(x & (1u << k)) != 0`, *after* checking that `k` is in range.

**C. Choose a representation.** A set has five active device IDs, but any ID from 0 to 10 million is possible. Would one packed bit per possible ID be sensible? What if union is performed millions of times on dense sets?

> [!answer]- Reasoning path
> A packed vector needs about 10 million bits (roughly 1.25 MB) per set, even for five active IDs. A sparse representation is attractive for the first workload. If sets are dense and whole-set operations dominate, sequential word operations become attractive. Account for *both* the domain size and the workload.

**D. Your course's bit-pattern exercise.** The *Computer Word* handout asks you to print a value's bits. First write down the highest bit position using `CHAR_BIT` and `sizeof`, then decide how to move from it toward bit 0. Test 0, 1, and 45 by hand. Keep the implementation yours.

## Next

[[ADT Set]] introduces the abstract operations. [[Bit-Vector Sets]] and [[Bit-Vector Union (Lecture)]] show the Boolean-array and packed-word representations in context.

## Source map

- Aho, Hopcroft & Ullman, *Data Structures and Algorithms* (1983), Chapter 4 §4.3: Boolean-array bit vectors, constant-time direct membership, whole-set operations proportional to universe size, and the one-word case (supplied PDF pp. 140–143). The C masks and sensor example here are an original translation and extension.
- Course handout: *Computer Word* (bit-pattern exercise and one-word sets).
- [WG14 C11 draft N1570, §§6.5.3.3 and 6.5.7–6.5.14](https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf): promotions, shift counts, bitwise operators, and logical operators. This is the language-rule source for the C-specific cautions above.
