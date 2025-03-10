import type { NextApiRequest, NextApiResponse } from 'next'

import { withAuthentication } from '@/lib/api-middlewares/with-authentication'
import { withMethods } from '@/lib/api-middlewares/with-methods'
import { getServerSession } from '@/lib/api/getServerSession'
import { authOptions } from '@/lib/auth'
import { captureException } from '@sentry/nextjs'
import { getTwitchTokens } from '../../lib/getTwitchTokens'

async function checkBan(broadcasterId: string, accessToken: string) {
  const checkUrl = `https://api.twitch.tv/helix/moderation/banned?broadcaster_id=${broadcasterId}&user_id=${process.env.TWITCH_BOT_PROVIDERID}`
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'Client-Id': process.env.TWITCH_CLIENT_ID,
  }

  try {
    const checkResponse = await fetch(checkUrl, { method: 'GET', headers })
    if (!checkResponse.ok) {
      throw new Error(`Failed to get banned info: ${checkResponse.statusText}`)
    }
    const checkData = await checkResponse.json()
    if (checkData.data && checkData.data.length > 0) {
      return { banned: true }
    }
    return { banned: false }
  } catch (error) {
    captureException(error)
    return { message: 'Error', error: error.message }
  }
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' })
  }

  const session = await getServerSession(req, res, authOptions)

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
    const response = await checkBan(providerAccountId, accessToken)
    return res.status(200).json(response)
  } catch (error) {
    captureException(error)
    return res
      .status(500)
      .json({ message: 'Failed to get ban info', error: error.message })
  }
}

export default withMethods(['GET'], withAuthentication(handler))
