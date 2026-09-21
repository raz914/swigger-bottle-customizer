import { itemLabel } from '../utils/designItems';
import { t } from '../i18n';
export default function DesignItemPanel({ items, selectedItemId, onSelect, onUpdate, onAdd }) {
    const selected = items.find(i => i.id === selectedItemId);
    if (!items.length) return null;
    return <div className="item-list-panel">
        <div className="item-list-strip" aria-label={t('editor.items')}>
            {items.map((item, index) => <button key={item.id} className="item-list-chip" aria-pressed={item.id === selectedItemId} onClick={() => onSelect(item.id)} title={itemLabel(item)}>{index + 1}. {itemLabel(item)}</button>)}
            <button className="item-list-chip" onClick={onAdd}>+ {t('editor.addAnother')}</button>
        </div>
        {selected && <div className="item-properties">
            <label>{t('editor.size')} <input aria-label={t('editor.size')} type="range" min=".025" max="1" step=".005" value={selected.width} onChange={e => onUpdate(selected.id, { width: Number(e.target.value) })} /><span>{Math.round(selected.width * 100)}%</span></label>
            <label>{t('editor.angle')} <input aria-label={t('editor.angle')} type="number" min="-360" max="360" value={Math.round(selected.rotation || 0)} onChange={e => onUpdate(selected.id, { rotation: Math.max(-360, Math.min(360, Number(e.target.value))) })} />°</label>
        </div>}
        <p className="item-editor-hint">{t('editor.hint')}</p>
    </div>;
}
