import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

export default function BackLink() {
  const navigate = useNavigate()

  const goBack = () => {
    navigate(-1)
  }

  return (
    <button onClick={goBack} className="flex items-center cursor-pointer gap-1">
      <ChevronLeft size={20} strokeWidth={1.5} className="text-muted" />
      <span className="text-muted text-body ">Back</span>
    </button>
  )
}
