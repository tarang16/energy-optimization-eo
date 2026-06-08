import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import SingleTitleCardExtraComponent from './SingleTitleCardWithExtraComponent'

vi.mock('utills/utilities', () => ({
  convertFormulaToHtml: vi.fn(),
}))

vi.mock(import('./SingleTitleCard.module.scss'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    card_container: 'card_container_class',
    shadow_none: 'shadow_none_class',
    card_header: 'card_header_class',
    card_header__title: 'card_header__title_class',
    card_body: 'card_body_class',
  }
})

import { convertFormulaToHtml } from 'utills/utilities'
import { beforeEach, describe, expect, test, vi } from 'vitest'

describe('SingleTitleCardExtraComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('does not render h1 when title is not provided', () => {
    render(
      <SingleTitleCardExtraComponent>
        <div data-testid='child-no-title'>NoTitleChild</div>
      </SingleTitleCardExtraComponent>,
    )

    // Assert: no heading is rendered
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull()
    // Assert: child is still rendered
    const child = screen.getByTestId('child-no-title')
    expect(child).toBeInTheDocument()
    expect(child).toHaveTextContent('NoTitleChild')
  })

  test('renders rightHtml and tabs elements correctly', () => {
    convertFormulaToHtml.mockReturnValue('X')
    const Right = () => <span data-testid='right'>RightSide</span>
    const Tab = () => <span data-testid='tab'>TabItem</span>

    render(
      <SingleTitleCardExtraComponent
        title='Z'
        rightHtml={<Right />}
        tabs={<Tab />}
      >
        <div data-testid='child-tabs'>ChildWithTabs</div>
      </SingleTitleCardExtraComponent>,
    )

    // Assert: rightHtml is rendered
    const right = screen.getByTestId('right')
    expect(right).toBeInTheDocument()
    expect(right).toHaveTextContent('RightSide')

    // Assert: tabs is rendered
    const tab = screen.getByTestId('tab')
    expect(tab).toBeInTheDocument()
    expect(tab).toHaveTextContent('TabItem')

    // Assert: child is rendered
    const child = screen.getByTestId('child-tabs')
    expect(child).toBeInTheDocument()
    expect(child).toHaveTextContent('ChildWithTabs')
  })
})
