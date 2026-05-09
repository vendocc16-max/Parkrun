import { getAllSiteContent } from '@/lib/site-content'
import { ContentEditor } from './ContentEditor'

export const metadata = { title: 'Content | Parkrun Admin' }

export default async function ContentPage() {
  const content = await getAllSiteContent()

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-park-dark">Content</h1>
        <p className="mt-1 text-park-muted">
          Edit public page copy. Saved changes publish immediately.
        </p>
      </div>

      <ContentEditor initialContent={content} />
    </div>
  )
}
