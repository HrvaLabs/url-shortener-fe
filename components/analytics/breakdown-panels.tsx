import { BreakdownList } from "@/components/analytics/breakdown-list"
import { CountryMapLazy } from "@/components/analytics/country-map-lazy"
import { QrScansList } from "@/components/analytics/qr-scans-list"
import type { AnalyticsBreakdowns, AnalyticsTotals } from "@/lib/types"

interface BreakdownPanelsProps {
  totals: AnalyticsTotals
  breakdowns: AnalyticsBreakdowns
  passwordProtected?: boolean
}

export function BreakdownPanels({ totals, breakdowns, passwordProtected }: BreakdownPanelsProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <QrScansList totals={totals} sources={breakdowns.sources} passwordProtected={passwordProtected} />
      <BreakdownList
        title="Referrers"
        dimension="referrers"
        entries={breakdowns.referrers}
        note={passwordProtected ? "Referrers aren't available for password-protected links." : undefined}
      />
      <BreakdownList
        title="Countries"
        dimension="countries"
        entries={breakdowns.countries}
        header={<CountryMapLazy breakdowns={breakdowns} />}
      />
      <BreakdownList title="Devices" dimension="devices" entries={breakdowns.devices} />
      <BreakdownList title="Browsers" dimension="browsers" entries={breakdowns.browsers} />
      <BreakdownList title="Operating systems" dimension="operatingSystems" entries={breakdowns.operatingSystems} />
    </div>
  )
}
