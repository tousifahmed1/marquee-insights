import { createFileRoute } from '@tanstack/react-router'

import { PageIntro } from '@/components/page-intro'

export const Route = createFileRoute('/contact')({
  head: () => ({ meta: [{ title: 'Contact | Marquee Insights' }] }),
  component: ContactPage,
})

function ContactPage() {
  return (
    <PageIntro title="Contact">
      <p>Tell us what you want to understand about your audience. A contact form is coming soon.</p>
    </PageIntro>
  )
}
