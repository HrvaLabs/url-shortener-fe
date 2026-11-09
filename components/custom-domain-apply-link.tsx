"use client"

import Link from "next/link"
import { useAuth } from "@/lib/auth-context"

const SETTINGS_PATH = "/dashboard/settings#custom-domains"

export function CustomDomainApplyLink({ signedInText, signedOutText, signedOutAfter = "" }: { signedInText: string; signedOutText: string; signedOutAfter?: string }) {
  const { user } = useAuth()
  return user ? (
    <Link href={SETTINGS_PATH}>{signedInText}</Link>
  ) : (
    <>
      <Link href={`/register?next=${encodeURIComponent(SETTINGS_PATH)}`}>{signedOutText}</Link>
      {signedOutAfter}
    </>
  )
}
