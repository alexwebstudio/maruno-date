'use client'
import { useState, useRef, useEffect } from 'react'
import type { CSSProperties } from 'react'
import { cn } from '@/lib/utils'

interface EditableTextProps {
  value: string
  onChange: (v: string) => void
  className?: string
  style?: CSSProperties
  multiline?: boolean
  placeholder?: string
  isEditing?: boolean
  tag?: 'h1' | 'h2' | 'h3' | 'p' | 'span' | 'div'
}

export function EditableText({
  value,
  onChange,
  className = '',
  style,
  multiline = false,
  placeholder = 'Нажмите для редактирования',
  isEditing = false,
  tag: Tag = 'p',
}: EditableTextProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  useEffect(() => { setDraft(value) }, [value])

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      if ('select' in inputRef.current) inputRef.current.select()
    }
  }, [editing])

  const handleBlur = () => {
    setEditing(false)
    if (draft !== value) onChange(draft)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) { handleBlur() }
    if (e.key === 'Escape') { setDraft(value); setEditing(false) }
  }

  if (!isEditing) {
    return <Tag className={className} style={style}>{value || placeholder}</Tag>
  }

  if (editing) {
    // Inherit the passed style properties in the input
    const inheritStyle: CSSProperties = {
      fontFamily: style?.fontFamily || 'inherit',
      fontSize: style?.fontSize || 'inherit',
      fontWeight: style?.fontWeight || 'inherit',
      color: style?.color || 'inherit',
      lineHeight: style?.lineHeight || 'inherit',
      textAlign: (style?.textAlign as CSSProperties['textAlign']) || 'inherit',
      letterSpacing: style?.letterSpacing || 'inherit',
    }

    const sharedProps = {
      value: draft,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(e.target.value),
      onBlur: handleBlur,
      onKeyDown: handleKeyDown,
      placeholder,
      className: cn(
        'bg-white/10 border-b-2 border-[#F5306B] outline-none rounded-sm w-full resize-none',
        className
      ),
      style: inheritStyle,
    }

    if (multiline) {
      return (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          {...sharedProps}
          rows={3}
        />
      )
    }
    return <input ref={inputRef as React.RefObject<HTMLInputElement>} type="text" {...sharedProps} />
  }

  return (
    <Tag
      className={cn(className, 'cursor-pointer hover:opacity-80 transition-opacity relative group')}
      style={style}
      onClick={() => setEditing(true)}
      title="Нажмите для редактирования"
    >
      {value || <span className="opacity-40 italic">{placeholder}</span>}
      <span className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-[#F5306B] scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
    </Tag>
  )
}
