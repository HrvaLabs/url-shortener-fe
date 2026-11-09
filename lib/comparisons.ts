export const BITLY_COMPARISON = {
  path: "/compare/bitly-alternative",
  published: false,
  checkedOn: "2026-10-29",
  sources: {
    pricing: "https://bitly.com/pages/pricing",
    privacy: "https://bitly.com/pages/privacy",
  },
} as const

export const FREE_PLANS_COMPARISON = {
  path: "/compare/free-custom-domain-shorteners",
  published: false,
  checkedOn: "2026-11-09",
  sources: {
    dub: "https://dub.co/pricing/links",
    shortio: "https://short.io/pricing/",
    bitly: "https://bitly.com/pages/pricing",
    rebrandly: "https://www.rebrandly.com/pricing",
  },
} as const
