import { useEffect, useRef, useState } from 'react';
import { areaAspect, constrainItem, getPrintArea, itemHeight, itemLabel, snapItemToCenter } from '../utils/designItems';
import { artworkKey, getItemArtwork } from '../utils/itemArtwork';
import { t } from '../i18n';
import './itemEditor.css';

function Artwork({ item, fonts, onArtworkReady }) {
    const [result, setResult] = useState(null);
    const [error, setError] = useState(false);
    const key = artworkKey(item);
    const latest = useRef({ item, fonts, onArtworkReady });
    latest.current = { item, fonts, onArtworkReady };
    useEffect(() => {
        let cancelled = false;
        setResult(null); setError(false);
        getItemArtwork(latest.current.item, latest.current.fonts).then(art => {
            if (cancelled) return;
            setResult(art);
            latest.current.onArtworkReady?.(latest.current.item.id, art.aspect);
        }).catch(() => { if (!cancelled) setError(true); });
        return () => { cancelled = true; };
    }, [key]);
    if (error) return <span className="item-art-error" title={t('editor.artError')}>!</span>;
    if (!result) return <span className="item-art-loading" />;
    return <span className="item-artwork" style={{ maskImage: `url("${result.src}")`, WebkitMaskImage: `url("${result.src}")` }} />;
}

function RotateIcon() {
    return <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5.2 8.4A7.5 7.5 0 1 1 4.7 14" />
        <path d="M5.2 3.8v4.6h4.6" />
    </svg>;
}

function DeleteIcon() {
    return <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 7l10 10M17 7 7 17" />
    </svg>;
}

function ResizeIcon() {
    return <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9.5 5H5v4.5M14.5 19H19v-4.5M6 6l12 12" />
    </svg>;
}

export default function ItemBottlePreview({ side, customization, selectedSize, selectedColor, bottleImageSrc, fonts, view,
    selectedItemId, onSelectItem, onUpdateItem, onRemoveItem, onArtworkReady, setIsImageLoading }) {
    const areaRef = useRef(null);
    const gesture = useRef(null);
    const imageRef = useRef(null);
    const area = getPrintArea(selectedSize, side, selectedColor);
    const aspect = areaAspect(selectedSize, side, selectedColor);
    const items = customization[side].items;
    const isCapture = view === 'capture';
    const editable = !isCapture && !!onUpdateItem;
    const [imageError, setImageError] = useState(false);
    const [guides, setGuides] = useState({ vertical: false, horizontal: false });
    useEffect(() => {
        setImageError(false);
        if (imageRef.current?.complete) setIsImageLoading?.(false);
    }, [bottleImageSrc, setIsImageLoading]);
    const start = (event, item, mode) => {
        if (!editable || event.button !== 0) return;
        event.preventDefault(); event.stopPropagation();
        onSelectItem(item.id);
        const rect = areaRef.current.getBoundingClientRect();
        gesture.current = { id: item.id, mode, item, rect, px: event.clientX, py: event.clientY,
            angle: Math.atan2(event.clientY - rect.top - item.y * rect.height, event.clientX - rect.left - item.x * rect.width) };
        event.currentTarget.setPointerCapture(event.pointerId);
    };
    const move = event => {
        const g = gesture.current;
        if (!g) return;
        const { item, rect } = g;
        let next = { ...item };
        const dx = event.clientX - g.px, dy = event.clientY - g.py;
        if (g.mode === 'move') {
            next.x += dx / rect.width; next.y += dy / rect.height;
            const snapped = snapItemToCenter(next, rect);
            next = snapped.item;
            setGuides(previous => previous.vertical === snapped.guides.vertical && previous.horizontal === snapped.guides.horizontal
                ? previous : snapped.guides);
        }
        if (g.mode === 'rotate') {
            const angle = Math.atan2(event.clientY - rect.top - item.y * rect.height, event.clientX - rect.left - item.x * rect.width);
            next.rotation = (item.rotation || 0) + (angle - g.angle) * 180 / Math.PI;
            if (event.shiftKey) next.rotation = Math.round(next.rotation / 15) * 15;
        }
        if (g.mode === 'resize') {
            const angle = (item.rotation || 0) * Math.PI / 180;
            const w = item.width * rect.width, h = itemHeight(item, aspect) * rect.height;
            const localDx = dx * Math.cos(angle) + dy * Math.sin(angle);
            const localDy = -dx * Math.sin(angle) + dy * Math.cos(angle);
            const scale = Math.max(.05, 1 + (localDx * w + localDy * h) / (w * w + h * h));
            next.width = item.width * scale;
            // Keep the opposite corner in place as the lower-right corner moves.
            next.x += ((w * (scale - 1) * Math.cos(angle) - h * (scale - 1) * Math.sin(angle)) / 2) / rect.width;
            next.y += ((w * (scale - 1) * Math.sin(angle) + h * (scale - 1) * Math.cos(angle)) / 2) / rect.height;
        }
        onUpdateItem(g.id, constrainItem(next, aspect));
    };
    const end = () => { gesture.current = null; setGuides({ vertical: false, horizontal: false }); };
    const selectedRaw = items.find(i => i.id === selectedItemId);
    const selected = selectedRaw ? constrainItem(selectedRaw, aspect) : null;
    return <div className={`item-bottle-frame ${isCapture ? 'item-bottle-capture' : ''} ${/white|frost|grey|gray|sage|mint|pink|lila|lavender|sky/.test(selectedColor) ? 'item-bottle-light' : ''}`}
        onPointerDown={() => editable && onSelectItem(null)} data-testid="bottle-editor">
        <img ref={imageRef} src={bottleImageSrc} alt={t('bottlePreview.alt', { side })} draggable={false}
            className="item-bottle-image" onLoad={() => setIsImageLoading?.(false)} onError={() => { setImageError(true); setIsImageLoading?.(false); }} />
        {imageError && <p className="item-image-error" role="alert">{t('editor.imageError')}</p>}
        <div ref={areaRef} className={`item-print-area ${editable && selectedItemId ? 'is-active' : ''}`} data-testid="print-area"
            style={{ left: `${area.x * 100}%`, top: `${area.y * 100}%`, width: `${area.width * 100}%`, height: `${area.height * 100}%` }}>
            {guides.vertical && <span className="item-center-guide item-center-guide-vertical" data-testid="vertical-center-guide" aria-hidden="true" />}
            {guides.horizontal && <span className="item-center-guide item-center-guide-horizontal" data-testid="horizontal-center-guide" aria-hidden="true" />}
            {items.map(raw => {
                const item = constrainItem(raw, aspect), active = editable && item.id === selectedItemId;
                return <div key={item.id} className={`bottle-design-item ${active ? 'is-selected' : ''}`} data-testid="design-item" data-item-id={item.id}
                    role={editable ? 'button' : undefined} tabIndex={editable ? 0 : undefined} aria-label={t('editor.select', { name: itemLabel(item) })}
                    aria-pressed={editable ? active : undefined}
                    style={{ left: `${item.x * 100}%`, top: `${item.y * 100}%`, width: `${item.width * 100}%`, height: `${itemHeight(item, aspect) * 100}%`, transform: `translate(-50%, -50%) rotate(${item.rotation || 0}deg)` }}
                    onClick={e => { e.stopPropagation(); if (editable) onSelectItem(item.id); }} onPointerDown={e => start(e, item, 'move')} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end}
                    onKeyDown={e => {
                        if (!editable || e.target !== e.currentTarget) return;
                        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectItem(item.id); }
                        if (active && (e.key === 'Delete' || e.key === 'Backspace')) { e.preventDefault(); onRemoveItem(item.id); }
                        if (active && e.key.startsWith('Arrow')) {
                            e.preventDefault(); const n = e.shiftKey ? .05 : .01;
                            onUpdateItem(item.id, constrainItem({ ...item, x: item.x + (e.key === 'ArrowRight' ? n : e.key === 'ArrowLeft' ? -n : 0), y: item.y + (e.key === 'ArrowDown' ? n : e.key === 'ArrowUp' ? -n : 0) }, aspect));
                        }
                    }}>
                    <Artwork item={item} fonts={fonts} onArtworkReady={onArtworkReady} />

                </div>;
            })}
            {editable && selected && <div className="item-selection-overlay" style={{ left: `${selected.x * 100}%`, top: `${selected.y * 100}%`, width: `${selected.width * 100}%`, height: `${itemHeight(selected, aspect) * 100}%`, transform: `translate(-50%, -50%) rotate(${selected.rotation || 0}deg)` }}
                onPointerMove={move} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end}>
                <button className="item-handle item-rotate" aria-label={t('editor.rotate')} onPointerDown={e => start(e, selected, 'rotate')} onClick={e => e.stopPropagation()}><RotateIcon /></button>
                <button className="item-handle item-delete" aria-label={t('editor.delete')} onPointerDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); onRemoveItem(selected.id); }}><DeleteIcon /></button>
                <button className="item-handle item-resize" aria-label={t('editor.resize')} onPointerDown={e => start(e, selected, 'resize')} onClick={e => e.stopPropagation()}><ResizeIcon /></button>
            </div>}
        </div>
    </div>;
}
