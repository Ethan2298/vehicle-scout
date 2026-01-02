import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock next/font/google
vi.mock('next/font/google', () => ({
  Geist: () => ({ variable: '--font-geist-sans' }),
  Geist_Mono: () => ({ variable: '--font-geist-mono' }),
}))

// Must import after mocks
import RootLayout from './layout'

describe('RootLayout', () => {
  it('renders the sidebar', () => {
    render(
      <RootLayout>
        <div>Test content</div>
      </RootLayout>
    )

    expect(screen.getByText('Vehicle Scout')).toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('renders children in the main content area', () => {
    render(
      <RootLayout>
        <div>Test content</div>
      </RootLayout>
    )

    expect(screen.getByText('Test content')).toBeInTheDocument()
  })
})
