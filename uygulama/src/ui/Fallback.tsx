import { memories } from '../content/memories';

interface FallbackProps {
  message: string;
  onRetry?: () => void;
}

/**
 * Üç boyutlu gökyüzü başlatılamadığında boş ekran yerine erişilebilir anı listesi.
 * Bu görünüm, gökyüzünün çalıştığının kanıtı değildir.
 */
export function Fallback({ message, onRetry }: FallbackProps) {
  return (
    <section className="fallback" aria-labelledby="fallback-title">
      <span className="fallback-star" aria-hidden="true">
        ✧
      </span>
      <h2 id="fallback-title">Hikâyemiz yine burada.</h2>
      <p className="fallback-message">{message}</p>
      {onRetry && (
        <button className="text-button" type="button" onClick={onRetry}>
          Gökyüzünü yeniden dene <span aria-hidden="true">↻</span>
        </button>
      )}
      <ol className="fallback-list">
        {memories.map((m) => (
          <li key={m.id}>
            <article>
              <div className="eyebrow">YILDIZ 0{m.index} · ÖRNEK ANI</div>
              <h3>{m.title}</h3>
              <p>{m.text}</p>
              <p className="photo-note">Fotoğraf alanı · {m.photoNote}</p>
            </article>
          </li>
        ))}
      </ol>
    </section>
  );
}
