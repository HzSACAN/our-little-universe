import { useEffect, useRef, type ReactNode } from 'react';
import { letter } from '../content/letter';
import { memories, type Memory, type StarId } from '../content/memories';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  className?: string;
  children: ReactNode;
}

/** Yerel dialog: odak hapsi, Escape ile kapatma ve odak geri dönüşü tarayıcıdan gelir. */
function Modal({ open, onClose, labelledBy, className, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      lastFocus.current = document.activeElement as HTMLElement | null;
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const handleClose = () => {
      onCloseRef.current();
      const target = lastFocus.current;
      if (!document.querySelector('dialog[open]') && target?.isConnected && !target.closest('[hidden]') && !(target as HTMLButtonElement).disabled) {
        target.focus({ preventScroll: true });
      }
    };
    const handleClick = (e: MouseEvent) => {
      if (e.target !== dialog) return;
      const r = dialog.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close();
    };
    dialog.addEventListener('close', handleClose);
    dialog.addEventListener('click', handleClick);
    return () => {
      dialog.removeEventListener('close', handleClose);
      dialog.removeEventListener('click', handleClick);
      if (dialog.open) dialog.close();
    };
  }, []);

  return (
    <dialog ref={ref} aria-labelledby={labelledBy} className={className}>
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
}

export function MemoryDialog({ memory, open, onClose, onNext, nextLabel }: MemoryDialogProps) {
  return (
    <Modal open={open && !!memory} onClose={onClose} labelledBy="memory-title" className="memory-dialog">
      {memory && (
        <>
          <button className="close" type="button" onClick={onClose} aria-label="Anıyı kapat">
            ✕
          </button>
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
    <Modal open={open} onClose={onClose} labelledBy="list-title" className="list-dialog">
      <button className="close" type="button" onClick={onClose} aria-label="Anı listesini kapat">
        ✕
      </button>
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


export function LetterDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return <Modal open={open} onClose={onClose} labelledBy="letter-title" className="letter-dialog">
    <button className="close" type="button" onClick={onClose} aria-label="Mektubu kapat">✕</button>
    <div className="eyebrow">06 · 11 / BİZİM GÜNÜMÜZ</div>
    <span className="letter-star" aria-hidden="true">✧</span>
    <h2 id="letter-title">{letter.greeting}</h2>
    {letter.paragraphs.map((p) => <p className="letter-paragraph" key={p}>{p}</p>)}
    <p className="letter-signature">{letter.signature}</p>
    <p className="letter-note">{letter.note}</p>
    <button className="text-button" type="button" onClick={onClose}>Gökyüzümüze dön <span aria-hidden="true">↖</span></button>
  </Modal>;
}
