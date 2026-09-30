'use client'
import { EditableText } from '@/components/editor/EditableText'

/**
 * Редактируемый кусок текста внутри сцены.
 *
 * Обёртка над общим EditableText: сцены не должны повторять одни и те же
 * четыре пропса, а в режиме просмотра текст обязан остаться простым
 * span без обработчиков.
 */
export function EditableInline({
  value, onChange, isEditing, placeholder, multiline = false, className, style,
}: {
  value: string
  onChange: (v: string) => void
  isEditing: boolean
  placeholder?: string
  multiline?: boolean
  className?: string
  style?: React.CSSProperties
}) {
  if (!isEditing) return <span className={className} style={style}>{value}</span>
  return (
    <EditableText
      tag="span"
      value={value}
      onChange={onChange}
      isEditing
      multiline={multiline}
      placeholder={placeholder}
      className={className}
      style={style}
    />
  )
}
