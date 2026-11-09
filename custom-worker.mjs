import openNextWorker from "./.open-next/worker.js"
import { withBioEdgeCache } from "./lib/bio-edge-cache"
import { junkPathResponse } from "./lib/junk-paths"
import { landingVisitOf, writeLandingVisit } from "./lib/landing-visits"
import { withCallbackHeaders, withContentSecurityPolicy } from "./lib/security-headers"
import { withUnavailableStatus } from "./lib/unavailable-status"

// Re-export any Durable Object class added later (e.g. OpenNext's DOQueueHandler or DOShardedTagCache) from ./.open-next/worker.js here.
const nextFetch = withBioEdgeCache(openNextWorker.fetch)

const worker = {
  fetch: async (request, env, context) => {
    const response = junkPathResponse(request) ?? withContentSecurityPolicy(withUnavailableStatus(request, withCallbackHeaders(request, await nextFetch(request, env, context))))
    writeLandingVisit(env.LANDING_VISITS, landingVisitOf(request, response))
    return response
  },
}

export default worker
