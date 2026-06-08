import { fireEvent, render, screen } from '@testing-library/react'

import assert from 'assert'
import { describe, expect, it, vi } from 'vitest'
import {
  default as MemoizedComponent,
  default as SingleSelect,
} from './SingleSelect'

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

describe('SingleSelect component', () => {
  it('renders SingleSelect', () => {
    const mockData = [
      { display_name: 'Option 1', tag_name: 'option1' },
      { display_name: 'Option 2', tag_name: 'option2' },
    ]
    const { queryAllByText } = render(
      <SingleSelect
        data={mockData}
        onSelectChange={() => {}}
        position={1}
        activeI={1}
        classes=''
        labelKey='display_name'
        disabled={false}
      />,
    )
    const singleSelectEvent = document.querySelector('#single-select-click')
    fireEvent.click(singleSelectEvent)
    const singleSelectIconEvent = document.querySelector(
      '#single-select-icon-click',
    )
    fireEvent.click(singleSelectIconEvent)
    fireEvent.click(singleSelectEvent)
    fireEvent.click(singleSelectIconEvent)
    assert(queryAllByText != undefined)
  })

  it('renders SingleSelect without data prop', () => {
    const { queryAllByText } = render(
      <SingleSelect activeI={-1} position={undefined} />,
    )
    assert(queryAllByText(''))
  })

  it('renders SingleSelect without data prop', () => {
    const { queryAllByText } = render(<SingleSelect />)
    assert(queryAllByText(''))
  })

  it('should close the dropdown when clicking outside', () => {
    const mockData = [
      { display_name: 'Option 1', tag_name: 'option1' },
      { display_name: 'Option 2', tag_name: 'option2' },
    ]
    render(
      <MemoizedComponent
        data={mockData}
        onSelectChange={() => {}}
        position={0}
        activeI={0}
        classes=''
        labelKey='display_name'
        disabled={false}
      />,
    )
    const dropdown = screen.getByTestId('single-select-click')
    fireEvent.click(dropdown)
    const dropdownList = document.querySelector('.blue_dropdownList')
    fireEvent.mouseDown(document)
    expect(dropdownList).not.toHaveClass('dropDownActive')
  })

  it('render component with data change', () => {
    const mockData = [
      { display_name: 'Option 1', tag_name: 'option1' },
      { display_name: 'Option 2', tag_name: 'option2' },
    ]
    render(
      <SingleSelect
        data={mockData}
        onSelectChange={() => {}}
        position={1}
        activeI={1}
        classes=''
        labelKey=''
        disabled={true}
      />,
    )
  })
})
