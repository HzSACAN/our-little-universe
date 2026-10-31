import { isComplete, memories, type StarId } from '../content/memories';

interface FallbackProps {
  message: string;
  visited: StarId[];
  onDiscover: (id: StarId) => void;
  onLetter: () => void;
  onRetry?: () => void;
}

/**
 * Üç boyutlu gökyüzü başlatılamadığında boş ekran yerine erişilebilir anı listesi.
 * Bu görünüm, gökyüzünün çalıştığının kanıtı değildir.
 */
export function Fallback({ message, onRetry, visited, onDiscover, onLetter }: FallbackProps) {
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
      <p className="fallback-progress" role="status">{visited.length} / {memories.length} anı keşfedildi</p>
      <ol className="fallback-list">
        {memories.map((m) => (
          <li key={m.id}>
            <article>
              <div className="eyebrow">YILDIZ 0{m.index} · ÖRNEK ANI</div>
              <h3>{m.title}</h3>
              <p>{m.text}</p>
              <p className="photo-note">Fotoğraf alanı · {m.photoNote}</p>
              <button className="text-button" type="button" disabled={visited.includes(m.id)} onClick={() => onDiscover(m.id)} aria-label={`${m.title}: ${visited.includes(m.id) ? 'keşfedildi' : 'anıyı keşfet'}`}>
                {visited.includes(m.id) ? 'Keşfedildi ✧' : 'Bu anıyı keşfet ↗'}
              </button>
            </article>
          </li>
        ))}
      </ol>
      <section className="fallback-ending">
        <p>{isComplete(visited) ? 'Altı yıldız, bir takımyıldız. Mektubun seni bekliyor.' : 'Mektubu açmak için altı anıyı keşfet.'}</p>
        <button className="primary" type="button" disabled={!isComplete(visited)} onClick={onLetter}>Sana bir mektup <span aria-hidden="true">✧</span></button>
      </section>
    </section>
  );
}
