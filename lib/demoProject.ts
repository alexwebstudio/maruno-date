import type { Project } from '@/types'
import { getDefaultBlocks, getDefaultMusic } from './utils'
import { templateDemoVars, type TemplateEntry } from './templateCatalog'

/**
 * Демонстрационное приглашение шаблона.
 *
 * Собирается тем же getDefaultBlocks(), которым создаётся настоящее
 * приглашение, поэтому демо в каталоге не может разойтись с тем, что
 * человек получит после нажатия «Выбрать».
 *
 * Это не «фейковый проект в базе»: объект существует только в памяти
 * браузера, ничего не сохраняет и ответы никуда не отправляет (DateSite
 * получает live={false}).
 */
export function demoProject(template: TemplateEntry): Project {
  return {
    id: `demo-${template.id}`,
    user_id: 'demo',
    title: template.name,
    slug: template.slug,
    template: template.id,
    language: 'ru',
    event_type: 'date',
    colors: template.colors,
    fonts: template.fonts,
    music: getDefaultMusic(),
    blocks: getDefaultBlocks(templateDemoVars(template), template),
    published: false,
    published_snapshot: null,
    published_at: null,
    archived_at: null,
    created_at: '',
    updated_at: '',
  }
}
