import { Github } from 'lucide-react'
import {
  BeakerIcon,
  BoltIcon,
  CommandLineIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline'
import Image from 'next/image'
import DiscordSvg from '@/images/logos/discord.svg'

export const navigation = [
  {
    name: 'Setup',
    href: '/dashboard',
    icon: BeakerIcon,
  },
  {
    name: 'Features',
    href: '/dashboard/features',
    icon: BoltIcon,
  },
  {
    name: 'Commands',
    href: '/dashboard/commands',
    icon: CommandLineIcon,
  },
  {
    name: 'Troubleshoot',
    href: '/dashboard/troubleshoot',
    icon: QuestionMarkCircleIcon,
  },
  {
    name: '',
    href: '',
    icon: null,
  },
  {
    name: 'Github',
    href: 'https://github.com/dotabod/',
    icon: Github,
  },
  {
    name: 'Discord',
    href: 'https://discord.dotabod.com',
    icon: ({ ...props }) => <Image alt="discord" src={DiscordSvg} {...props} />,
  },
]