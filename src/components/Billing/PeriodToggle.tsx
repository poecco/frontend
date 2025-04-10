import { plans } from '@/components/Billing/BillingPlans'
import {
  type PricePeriod,
  type SubscriptionRow,
  calculateSavings,
  getCurrentPeriod,
  isSubscriptionActive,
} from '@/utils/subscription'
import { Radio, RadioGroup } from '@headlessui/react'
import clsx from 'clsx'
import { useEffect } from 'react'

interface PeriodToggleProps {
  activePeriod: PricePeriod
  onChange: (period: PricePeriod) => void
  subscription: SubscriptionRow | null
}

export function PeriodToggle({ activePeriod, onChange, subscription }: PeriodToggleProps) {
  // Set initial period based on subscription
  useEffect(() => {
    if (isSubscriptionActive({ status: subscription?.status })) {
      const period = getCurrentPeriod(subscription?.stripePriceId)
      onChange(period)
    }
  }, [subscription, onChange])

  return (
    <RadioGroup
      value={activePeriod}
      onChange={onChange}
      className='grid grid-cols-3 bg-gray-800/50 p-1 rounded-lg'
    >
      {['monthly', 'annual', 'lifetime'].map((period) => (
        <Radio
          key={period}
          value={period}
          className={clsx(
            'cursor-pointer px-8 py-2 text-sm transition-colors rounded-md flex items-center gap-2',
            'focus:outline-hidden focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900',
            activePeriod === period
              ? 'bg-purple-500 text-gray-900 font-semibold shadow-lg'
              : 'text-gray-300 hover:bg-gray-700/50',
          )}
        >
          <div className='relative flex flex-col items-center gap-1'>
            <span className='first-letter:uppercase'>{period}</span>
            {period === 'annual' && (
              <div
                className={clsx(
                  'absolute -bottom-8 text-xs whitespace-nowrap',
                  activePeriod === period ? 'text-purple-400' : 'text-purple-300',
                )}
              >
                Save up to{' '}
                {Math.max(
                  ...plans
                    .filter((plan) => plan.price.monthly !== '$0')
                    .map((plan) => calculateSavings(plan.price.monthly, plan.price.annual)),
                )}
                %
              </div>
            )}
            {period === 'lifetime' && (
              <div
                className={clsx(
                  'absolute -bottom-8 text-xs whitespace-nowrap',
                  activePeriod === period ? 'text-purple-400' : 'text-purple-300',
                )}
              >
                Pay once, use forever
              </div>
            )}
          </div>
        </Radio>
      ))}
    </RadioGroup>
  )
}
