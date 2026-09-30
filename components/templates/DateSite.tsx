'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { BlockData, Project } from '@/types'
import {
  allScenes, buildAnswerPayload, sceneVisible, str, type Answers,
} from '@/lib/dateScenario'
import { AskScene } from '@/components/blocks/date/AskScene'
import { ChoiceScene } from '@/components/blocks/date/ChoiceScene'
import { WhenScene } from '@/components/blocks/date/WhenScene'
import { FinalScene } from '@/components/blocks/date/FinalScene'
import { StoryScene } from '@/components/blocks/date/StoryScene'
import { BlockWrapper } from '@/components/editor/BlockWrapper'
import { SceneRail } from '@/components/editor/SceneRail'
import { MusicPlayer } from '@/components/ui/MusicPlayer'
import { buttonRadius, imageRadius, type ButtonShape, type ImageShape } from '@/lib/editorPresets'

/**
 * РЕНДЕРЕР ПРИГЛАШЕНИЯ НА СВИДАНИЕ
 *
 * Место этого компонента в архитектуре то же, что у рендерера сайта
 * в остальных направлениях Maruno: он получает проект и показывает его
 * содержимое. Отличие одно, но принципиальное — приглашение на свидание
 * не длинная страница, а последовательность экранов, поэтому
 * одновременно виден ровно один блок.
 *
 * Один и тот же компонент обслуживает три режима:
 *   правка       — автор видит выбранную сцену и меняет тексты на месте;
 *   предпросмотр — сценарий проходится по-настоящему, но ответы никуда
 *                  не сохраняются: это черновик, а не живое приглашение;
 *   опубликовано — то же прохождение, и в конце ответ уходит автору.
 *
 * Отдельного кода для предпросмотра нет намеренно: именно поэтому
 * увиденное в редакторе совпадает с тем, что получит человек по ссылке.
 */

interface DateSiteProps {
  project: Project
  isEditing?: boolean
  onBlockChange?: (blockId: string, content: BlockData['content']) => void
  onBlockToggle?: (blockId: string) => void
  onBlockMoveUp?: (blockId: string) => void
  onBlockMoveDown?: (blockId: string) => void
  onBlockSettings?: (blockId: string) => void
  userId?: string
  buttonStyleFallback?: ButtonShape
  imageStyleFallback?: ImageShape
  /**
   * Живое приглашение: ответ сохраняется автору. Включено только на
   * опубликованной странице. В предпросмотре false — иначе кабинет
   * заполнялся бы ответами, которых никто не давал.
   */
  live?: boolean
  /** Сцена, открытая в редакторе. Поднято наружу — ею управляет боковая панель. */
  activeSceneId?: string | null
  onActiveSceneChange?: (id: string) => void
}

export function DateSite({
  project,
  isEditing = false,
  onBlockChange,
  onBlockToggle,
  onBlockMoveUp,
  onBlockMoveDown,
  onBlockSettings,
  userId,
  buttonStyleFallback,
  imageStyleFallback,
  live = false,
  activeSceneId,
  onActiveSceneChange,
}: DateSiteProps) {
  const { colors, fonts, music, blocks } = project

  const scenes = useMemo(() => allScenes(blocks), [blocks])
  const [answers, setAnswers] = useState<Answers>({})
  const [playIndex, setPlayIndex] = useState(0)
  const [fallbackSceneId, setFallbackSceneId] = useState<string | null>(null)
  const sent = useRef(false)

  /*
   * Выход из предпросмотра и возврат в него начинают историю заново:
   * показывать автору сцену, до которой он дошёл в прошлый раз, неверно —
   * он смотрит приглашение глазами того, кто его откроет.
   *
   * Сброс сделан прямо в рендере, а не эффектом: React пересчитывает
   * компонент сразу, не показывая промежуточный кадр с чужими ответами.
   */
  const [wasEditing, setWasEditing] = useState(isEditing)
  if (wasEditing !== isEditing) {
    setWasEditing(isEditing)
    setAnswers({})
    setPlayIndex(0)
  }

  // Признак «ответ уже отправлен» — не состояние рендера, поэтому живёт
  // в ref и сбрасывается отдельно, вместе со сменой режима.
  useEffect(() => { sent.current = false }, [wasEditing])

  /** Сцены, которые человек увидит при уже данных ответах. */
  const path = useMemo(
    () => scenes.filter((s) => sceneVisible(s, answers)),
    [scenes, answers],
  )

  const editorSceneId = activeSceneId ?? fallbackSceneId ?? scenes[0]?.id ?? null
  const setEditorScene = useCallback((id: string) => {
    setFallbackSceneId(id)
    onActiveSceneChange?.(id)
  }, [onActiveSceneChange])

  const current: BlockData | undefined = isEditing
    ? scenes.find((s) => s.id === editorSceneId) ?? scenes[0]
    : path[Math.min(playIndex, Math.max(path.length - 1, 0))]

  /**
   * Ответ на сцену. Ответы копятся в состоянии, а следующая сцена
   * вычисляется уже с их учётом — так работает условный показ:
   * «А что будем есть?» просто не попадает в путь, если выбрали кино.
   */
  const handleAnswer = useCallback((patch: Answers) => {
    const next = { ...answers, ...patch }
    // Следующая сцена считается уже с новым ответом — так и работает
    // условный показ: «А что будем есть?» просто не попадает в путь,
    // если человек выбрал кино.
    const nextPath = scenes.filter((s) => sceneVisible(s, next))

    let idx: number
    if (patch.ask?.value === 'no') {
      // Отказ — конец истории, а не пропуск одного экрана: спрашивать
      // про еду и время после «Нет» бессмысленно.
      const finalIdx = nextPath.findIndex((s) => s.type === 'date-final')
      idx = finalIdx >= 0 ? finalIdx : nextPath.length - 1
    } else {
      const here = nextPath.findIndex((s) => s.id === current?.id)
      idx = Math.min(here + 1, nextPath.length - 1)
    }

    setAnswers(next)
    setPlayIndex(idx)
  }, [answers, scenes, current?.id])

  /**
   * Ответ автору приглашения.
   *
   * Уходит в ту же таблицу rsvp_responses, что и ответы гостей в других
   * направлениях: своей таблицы для свиданий нет, потому что это те же
   * ответы на приглашение. Отправляется один раз — ref, а не состояние,
   * чтобы повторный рендер не создал вторую запись.
   */
  useEffect(() => {
    if (!live || isEditing || sent.current) return
    /*
     * Отправляем на ПОСЛЕДНЕЙ сцене пути, а не только на сцене «Финал».
     * Автор вправе удалить финал — и тогда привязка к типу означала бы,
     * что ответ молча не доходит до него никогда.
     */
    const last = path[path.length - 1]
    if (!current || !last || current.id !== last.id) return
    if (!Object.keys(answers).length) return

    sent.current = true
    const { attending, extra } = buildAnswerPayload(scenes, answers)
    const ask = scenes.find((s) => s.type === 'date-ask')
    const name = str(ask?.content?.recipient).trim() || 'Ответ на приглашение'

    import('@/app/actions/rsvp')
      .then(({ saveRSVPToDatabase, sendRSVPToTelegram, sendRSVPEmail }) => {
        const payload = {
          name,
          attending,
          guestCount: 1,
          projectTitle: project.title,
          projectSlug: project.slug,
        }
        return saveRSVPToDatabase({ ...payload, projectId: project.id, extra }).then((saved) => {
          if (!saved.ok) {
            // Молчать нельзя: автор иначе не узнает, что ответ не дошёл.
            console.error('[maruno] Ответ не сохранён:', saved.reason)
            sent.current = false
            return
          }
          const delivery = project.rsvp_delivery ?? 'site'
          if (delivery === 'telegram') void sendRSVPToTelegram(payload)
          else if (delivery === 'email') void sendRSVPEmail(payload)
        })
      })
      .catch((err) => {
        console.error('[maruno] Ответ не отправлен:', err)
        sent.current = false
      })
  }, [live, isEditing, current, path, answers, scenes, project.id, project.slug, project.title, project.rsvp_delivery])

  if (!current) {
    return (
      <div
        style={{
          minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: colors.background, color: colors.text, padding: 24, textAlign: 'center',
        }}
      >
        <p style={{ opacity: 0.6 }}>В приглашении пока нет ни одной сцены</p>
      </div>
    )
  }

  const sceneProps = {
    block: current,
    colors,
    fonts,
    isEditing,
    onChange: (content: BlockData['content']) => onBlockChange?.(current.id, content),
    onAnswer: handleAnswer,
    answers,
    blocks: scenes,
    userId,
    projectId: project.id,
  }

  const scene = (() => {
    switch (current.type) {
      case 'date-ask': return <AskScene {...sceneProps} />
      case 'date-choice': return <ChoiceScene {...sceneProps} />
      case 'date-when': return <WhenScene {...sceneProps} />
      case 'date-final': return <FinalScene {...sceneProps} />
      case 'date-story': return <StoryScene {...sceneProps} />
      default: return null
    }
  })()

  const editorIndex = scenes.findIndex((s) => s.id === current.id)
  const progress = path.length > 1
    ? Math.min(playIndex / (path.length - 1), 1)
    : 1

  return (
    <div
      style={{
        position: 'relative',
        background: colors.background,
        ['--wd-btn-radius' as string]: buttonRadius(fonts.buttonStyle ?? buttonStyleFallback),
        ['--wd-img-radius' as string]: imageRadius(fonts.imageStyle ?? imageStyleFallback),
      } as React.CSSProperties}
    >
      {/* Тонкая полоса пройденного пути. В редакторе не нужна:
          там автор прыгает по сценам, а не проходит историю. */}
      {!isEditing && (
        <div className="date-progress" style={{ background: `${colors.text}14` }}>
          <motion.div
            style={{ height: '100%', background: colors.primary, transformOrigin: 'left' }}
            initial={false}
            animate={{ scaleX: progress }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      )}

      {isEditing && (
        <SceneRail
          scenes={scenes}
          activeId={current.id}
          answersPreview={answers}
          onSelect={setEditorScene}
        />
      )}

      {/*
        ПЕРЕХОД МЕЖДУ СЦЕНАМИ

        Не навигация по страницам: старая сцена уходит вверх и растворяется,
        новая приходит снизу. mode="wait" — чтобы два экрана не накладывались
        и текст не читался поверх текста.
      */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={current.id}
          initial={{ opacity: 0, y: 24, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.99 }}
          transition={{ duration: 0.42, ease: [0.22, 0.7, 0.25, 1] }}
        >
          {isEditing ? (
            <BlockWrapper
              block={current}
              isEditing
              onToggle={() => onBlockToggle?.(current.id)}
              onMoveUp={() => onBlockMoveUp?.(current.id)}
              onMoveDown={() => onBlockMoveDown?.(current.id)}
              onSettings={onBlockSettings ? () => onBlockSettings(current.id) : undefined}
              canMoveUp={editorIndex > 0}
              canMoveDown={editorIndex < scenes.length - 1}
            >
              {scene}
            </BlockWrapper>
          ) : (
            scene
          )}
        </motion.div>
      </AnimatePresence>

      <MusicPlayer music={music} accentColor={colors.primary} />
    </div>
  )
}
