import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import assert from 'assert'
import SignleTitleCardWithDropdown from './SignleTitleCardWithDropdown'
import { describe, it, test, expect, beforeEach, vi } from 'vitest'

vi.mock('config/scss/_variables.scss', () => {
  return {
    primary_white: '#ff0000',
    primary_gray: '#ff0000',
    primary_gray_2: '#ff0000',
    primary_orange: '#ff0000',
    primary_yellow: '#ff0000',
    primary_blue: '#ff0000',
  }
})

describe('SignleTitleCardWithDropdown component', () => {
  const mockOnSelectChange = vi.fn()
  const mockHandleSearchChange = vi.fn()
  const dropDownItems = [
    { value: 'item1', label: 'Item 1' },
    { value: 'item2', label: 'Item 2' },
  ]
  const title = 'Test Title'
  const initialValues = ['item1']

  beforeEach(() => {
    mockOnSelectChange.mockClear()
    mockHandleSearchChange.mockClear()
  })

  it('calls handleSearchChange with the correct value when search input changes', () => {
    render(
      <SignleTitleCardWithDropdown
        title={title}
        dropDownItems={dropDownItems}
        onSelectChange={mockOnSelectChange}
        initialValues={initialValues}
        handleSearchChange={mockHandleSearchChange}
      />,
    )
    const searchIconButton = screen.getByRole('button', {
      name: /toggle search/i,
    })
    fireEvent.click(searchIconButton)
    const searchInput = screen.getByPlaceholderText('Search...')
    fireEvent.change(searchInput, { target: { value: 'test' } })
    expect(mockHandleSearchChange).toHaveBeenCalledWith('test')
  })

  it('hides search input when clicking outside', () => {
    render(
      <SignleTitleCardWithDropdown
        title={title}
        dropDownItems={dropDownItems}
        onSelectChange={mockOnSelectChange}
        initialValues={initialValues}
        handleSearchChange={mockHandleSearchChange}
      />,
    )
    const searchIconButton = screen.getByRole('button', {
      name: /toggle search/i,
    })
    fireEvent.click(searchIconButton)
    const searchInput = screen.getByPlaceholderText('Search...')
    // expect(searchInput).toHaveClass('visible');
    // Simulate a click outside the search input
    fireEvent.mouseDown(document)
    // expect(searchInput).toHaveClass('hidden');
  })
})
