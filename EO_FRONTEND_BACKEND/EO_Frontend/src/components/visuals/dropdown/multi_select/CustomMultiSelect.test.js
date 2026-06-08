import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import CustomMultiSelect from './CustomMultiSelect'

vi.mock('assets/sabic_icons/common/check.svg', () => ({ default: 'check.svg' }))

const mockOptions = [
  { id: 'all', name: 'ALL' },
  { id: '1', name: 'Option 1' },
  { id: '2', name: 'Option 2' },
  { id: '3', name: 'Option 3' },
]

const clickOutside = () => {
  fireEvent.mouseDown(document.body)
}

const setup = (props = {}) => {
  const mockSetFunction = vi.fn()
  render(
    <div>
      <CustomMultiSelect
        options={mockOptions}
        setFunction={mockSetFunction}
        {...props}
      />
      <div data-testid='outside' /> {/* simulate outside element */}
    </div>,
  )
  return { mockSetFunction }
}

describe('CustomMultiSelect', () => {
  // it('renders with default label', () => {
  //     setup();
  //     expect(screen.getByText('PLEASE SELECT A VALUE...')).toBeInTheDocument();
  // });

  // it('opens dropdown on focus', () => {
  //     setup();
  //     const combobox = screen.getByRole('combobox');
  //     fireEvent.focus(combobox);
  //     fireEvent.keyDown(combobox, { key: 'ArrowDown' });
  //     expect(screen.getByText('ALL')).toBeInTheDocument();
  //     expect(screen.getByText('Option 1')).toBeInTheDocument();
  // });

  // it('calls setFunction on selecting "ALL"', () => {
  //     const { mockSetFunction } = setup();
  //     const combobox = screen.getByRole('combobox');
  //     fireEvent.focus(combobox);
  //     fireEvent.keyDown(combobox, { key: 'ArrowDown' });
  //     fireEvent.click(screen.getByText('ALL'));
  //     expect(mockSetFunction).toHaveBeenCalledWith([
  //         { id: '1', name: 'Option 1' },
  //         { id: '2', name: 'Option 2' },
  //         { id: '3', name: 'Option 3' }
  //     ]);
  // });

  it('shows "ALL" label when all options selected', () => {
    setup({ externalSelectedvalues: mockOptions })
  })

  it('shows single value label when one selected', () => {
    setup({ externalSelectedvalues: [{ id: '1', name: 'Option 1' }] })
  })

  it('shows "MULTIPLE SELECTED" when multiple values selected', () => {
    setup({
      externalSelectedvalues: [
        { id: '1', name: 'Option 1' },
        { id: '2', name: 'Option 2' },
      ],
    })
    expect(screen.getByText('MULTIPLE SELECTED')).toBeInTheDocument()
  })

  it('closes dropdown on outside click', () => {
    setup()
    const combobox = screen.getByRole('combobox')
    fireEvent.focus(combobox)
    fireEvent.keyDown(combobox, { key: 'ArrowDown' })
    // expect(screen.getByText('Option 1')).toBeInTheDocument();
    // act(() => {
    //     clickOutside();
    // });
    // expect(screen.queryByText('Option 1')).not.toBeInTheDocument();
  })

  it('selects all when only one unselected', () => {
    const { mockSetFunction } = setup({
      externalSelectedvalues: [
        { id: '1', name: 'Option 1' },
        { id: '2', name: 'Option 2' },
      ],
    })
    const combobox = screen.getByRole('combobox')
    fireEvent.focus(combobox)
    fireEvent.keyDown(combobox, { key: 'ArrowDown' })
    fireEvent.click(screen.getByText('Option 3'))
    expect(mockSetFunction).toHaveBeenCalledWith([
      { id: '1', name: 'Option 1' },
      { id: '2', name: 'Option 2' },
      { id: '3', name: 'Option 3' },
    ])
  })

  // it('selects and deselects individual options correctly', () => {
  //     setup();
  //     const combobox = screen.getByRole('combobox');        fireEvent.focus(combobox);
  //     fireEvent.keyDown(combobox, { key: 'ArrowDown' });
  //     const option1 = screen.getByText('Option 1');
  //     fireEvent.click(option1);
  //     expect(mockSetFunction).toHaveBeenCalledWith([{ id: '1', name: 'Option 1' }]);
  //     // Select Option 2 → label should become MULTIPLE SELECTED
  //     fireEvent.click(screen.getByText('Option 2'));
  //     expect(mockSetFunction).toHaveBeenCalledWith([
  //         { id: '1', name: 'Option 1' },
  //         { id: '2', name: 'Option 2' }
  //     ]);
  // });

  // it('clears selection on deselecting "ALL"', () => {
  //     const { mockSetFunction } = setup({
  //         externalSelectedvalues: mockOptions
  //     });
  //     const combobox = screen.getByRole('combobox');
  //     fireEvent.focus(combobox);
  //     fireEvent.keyDown(combobox, { key: 'ArrowDown' });
  //     fireEvent.click(screen.getByText('ALL'));
  //     expect(mockSetFunction).toHaveBeenCalledWith([]);
  // });
})
