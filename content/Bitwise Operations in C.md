---
category: foundations
level: basic
step: 3
summary: "Binary, masks, and the six bitwise operators (& | ^ ~ << >>), plus the four idioms (set, clear, toggle, test a bit) that every bit-vector set is built from."
tags: [cis-2101, bitwise, binary, c, foundations]
course: CIS-2101 Data Structures
updated: 2026-09-28
---

> [!goal] By the end of this note you can
> - Convert between decimal, binary, and hex for 8-bit values in your head.
> - Predict the result of `&`, `|`, `^`, `~`, `<<`, `>>` on unsigned values.
> - Build a mask with `1u << k` and use it to **set, clear, toggle and test** one bit.
> - Avoid the classic bugs: signed shifts, shifting too far, `~` promotion, and precedence.

## 1. Binary in five minutes

A byte is 8 bits. Bit `k` has **place value 2ᵏ**, and bit 0 is the rightmost (least significant).

| Bit position | 7 | 6 | 5 | 4 | 3 | 2 | 1 | 0 |
|---|---|---|---|---|---|---|---|---|
| Place value | 128 | 64 | 32 | 16 | 8 | 4 | 2 | 1 |
| `45` in binary | 0 | 0 | 1 | 0 | 1 | 1 | 0 | 1 |

45 = 32 + 8 + 4 + 1, so `45 = 0b00101101`.

**Hex** is shorthand for binary: each hex digit is exactly 4 bits. `0010 1101` → `2` `D` → `0x2D`. That's why printing bit patterns in groups of 4 is easier to read.

**How many bits does a type have?** Use `sizeof`, which counts bytes: `8 * sizeof(unsigned char)` is 8, and `8 * sizeof(unsigned int)` is 32 on most machines, but never assume. (`CHAR_BIT` from `<limits.h>` is the exact bits-per-byte.)

> [!tip] Use unsigned types for bits
> Every bit-manipulation example here uses `unsigned char` or `unsigned int`. Signed types have a sign bit, and shifting or inverting them hits implementation-defined or undefined behaviour (section 4).

## 2. The six operators

Examples use `a = 0b00101101` (45) and `b = 0b00001111` (15).

| Operator | Name | Rule per bit | `a op b` | Result |
|---|---|---|---|---|
| `a & b` | AND | 1 only if **both** are 1 | `00101101 & 00001111` | `00001101` (13) |
| `a \| b` | OR | 1 if **either** is 1 | `00101101 \| 00001111` | `00101111` (47) |
| `a ^ b` | XOR | 1 if they **differ** | `00101101 ^ 00001111` | `00100010` (34) |
| `~b` | NOT | flip every bit | `~00001111` | `11110000` (240, as a byte) |
| `a << 2` | left shift | move bits left, fill with 0 | `00101101 << 2` | `10110100` (180) |
| `a >> 2` | right shift | move bits right, fill with 0 (unsigned) | `00101101 >> 2` | `00001011` (11) |

Shifting left by 1 multiplies by 2; shifting right by 1 divides by 2 (unsigned, rounding down).

## 3. Masks and the four idioms

A **mask** is a value with 1s exactly where you want to act. The mask for bit `k` is `1u << k`:

```
k = 0 → 00000001      k = 3 → 00001000      k = 7 → 10000000
```

With a mask, four one-liners cover everything:

| Goal | Idiom | Why it works |
|---|---|---|
| **Set** bit k (make it 1) | `x \|= (1u << k);` | OR with 1 forces 1; OR with 0 changes nothing |
| **Clear** bit k (make it 0) | `x &= ~(1u << k);` | the inverted mask is 0 only at k; AND with 0 forces 0 |
| **Toggle** bit k | `x ^= (1u << k);` | XOR with 1 flips; XOR with 0 keeps |
| **Test** bit k | `(x & (1u << k)) != 0` | everything except bit k is masked away |

### Worked example: file permissions

Here's a complete program on a problem that isn't a course exercise: Unix-style permission flags packed into one byte.

```c title="permissions.c"
#include <stdio.h>

/* One bit per permission. Named masks beat magic numbers. */
#define PERM_READ   (1u << 2)   /* 100 */
#define PERM_WRITE  (1u << 1)   /* 010 */
#define PERM_EXEC   (1u << 0)   /* 001 */

typedef unsigned char Perms;

void describe(const char *who, Perms p) {
    printf("%-6s %c%c%c  (value %u)\n", who,
           (p & PERM_READ)  ? 'r' : '-',
           (p & PERM_WRITE) ? 'w' : '-',
           (p & PERM_EXEC)  ? 'x' : '-',
           (unsigned)p);
}

int main(void) {
    Perms owner = 0;

    owner |= PERM_READ | PERM_WRITE;     /* set two bits at once   */
    describe("owner", owner);            /* rw-  (value 6)         */

    owner |= PERM_EXEC;                  /* set                    */
    owner &= (Perms)~PERM_WRITE;         /* clear                  */
    describe("owner", owner);            /* r-x  (value 5)         */

    owner ^= PERM_WRITE;                 /* toggle: now it's back  */
    describe("owner", owner);            /* rwx  (value 7)         */

    Perms group = PERM_READ | PERM_EXEC;
    describe("both",  owner & group);    /* AND: permissions they share    */
    describe("either", owner | group);   /* OR: permissions either one has */
    return 0;
}
```

Look at the last two lines: `&` gives what two permission sets **have in common** and `|` gives **everything either has**. That's intersection and union. Bit vectors turn set operations into single instructions, which is the whole point of the next unit.

## 4. The bugs everyone hits once

> [!danger] Shifting by too much is undefined behaviour
> In C, `x << k` is undefined if `k` is negative or ≥ the width of the (promoted) type. `1u << 32` on a 32-bit `unsigned int` is **not** 0. It's UB, and on x86 it often produces 1. Always range-check `k` before shifting. This is exactly why the ADT Guide's checklist starts with a *safety check*.

**`1 << 31` vs `1u << 31`.** `1` is a signed `int`. Shifting a 1 into the sign bit is undefined. Write `1u` (unsigned) whenever you build masks.

**`~` promotes to `int`.** In `unsigned char m = 0x0F;`, the expression `~m` is an **int** with value `-16` (`0xFFFFFFF0`), not `0xF0`. Assigning it back to an `unsigned char` truncates it to `0xF0`, which is fine, but comparing is not:

```c
unsigned char m = 0x0F;
if (~m == 0xF0) { /* never true: -16 != 240 */ }
if ((unsigned char)~m == 0xF0) { /* true */ }
```

**Precedence.** `==` binds tighter than `&`:

```c
if (x & 1 == 0)     /* parsed as x & (1 == 0) → x & 0 → always false */
if ((x & 1) == 0)   /* what you meant: "x is even" */
```

**`&` is not `&&`.** `6 && 1` is 1 (both non-zero). `6 & 1` is 0 (no common bits).

## 5. Practice

**Basic.** Let `unsigned char x = 0b01010010;` (82). Evaluate each, in binary and decimal.

1. `x | (1u << 0)`
2. `x & ~(1u << 6)`
3. `x ^ 0xFF`
4. `(x >> 4) & 0x0F`

> [!answer]- Answers
> 1. `01010011` = 83 (bit 0 set)
> 2. `00010010` = 18 (bit 6 cleared)
> 3. `10101101` = 173 (every bit flipped)
> 4. `00000101` = 5 (the high nibble moved down)

**Intermediate: find the bug.**

```c
int isBitSet(unsigned int x, int k) {
    return x & 1 << k == 1;
}
```

> [!answer]- Answer
> Two problems. Precedence first: `<<` binds tighter than `==`, which binds tighter than `&`, so this is `x & ((1 << k) == 1)`. Second, even with correct parentheses, `(x & (1u << k))` equals `1u << k`, not `1`, whenever k > 0. Write `return (x & (1u << k)) != 0;` and add a range check on `k`.

**Advanced: the bit-pattern exercise.** Your *Computer Word* handout asks for a function that displays the bit pattern of an integer. It must use only shift and bitwise operators, stay platform-independent with `sizeof`, use no arrays, and group the bits in fours. That one's yours to write. Some nudges:

> [!hint]- Hint 1: where to start
> The first bit you print is the *most significant* one. Its position is `8 * sizeof(x) - 1`. Loop down from there to 0.

> [!hint]- Hint 2: testing each bit
> For position `i`, you already know the idiom: build a mask and AND it with `x`. Which operator gives you the mask without an array?

> [!hint]- Hint 3: grouping by four
> You want a space *after* positions 12, 8, 4 (for 16 bits), but not after the last one. What's true about `i` at those points?

> [!hint]- Hint 4: testing your function
> Check it against values you can verify by hand: 0, 1, 45 (`0010 1101` in the low byte), 255, and the largest value of the type.

## Next

You have the tools. Now the ADT they're built for: [[ADT Set]].

## References

- Course handout: *Computer Word* (bit-pattern exercise, computer-word sets)
- [SEI CERT C INT34-C: Do not shift by a negative number of bits or ≥ the operand width](https://wiki.sei.cmu.edu/confluence/display/c/INT34-C.+Do+not+shift+an+expression+by+a+negative+number+of+bits+or+by+greater+than+or+equal+to+the+number+of+bits+that+exist+in+the+operand)
- [Arithmetic and bitwise operators (cppreference, C)](https://en.cppreference.com/w/c/language/operator_arithmetic)
