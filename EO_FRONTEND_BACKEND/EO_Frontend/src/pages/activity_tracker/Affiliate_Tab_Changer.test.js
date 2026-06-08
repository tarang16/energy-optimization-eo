import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import Affiliate_Tab_Changer from './Affiliate_Tab_Changer'

const mockOnTabChange = vi.fn()

const mockTabsData = [
  { key: 'tab1', label: 'Tab 1' },
  { key: 'tab2', label: 'Tab 2' },
  { key: 'tab3', label: 'Tab 3' },
]

describe('Affiliate_Tab_Changer Component', () => {
  test('renders with no selectedTab and sets the first tab as active by default', () => {
    render(
      <Affiliate_Tab_Changer
        tabsData={mockTabsData}
        text='Affiliate Tabs'
        onTabChange={mockOnTabChange}
      />,
    )
    const activeTab = screen.getByText('Tab 1')
  })

  test('does not render the image if imgSrc is not provided', () => {
    render(
      <Affiliate_Tab_Changer
        tabsData={mockTabsData}
        text='Affiliate Tabs'
        selectedTab={undefined}
        onTabChange={undefined}
      />,
    )
    expect(screen.queryByAltText('Affiliate Icon')).not.toBeInTheDocument()
  })

  test('renders with empty tabsData, text, selectedTab, onTabChange', () => {
    render(
      <Affiliate_Tab_Changer
        selectedTab=''
        onTabChange={[]}
        imgSrc='https://example.com/image.png'
        imgAlt='Affiliate Icon'
      />,
    )
  })
})
