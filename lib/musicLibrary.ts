import { createClient } from './supabase/client'

/**
 * БИБЛИОТЕКА МУЗЫКИ
 *
 * Раньше здесь лежал захардкоженный список из 30 коммерческих треков без
 * единого файла: кнопка «Выбрать» была отключена у всех строк, а половина
 * списка вдобавок пряталась за тарифом. Библиотека выглядела богатой, но
 * не работала ни одной кнопкой — это ровно тот случай, который патч
 * запрещает: имитация функции вместо функции.
 *
 * Теперь библиотека читает то, что реально лежит в Supabase Storage,
 * в папке `music/` бакета `media`. Что положили — то человек и видит,
 * может прослушать и выбрать. Список пуст ровно тогда, когда папка пуста,
 * и интерфейс говорит об этом прямо, а не подсовывает выдуманные строки.
 *
 * Как наполнить: залейте свои лицензированные (или собственные) файлы
 * в `media/music/`, назвав их по схеме `Исполнитель - Название.mp3` —
 * подпись в интерфейсе соберётся из имени файла.
 */

export interface LibraryTrack {
  /** Путь внутри бакета — он же стабильный идентификатор трека. */
  id: string
  title: string
  artist: string
  /** Прямая ссылка на файл. Без неё трека в списке не бывает. */
  url: string
}

/** Папка библиотеки внутри бакета media. */
export const MUSIC_LIBRARY_PREFIX = 'music'

const AUDIO_EXT = /\.(mp3|m4a|aac|ogg|oga|wav|webm)$/i

/**
 * Разбирает имя файла на исполнителя и название.
 * `Kool & The Gang - Celebration.mp3` → { artist, title }.
 * Если разделителя нет, всё имя становится названием — выдумывать
 * исполнителя мы не имеем права.
 */
export function parseTrackName(fileName: string): { title: string; artist: string } {
  const base = fileName.replace(AUDIO_EXT, '').trim()
  const m = base.split(/\s+[-–—]\s+/)
  if (m.length >= 2) {
    return { artist: m[0].trim(), title: m.slice(1).join(' — ').trim() }
  }
  return { artist: '', title: base }
}

/**
 * Загружает библиотеку из Storage.
 *
 * Ошибки не проглатываются и не подменяются заглушкой: вызывающий код
 * должен показать, что именно пошло не так.
 */
export async function loadMusicLibrary(): Promise<LibraryTrack[]> {
  const supabase = createClient()

  const { data, error } = await supabase.storage
    .from('media')
    .list(MUSIC_LIBRARY_PREFIX, { limit: 200, sortBy: { column: 'name', order: 'asc' } })

  if (error) throw error

  return (data ?? [])
    .filter((f) => AUDIO_EXT.test(f.name))
    .map((f) => {
      const path = `${MUSIC_LIBRARY_PREFIX}/${f.name}`
      const { data: pub } = supabase.storage.from('media').getPublicUrl(path)
      const { title, artist } = parseTrackName(f.name)
      return { id: path, title, artist, url: pub.publicUrl }
    })
}

/** Подпись трека в интерфейсе и в поле project.music.title. */
export function trackLabel(t: Pick<LibraryTrack, 'title' | 'artist'>): string {
  return t.artist ? `${t.title} — ${t.artist}` : t.title
}
