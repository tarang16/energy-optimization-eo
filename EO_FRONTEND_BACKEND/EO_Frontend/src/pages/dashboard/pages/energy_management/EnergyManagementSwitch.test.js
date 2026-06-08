import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import * as ReactRouterDom from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import EnergyManagementSwitch from './EnergyManagementSwitch'

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

// Mocking useParams

vi.mock(import('react-router-dom'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useParams: vi.fn(),
  }
})
vi.mock(import('logger/Logger'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    // your mocked methods
  }
})

describe('EnergyManagementSwitch', () => {
  beforeEach(() => {
    // Clean up before each test
    vi.clearAllMocks()
  })

  it('renders the valid tile component when key matches', () => {
    ReactRouterDom.useParams.mockReturnValue({ key: 'validKey' })

    render(<EnergyManagementSwitch />)
  })

  it('renders "Invalid Url." when key is invalid or missing', () => {
    ReactRouterDom.useParams.mockReturnValue({ key: 'invalidKey' })

    render(<EnergyManagementSwitch />)

    expect(screen.getByText('Invalid Url.')).toBeInTheDocument()
  })

  it('renders "Invalid Url." when params are undefined', () => {
    ReactRouterDom.useParams.mockReturnValue(undefined)

    render(<EnergyManagementSwitch />)

    expect(screen.getByText('Invalid Url.')).toBeInTheDocument()
  })

  it('renders "Invalid Url." when key is missing in params', () => {
    ReactRouterDom.useParams.mockReturnValue({})

    render(<EnergyManagementSwitch />)

    expect(screen.getByText('Invalid Url.')).toBeInTheDocument()
  })
})
