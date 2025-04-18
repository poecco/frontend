import { type SubscriptionRow, isSubscriptionActive } from '@/utils/subscription'
import type { Subscription } from '@prisma/client'
import { useRouter } from 'next/router'
import { createContext, useEffect, useState } from 'react'

interface SubscriptionContextType {
  subscription: SubscriptionRow | null
  isLoading: boolean
  isSubscribed: boolean
}

export const SubscriptionContext = createContext<SubscriptionContextType | null>(null)

export function SubscriptionProviderMain({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { userId } = router.query
  const [subscription, setSubscription] = useState<SubscriptionRow | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    async function getSubscription() {
      setIsLoading(true)
      const response = await fetch(`/api/stripe/subscription?id=${userId ?? ''}`)
      if (response.ok) {
        const data: Subscription = await response.json()
        // Create date objects for currentPeriodEnd
        const subscriptionData = {
          ...data,
          currentPeriodEnd: data.currentPeriodEnd ? new Date(data.currentPeriodEnd) : null,
        }
        setSubscription(subscriptionData)
      }
      setIsLoading(false)
    }
    router.isReady && getSubscription()
  }, [userId, router.isReady])

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        isLoading,
        isSubscribed: isSubscriptionActive({ status: subscription?.status }),
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  )
}
