import React from 'react'
import { render, screen } from '@testing-library/react'
import LBMIterationTable from './LBMIterationTable'
import { describe, it, test, expect } from 'vitest'
import '@testing-library/jest-dom'

describe('LBMIterationTable component', () => {
  const headers = ['ITERATION', 'TAG NAME', 'MIN', 'MAX', 'ACTION']
  const tableData = [
    [
      '1 iteration_dummy_text_for_sort_function',
      'AR.AR5.DCS.UTILITY.TI5690.PV (DEGC)',
      '5',
      '5',
      <div className='CaseConfigurationPortal_img__t204n text-center'>
        <img
          id='edit-6476-1-246-69313'
          data-testid='edit-6476-1-246-69313'
          src='/peeoui/static/media/edit_default_icon.0f4814e4463c5540b07f9b1976c79005.svg'
          className='cursor-pointer  CaseConfigurationPortal_lbmEditIcon__IOg8y'
        />
      </div>,
    ],
    [
      '1 iteration_dummy_text_for_sort_function',
      'BOILER_LOAD_A (% )',
      '5',
      '5',
      <div className='CaseConfigurationPortal_img__t204n text-center'>
        <img
          id='edit-6652-1-246-69490'
          data-testid='edit-6652-1-246-69490'
          src='/peeoui/static/media/edit_default_icon.0f4814e4463c5540b07f9b1976c79005.svg'
          className='cursor-pointer  CaseConfigurationPortal_lbmEditIcon__IOg8y'
        />
      </div>,
    ],
  ]

  const rowspanDict = {
    '1 iteration_dummy_text_for_sort_function': [2, 1],
  }
  const rowspanColumn = 0
  const secondaryRowspanColumn = 4

  // Rendering test
  test('renders component correctly with given props', () => {
    const { container } = render(
      <LBMIterationTable
        showLoader={false}
        headers={headers}
        tableData={tableData}
        rowspanDict={rowspanDict}
        rowspanColumn={rowspanColumn}
        secondaryRowspanColumn={secondaryRowspanColumn}
      />,
    )
    const textElement = screen.getByText('ITERATION')
    expect(textElement).toBeInTheDocument()
  })
})
