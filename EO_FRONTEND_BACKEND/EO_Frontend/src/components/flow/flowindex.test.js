import { fireEvent, render, screen } from '@testing-library/react'
import { AppAtom } from 'atoms/AppAtom'
import { developerModeAtom } from 'atoms/NetworkAtom'
import { TRACKEVENTOBJ } from 'config/ActivityTrackerConfig'
import { useAtom, useAtomValue } from 'jotai'
import { useParams } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './index'
vi.mock('jotai', () => ({
  useAtom: vi.fn(),
  useAtomValue: vi.fn(),
}))
vi.mock('react-router-dom', () => ({
  useParams: vi.fn(),
}))
vi.mock('atoms/AppAtom', () => ({
  AppAtom: {},
}))
vi.mock('atoms/NetworkAtom', () => ({
  developerModeAtom: {},
  showHandlesAtom: {},
}))
vi.mock('config/ActivityTrackerConfig', () => ({
  TRACKEVENTOBJ: {
    network: {
      HideHandlesClick: vi.fn(),
      ShowHandlesClick: vi.fn(),
    },
  },
}))
vi.mock('./Flow', () => ({
  default: () => <div data-testid='flow' />,
}))
vi.mock('./NodeConfigurator', () => ({
  default: () => <div data-testid='node-configurator' />,
}))
vi.mock('./NodesList', () => ({
  default: () => <div data-testid='nodes-list' />,
}))
describe('App component', () => {
  const mockToggle = vi.fn()
  beforeEach(() => {
    vi.clearAllMocks()
    useParams.mockReturnValue({ plantId: '123' })
    useAtom.mockReturnValue([false, mockToggle])
    useAtomValue.mockImplementation((atom) => {
      if (atom === AppAtom) return { caseData: { id: 'case1' } }
      if (atom === developerModeAtom) return false
      return null
    })
  })
  it('renders right section with Flow always', async () => {
    render(<App selectedPlant={null} />)
    expect(await screen.getByTestId('flow'))?.toBeInTheDocument()
    expect(await screen.getByTestId('network-flow'))?.toBeInTheDocument()
  })
  it('renders left section when developer mode is true', async () => {
    useAtomValue.mockImplementation((atom) => {
      if (atom === developerModeAtom) return true
      if (atom === AppAtom) return { caseData: {} }
      return null
    })
    render(<App selectedPlant={null} />)
    expect(await screen.getByTestId('node-list'))?.toBeInTheDocument()
    expect(await screen.getByTestId('node-configuration'))?.toBeInTheDocument()
  })
  it('renders handles button when developer mode is true and plant is selected', async () => {
    useAtomValue.mockImplementation((atom) => {
      if (atom === developerModeAtom) return true
      if (atom === AppAtom) return { caseData: {} }
      return null
    })
    render(<App selectedPlant='plant1' />)
    expect(await screen.getByTestId('handles-button'))?.toBeInTheDocument()
  })
  it('clicking handles button triggers HideHandlesClick when show=true', () => {
    useAtom.mockReturnValue([true, mockToggle])
    useAtomValue.mockImplementation((atom) => {
      if (atom === developerModeAtom) return true
      if (atom === AppAtom) return { caseData: { id: 'case1' } }
      return null
    })
    render(<App selectedPlant='plant1' />)
    fireEvent.click(screen.getByTestId('handles-button'))
    expect(TRACKEVENTOBJ.network.HideHandlesClick).toHaveBeenCalledWith({
      params: { plantId: '123' },
      caseData: { id: 'case1' },
    })
    expect(mockToggle).toHaveBeenCalledWith(false)
  })
  it('clicking handles button triggers ShowHandlesClick when show=false', () => {
    useAtom.mockReturnValue([false, mockToggle])
    useAtomValue.mockImplementation((atom) => {
      if (atom === developerModeAtom) return true
      if (atom === AppAtom) return { caseData: { id: 'case2' } }
      return null
    })
    render(<App selectedPlant='plant1' />)
    fireEvent.click(screen.getByTestId('handles-button'))
    expect(TRACKEVENTOBJ.network.ShowHandlesClick).toHaveBeenCalledWith({
      params: { plantId: '123' },
      caseData: { id: 'case2' },
    })
    expect(mockToggle).toHaveBeenCalledWith(true)
  })
})
