'use client'
import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, AlertTriangle } from 'lucide-react'

interface Props {
  open: boolean
  blockName?: string
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteConfirm({ open, blockName, onConfirm, onCancel }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
      if (e.key === 'Enter') onConfirm()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onConfirm, onCancel])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0"
            style={{ background: 'rgba(20,15,10,.55)', backdropFilter: 'blur(4px)' }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', damping: 26, stiffness: 340 }}
            className="relative w-full max-w-sm rounded-3xl bg-white overflow-hidden"
            style={{ boxShadow: '0 30px 80px rgba(0,0,0,.35)' }}
          >
            <div className="px-7 pt-8 pb-6 text-center">
              <div
                className="mx-auto mb-5 flex items-center justify-center rounded-2xl"
                style={{ width: 60, height: 60, background: 'linear-gradient(135deg,#FEE2E2,#FECACA)' }}
              >
                <AlertTriangle size={26} className="text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-[#1A1016] mb-1.5">Удалить блок?</h3>
              <p className="text-sm text-ink-400 leading-relaxed">
                {blockName ? <>Блок <span className="font-medium text-[#1A1016]">«{blockName}»</span> будет удалён из сайта.</> : 'Этот блок будет удалён из сайта.'}
                {' '}Действие можно отменить через «Отменить» (Ctrl+Z).
              </p>
            </div>
            <div className="flex gap-2.5 px-5 pb-5">
              <button
                onClick={onCancel}
                className="flex-1 py-3 rounded-2xl text-sm font-medium text-ink-600 bg-paper-2 hover:bg-paper-3 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 py-3 rounded-2xl text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 size={15} /> Удалить
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
