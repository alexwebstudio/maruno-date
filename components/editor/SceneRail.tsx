'use client'
import { EyeOff, GitBranch } from 'lucide-react'
import type { BlockData } from '@/types'
import { sceneVisible, str, type Answers } from '@/lib/dateScenario'
import { SCENE_META, sceneTitle } from '@/lib/sceneMeta'

/**
 * ЛЕНТА СЦЕН В РЕДАКТОРЕ
 *
 * Приглашение показывает один экран за раз, поэтому автору нужен способ
 * перейти к любой сцене, не проходя историю целиком. Лента и есть этот
 * способ: она же показывает порядок и отмечает условные сцены, которые
 * увидят не все.
 *
 * В предпросмотре и в опубликованном приглашении ленты нет — там человек
 * проходит историю, а не редактирует её.
 */
export function SceneRail({
  scenes, activeId, answersPreview, onSelect,
}: {
  scenes: BlockData[]
  activeId: string
  answersPreview: Answers
  onSelect: (id: string) => void
}) {
  return (
    <div
      className="sticky top-0 z-30 flex items-center gap-1.5 overflow-x-auto"
      style={{
        padding: '10px 12px',
        background: 'rgba(255,255,255,.92)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid var(--mrn-line)',
        scrollbarWidth: 'thin',
      }}
      data-lenis-prevent
      role="tablist"
      aria-label="Сцены приглашения"
    >
      {scenes.map((scene, i) => {
        const active = scene.id === activeId
        const conditional = Boolean(str(scene.content.showIf).trim())
        const hidden = scene.enabled === false

        return (
          <button
            key={scene.id}
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(scene.id)}
            title={conditional ? `Условная сцена: ${str(scene.content.showIf)}` : undefined}
            className="flex items-center gap-1.5 flex-shrink-0 transition-colors"
            style={{
              minHeight: 36,
              padding: '0 12px',
              borderRadius: 999,
              fontSize: 12.5,
              fontWeight: active ? 600 : 500,
              whiteSpace: 'nowrap',
              border: `1px solid ${active ? 'var(--color-punch)' : 'var(--mrn-line-strong)'}`,
              background: active ? 'var(--color-punch)' : 'transparent',
              color: active ? '#fff' : hidden ? 'var(--color-ink-400)' : 'var(--color-ink-600)',
              opacity: hidden ? 0.55 : 1,
              cursor: 'pointer',
            }}
          >
            <span style={{ opacity: 0.75 }}>{i + 1}</span>
            <span>{SCENE_META[scene.type]?.icon}</span>
            <span style={{ maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {sceneTitle(scene)}
            </span>
            {conditional && <GitBranch size={12} aria-label="условная сцена" />}
            {hidden && <EyeOff size={12} aria-label="сцена скрыта" />}
            {/* Сцена, которую при текущих ответах предпросмотра не покажут */}
            {conditional && !sceneVisible(scene, answersPreview) && null}
          </button>
        )
      })}
    </div>
  )
}
