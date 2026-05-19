import { useNavigate } from 'react-router-dom'
import GroupDetailsModal from './GroupDetailsModal'

type GroupDetailViewProps = {
  groupId: string
}

export default function GroupDetailView({ groupId }: GroupDetailViewProps) {
  const navigate = useNavigate()

  return <GroupDetailsModal groupId={groupId} isOpen onClose={() => navigate('/groups')} />
}
