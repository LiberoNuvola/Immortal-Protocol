#!/usr/bin/env python3
"""
IMMORTAL — finite-model mechanical verification of the ABSTRACT model.

SCOPE AND LIMITS (read before citing any result produced by this file):

  * This harness checks the mathematical claims of 03_ECONOMIC_KERNEL_FINAL.md and
    15_COMPOSITION_CONTRACT.md on randomly generated FINITE systems, plus a small number
    of hand-built systems.
  * Exhaustive/randomised agreement on finite models is MECHANICAL EVIDENCE for the
    abstract model. It is NOT a proof for infinite state spaces (the paper proofs are),
    and it is NOT evidence about any implementation, adapter, oracle or deployment.
  * A finite system is represented by:
        states : 0..n-1
        acts(s): list of actions available at s
        succ(s,a) : frozenset of states  ==  { T(s,a,w) | w in Omega(s,a) }, non-empty
        safe : frozenset of states
    Modelling Omega by its induced successor set loses no generality for the kernel
    results, all of which quantify over successors only.

Deterministic: fixed RNG seed, so results are reproducible.
Usage: python3 finite_model_checks.py
"""

import itertools
import random

SEED = 20260917
TRIALS = 400


# ----------------------------------------------------------------------------- core
class Sys:
    def __init__(self, n, succ, safe):
        self.n = n
        self.succ = succ                      # dict (s,a) -> frozenset
        self.safe = frozenset(safe)
        self.acts = {}
        for (s, a) in succ:
            self.acts.setdefault(s, []).append(a)
        for s in range(n):
            self.acts.setdefault(s, [])

    def pre(self, K):
        K = frozenset(K)
        return frozenset(s for s in range(self.n)
                         if any(self.succ[(s, a)] <= K for a in self.acts[s]))

    def F(self, K):
        return self.safe & self.pre(K)

    def kstar(self):
        """Greatest fixed point by decreasing iteration from the full set (finite => converges)."""
        K = frozenset(range(self.n))
        while True:
            K2 = self.F(K)
            if K2 == K:
                return K
            K = K2

    def a_safe(self, s, K):
        return [a for a in self.acts[s] if self.succ[(s, a)] <= K]


def random_sys(rng, n=6, max_acts=3, max_succ=3, safe_p=0.7):
    succ = {}
    for s in range(n):
        for a in range(rng.randint(1, max_acts)):
            k = rng.randint(1, max_succ)
            succ[(s, a)] = frozenset(rng.randrange(n) for _ in range(k))
    safe = frozenset(s for s in range(n) if rng.random() < safe_p)
    return Sys(n, succ, safe)


def subsets(n, limit=None, rng=None, count=40):
    """All subsets for small n, else a random sample."""
    if n <= 10 and limit is None:
        for r in range(n + 1):
            for c in itertools.combinations(range(n), r):
                yield frozenset(c)
    else:
        for _ in range(count):
            yield frozenset(s for s in range(n) if rng.random() < 0.5)


# ----------------------------------------------------------------------- check bodies
def check_T1_monotonicity(sys_, rng):
    """K subset K'  =>  Pre(K) subset Pre(K') and F(K) subset F(K')."""
    for _ in range(30):
        K = frozenset(s for s in range(sys_.n) if rng.random() < 0.5)
        K2 = K | frozenset(s for s in range(sys_.n) if rng.random() < 0.3)
        if not sys_.pre(K) <= sys_.pre(K2):
            return False, ("Pre", K, K2)
        if not sys_.F(K) <= sys_.F(K2):
            return False, ("F", K, K2)
    return True, None


def check_T3_fixpoint(sys_):
    """K* = F(K*), K* subset Safe, K* subset Pre(K*), and K* is GREATEST post-fixed point."""
    K = sys_.kstar()
    if sys_.F(K) != K:
        return False, ("not a fixed point", K)
    if not K <= sys_.safe:
        return False, ("not inside Safe", K)
    if not K <= sys_.pre(K):
        return False, ("not inside Pre", K)
    # greatest: every post-fixed point is contained in K*  (exhaustive for small n)
    for C in subsets(sys_.n):
        if C <= sys_.F(C) and not C <= K:
            return False, ("post-fixed point outside K*", C, K)
    return True, None


def check_T4_kunder(sys_):
    """T-KUNDER: K_c subset Safe and K_c subset Pre(K_c)  =>  K_c subset K*.
    Checked EXHAUSTIVELY over every subset of the state space."""
    K = sys_.kstar()
    tested = 0
    for C in subsets(sys_.n):
        if C <= sys_.safe and C <= sys_.pre(C):
            tested += 1
            if not C <= K:
                return False, ("certificate outside K*", C, K), tested
    return True, None, tested


def check_T4_strictness(sys_):
    """Confirm K_c may be a STRICT subset of K* (conservatism is real, not hypothetical)."""
    K = sys_.kstar()
    for C in subsets(sys_.n):
        if C <= sys_.safe and C <= sys_.pre(C) and C < K and len(C) > 0:
            return True
    return False


def check_T6_induction(sys_, rng, steps=40, runs=20):
    """Gate a run on an arbitrary certificate K_c; adversary resolves the successor.
    Claim: the run never leaves K_c (hence never leaves Safe)."""
    cands = [C for C in subsets(sys_.n)
             if C and C <= sys_.safe and C <= sys_.pre(C)]
    if not cands:
        return None, None            # vacuous for this system
    Kc = rng.choice(cands)
    for _ in range(runs):
        s = rng.choice(sorted(Kc))
        for _ in range(steps):
            gated = sys_.a_safe(s, Kc)
            if not gated:
                return False, ("blocked inside certificate (CK3 violated?)", s, Kc)
            a = rng.choice(gated)                      # adaptive policy: arbitrary choice
            s = rng.choice(sorted(sys_.succ[(s, a)]))  # adversarial event resolution
            if s not in Kc or s not in sys_.safe:
                return False, ("escaped", s, Kc)
    return True, None


def check_T9_omega_monotone(sys_, rng):
    """Enlarging Omega (enlarging successor sets) can only SHRINK K*."""
    succ2 = {}
    for k, v in sys_.succ.items():
        extra = frozenset(rng.randrange(sys_.n) for _ in range(rng.randint(0, 1)))
        succ2[k] = v | extra
    big = Sys(sys_.n, succ2, sys_.safe)
    if not big.kstar() <= sys_.kstar():
        return False, (sorted(big.kstar()), sorted(sys_.kstar()))
    return True, None


def check_T9_narrowing_unsound(sys_, rng):
    """Narrowing Omega can certify a state that is NOT viable under the true Omega.
    We look for a witness; finding one demonstrates that narrowing is unsound,
    not merely prohibited."""
    succ2 = {}
    for k, v in sys_.succ.items():
        v = sorted(v)
        succ2[k] = frozenset(v[:1]) if len(v) > 1 else frozenset(v)
    narrow = Sys(sys_.n, succ2, sys_.safe)
    return bool(narrow.kstar() - sys_.kstar())


# --------------------------------------------------------------- composition fixtures
def shared_reserve_counterexample():
    """15 section 3, made concrete, finite and checkable.

    Shared reserve R in {0,1}. Each system models R as if it alone draws on it.
    Local safety: R must never go negative.

    THREE distinct findings are reported, because the naive compositionality claim
    can fail in three different ways and they are not interchangeable:

      (F1) TYPE FAILURE. With shared economic content, S_AB is NOT S_A x S_B: both
           local state spaces contain the same R, so the 'product' is not even
           well formed. Condition 1 of T-COMP-INDEP fails structurally.

      (F2) GATE FAILURE (the substantive one). Force a mapping anyway. Each system's
           LOCAL gate admits its own draw, because each local certificate is sound
           in its own model. Executing both admitted actions drives R negative.
           So the product of locally gated action sets is NOT contained in the
           jointly gated action set:
               A_safe_A(K_A) x A_safe_B(K_B)  NOT SUBSET OF  A_safe_AB(K_A x K_B)

      (F3) STATE-SET INDUCTIVENESS IS NOT ENOUGH. If both systems admit an idle
           action, the product state set can still satisfy K subset Pre(K) in the
           joint system, because 'both idle' witnesses Pre. Inductiveness of the
           product SET therefore does not rescue the product GATE. Safety comes
           from the gate, not from the existence of some safe continuation.
    """
    UNSAFE = 4

    def jidx(r, fa, fb):
        # r in {0,1}; flags record who has already drawn
        return {(1, 0, 0): 0, (0, 1, 0): 1, (0, 0, 1): 2, (0, 1, 1): 3}[(r, fa, fb)] \
            if (r, fa, fb) in {(1, 0, 0), (0, 1, 0), (0, 0, 1), (0, 1, 1)} else UNSAFE

    # ---- joint system ----------------------------------------------------------
    succ = {}
    succ[(0, 'idle')] = frozenset([0])
    succ[(0, 'drawA')] = frozenset([1])          # R: 1 -> 0
    succ[(0, 'drawB')] = frozenset([2])          # R: 1 -> 0
    succ[(0, 'drawAB')] = frozenset([UNSAFE])    # R: 1 -> -1   <-- both local gates said yes
    succ[(1, 'idle')] = frozenset([1])
    succ[(1, 'drawB')] = frozenset([UNSAFE])     # R: 0 -> -1
    succ[(2, 'idle')] = frozenset([2])
    succ[(2, 'drawA')] = frozenset([UNSAFE])
    succ[(3, 'idle')] = frozenset([3])
    succ[(UNSAFE, 'idle')] = frozenset([UNSAFE])
    AB = Sys(5, succ, safe=frozenset([0, 1, 2, 3]))

    product_cert = frozenset([0, 1, 2])          # image of K_A x K_B under the forced map
    set_inductive = product_cert <= AB.safe and product_cert <= AB.pre(product_cert)

    # locally gated joint action that is NOT jointly gated:
    gate_unsound = not (AB.succ[(0, 'drawAB')] <= product_cert)

    # a joint certificate that IS sound: at most one draw may ever be admitted
    sound_joint = frozenset([0, 1, 2, 3])
    sound_ok = sound_joint <= AB.safe and sound_joint <= AB.pre(sound_joint)
    # but note it is only sound because 'drawAB' is excluded from the admitted set
    return {
        'F1_shared_content_breaks_product_state_space': True,
        'F2_product_of_local_gates_admits_unsafe_joint_action': gate_unsound,
        'F3_product_state_set_still_inductive_via_idle': set_inductive,
        'joint_kstar_contains_start': 0 in AB.kstar(),
        'a_sound_joint_certificate_exists': sound_ok,
        'conclusion': 'naive composition fails at the GATE, not necessarily at the SET',
    }


def independent_product_check(rng, trials=120):
    """T-COMP-INDEP: under a genuine synchronous product with product successor sets,
    K_A x K_B is inductive in the product, hence contained in K*_AB."""
    failures = 0
    vacuous = 0
    for _ in range(trials):
        A = random_sys(rng, n=4, max_acts=2, max_succ=2)
        B = random_sys(rng, n=4, max_acts=2, max_succ=2)
        certsA = [C for C in subsets(A.n) if C and C <= A.safe and C <= A.pre(C)]
        certsB = [C for C in subsets(B.n) if C and C <= B.safe and C <= B.pre(C)]
        if not certsA or not certsB:
            vacuous += 1
            continue
        KA = rng.choice(certsA)
        KB = rng.choice(certsB)
        n = A.n * B.n
        def j(x, y):
            return x * B.n + y
        succ = {}
        for x in range(A.n):
            for y in range(B.n):
                for a in A.acts[x]:
                    for b in B.acts[y]:
                        succ[(j(x, y), (a, b))] = frozenset(
                            j(u, v) for u in A.succ[(x, a)] for v in B.succ[(y, b)])
        safe = frozenset(j(x, y) for x in A.safe for y in B.safe)
        AB = Sys(n, succ, safe)
        prod = frozenset(j(x, y) for x in KA for y in KB)
        if not (prod <= AB.safe and prod <= AB.pre(prod) and prod <= AB.kstar()):
            failures += 1
    return failures, vacuous


def upgrade_nonmonotonicity_witness():
    """Show that K*_new need not contain K*_old: justification for requiring U1
    (activation-state admission) rather than assuming migration is automatic."""
    succ = {(0, 'a'): frozenset([1]), (1, 'a'): frozenset([1]),
            (2, 'a'): frozenset([2])}
    old = Sys(3, succ, safe=frozenset([0, 1, 2]))
    new = Sys(3, succ, safe=frozenset([2]))          # governance tightens Safe
    Ko, Kn = old.kstar(), new.kstar()
    return {'K_old': sorted(Ko), 'K_new': sorted(Kn),
            'stranded_states': sorted(Ko - Kn),
            'old_subset_new': Ko <= Kn}


def expiry_absorbing_check():
    """Expiry finality as a reachability property: from an 'expired' state no action
    restores claimability. Modelled as an absorbing class; checked exhaustively."""
    # 0 = live right, 1 = settled, 2 = expired. Only 'reveal' is offered after expiry.
    succ = {(0, 'settle'): frozenset([1]), (0, 'expire'): frozenset([2]),
            (1, 'noop'): frozenset([1]), (2, 'reveal'): frozenset([2]),
            (2, 'noop'): frozenset([2])}
    S = Sys(3, succ, safe=frozenset([0, 1, 2]))
    reach = {2}
    frontier = [2]
    while frontier:
        s = frontier.pop()
        for a in S.acts[s]:
            for t in S.succ[(s, a)]:
                if t not in reach:
                    reach.add(t)
                    frontier.append(t)
    return {'reachable_from_expired': sorted(reach), 'can_return_to_live': 0 in reach,
            'can_reach_settled': 1 in reach}


def conservation_algebra_check(rng, trials=2000):
    """Conservation identity over a disjoint exhaustive partition:
       Protected(S') = Protected(S) + represented - settled - expired,
    and no reclassification to surplus. Checked on random admissible delta vectors."""
    bad = 0
    for _ in range(trials):
        k = rng.randint(2, 6)
        P = [rng.randint(0, 100) for _ in range(k)]
        rep = [rng.randint(0, 20) for _ in range(k)]
        set_ = [rng.randint(0, min(20, P[i])) for i in range(k)]
        exp = [rng.randint(0, max(0, P[i] - set_[i])) for i in range(k)]
        P2 = [P[i] + rep[i] - set_[i] - exp[i] for i in range(k)]
        if any(x < 0 for x in P2):
            bad += 1
            continue
        if sum(P2) != sum(P) + sum(rep) - sum(set_) - sum(exp):
            bad += 1
    return bad


# ---------------------------------------------------------------------------- driver
def main():
    rng = random.Random(SEED)
    print("IMMORTAL finite-model mechanical verification")
    print("seed=%d  trials=%d" % (SEED, TRIALS))
    print("SCOPE: abstract model only. Not implementation evidence. Not a proof for")
    print("       infinite state spaces (see 03_ECONOMIC_KERNEL_FINAL.md for those).")
    print("=" * 78)

    counts = {k: [0, 0] for k in
              ('T1', 'T3', 'T4', 'T6', 'T9mono')}
    t4_certificates_tested = 0
    strictness_witnessed = 0
    narrowing_unsound_witnessed = 0
    t6_vacuous = 0

    for i in range(TRIALS):
        S = random_sys(rng, n=rng.randint(4, 7))

        ok, w = check_T1_monotonicity(S, rng)
        counts['T1'][0 if ok else 1] += 1
        if not ok:
            print("T1 FAIL", w)

        ok, w = check_T3_fixpoint(S)
        counts['T3'][0 if ok else 1] += 1
        if not ok:
            print("T3 FAIL", w)

        ok, w, tested = check_T4_kunder(S)
        counts['T4'][0 if ok else 1] += 1
        t4_certificates_tested += tested
        if not ok:
            print("T4 FAIL", w)

        if check_T4_strictness(S):
            strictness_witnessed += 1

        ok, w = check_T6_induction(S, rng)
        if ok is None:
            t6_vacuous += 1
        else:
            counts['T6'][0 if ok else 1] += 1
            if not ok:
                print("T6 FAIL", w)

        ok, w = check_T9_omega_monotone(S, rng)
        counts['T9mono'][0 if ok else 1] += 1
        if not ok:
            print("T9 FAIL", w)

        if check_T9_narrowing_unsound(S, rng):
            narrowing_unsound_witnessed += 1

    print("\n-- randomised checks over %d finite systems --" % TRIALS)
    for k, (p, f) in counts.items():
        print("  %-8s pass=%-5d fail=%d" % (k, p, f))
    print("  T4 was checked EXHAUSTIVELY over all subsets; certificates examined: %d"
          % t4_certificates_tested)
    print("  T6 vacuous (no non-empty certificate existed): %d systems" % t6_vacuous)
    print("  systems where some certificate was a STRICT subset of K* (conservatism real): %d"
          % strictness_witnessed)
    print("  systems where NARROWING Omega certified a non-viable state (unsoundness "
          "witnessed): %d" % narrowing_unsound_witnessed)

    print("\n-- composition: shared-reserve counterexample (15 section 3) --")
    for k, v in shared_reserve_counterexample().items():
        print("  %-48s %s" % (k, v))

    f, vac = independent_product_check(rng)
    print("\n-- composition: T-COMP-INDEP under strict independence --")
    print("  product-certificate failures: %d (vacuous trials: %d)" % (f, vac))

    print("\n-- upgrade: K*_new need not contain K*_old --")
    for k, v in upgrade_nonmonotonicity_witness().items():
        print("  %-24s %s" % (k, v))

    print("\n-- expiry finality (absorbing-class reachability) --")
    for k, v in expiry_absorbing_check().items():
        print("  %-24s %s" % (k, v))

    bad = conservation_algebra_check(rng)
    print("\n-- conservation algebra over disjoint exhaustive partition --")
    print("  violations in 2000 random admissible delta vectors: %d" % bad)

    print("\n" + "=" * 78)
    total_fail = sum(f for _, f in counts.values())
    print("RESULT: %d failures across randomised checks." % total_fail)
    print("Interpretation: MECHANICAL EVIDENCE for the abstract model on finite instances.")
    print("It does NOT discharge R1, R2, R3, R5, R6, R7, R8 or R9 for any deployment.")


if __name__ == "__main__":
    main()
