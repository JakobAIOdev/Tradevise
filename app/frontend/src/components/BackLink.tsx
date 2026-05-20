import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import Button from './Button'

export default function BackLink() {
  const navigate = useNavigate()

  const goBack = () => {
    navigate(-1)
  }

  return (
    <Button variant="ghost" size="none" onClick={goBack} className="gap-1 hover:bg-transparent">
      <ChevronLeft size={20} strokeWidth={1.5} className="text-muted" />
      <span className="text-muted text-body ">Back</span>
    </Button>
  )
}
