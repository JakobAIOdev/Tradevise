import { useParams } from 'react-router-dom'
import GroupDetailView from '../components/groups/GroupDetailView'
import GroupsOverview from '../components/groups/GroupsOverview'

export default function GroupPage() {
  const { groupId } = useParams()

  return (
    <>
      <GroupsOverview />
      {groupId && <GroupDetailView groupId={groupId} />}
    </>
  )
}
