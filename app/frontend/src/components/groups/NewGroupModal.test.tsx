import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import NewGroupModal from './NewGroupModal'

const mocks = vi.hoisted(() => ({
  onClose: vi.fn(),
  onGroupSelected: vi.fn(),
  showMessage: vi.fn(),
  createGroup: vi.fn(),
  joinGroup: vi.fn(),
}))

vi.mock('../../contexts/toast', () => ({
  useToast: () => ({
    showMessage: mocks.showMessage,
  }),
}))

vi.mock('../../hooks/useGroups', () => ({
  useCreateGroup: () => ({
    mutateAsync: mocks.createGroup,
    isPending: false,
  }),
  useJoinGroup: () => ({
    mutateAsync: mocks.joinGroup,
    isPending: false,
  }),
}))

function renderNewGroupModal(initialMode?: 'create' | 'join') {
  return render(
    <NewGroupModal
      isOpen={true}
      initialMode={initialMode}
      onClose={mocks.onClose}
      onGroupSelected={mocks.onGroupSelected}
    />,
  )
}

describe('NewGroupModal', () => {
  beforeEach(() => {
    mocks.onClose.mockReset()
    mocks.onGroupSelected.mockReset()
    mocks.showMessage.mockReset()
    mocks.createGroup.mockReset()
    mocks.joinGroup.mockReset()

    mocks.createGroup.mockResolvedValue({
      id: 'group-1',
      name: 'Test Group',
    })

    mocks.joinGroup.mockResolvedValue({
      id: 'group-2',
      name: 'Joined Group',
    })
  })

  it('creates a group with the entered name', async () => {
    renderNewGroupModal()

    fireEvent.change(screen.getByLabelText(/group name/i), {
      target: { value: 'My Group' },
    })

    const createButtons = screen.getAllByRole('button', { name: /^create group$/i })
    fireEvent.click(createButtons[createButtons.length - 1])

    await waitFor(() => {
      expect(mocks.createGroup).toHaveBeenCalledWith('My Group')
    })
  })

  it('shows the group code field when switching to join mode', () => {
    renderNewGroupModal('join')

    expect(screen.getByLabelText(/group code/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /join group/i })).toBeInTheDocument()
  })

  it('converts the group code to uppercase', () => {
    renderNewGroupModal('join')

    const input = screen.getByLabelText(/group code/i)
    fireEvent.change(input, {
      target: { value: 'abc123' },
    })

    expect(input).toHaveValue('ABC123')
  })

  it('joins a group with the entered code', async () => {
    renderNewGroupModal('join')

    fireEvent.change(screen.getByLabelText(/group code/i), {
      target: { value: 'abc123' },
    })

    fireEvent.click(screen.getByRole('button', { name: /^join group$/i }))

    await waitFor(() => {
      expect(mocks.joinGroup).toHaveBeenCalledWith('ABC123')
    })
  })
})
