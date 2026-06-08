import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import NumberedCircle from './NumberedCircle'
import styles from './NumberedCircle.module.scss'

describe('NumberedCircle Component', () => {
  it('should render correctly and handle click event', () => {
    const data = {
      region_short_name: 'TestRegion',
      count_affiliate: 5,
      regionName: 'TestRegion', // Add the missing property
      top: '10px',
      left: '20px',
      height: '30px',
      width: '40px',
    }

    const isRegionClicked = true
    const pageApiData = {
      regionName: 'TestRegion',
    }

    const handleClick = vi.fn()

    render(
      <NumberedCircle
        id='testId'
        handleClick={handleClick}
        data={data}
        isRegionClicked={isRegionClicked}
        pageApiData={pageApiData}
        dataTooltipIid='testTooltipId'
      />,
    )

    // Assertions for the rendered component
    const buttonElement = screen.getByRole('button')
    expect(buttonElement).toHaveAttribute('data-tooltip-id', 'testTooltipId')
    expect(buttonElement).toHaveStyle({
      top: '10px',
      left: '20px',
      height: '30px',
      width: '40px',
    })

    // Assertions for conditional styles based on isRegionClicked
    if (isRegionClicked && pageApiData.regionName === data.regionName) {
      expect(buttonElement).toHaveClass(styles.activeRegion)
    } else {
      expect(buttonElement).not.toHaveClass(styles.activeRegion)
    }

    // Assertions for conditional styles based on data keys
    if (Object.keys(data).includes('class')) {
      expect(buttonElement).toHaveClass(styles.subRegionLinks)
      expect(buttonElement).toHaveClass(data.class)
    } else {
      expect(buttonElement).toHaveClass(styles.regionLinks)
      expect(buttonElement).toHaveClass('text-24-bold pt-1')
    }

    // Assertions for additional styles based on data value
    if (data.value < 10) {
      expect(buttonElement).toHaveClass('pt-1')
    }

    // Click event simulation
    fireEvent.click(buttonElement)
    expect(handleClick).toHaveBeenCalledWith('TestRegion', 5)
  })
})
