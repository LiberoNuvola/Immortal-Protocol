# IMMORTAL Protocol — Explained Without the Mathematics
**Status:** Supporting | **Version:** 3.0.0

## The idea in one sentence

IMMORTAL is an economic protocol that refuses to execute an action unless it can show that
the resulting economic state stays safe under everything the declared environment says can
happen.

## Why that is different

A normal economic system usually asks:

> "Can we afford this payment right now?"

IMMORTAL asks a stronger question:

> "After doing this, are we still safe if the adverse events the system must consider occur?"

That difference is the whole protocol.

## The four gates

**1. Truth.** Decide what is actually authoritative. A number is not true because an
operator, website or application displays it.

**2. Protection.** Reserve everything already owed or that may become an obligation. Only
what remains is surplus.

**3. Viability.** Ask whether the new state belongs to the set of states from which safe
continuation remains possible.

**4. Atomic execution.** If the action passes, all coupled changes happen together. There is
no conforming halfway state.

## The most important rule

The protocol does not say "here is a safe policy, execute whatever the policy chooses."
It says "only actions that pass the viability gate are executable." That distinction stops a
malicious or broken policy selector from bypassing the economic invariant.

## The safe-states set, and how it is actually checked

There is an ideal set of safe-to-continue-from states. Mathematically it is well defined —
but for a system with unlimited possible states, nobody can compute it exactly, and this
package does not pretend otherwise.

So a deployment instead publishes a **smaller, checkable set** and proves two things about
it: every state in it is safe, and from every state in it there is a move that keeps you
inside it. Those two facts are enough to guarantee that the smaller set sits inside the
ideal one. The protocol checks membership in the smaller set.

The trade-off is worth stating plainly:

- If the checkable set is **too small**, the protocol is over-cautious. It may refuse
  things that were actually fine, and it may sit still. It is still safe.
- If the checkable set is **too big**, the guarantee is gone.

Everything rests on proving the second property honestly.

## What if something unexpected happens?

The protocol does not assume it won't. The uncertainty envelope lists the economically
relevant events the environment is allowed to produce, and every decision must survive
*all* of them, not the likely ones. Small probability is not a reason to leave an event out.

If required information cannot be verified, the protocol stops rather than inventing a
convenient number.

And the honest limit: **if an event was never in the envelope, the guarantee says nothing
about it.** That is why every deployment must publish the boundary of what it modelled, and
what it knowingly left outside.

## Why safety can hold forever

The protocol does not enumerate the future. If the current state is inside the checkable
safe set and every executed action keeps it inside, the same argument applies again at the
next step. Repeating that step gives safety over an unlimited horizon.

## What about an adversary?

An adversary can adapt to everything that happened before. That does not break the argument,
because every action the adversary can actually get executed still has to pass the gate. The
adversary may choose among allowed actions; it cannot enlarge the allowed set.

Which is why a serious adversary will not attack the mathematics. It will attack the three
soft points: a bug that commits an action without passing the gate, an envelope that left
out a real event, or a safe-set proof that was not actually valid.

## What about waiting? (Why liveness is separate)

Being in the safe set means a safe move **exists**. It does not mean anyone will make it.
Someone has to propose the action, the required information has to be available, the message
has to arrive, and the transaction has to be included.

So IMMORTAL guarantees safety, and it guarantees that a safe continuation exists. It does
**not** guarantee that anything happens. A protocol that sits still forever is disappointing,
but it is not unsafe — and the package says so rather than quietly implying otherwise.
Deployments that need progress must publish what they are assuming about the world.

Notably, the protocol is never allowed to restore progress by loosening the gate.

## Why upgrades need migration safety

Changing the rules changes which states count as safe. An upgrade could therefore leave the
live system outside the new safe set, or quietly erase rights people already hold.

So an upgrade is admissible only if: the state at the moment of switching is inside the new
checkable safe set; existing rights and obligations survive the translation; protection does
not regress; history is not rewritten; and the mandatory rules are still mandatory
afterwards — so nobody can "pass" the migration test by redefining safety as everything.

If those cannot be shown, the upgrade does not activate. Not even if the alternative is
staying stuck.

## Why composition needs a contract

Two systems that are each safe on their own are not automatically safe together. The simplest
case: both are allowed to draw on the same reserve, each correctly concluding it can afford
it, because neither one's model included the other. Both draw. The reserve goes negative.

Nothing was wrong with either proof. What was wrong was assuming the proofs combine. So any
economic interaction between two instances requires its own contract and its own proof about
the combined system.

## What IMMORTAL is not

Not a ticket system, not a particular blockchain application, and not PRE-RICH. PRE-RICH can
instantiate IMMORTAL with its own prices, classes, payouts and lifecycle; those belong to the
application layer.

## What is not claimed

- That the ideal safe set can be computed.
- That it is non-empty for any particular deployment — that must be demonstrated.
- That the protocol will ever act (liveness).
- That the envelope covers events outside the published boundary.
- That two conforming systems compose.
- That any particular implementation actually follows these rules.

That last one matters most. The mathematics proves what follows from the rules. Showing that
a real system implements those rules is a separate job, done with tests, formal verification,
replay evidence and independent review — and this package deliberately keeps the two apart.

## The mental model

A door with several locks:

**Truth → Protection → Viability → Atomic Commit**

If any lock fails, the action does not pass. The protocol would rather wait than cross an
unsafe boundary.
