export const SIGNUP_SOURCES = [
  "AI_ASSISTANT",
  "SEARCH_ENGINE",
  "SHARED_LINK",
  "RECOMMENDED",
  "WEBSITE_OR_LIST",
  "OTHER",
] as const

export type SignupChoice = (typeof SIGNUP_SOURCES)[number]
export type SignupSource = SignupChoice | "SKIPPED"

export const SIGNUP_SOURCE_LABELS: Record<SignupChoice, string> = {
  AI_ASSISTANT: "An AI assistant (ChatGPT, Claude…)",
  SEARCH_ENGINE: "A search engine",
  SHARED_LINK: "An hrva.cc link or bio page someone shared",
  RECOMMENDED: "Someone recommended it",
  WEBSITE_OR_LIST: "A website, list or directory",
  OTHER: "Something else",
}

export const SIGNUP_SOURCE_QUESTION = "How did you find hrva.cc?"
export const SIGNUP_SOURCE_NOTE = "Optional. The admin sees only counts per answer, not who answered what."
export const SIGNUP_SOURCE_PICK_FIRST = "Pick an answer, or skip."
export const SIGNUP_SOURCE_FAILED = "Couldn't save your answer. Try again, or skip."
