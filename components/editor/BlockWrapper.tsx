'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, ChevronUp, ChevronDown, Settings } from 'lucide-react'
import type { BlockData } from '@/types'

interface BlockWrapperProps {
  block: BlockData
  isEditing: boolean
  onToggle: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onSettings?: () => void
  children: React.ReactNode
  canMoveUp?: boolean
  canMoveDown?: boolean
}

export function BlockWrapper({
  block,
  isEditing,
  onToggle,
  onMoveUp,
  onMoveDown,
  onSettings,
  children,
  canMoveUp = true,
  canMoveDown = true,
}: BlockWrapperProps) {
  const [hovered, setHovered] = useState(false)

  if (!block.enabled && !isEditing) return null

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {!block.enabled && isEditing && (
        <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center pointer-events-none">
          <span className="text-white/60 text-sm">Блок скрыт</span>
        </div>
      )}

      {children}

      {/* Block controls */}
      <AnimatePresence>
        {isEditing && hovered && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-3 right-3 z-20 flex items-center gap-1"
          >
            <div className="flex items-center gap-1 glass-white rounded-xl px-2 py-1.5 shadow-lg">
              {onSettings && (
                <button
                  onClick={onSettings}
                  className="p-1.5 rounded-lg hover:bg-[#F5306B]/10 transition-colors"
                  title="Настройки блока"
                >
                  <Settings size={14} className="text-[#1A1016]" />
                </button>
              )}
              <button
                onClick={onMoveUp}
                disabled={!canMoveUp}
                className="p-1.5 rounded-lg hover:bg-[#F5306B]/10 transition-colors disabled:opacity-30"
                title="Переместить вверх"
              >
                <ChevronUp size={14} className="text-[#1A1016]" />
              </button>
              <button
                onClick={onMoveDown}
                disabled={!canMoveDown}
                className="p-1.5 rounded-lg hover:bg-[#F5306B]/10 transition-colors disabled:opacity-30"
                title="Переместить вниз"
              >
                <ChevronDown size={14} className="text-[#1A1016]" />
              </button>
              <div className="w-px h-4 bg-[#F5306B]/20 mx-0.5" />
              <button
                onClick={onToggle}
                className="p-1.5 rounded-lg hover:bg-[#F5306B]/10 transition-colors"
                title={block.enabled ? 'Скрыть блок' : 'Показать блок'}
              >
                {block.enabled
                  ? <Eye size={14} className="text-[#F5306B]" />
                  : <EyeOff size={14} className="text-ink-400" />
                }
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
