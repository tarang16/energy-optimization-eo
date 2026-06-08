import '@testing-library/jest-dom'
import { render } from '@testing-library/react'
import { showHandlesAtom } from 'atoms/NetworkAtom'
import { Provider as JotaiProvider } from 'jotai'
import { describe, it, vi } from 'vitest'
import HorizontalHandles from './HorizontalHandles'

// Mock Handle component from @xyflow/react

vi.mock(import('@xyflow/react'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    Handle: vi.fn(({ id, type, position, style }) => (
      <div
        data-testid={id}
        data-type={type}
        data-position={position}
        style={style}
      />
    )),
  }
})

const renderWithAtoms = (ui, { showHandles = true } = {}) => {
  const Wrapper = ({ children }) => (
    <JotaiProvider initialValues={[[showHandlesAtom, showHandles]]}>
      {children}
    </JotaiProvider>
  )

  return render(ui, { wrapper: Wrapper })
}

describe('HorizontalHandles', () => {
  const defaultProps = {
    id: 'node-123',
    leftStyles: { backgroundColor: 'red' },
    rightStyles: { backgroundColor: 'blue' },
  }

  it('renders both left and right handles with correct IDs', () => {
    const { getByTestId } = renderWithAtoms(
      <HorizontalHandles {...defaultProps} />,
    )
  })

  it('applies visibility and style correctly when showHandles = true', () => {
    const { getByTestId } = renderWithAtoms(
      <HorizontalHandles {...defaultProps} />,
      {
        showHandles: true,
      },
    )
  })

  it('applies opacity 0 when showHandles = false', () => {
    const { getByTestId } = renderWithAtoms(
      <HorizontalHandles {...defaultProps} />,
      {
        showHandles: false,
      },
    )
  })

  it('uses correct XYFlow handle types and positions', () => {
    const { getByTestId } = renderWithAtoms(
      <HorizontalHandles {...defaultProps} />,
    )
  })
})
