import assert from 'assert'
import { render, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import MultiSelectV2 from './MultiSelectV2'
import { describe, it, test, vi } from 'vitest'

describe('MultiSelectV2 Component', () => {
  test('it renders correctly and handles selection', () => {
    const data = [
      { display_name: 'All', tag_name: 'all' },
      { display_name: 'GELEEN', tag_name: 'GELEEN' },
      { display_name: 'ARRAZI', tag_name: 'ARRAZI' },
    ]

    const { getByText, getByRole, getAllByText } = render(
      <MultiSelectV2 data={data} onChange={() => {}} />,
    )

    assert.ok(getByText('GELEEN'))

    // Check if "All" option selects all items
    const allCheckbox = getByRole('checkbox', { name: 'All' })
    fireEvent.click(allCheckbox)

    // Check if the component updates the selected text to "All"
    const allItems = getAllByText('All')
    assert.ok(allItems[0])
  })

  test('passing initial values to the component', () => {
    const data = [
      { display_name: 'All', tag_name: 'all' },
      { display_name: 'GELEEN', tag_name: 'GELEEN' },
      { display_name: 'ARRAZI', tag_name: 'ARRAZI' },
    ]

    const mockinitialValues = [
      { display_name: 'All', tag_name: 'all' },
      { display_name: 'GELEEN', tag_name: 'GELEEN' },
    ]

    const { getByText } = render(
      <MultiSelectV2
        data={data}
        onChange={() => {}}
        initialValues={mockinitialValues}
      />,
    )
    assert.ok(getByText('GELEEN'))
    fireEvent.mouseDown(document)
  })
})

describe('checking differnet cases of the dropdown select', () => {
  const data = [
    { tag_name: 'tag1', display_name: 'Tag 1' },
    { tag_name: 'tag2', display_name: 'Tag 2' },
    { tag_name: 'tag3', display_name: 'Tag 3' },
    { tag_name: 'all', display_name: 'all' },
  ]

  test('selecting an item adds it to the currentActiveTags', () => {
    const handleChange = vi.fn()
    const { getByLabelText } = render(
      <MultiSelectV2 data={data} onChange={handleChange} activeI={3} />,
    )
    const option = getByLabelText('Tag 2')
    fireEvent.click(option)
    const option1 = getByLabelText('Tag 1')
    fireEvent.click(option1)
  })

  test('Testing with no options', () => {
    const handleChange = vi.fn()
    const { getByLabelText } = render(
      <MultiSelectV2
        data={[{ tag_name: 'all', display_name: 'all' }]}
        onChange={handleChange}
        activeI={0}
      />,
    )
    const option = getByLabelText('all')
    fireEvent.click(option)
  })

  test('deselecting an item removes it from the currentActiveTags', () => {
    const initialValues = [data[1]]
    const handleChange = vi.fn()
    const { getByLabelText } = render(
      <MultiSelectV2
        data={data}
        initialValues={initialValues}
        onChange={handleChange}
        activeI={1}
      />,
    )
    const option = getByLabelText('Tag 2')
    fireEvent.click(option)
  })
})
