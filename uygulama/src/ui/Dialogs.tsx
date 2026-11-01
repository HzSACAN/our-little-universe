import { useEffect, useRef, type ReactNode } from 'react';
import { letter } from '../content/letter';
import { memories, type Memory, type StarId } from '../content/memories';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  className?: string;
  closeLabel: string;
  /** Dialog bu öğenin ekrandaki yerinden doğar ve kapanırken oraya döner (anı yıldızı). */
  origin?: () => HTMLElement | null;
  /** Açılış gecikmesi (ms): önce yıldızın ışık tepkisi görünür. */
  openDelay?: number;
  /** Dialogu açan öğe odaklanamıyorsa kapanınca odaklanacak öğe. */
  returnFocus?: () => HTMLElement | null;
  children: ReactNode;
}

const focusable = (el: HTMLElement | null | undefined): el is HTMLElement =>
  !!el && el !== document.body && el.isConnected && !el.closest('[hidden], dialog:not([open])') &&
  !(el as HTMLButtonElement).disabled && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';

/**
 * Yerel dialog: odak hapsi ve Escape tarayıcıdan gelir. Kapanış (✕, Escape, dışarı tıklama)
 * kökene dönen kısa bir animasyonla biter; odak anlamlı bir öğeye geri verilir.
 */
function Modal({ open, onClose, labelledBy, className, closeLabel, origin, openDelay = 0, returnFocus, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const openedAt = useRef(0);
  const props = useRef({ onClose, origin, returnFocus });
  props.current = { onClose, origin, returnFocus };

  // Kökenin dialog merkezine göre farkı; animasyon bu vektör boyunca büyür/küçülür.
  const aim = (dialog: HTMLDialogElement) => {
    const from = props.current.origin?.();
    if (!from || from.dataset.visible === 'false') {
      dialog.classList.remove('from-star');
      return false;
    }
    const a = from.getBoundingClientRect();
    const b = dialog.getBoundingClientRect();
    dialog.style.setProperty('--from-x', `${(a.left + a.width / 2 - (b.left + b.width / 2)).toFixed(0)}px`);
    dialog.style.setProperty('--from-y', `${(a.top + a.height / 2 - (b.top + b.height / 2)).toFixed(0)}px`);
    dialog.classList.add('from-star');
    return true;
  };

  const requestClose = () => {
    const dialog = ref.current;
    if (!dialog?.open || dialog.classList.contains('closing')) return;
    if (!aim(dialog)) {
      dialog.close();
      return;
    }
    dialog.classList.add('closing');
    const done = () => {
      clearTimeout(timer);
      dialog.removeEventListener('animationend', done);
      dialog.classList.remove('closing');
      if (dialog.open) dialog.close();
    };
    const timer = setTimeout(done, 520);
    dialog.addEventListener('animationend', done);
  };

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      const show = () => {
        lastFocus.current = document.activeElement as HTMLElement | null;
        dialog.classList.remove('closing');
        dialog.showModal();
        openedAt.current = performance.now();
        aim(dialog);
      };
      if (openDelay > 0) {
        const timer = setTimeout(show, openDelay);
        return () => clearTimeout(timer);
      }
      show();
    } else if (!open && dialog.open) {
      dialog.classList.remove('closing');
      dialog.close();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const handleClose = () => {
      props.current.onClose();
      if (document.querySelector('dialog[open]')) return;
      const previous = lastFocus.current;
      const preferred = props.current.returnFocus?.();
      // Önce dialogu açan öğe; o artık kullanılamıyorsa (ör. Safari'de tıklanan düğme odak almaz) yedek hedef.
      const target = [previous, preferred].find(focusable);
      target?.focus({ preventScroll: true });
    };
    const handleCancel = (e: Event) => {
      e.preventDefault();
      requestClose();
    };
    const handleClick = (e: MouseEvent) => {
      if (e.target !== dialog) return;
      // Açılıştaki hızlı ikinci dokunuş, henüz yerleşmeyen dialogu kapatmaz.
      if (performance.now() - openedAt.current < 650) return;
      const r = dialog.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) requestClose();
    };
    dialog.addEventListener('close', handleClose);
    dialog.addEventListener('cancel', handleCancel);
    dialog.addEventListener('click', handleClick);
    return () => {
      dialog.removeEventListener('close', handleClose);
      dialog.removeEventListener('cancel', handleCancel);
      dialog.removeEventListener('click', handleClick);
      if (dialog.open) dialog.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <dialog ref={ref} aria-labelledby={labelledBy} className={className}>
      <button className="close" type="button" onClick={requestClose} aria-label={closeLabel}>
        ✕
      </button>
      {children}
    </dialog>
  );
}

interface MemoryDialogProps {
  memory: Memory | null;
  open: boolean;
  onClose: () => void;
  onNext: () => void;
  nextLabel: string;
  /** Anının saklandığı yıldızın erişilebilir hedefi: kart oradan doğar, odak oraya döner. */
  star: () => HTMLElement | null;
  openDelay: number;
}

export function MemoryDialog({ memory, open, onClose, onNext, nextLabel, star, openDelay }: MemoryDialogProps) {
  return (
    <Modal
      open={open && !!memory}
      onClose={onClose}
      labelledBy="memory-title"
      className="memory-dialog"
      closeLabel="Anıyı kapat"
      origin={star}
      returnFocus={star}
      openDelay={openDelay}
    >
      {memory && (
        <>
          <div className={`memory-art memory-art--${memory.id}`}>
            <div className="art-glow" aria-hidden="true" />
            <span className="art-script" dangerouslySetInnerHTML={{ __html: memory.script }} />
            <div className="photo-placeholder">
              <span aria-hidden="true">✧</span>
              Fotoğraf alanı · {memory.photoNote}
            </div>
          </div>
          <div className="memory-content">
            <div className="eyebrow">YILDIZ 0{memory.index} · ÖRNEK ANI</div>
            <h2 id="memory-title">{memory.title}</h2>
            <div className="mini-rule" aria-hidden="true" />
            <p className="memory-text">{memory.text}</p>
            <p className="example-note">
              Bu anı ve metin, tasarımı göstermek için örnektir.
              <br />
              Gerçek hikâyenizle değiştirilecek.
            </p>
            <div className="memory-actions">
              <button className="text-button" type="button" onClick={onNext}>
                {nextLabel} <span aria-hidden="true">↗</span>
              </button>
              <span>
                0{memory.index} / 0{memories.length}
              </span>
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}

interface ListDialogProps {
  open: boolean;
  visited: StarId[];
  onClose: () => void;
  onPick: (id: StarId) => void;
}

export function ListDialog({ open, visited, onClose, onPick }: ListDialogProps) {
  return (
    <Modal open={open} onClose={onClose} labelledBy="list-title" className="list-dialog" closeLabel="Anı listesini kapat">
      <div className="eyebrow">BİZİM TAKIMYILDIZIMIZ</div>
      <h2 id="list-title">
        Küçük anlar,
        <br />
        <em>kocaman bir biz.</em>
      </h2>
      <p className="list-note">Altı küçük durak. Her keşifle gökyüzümüzde yeni bir çizgi.</p>
      <ul className="memory-list">
        {memories.map((m) => (
          <li key={m.id}>
            <button type="button" onClick={() => onPick(m.id)}>
              <small>0{m.index}</small>
              <span>{m.title}</span>
              <span className="list-status" aria-label={visited.includes(m.id) ? 'keşfedildi' : 'henüz gidilmedi'}>
                {visited.includes(m.id) ? '✧' : '↗'}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  );
}


export function LetterDialog({ open, onClose, returnFocus }: { open: boolean; onClose: () => void; returnFocus?: () => HTMLElement | null }) {
  return <Modal open={open} onClose={onClose} labelledBy="letter-title" className="letter-dialog" closeLabel="Mektubu kapat" returnFocus={returnFocus}>
    <div className="eyebrow">06 · 11 / BİZİM GÜNÜMÜZ</div>
    <span className="letter-star" aria-hidden="true">✧</span>
    <h2 id="letter-title">{letter.greeting}</h2>
    {letter.paragraphs.map((p) => <p className="letter-paragraph" key={p}>{p}</p>)}
    <p className="letter-signature">{letter.signature}</p>
    <p className="letter-note">{letter.note}</p>
    <button className="text-button" type="button" onClick={onClose}>Gökyüzümüze dön <span aria-hidden="true">↖</span></button>
  </Modal>;
}
