'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import {
  Megaphone,
  PlusCircle,
  Edit,
  Trash2,
  Pin,
  Image as ImageIcon,
  Link as LinkIcon,
  Archive,
  CheckCircle,
  Eye,
  AlertCircle
} from 'lucide-react'

import { Database } from '@/types/database.types'

type Announcement = Database['public']['Tables']['announcements']['Row']

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  // Form State
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState<Announcement['category']>('Notice')
  const [priority, setPriority] = useState<Announcement['priority']>('Medium')
  const [status, setStatus] = useState<Announcement['status']>('Draft')
  const [imageUrl, setImageUrl] = useState('')
  const [externalUrl, setExternalUrl] = useState('')
  const [pinned, setPinned] = useState(false)
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [previewData, setPreviewData] = useState<Announcement | null>(null)

  const supabase = createClient()

  const loadAnnouncements = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false })
    
    if (data) setAnnouncements(data as Announcement[])
    setLoading(false)
  }

  useEffect(() => {
    loadAnnouncements()
  }, [])

  const resetForm = () => {
    setEditingId(null)
    setTitle('')
    setContent('')
    setCategory('Notice')
    setPriority('Medium')
    setStatus('Draft')
    setImageUrl('')
    setExternalUrl('')
    setPinned(false)
  }

  const handleEdit = (item: Announcement) => {
    setEditingId(item.id)
    setTitle(item.title)
    setContent(item.content)
    setCategory(item.category)
    setPriority(item.priority)
    setStatus(item.status)
    setImageUrl(item.image_url || '')
    setExternalUrl(item.external_url || '')
    setPinned(item.pinned)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return
    const { error } = await supabase.from('announcements').delete().eq('id', id)
    if (!error) loadAnnouncements()
  }

  const handleTogglePin = async (item: Announcement) => {
    const { error } = await supabase
      .from('announcements')
      .update({ pinned: !item.pinned })
      .eq('id', item.id)
    if (!error) loadAnnouncements()
  }

  const handleTogglePublish = async (item: Announcement) => {
    const newStatus = item.status === 'Published' ? 'Draft' : 'Published'
    const newPublishedDate = newStatus === 'Published' ? new Date().toISOString() : null
    
    const { error } = await supabase
      .from('announcements')
      .update({ status: newStatus, published_date: newPublishedDate })
      .eq('id', item.id)
    if (!error) loadAnnouncements()
  }

  const handlePreview = (item: Announcement) => {
    setPreviewData(item)
    setIsPreviewModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const payload = {
      title,
      content,
      category,
      priority,
      status,
      image_url: imageUrl || null,
      external_url: externalUrl || null,
      pinned,
      author_id: user.id,
      published_date: status === 'Published' ? new Date().toISOString() : null
    }

    if (editingId) {
      await supabase.from('announcements').update(payload).eq('id', editingId)
    } else {
      await supabase.from('announcements').insert(payload)
    }

    setIsSubmitting(false)
    setIsModalOpen(false)
    resetForm()
    loadAnnouncements()
  }

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Urgent': return 'bg-red-500/10 text-red-400 border-red-500/30'
      case 'Event': return 'bg-amber-500/10 text-amber-400 border-amber-500/30'
      case 'Exam': return 'bg-purple-500/10 text-purple-400 border-purple-500/30'
      case 'Update': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
      default: return 'bg-blue-500/10 text-blue-400 border-blue-500/30'
    }
  }

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="space-y-6 animate-fadeIn">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-wide flex items-center gap-2">
              <Megaphone className="w-7 h-7 text-emerald-400" /> Site <span className="glow-heading">Announcements</span>
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Manage platform-wide notices, urgent alerts, and events.
            </p>
          </div>
          <Button onClick={() => { resetForm(); setIsModalOpen(true); }} className="text-xs">
            <PlusCircle className="w-4 h-4" /> Create Announcement
          </Button>
        </div>

        <div className="lms-card overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-sm text-[var(--text-secondary)]">Loading announcements...</div>
          ) : announcements.length === 0 ? (
            <div className="p-10 text-center text-sm text-[var(--text-secondary)] flex flex-col items-center gap-2">
              <AlertCircle className="w-8 h-8 opacity-50" />
              No announcements found. Create one to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-[var(--text-secondary)]">
                <thead className="text-xs uppercase bg-[var(--bg-secondary)] text-[var(--text-primary)] border-b border-[var(--blue-border)]/30">
                  <tr>
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Pinned</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {announcements.map((item) => (
                    <tr key={item.id} className="border-b border-[var(--blue-border)]/10 hover:bg-[var(--bg-secondary)]/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-white flex items-center gap-2">
                        {item.pinned && <Pin className="w-3 h-3 text-amber-400" />}
                        {item.title || <span className="text-slate-500 italic">(Untitled)</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getCategoryColor(item.category)}`}>
                          {item.category}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          item.status === 'Published' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                          item.status === 'Archived' ? 'bg-gray-500/10 text-gray-400 border-gray-500/30' :
                          'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleTogglePin(item)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            item.pinned ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' : 'bg-[var(--bg-primary)] text-slate-500 hover:text-white'
                          }`}
                        >
                          <Pin className="w-4 h-4" />
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button onClick={() => handlePreview(item)} className="p-1.5 rounded-lg bg-[var(--bg-primary)] text-slate-400 hover:text-[var(--blue-glow)] hover:bg-[var(--blue-glow)]/10 transition-colors" title="Preview">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleTogglePublish(item)} className="p-1.5 rounded-lg bg-[var(--bg-primary)] text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors" title={item.status === 'Published' ? 'Unpublish' : 'Publish'}>
                          {item.status === 'Published' ? <Archive className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </button>
                        <button onClick={() => handleEdit(item)} className="p-1.5 rounded-lg bg-[var(--bg-primary)] text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg bg-[var(--bg-primary)] text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create/Edit Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingId ? 'Edit Announcement' : 'Create Announcement'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. System Maintenance Scheduled"
            />
            
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                Content
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
                className="w-full bg-[var(--bg-secondary)] border border-[var(--blue-border)]/40 rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--blue-glow)] focus:ring-1 focus:ring-[var(--blue-glow)] transition-all resize-none"
                placeholder="Write the announcement content here..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--blue-border)]/40 rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--blue-glow)]"
                >
                  <option value="Notice">Notice</option>
                  <option value="Urgent">Urgent</option>
                  <option value="Update">Update</option>
                  <option value="Event">Event</option>
                  <option value="Exam">Exam</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--blue-border)]/40 rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--blue-glow)]"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--blue-border)]/40 rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--blue-glow)]"
                >
                  <option value="Draft">Draft</option>
                  <option value="Published">Published</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Image URL (Optional)"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
              />
              <Input
                label="External URL (Optional)"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="flex items-center gap-3 p-3 bg-[var(--bg-secondary)]/50 rounded-xl border border-[var(--blue-border)]/20">
              <input
                type="checkbox"
                id="pinned"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
                className="w-4 h-4 rounded border-slate-600 text-[var(--blue-glow)] focus:ring-[var(--blue-glow)] focus:ring-offset-[var(--bg-primary)] bg-[var(--bg-primary)]"
              />
              <label htmlFor="pinned" className="text-sm font-medium text-white select-none cursor-pointer">
                Pin this announcement to the top
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                {editingId ? 'Save Changes' : 'Create Announcement'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Preview Modal */}
        <Modal
          isOpen={isPreviewModalOpen}
          onClose={() => setIsPreviewModalOpen(false)}
          title="Announcement Preview"
        >
          {previewData && (
            <div className="p-4 rounded-xl bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-primary)] border border-[var(--blue-border)]/40 shadow-xl relative overflow-hidden">
              {previewData.pinned && (
                <div className="absolute top-0 right-0">
                  <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[10px] font-bold px-4 py-1 rounded-bl-xl shadow-lg flex items-center gap-1">
                    <Pin className="w-3 h-3" /> Pinned
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-2 mb-3 mt-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getCategoryColor(previewData.category)}`}>
                  {previewData.category}
                </span>
                <span className="text-[10px] text-slate-400">
                  {previewData.published_date ? new Date(previewData.published_date).toLocaleDateString() : 'Unpublished'}
                </span>
              </div>
              
              {previewData.title && (
                <h3 className="text-lg font-bold text-white mb-2 leading-tight">
                  {previewData.title}
                </h3>
              )}
              
              {previewData.content && (
                <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed">
                  {previewData.content}
                </p>
              )}

              {previewData.image_url && (
                <div className="mt-4 rounded-lg overflow-hidden border border-[var(--blue-border)]/30">
                  <img src={previewData.image_url} alt="Announcement Media" className="w-full h-auto block" />
                </div>
              )}

              {previewData.external_url && (
                <a
                  href={previewData.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--blue-glow)] hover:text-white bg-[var(--blue-glow)]/10 hover:bg-[var(--blue-glow)]/20 px-3 py-1.5 rounded-lg transition-colors border border-[var(--blue-glow)]/30"
                >
                  <LinkIcon className="w-3.5 h-3.5" /> View External Link
                </a>
              )}
            </div>
          )}
        </Modal>

      </div>
    </RoleGuard>
  )
}
