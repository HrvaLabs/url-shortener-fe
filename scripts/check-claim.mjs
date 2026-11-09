import assert from "node:assert/strict"
import "./resolve-ts-imports.mjs"

const { CLAIM_RULES, rulesLineNeeded, aliasFromInput, aliasFromNext, claimMessage, claimResultLine, claimNextPath, isAliasShaped } = await import("../lib/claim.ts")
const { safeNext } = await import("../lib/utils.ts")

let failures = 0

const check = async (name, run) => {
  try {
    await run()
  } catch (error) {
    failures += 1
    console.error(`FAIL ${name}\n  ${String(error.message).split("\n").join("\n  ")}`)
  }
}

await check("aPastedShortLinkIsReducedToTheName", () => {
  for (const pasted of ["https://hrva.cc/karlo/", "hrva.cc/karlo", " karlo ", "http://www.hrva.cc/karlo", "www.hrva.cc/karlo", "karlo/", "HTTPS://hrva.cc/Karlo", "hrva.cc/karlo?x=1", "https://hrva.cc/karlo#top", "app.hrva.cc/karlo", "https://app.hrva.cc/karlo/?a=b#c"]) {
    assert.equal(aliasFromInput(pasted).toLowerCase(), "karlo", pasted)
  }
  assert.equal(aliasFromInput("HTTPS://hrva.cc/Karlo"), "Karlo")
  assert.equal(aliasFromInput(""), "")
})

await check("theAliasPatternMatchesTheBackend", () => {
  assert.equal(isAliasShaped("a".repeat(32)), true)
  assert.equal(isAliasShaped("a".repeat(33)), false)
  assert.equal(isAliasShaped("a b"), false)
  assert.equal(isAliasShaped("_-"), true)
  assert.equal(isAliasShaped(""), false)
  assert.equal(isAliasShaped("karlo\n"), false)
  assert.equal(isAliasShaped("čaj"), false)
})

await check("theNextPathRoundTrips", () => {
  const path = claimNextPath("a_b-1")
  assert.equal(path, "/dashboard?alias=a_b-1")
  assert.equal(aliasFromNext(path), "a_b-1")
  assert.equal(safeNext(path), path)
  const viaRegister = new URLSearchParams(new URL(`/register?next=${encodeURIComponent(path)}`, "https://hrva.cc").search).get("next")
  assert.equal(aliasFromNext(viaRegister), "a_b-1")
})

await check("aForeignNextGivesNoAlias", () => {
  for (const next of [null, "", "//evil.com", "/login", "https://evil.com/dashboard?alias=x", "/dashboard", "/dashboard?alias=", "/dashboard?alias=a%20b", "/dashboard?alias=" + "a".repeat(33), "/dashboard/x?alias=ok"]) {
    assert.equal(aliasFromNext(next), null, String(next))
  }
})

await check("everyStatusHasAMessage", () => {
  for (const status of ["AVAILABLE", "TAKEN", "RESERVED", "INVALID", "DISABLED"]) {
    const message = claimMessage(status, "Some reason.")
    assert.ok(message.text.length > 0, status)
    assert.equal(message.tone, status === "AVAILABLE" ? "ok" : "no")
  }
  const invalid = claimMessage("INVALID", CLAIM_RULES)
  assert.equal(invalid.text, CLAIM_RULES)
  assert.equal(rulesLineNeeded("INVALID", invalid.text), false)
  assert.equal(rulesLineNeeded("INVALID", "Names can't start with a hyphen."), true)
  for (const status of ["DISABLED", "RESERVED", "TAKEN"]) assert.equal(rulesLineNeeded(status, "Some reason."), false, status)
  assert.equal(claimResultLine("KARLO-QA", "TAKEN", "Taken."), "hrva.cc/KARLO-QA: Taken. Capital letters don't make a new name.")
  assert.equal(claimResultLine("karlo", "TAKEN", "Taken."), "hrva.cc/karlo: Taken.")
  assert.equal(claimResultLine("Karlo", "RESERVED", "Reserved."), "hrva.cc/Karlo: Reserved.")
  assert.equal(claimResultLine("", "INVALID", CLAIM_RULES), CLAIM_RULES)
  assert.equal(claimMessage("TAKEN", "This short URL is already taken. Try another.").text, "This short URL is already taken. Try another.")
  assert.ok(claimMessage("TAKEN", null).text.length > 0)
  assert.ok(claimMessage("SOMETHING_NEW", null).text.length > 0)
  assert.equal(claimMessage("SOMETHING_NEW", null).tone, "no")
})

if (failures > 0) {
  console.error(`${failures} check(s) failed`)
  process.exit(1)
}

console.log("ok")
