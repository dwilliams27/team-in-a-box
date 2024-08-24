addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  if (request.method !== 'POST') {
    return new Response('Send a POST request', { status: 405 })
  }

  try {
    const body = await request.json()

    if (body.type && body.type.startsWith('slack_')) {
      return new Response('Processed Slack event', { status: 200 })
    }

    return new Response('Not a Slack event', { status: 200 })
  } catch (err) {
    return new Response('Error parsing JSON', { status: 400 })
  }
}
