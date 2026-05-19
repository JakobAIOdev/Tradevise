import Modal from '../modal/Modal'
import GroupDetailContent from './GroupDetailContent'

type GroupDetailsModalProps = {
  groupId: string | null
  isOpen: boolean
  onClose: () => void
}

export default function GroupDetailsModal({ groupId, isOpen, onClose }: GroupDetailsModalProps) {
  return (
    <Modal isOpen={isOpen && Boolean(groupId)} onClose={onClose}>
      {groupId && <GroupDetailContent groupId={groupId} onClose={onClose} />}
    </Modal>
  )
}
