import DashboardShell from '@/components/Dashboard/DashboardShell'
import Header from '@/components/Dashboard/Header'
import { useSubscription } from '@/hooks/useSubscription'
import { fetcher } from '@/lib/fetcher'
import { useTrack } from '@/lib/track'
import { Card } from '@/ui/card'
import { canAccessFeature } from '@/utils/subscription'
import { Button, Select, notification } from 'antd'
import { useSession } from 'next-auth/react'
import Head from 'next/head'
import Image from 'next/image'
import type { ReactElement } from 'react'
import { useEffect, useState } from 'react'
import useSWR from 'swr'

const ModeratorsPage = () => {
  const track = useTrack()
  const session = useSession()
  const { subscription } = useSubscription()
  const tierAccess = canAccessFeature('managers', subscription)

  const {
    data: approvedMods,
    isLoading: loadingApprovedMods,
    mutate,
  } = useSWR<
    {
      moderatorChannelId: number
      createdAt: string
    }[]
  >('/api/get-approved-moderators', fetcher)
  const { data: moderatorList, isLoading: loadingModList } = useSWR<
    {
      user_id: string
      user_login: string
      user_name: string
    }[]
  >('/api/get-moderators', fetcher)

  const [loading, setLoading] = useState<boolean>(false) // Loading state
  const [selectedModerators, setSelectedModerators] = useState<string[]>([]) // Selected moderators

  useEffect(() => {
    if (!loadingApprovedMods && Array.isArray(approvedMods)) {
      setSelectedModerators(approvedMods?.map((mod) => `${mod.moderatorChannelId}`) || [])
    }
  }, [approvedMods, loadingApprovedMods])

  const handleApprove = async () => {
    setLoading(true) // Set loading state
    track('approve_moderators_start')

    try {
      const data = await fetch('/api/approve-moderator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          moderatorChannelIds: selectedModerators,
        }),
      })
      const body = await data.json()
      if (body?.error) {
        throw new Error(body?.message)
      }
      // Re-fetch approved moderators
      mutate()
      notification.success({
        message: 'Success',
        description: 'Managers updated successfully!',
      })
      track('approve_moderators_success')
    } catch (error) {
      console.error('Failed to approve moderators:', error)
      notification.error({
        message: 'Error',
        description: 'Failed to approve moderators.',
      })
      track('approve_moderators_failure', { error: error.message })
    } finally {
      setLoading(false)
      setSelectedModerators([])
    }
  }

  if (session?.data?.user?.isImpersonating) {
    return null
  }

  return (
    <>
      <Head>
        <title>Dotabod | Managers</title>
      </Head>
      <Header
        subtitle='Below is a list of moderators for your channel. You can approve them to manage your Dotabod settings.'
        title='Managers'
      />

      <Card title='Approve Managers' feature='managers'>
        <div className='subtitle'>
          <p>
            By approving a user, you're allowing them to access and modify your Dotabod dashboard.
            Approved managers can manage features, toggle commands, and update settings on your
            behalf.
          </p>
          <p>
            Note: They will not have access to your setup page, downloading the GSI cfg, nor overlay
            URL.
          </p>
        </div>

        <div className='max-w-sm flex flex-col gap-4'>
          <Select
            disabled={!tierAccess.hasAccess}
            optionFilterProp='label'
            loading={loadingModList || loadingApprovedMods}
            mode='multiple'
            style={{ width: '100%' }}
            placeholder='Select moderators'
            value={selectedModerators}
            defaultValue={
              Array.isArray(approvedMods) && approvedMods.map((mod) => `${mod.moderatorChannelId}`)
            }
            onChange={(value: string[] | false) => {
              if (Array.isArray(value)) {
                setSelectedModerators(value)
              }
            }}
            options={
              Array.isArray(moderatorList)
                ? moderatorList.map((moderator) => ({
                    label: moderator.user_name,
                    value: moderator.user_id,
                    disabled: moderator.user_id === '843245458',
                  }))
                : []
            }
          />
          <Button
            type='primary'
            onClick={handleApprove}
            loading={loading}
            disabled={!tierAccess.hasAccess}
          >
            Submit
          </Button>
        </div>
      </Card>

      <Card>
        <div className='title'>
          <h3>What is this?</h3>
        </div>
        <div className=''>
          Once you approve a user, they will login to dotabod.com and be able to access your
          dashboard by using this selectbox:
        </div>
        <Image
          src='https://i.imgur.com/GSRVXFz.png'
          alt='Managers selectbox'
          width={1245}
          height={829}
        />
      </Card>
    </>
  )
}

ModeratorsPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <DashboardShell
      seo={{
        title: 'Managers | Dotabod Dashboard',
        description: 'Manage moderators and channel managers for your Dotabod account.',
        canonicalUrl: 'https://dotabod.com/dashboard/managers',
        noindex: true,
      }}
    >
      {page}
    </DashboardShell>
  )
}

export default ModeratorsPage
