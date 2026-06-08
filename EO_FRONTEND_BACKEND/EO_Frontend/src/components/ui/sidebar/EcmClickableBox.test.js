import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import EcmClickableBox from './EcmClickableBox'

describe('EcmClickableBox', () => {
  const mockHandleFolderClick = vi.fn()
  const data = { label: 'Test Folder', data: 'folderData' }

  it('renders correctly and handles clicks', () => {
    const { getByText, getByRole } = render(
      <EcmClickableBox
        handleFolderClick={mockHandleFolderClick}
        data={data}
        parentData={null}
      />,
    )

    const folderIcon = getByRole('img', { name: /folder_icon.svg/i })
    const folderLabel = getByText(/Test Folder/i)

    expect(folderIcon).toBeInTheDocument()
    expect(folderLabel).toBeInTheDocument()

    fireEvent.click(folderIcon)
    expect(mockHandleFolderClick).toHaveBeenCalledWith(data.data, null)

    fireEvent.click(folderLabel)
    expect(mockHandleFolderClick).toHaveBeenCalledWith(data.data, null)
  })
})
