import { Constr, Data } from 'lucid-cardano'
import {
  PRE_RICH_PREPROD_DEPLOYMENT_PROFILE_V1 as profile,
  PRE_RICH_PREPROD_CLASS_PRICES,
  assertPreRichPreprodInitialProfile,
  buildPreRichPreprodInitialClasses,
} from '../PRE-RICH/profile/PreRichPreprodDeploymentProfile'

export function buildPreRichPreprodInitialDatum(): string {
  assertPreRichPreprodInitialProfile()

  const classes = buildPreRichPreprodInitialClasses().map((entry) =>
    new Constr(0, [
      entry.classId,
      entry.issued,
      entry.unresolved,
      entry.exposure,
      entry.cap,
      new Constr(entry.saleable ? 1 : 0, []),
    ]),
  )

  if (classes.length !== PRE_RICH_PREPROD_CLASS_PRICES.length) {
    throw new Error('initial V3 datum class count mismatch')
  }

  const state = new Constr(0, [
    profile.crystallizedLiabilities,
    profile.unresolvedReserve,
    profile.unresolvedTicketCount,
    profile.safetyCapital,
    profile.reserveProtection,
    profile.mandatoryFutureCosts,
    classes,
    new Constr(0, [
      profile.currentActiveClass,
      profile.highestClassEverActivated,
    ]),
    new Constr(0, [
      profile.jackpot.lockedAmount,
      profile.jackpot.threshold,
      new Constr(0, []),
      profile.jackpot.cycle,
    ]),
  ])

  return Data.to(new Constr(0, [profile.stateVersion, state]))
}
