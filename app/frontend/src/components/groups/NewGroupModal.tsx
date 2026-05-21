import { X } from 'lucide-react'
import { useState, type SubmitEventHandler } from 'react'
import { useCreateGroup, useJoinGroup } from '../../hooks/useGroups'
import { useToast } from '../../contexts/toast'
import Modal from '../modal/Modal'
import Button from '../Button'
import SegmentedControl from '../SegmentedControl'
import TextField from '../TextField'

type GroupModalMode = 'create' | 'join'

type NewGroupModalProps = {
  isOpen: boolean
  onClose: () => void
  onGroupSelected?: (groupId: string) => void
}

const GROUP_MODAL_MODES: Array<{ value: GroupModalMode; label: string }> = [
  { value: 'create', label: 'Create group' },
  { value: 'join', label: 'Join with code' },
]

function getGroupActionErrorMessage(mode: GroupModalMode) {
  return mode === 'create'
    ? 'Could not create group. Please try again.'
    : 'Could not join group. Check the invite code and try again.'
}

export default function NewGroupModal({ isOpen, onClose, onGroupSelected }: NewGroupModalProps) {
  const [mode, setMode] = useState<GroupModalMode>('create')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const createGroup = useCreateGroup()
  const joinGroup = useJoinGroup()
  const { showMessage } = useToast()
  const isPending = createGroup.isPending || joinGroup.isPending

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault()

    try {
      const group =
        mode === 'create'
          ? await createGroup.mutateAsync(name.trim())
          : await joinGroup.mutateAsync(code.trim())

      setName('')
      setCode('')
      onClose()
      showMessage(
        mode === 'create' ? `Created group ${group.name}` : `Joined group ${group.name}`,
        'success',
      )
      onGroupSelected?.(group.id)
    } catch {
      showMessage(getGroupActionErrorMessage(mode), 'error')
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col gap-40">
        <NewGroupModalHeader onClose={onClose} />
        <GroupModeToggle mode={mode} onChange={setMode} />

        <form className="flex flex-col gap-40" onSubmit={handleSubmit}>
          {mode === 'create' ? (
            <GroupNameField value={name} onChange={setName} />
          ) : (
            <GroupCodeField value={code} onChange={setCode} />
          )}

          <Button type="submit" disabled={isPending}>
            {isPending ? 'Saving...' : mode === 'create' ? 'Create group' : 'Join group'}
          </Button>
        </form>
      </div>
    </Modal>
  )
}

function NewGroupModalHeader({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex items-start justify-between gap-16">
      <div>
        <h2 className="text-h3 font-medium text-text">New Group</h2>
        <p className="mt-4 text-small text-muted">Create a group or join one by code.</p>
      </div>
      <Button variant="secondary" size="icon" onClick={onClose} aria-label="Close">
        <X size={18} strokeWidth={1.5} />
      </Button>
    </div>
  )
}

function GroupModeToggle({
  mode,
  onChange,
}: {
  mode: GroupModalMode
  onChange: (mode: GroupModalMode) => void
}) {
  return (
    <SegmentedControl
      value={mode}
      options={GROUP_MODAL_MODES}
      onChange={(value) => onChange(value as GroupModalMode)}
    />
  )
}

function GroupNameField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <TextField
      label="Group name"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Klasse 4A"
      minLength={2}
      maxLength={40}
      required
    />
  )
}

function GroupCodeField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <TextField
      label="Group code"
      value={value}
      onChange={(event) => onChange(event.target.value.toUpperCase())}
      placeholder="ABC123"
      minLength={4}
      maxLength={12}
      inputClassName="uppercase tracking-widest"
      required
    />
  )
}
