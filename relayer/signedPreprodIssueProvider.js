const { createPreprodIssueObservationProducerFromLucid } = require('./preprodIssueAdmissionProvider')
const { fetchSignedIssueAuthority } = require('./signedIssueAuthority')

function createSignedPreprodIssueObservationProducerFromLucid({ lucid, deployment, authorityUrl, authorityPublicKey }) {
  if (!authorityUrl) throw new Error('authorityUrl is required')
  if (!authorityPublicKey) throw new Error('authorityPublicKey is required')

  return createPreprodIssueObservationProducerFromLucid({
    lucid,
    deployment,
    authoritySource: async (request) => fetchSignedIssueAuthority({
      baseUrl: authorityUrl,
      publicKeyPem: authorityPublicKey,
      request,
    }),
  })
}

module.exports = { createSignedPreprodIssueObservationProducerFromLucid }
