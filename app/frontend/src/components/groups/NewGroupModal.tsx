import { X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useCreateGroup, useJoinGroup } from '../../hooks/useGroups'
import Modal from '../modal/Modal'

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

export default function NewGroupModal({ isOpen, onClose, onGroupSelected }: NewGroupModalProps) {
  const [mode, setMode] = useState<GroupModalMode>('create')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const createGroup = useCreateGroup()
  const joinGroup = useJoinGroup()
  const isPending = createGroup.isPending || joinGroup.isPending

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    try {
      const group =
        mode === 'create'
          ? await createGroup.mutateAsync(name.trim())
          : await joinGroup.mutateAsync(code.trim())

      setName('')
      setCode('')
      onClose()
      onGroupSelected?.(group.id)
    } catch {
      setError(mode === 'create' ? 'Could not create group.' : 'Could not join group.')
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col gap-40">
        <NewGroupModalHeader onClose={onClose} />
        <GroupModeToggle
          mode={mode}
          onChange={(nextMode) => {
            setMode(nextMode)
            setError(null)
          }}
        />

        <form className="flex flex-col gap-40" onSubmit={handleSubmit}>
          {mode === 'create' ? (
            <GroupNameField value={name} onChange={setName} />
          ) : (
            <GroupCodeField value={code} onChange={setCode} />
          )}

          {error && <p className="text-small font-semibold text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={isPending}
            className="flex items-center justify-center rounded-lg bg-text px-25 py-3 font-bold text-surface disabled:cursor-not-allowed disabled:opacity-60 hover:opacity-90 hover:cursor-pointer"
          >
            {isPending ? 'Saving...' : mode === 'create' ? 'Create group' : 'Join group'}
          </button>
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
      <button
        type="button"
        onClick={onClose}
        className="rounded-lg border border-border p-2 text-text transition-colors hover:cursor-pointer hover:bg-surface-hover"
        aria-label="Close"
      >
        <X size={18} strokeWidth={1.5} />
      </button>
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
    <div className="grid grid-cols-2 gap-1.5 rounded-[20px] bg-surface-hover p-1.5">
      {GROUP_MODAL_MODES.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`rounded-[14px] py-3 text-body transition-colors hover:cursor-pointer ${
            mode === option.value
              ? 'bg-surface font-bold text-text'
              : 'text-muted hover:bg-surface/60'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

function GroupNameField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <label className="flex flex-col gap-6">
      <span className="text-small text-muted">Group name</span>
      <input
        className="h-13 rounded-lg border border-border bg-surface px-5 text-body text-text outline-none focus:border-text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Klasse 4A"
        minLength={2}
        maxLength={40}
        required
      />
    </label>
  )
}

function GroupCodeField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <label className="flex flex-col gap-6">
      <span className="text-small text-muted">Group code</span>
      <input
        className="h-13 rounded-lg border border-border bg-surface px-5 text-body uppercase tracking-widest text-text outline-none focus:border-text"
        value={value}
        onChange={(event) => onChange(event.target.value.toUpperCase())}
        placeholder="ABC123"
        minLength={4}
        maxLength={12}
        required
      />
    </label>
  )
}
