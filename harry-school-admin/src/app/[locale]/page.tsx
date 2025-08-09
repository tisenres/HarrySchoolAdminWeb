import { redirect } from 'next/navigation'

interface HomePageProps {
  params: {
    locale: string
  }
}

export default function HomePage({ params }: HomePageProps) {
  // Redirect to login page with current locale
  redirect(`/${params.locale}/login`)
}