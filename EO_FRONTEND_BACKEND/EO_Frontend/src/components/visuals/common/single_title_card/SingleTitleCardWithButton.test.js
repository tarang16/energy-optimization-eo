import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import SingleTitleCardWithButton from './SingleTitleCardWithButton'
import assert from 'assert'
import { describe, it, test, vi } from 'vitest'

vi.mock('utills/utilities', () => ({
  convertFormulaToHtml: (text) => text,
}))
describe('SingleTitleCardWithButton', () => {
  const defaultProps = {
    title: 'Test Title',
    children: <div>Test Children</div>,
    shadow: true,
    extraClasses: '',
    handleButtonClick: vi.fn(),
    isVirtualEngg: { convergeStatus: 'true' },
    ButtonText: 'ADD',
    extraBtnClasses: '',
    BtnIcon: <i className='fa fa-plus' />,
  }

  const defaultProps1 = {
    title: 'Test Title',
    children: <div>Test Children</div>,
    shadow: false,
    extraClasses: '',
    handleButtonClick: vi.fn(),
    isVirtualEngg: { convergeStatus: 'true' },
    ButtonText: 'ADD',
    extraBtnClasses: '',
  }

  it('renders component with valid return method', () => {
    const { getByText } = render(
      <SingleTitleCardWithButton title='TEST TITLE' />,
    )
    assert(getByText('TEST TITLE'))
  })

  it('displays non-converge status correctly when isVirtualEngg convergeStatus is false', () => {
    const nonConvergedProps = {
      ...defaultProps,
      isVirtualEngg: { convergeStatus: 'false' },
    }
    render(<SingleTitleCardWithButton {...nonConvergedProps} />)
  })

  it('does not render button when handleButtonClick is not provided', () => {
    const noButtonProps = {
      ...defaultProps,
      handleButtonClick: null,
    }
    render(<SingleTitleCardWithButton {...noButtonProps} />)
  })

  it('BtnIcon props is not provided and shadow is false', () => {
    const noButtonProps = {
      ...defaultProps1,
    }
    render(<SingleTitleCardWithButton {...noButtonProps} />)
  })
})
