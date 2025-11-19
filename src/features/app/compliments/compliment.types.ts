export interface FeedCompliment {
  id: string
  sender: {
    id: string
    name: string
    avatar: string | null
    department: string | null
  }
  receiver: {
    id: string
    name: string
    avatar: string | null
    department: string | null
  }
  companyValue: {
    id: number
    title: string
    iconName: string | null
    iconColor: string | null
  }
  coins: number
  message: string
  createdAt: string
  timeAgo: string
}
