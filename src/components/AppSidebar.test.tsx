import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AppSidebar } from './AppSidebar'
import { SidebarProvider } from '@/components/ui/sidebar'

const renderWithProvider = (ui: React.ReactNode) => {
  return render(<SidebarProvider>{ui}</SidebarProvider>)
}

describe('AppSidebar', () => {
  it('renders navigation menu items', () => {
    renderWithProvider(<AppSidebar />)

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Vehicles')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('renders the app title in sidebar header', () => {
    renderWithProvider(<AppSidebar />)

    expect(screen.getByText('Vehicle Scout')).toBeInTheDocument()
  })
})
