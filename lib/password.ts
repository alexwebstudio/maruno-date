/**
 * Проверка надёжности пароля.
 *
 * Единая функция для регистрации, смены пароля и восстановления доступа —
 * иначе требования разъезжаются между экранами.
 */

export interface PasswordCheck {
  /** Достаточно ли надёжен, чтобы разрешить сохранение. */
  ok: boolean
  /** 0–4 для индикатора. */
  score: number
  label: string
  /** Что именно ещё не выполнено — показываем пользователю списком. */
  problems: string[]
}

const MIN_LENGTH = 8

export function checkPassword(password: string): PasswordCheck {
  const problems: string[] = []

  if (password.length < MIN_LENGTH) problems.push(`Минимум ${MIN_LENGTH} символов`)
  if (!/[a-zа-яё]/i.test(password)) problems.push('Хотя бы одна буква')
  if (!/\d/.test(password)) problems.push('Хотя бы одна цифра')

  // Самые частые пароли принимать нельзя, даже если формально длина подходит
  const trivial = ['12345678', 'password', 'qwerty123', '11111111', 'parol123']
  if (trivial.includes(password.toLowerCase())) problems.push('Слишком простой пароль')

  let score = 0
  if (password.length >= MIN_LENGTH) score++
  if (password.length >= 12) score++
  if (/[a-zа-яё]/i.test(password) && /\d/.test(password)) score++
  if (/[^\w\s]/.test(password)) score++

  const ok = problems.length === 0
  const label = !password
    ? ''
    : !ok
      ? 'Ненадёжный'
      : score >= 4
        ? 'Отличный'
        : score === 3
          ? 'Хороший'
          : 'Приемлемый'

  return { ok, score: Math.min(score, 4), label, problems }
}
