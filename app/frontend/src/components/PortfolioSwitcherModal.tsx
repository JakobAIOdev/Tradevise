import { CheckCircle2, ChevronRight, Circle, LogOut, Pencil, Plus, X } from 'lucide-react'
import { useState } from 'react'
import { useToast } from '../contexts/toast'
import { useLogout } from '../hooks/useLogout'
import {
  useCreatePortfolio,
  useDeletePortfolio,
  usePortfolios,
  useSetActivePortfolio,
  useUpdatePortfolio,
} from '../hooks/usePortfolios'
import type { PortfolioSummary } from '../types'
import { formatMoney } from '../utils/format'
import Modal from './modal/Modal'

type PortfolioSwitcherModalProps = {
  isOpen: boolean
  onClose: () => void
}

type PortfolioListProps = {
  activePortfolioId?: string
  portfolios: PortfolioSummary[]
  newPortfolioName: string
  isCreating: boolean
  isLoggingOut: boolean
  onCreate: () => void
  onEdit: (portfolio: PortfolioSummary) => void
  onLogout: () => void
  onNameChange: (name: string) => void
  onSelect: (portfolio: PortfolioSummary) => void
}

type PortfolioSettingsProps = {
  name: string
  isDeleting: boolean
  isSaving: boolean
  onApply: () => void
  onDelete: () => void
  onNameChange: (name: string) => void
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

export default function PortfolioSwitcherModal({ isOpen, onClose }: PortfolioSwitcherModalProps) {
  const { data } = usePortfolios()
  const createPortfolio = useCreatePortfolio()
  const deletePortfolio = useDeletePortfolio()
  const logout = useLogout()
  const setActivePortfolio = useSetActivePortfolio()
  const updatePortfolio = useUpdatePortfolio()
  const { showMessage } = useToast()
  const [newPortfolioName, setNewPortfolioName] = useState('')
  const [editingPortfolio, setEditingPortfolio] = useState<PortfolioSummary | null>(null)
  const [editName, setEditName] = useState('')

  const portfolios = data?.portfolios ?? []
  const isSettingsOpen = Boolean(editingPortfolio)

  function handleClose() {
    setEditingPortfolio(null)
    setEditName('')
    onClose()
  }

  function handleCreatePortfolio() {
    const name = newPortfolioName.trim()
    if (!name) return

    createPortfolio.mutate(name, {
      onSuccess: (portfolio) => {
        setNewPortfolioName('')
        showMessage(`Created ${portfolio.name}`, 'success')
      },
      onError: (error) => {
        showMessage(getErrorMessage(error, 'Could not create portfolio'), 'error')
      },
    })
  }

  function handleEditPortfolio(portfolio: PortfolioSummary) {
    setEditingPortfolio(portfolio)
    setEditName(portfolio.name)
  }

  function handleApplySettings() {
    const name = editName.trim()
    if (!editingPortfolio || !name) return

    updatePortfolio.mutate(
      {
        portfolioId: editingPortfolio.id,
        name,
      },
      {
        onSuccess: (portfolio) => {
          setEditingPortfolio(null)
          setEditName('')
          showMessage(`Updated ${portfolio.name}`, 'success')
        },
        onError: (error) => {
          showMessage(getErrorMessage(error, 'Could not update portfolio'), 'error')
        },
      },
    )
  }

  function handleDeletePortfolio() {
    if (!editingPortfolio) return

    deletePortfolio.mutate(editingPortfolio.id, {
      onSuccess: () => {
        showMessage(`Deleted ${editingPortfolio.name}`, 'success')
        setEditingPortfolio(null)
        setEditName('')
      },
      onError: (error) => {
        showMessage(getErrorMessage(error, 'Could not delete portfolio'), 'error')
      },
    })
  }

  function handleLogout() {
    logout.mutate(undefined, {
      onSettled: handleClose,
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <section className="relative text-text">
        <CloseButton onClose={handleClose} />

        {isSettingsOpen ? (
          <PortfolioSettingsView
            name={editName}
            isDeleting={deletePortfolio.isPending}
            isSaving={updatePortfolio.isPending}
            onApply={handleApplySettings}
            onDelete={handleDeletePortfolio}
            onNameChange={setEditName}
          />
        ) : (
          <PortfolioListView
            activePortfolioId={data?.activePortfolioId}
            portfolios={portfolios}
            newPortfolioName={newPortfolioName}
            isCreating={createPortfolio.isPending}
            isLoggingOut={logout.isPending}
            onCreate={handleCreatePortfolio}
            onEdit={handleEditPortfolio}
            onLogout={handleLogout}
            onNameChange={setNewPortfolioName}
            onSelect={(portfolio) => {
              setActivePortfolio.mutate(portfolio.id, {
                onSuccess: () => {
                  showMessage(`Switched to ${portfolio.name}`, 'success')
                  handleClose()
                },
                onError: (error) => {
                  showMessage(getErrorMessage(error, 'Could not switch portfolio'), 'error')
                },
              })
            }}
          />
        )}
      </section>
    </Modal>
  )
}

function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label="Close portfolios"
      className="absolute top-0 right-0 rounded-lg border border-border p-2 text-text transition-colors hover:cursor-pointer hover:bg-surface-hover"
    >
      <X size={18} strokeWidth={1.5} />
    </button>
  )
}

function ModalHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 className="text-[32px] leading-tight font-bold text-text md:text-[36px]">{title}</h2>
      <p className="mt-1 text-body text-muted">{subtitle}</p>
    </div>
  )
}

function PortfolioListView({
  activePortfolioId,
  portfolios,
  newPortfolioName,
  isCreating,
  isLoggingOut,
  onCreate,
  onEdit,
  onLogout,
  onNameChange,
  onSelect,
}: PortfolioListProps) {
  return (
    <>
      <ModalHeading title="Portfolios" subtitle="Manage all of your profiles" />

      <div className="mx-auto mt-40 flex w-full max-w-83.75 flex-col gap-3">
        {portfolios.map((portfolio) => (
          <PortfolioRow
            key={portfolio.id}
            portfolio={portfolio}
            isActive={portfolio.id === activePortfolioId}
            onEdit={onEdit}
            onSelect={onSelect}
          />
        ))}

        <CreatePortfolioForm
          value={newPortfolioName}
          isPending={isCreating}
          onChange={onNameChange}
          onSubmit={onCreate}
        />

        <LogoutButton isPending={isLoggingOut} onClick={onLogout} />
      </div>
    </>
  )
}

function PortfolioRow({
  portfolio,
  isActive,
  onEdit,
  onSelect,
}: {
  portfolio: PortfolioSummary
  isActive: boolean
  onEdit: (portfolio: PortfolioSummary) => void
  onSelect: (portfolio: PortfolioSummary) => void
}) {
  function selectPortfolio() {
    if (!isActive) onSelect(portfolio)
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={selectPortfolio}
      onKeyDown={(event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return
        event.preventDefault()
        selectPortfolio()
      }}
      className={`grid min-h-15.5 grid-cols-[36px_minmax(0,1fr)_24px] items-center gap-3 rounded-xl border px-5 text-left transition-colors ${
        isActive
          ? 'border-border bg-surface-hover'
          : 'cursor-pointer border-border bg-surface hover:bg-surface-hover'
      }`}
    >
      <span className="size-9 rounded-full bg-border" />
      <span className="min-w-0">
        <span className="flex min-w-0 items-center gap-1">
          <span className="truncate text-body font-semibold text-text">{portfolio.name}</span>
          <button
            type="button"
            aria-label={`Edit ${portfolio.name}`}
            onClick={(event) => {
              event.stopPropagation()
              onEdit(portfolio)
            }}
            className="shrink-0 rounded-sm p-0.5 text-muted hover:cursor-pointer hover:text-text"
          >
            <Pencil size={13} strokeWidth={1.7} />
          </button>
        </span>
        <span className="block truncate text-small text-bullish">
          {formatMoney(portfolio.totalValue ?? portfolio.cash)}
        </span>
      </span>
      {isActive ? (
        <CheckCircle2 size={22} strokeWidth={2.2} className="text-muted" />
      ) : (
        <Circle size={22} strokeWidth={1.4} className="text-border" />
      )}
    </div>
  )
}

function CreatePortfolioForm({
  value,
  isPending,
  onChange,
  onSubmit,
}: {
  value: string
  isPending: boolean
  onChange: (value: string) => void
  onSubmit: () => void
}) {
  return (
    <div className="mt-3 flex gap-2">
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') onSubmit()
        }}
        placeholder="New portfolio name"
        className="h-11 min-w-0 flex-1 rounded-lg border border-border bg-surface px-4 text-small text-text outline-none focus:border-text"
      />
      <button
        type="button"
        onClick={onSubmit}
        disabled={!value.trim() || isPending}
        className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-text text-surface hover:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Create portfolio"
      >
        <Plus size={18} strokeWidth={2} />
      </button>
    </div>
  )
}

function LogoutButton({
  isPending,
  onClick,
}: {
  isPending: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isPending}
      className="mt-3 flex h-11 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 text-small font-semibold text-bearish transition-colors hover:cursor-pointer hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
    >
      <LogOut size={16} strokeWidth={1.8} />
      Logout
    </button>
  )
}

function PortfolioSettingsView({
  name,
  isDeleting,
  isSaving,
  onApply,
  onDelete,
  onNameChange,
}: PortfolioSettingsProps) {
  return (
    <>
      <ModalHeading title="Settings" subtitle="Edit your portfolio" />

      <div className="mt-8 flex min-h-48 flex-col justify-between">
        <label className="flex flex-col gap-2">
          <span className="text-small text-text">Profile</span>
          <input
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') onApply()
            }}
            className="h-11 rounded-lg border border-border bg-surface px-5 text-body text-text outline-none focus:border-text"
          />
          <span className="text-small-mobile text-muted">Change your portfolio display name</span>
        </label>

        <div className="flex items-center justify-between pt-10">
          <button
            type="button"
            onClick={onDelete}
            disabled={isDeleting}
            className="flex items-center gap-1 text-small text-bearish hover:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          >
            Delete
            <ChevronRight size={14} strokeWidth={1.8} />
          </button>
          <button
            type="button"
            onClick={onApply}
            disabled={!name.trim() || isSaving}
            className="flex items-center gap-2 rounded-lg bg-text px-7 py-3 text-small font-bold text-surface hover:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          >
            Apply
            <ChevronRight size={14} strokeWidth={2} />
          </button>
        </div>
      </div>
    </>
  )
}
