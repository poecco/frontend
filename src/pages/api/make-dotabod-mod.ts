import type { NextApiRequest, NextApiResponse } from 'next'

import { withAuthentication } from '@/lib/api-middlewares/with-authentication'
import { withMethods } from '@/lib/api-middlewares/with-methods'
import { getServerSession } from '@/lib/api/getServerSession'
import { authOptions } from '@/lib/auth'
import { getTwitchTokens } from '@/lib/getTwitchTokens'
import { captureException } from '@sentry/nextjs'

async function addModerator(broadcasterId: string, accessToken: string) {
  const checkUrl = `https://api.twitch.tv/helix/moderation/moderators?broadcaster_id=${broadcasterId}&user_id=${process.env.TWITCH_BOT_PROVIDERID}`
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'Client-Id': process.env.TWITCH_CLIENT_ID,
  }

  try {
    // Check if the user is already a moderator
    const checkResponse = await fetch(checkUrl, { method: 'GET', headers })
    if (!checkResponse.ok) {
      throw new Error(`Failed to get moderators: ${checkResponse.statusText}`)
    }
    const checkData = await checkResponse.json()
    if (checkData.data && checkData.data.length > 0) {
      // The user is already a moderator
      return { status: 'OK', message: 'User is already a moderator' }
    }

    // If the user is not a moderator, add them as a moderator
    const url = `https://api.twitch.tv/helix/moderation/moderators?broadcaster_id=${broadcasterId}&user_id=${process.env.TWITCH_BOT_PROVIDERID}`
    const response = await fetch(url, { method: 'POST', headers })
    if (!response.ok) {
      throw new Error(`Failed to add moderator: ${response.statusText}`)
    }
    if (response.status === 204) {
      return { status: 'OK', message: 'Added Dotabod as moderator' }
    }
  } catch (error) {
    captureException(error)
    console.error(error)
    return { status: 'ERROR', message: 'Error', error: error.message } // Handle error gracefully
  }
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' })
  }

  const session = await getServerSession(req, res, authOptions)
  if (session?.user?.isImpersonating) {
    return res.status(403).json({ message: 'Forbidden' })
  }
  if (!session?.user?.id) {
    return res.status(403).json({ message: 'Forbidden' })
  }

  try {
    const { providerAccountId, accessToken, error } = await getTwitchTokens(
      session.user.id
    )
    if (error) {
      return res.status(403).json({ message: 'Forbidden' })
    }
    const response = await addModerator(providerAccountId, accessToken)
    return res.status(200).json(response)
  } catch (error) {
    captureException(error)
    console.error('Failed to update mod:', error)
    return res
      .status(500)
      .json({ message: 'Failed to update mod', error: error.message })
  }
}

export default withMethods(['GET'], withAuthentication(handler))
