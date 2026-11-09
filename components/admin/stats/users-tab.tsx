"use client"

import { RankedList } from "@/components/admin/stats/ranked-list"
import { StackedDailyChart } from "@/components/admin/stats/stacked-daily-chart"
import { StatGrid } from "@/components/admin/stats/stat-grid"
import { SignupSources, VisitTables } from "@/components/admin/stats/visit-tables"
import { StatsPanel } from "@/components/admin/stats/stats-panel"
import { providerLabels, type SignInProvider } from "@/lib/admin-stats"
import { CHANNEL_EVENT_LABELS, CHANNEL_TYPES, EMAIL_NOTIFICATION_NOUNS } from "@/lib/notifications"
import { useUsersStats } from "@/lib/hooks/useSiteStats"
import type { AnalyticsRange, ChannelEvent, CountEntry, EmailNotificationType, UsersStats } from "@/lib/types"

const consentTile = ({ value, count }: CountEntry) => {
  const emailNoun = EMAIL_NOTIFICATION_NOUNS[value as EmailNotificationType]
  if (emailNoun) return { label: `${emailNoun.charAt(0).toUpperCase()}${emailNoun.slice(1)}`, value: count.toLocaleString(), hint: "People who turned this email on." }
  return { label: CHANNEL_EVENT_LABELS[value as ChannelEvent] ?? value, value: count.toLocaleString(), hint: "Channels getting this event." }
}

const channelTile = ({ value, count }: CountEntry) => ({
  label: CHANNEL_TYPES.find((option) => option.type === value)?.label ?? value,
  value: count.toLocaleString(),
  hint: "Channels of this type.",
})

interface UsersTabProps {
  days: AnalyticsRange
}

export function UsersTab({ days }: UsersTabProps) {
  const query = useUsersStats(days)
  return <StatsPanel query={query}>{(data) => <UsersBody data={data} days={data.days} />}</StatsPanel>
}

interface UsersBodyProps {
  data: UsersStats
  days: AnalyticsRange
}

function UsersBody({ data, days }: UsersBodyProps) {
  const { signups, now, apiKeys, mcp, bioPages } = data

  return (
    <>
      <StackedDailyChart title="Sign-ups" series={signups} labels={providerLabels} days={days} />
      <StatGrid
        title="Accounts"
        items={[
          { label: "Total", value: now.total.toLocaleString() },
          { label: "Active", value: now.active.toLocaleString() },
          { label: "Deactivated", value: now.deactivated.toLocaleString() },
          { label: "Admins", value: now.admins.toLocaleString() },
          { label: "Email verified", value: now.emailVerified.toLocaleString() },
          { label: "Two-factor on", value: now.twoFactorEnabled.toLocaleString() },
        ]}
      />
      <RankedList
        title="Sign-in method"
        valueLabel="Accounts"
        entries={now.byProvider}
        label={(value) => providerLabels[value as SignInProvider] ?? value}
        emptyText="No accounts yet."
      />
      <StatGrid
        title="Activity"
        items={[
          { label: "Signed in, last 7 days", value: data.activeLast7Days.toLocaleString(), hint: "By last sign-in." },
          { label: "Signed in, last 30 days", value: data.activeLast30Days.toLocaleString(), hint: "By last sign-in." },
        ]}
      />
      <StatGrid
        title="API keys"
        items={[
          { label: "Active", value: apiKeys.active.toLocaleString() },
          { label: "Expired", value: apiKeys.expired.toLocaleString() },
          {
            label: "Revoked",
            value: apiKeys.revoked.toLocaleString(),
            hint: "Turned off by the owner or an admin.",
          },
          { label: "API requests made", value: apiKeys.callsUsed.toLocaleString(), hint: "All keys, all time." },
        ]}
      />
      <StatGrid
        title="AI connector"
        items={[
          {
            label: "Accounts connected now",
            value: mcp.connectedUsers.toLocaleString(),
            hint: "Accounts with an AI app connected right now. Expired connections are cleaned up daily.",
          },
          {
            label: "Registered apps",
            value: mcp.registeredClients.toLocaleString(),
            hint: "Apps registered in the last 30 days or still connected.",
          },
        ]}
      />
      {data.notifications && (
        <StatGrid
          title="Notifications"
          items={[
            ...data.notifications.consents.map(consentTile),
            ...data.notifications.channels.map(channelTile),
            {
              label: "Turned off after failing",
              value: data.notifications.autoDisabledChannels.toLocaleString(),
              hint: "Channels that turned themselves off after failing on 10 different days.",
            },
          ]}
        />
      )}
      <VisitTables days={days} />
      <SignupSources entries={data.signupSources} />
      {bioPages && (
        <StatGrid
          title="Bio pages"
          items={[
            { label: "Pages", value: bioPages.total.toLocaleString() },
            { label: "Hidden", value: bioPages.hidden.toLocaleString() },
          ]}
        />
      )}
    </>
  )
}
