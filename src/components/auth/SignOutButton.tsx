'use client'

import { Button, type ButtonProps } from '@mantine/core'
import { signOut } from 'next-auth/react'

interface SignOutButtonProps extends ButtonProps {
  children?: React.ReactNode
}

/**
 * Sign out button that immediately signs out the user.
 */
export function SignOutButton({
  children = 'ログアウト',
  ...props
}: SignOutButtonProps) {
  const handleSignOut = () => {
    signOut({ callbackUrl: '/' })
  }

  return (
    <Button onClick={handleSignOut} {...props}>
      {children}
    </Button>
  )
}
