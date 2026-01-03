import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AppSidebar } from './AppSidebar'
import { SidebarProvider } from '@/components/ui/sidebar'

// Mock usePathname
const mockPathname = vi.fn()
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
}))

const renderWithProvider = (ui: React.ReactNode) => {
  return render(<SidebarProvider>{ui}</SidebarProvider>)
}

describe('AppSidebar', () => {
  beforeEach(() => {
    mockPathname.mockReturnValue('/')
  })

  it('renders navigation menu items', () => {
    renderWithProvider(<AppSidebar />)

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Vehicles')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })


  it('marks Dashboard as active on home page', () => {
    mockPathname.mockReturnValue('/')
    renderWithProvider(<AppSidebar />)

    const dashboardButton = screen.getByText('Dashboard').closest('[data-sidebar="menu-button"]')
    expect(dashboardButton).toHaveAttribute('data-active', 'true')
  })

  it('marks Vehicles as active on vehicles page', () => {
    mockPathname.mockReturnValue('/vehicles')
    renderWithProvider(<AppSidebar />)

    const vehiclesButton = screen.getByText('Vehicles').closest('[data-sidebar="menu-button"]')
    expect(vehiclesButton).toHaveAttribute('data-active', 'true')
  })
})
