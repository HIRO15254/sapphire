'use client'

import { Alert, Button, Container, Stack, Text, Title } from '@mantine/core'
import { IconAlertTriangle, IconRefresh } from '@tabler/icons-react'
import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  /**
   * Custom fallback component to render when an error occurs.
   */
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * Error boundary component for catching and displaying errors.
 * Shows Japanese error messages and provides retry functionality.
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <Container py="xl" size="sm">
          <Alert
            color="red"
            icon={<IconAlertTriangle size={24} />}
            title="エラーが発生しました"
            variant="light"
          >
            <Stack gap="md">
              <Text size="sm">
                申し訳ございません。予期せぬエラーが発生しました。
              </Text>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <Text c="dimmed" size="xs" style={{ fontFamily: 'monospace' }}>
                  {this.state.error.message}
                </Text>
              )}
              <Button
                color="red"
                leftSection={<IconRefresh size={16} />}
                onClick={this.handleRetry}
                variant="light"
              >
                再試行
              </Button>
            </Stack>
          </Alert>
        </Container>
      )
    }

    return this.props.children
  }
}

/**
 * Error display component for showing error messages.
 * Can be used as a standalone component outside ErrorBoundary.
 */
export function ErrorDisplay({
  title = 'エラーが発生しました',
  message = '申し訳ございません。予期せぬエラーが発生しました。',
  onRetry,
}: {
  title?: string
  message?: string
  onRetry?: () => void
}) {
  return (
    <Container py="xl" size="sm">
      <Stack align="center" gap="lg">
        <IconAlertTriangle color="var(--mantine-color-red-6)" size={48} />
        <Title order={2}>{title}</Title>
        <Text c="dimmed" ta="center">
          {message}
        </Text>
        {onRetry && (
          <Button
            leftSection={<IconRefresh size={16} />}
            onClick={onRetry}
            variant="light"
          >
            再試行
          </Button>
        )}
      </Stack>
    </Container>
  )
}
