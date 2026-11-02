import { Component, lazy, Suspense, useCallback, useEffect, useReducer, useRef, useState, type ReactNode } from 'react';
import { isComplete, memories, memoryById, nextUnvisited } from './content/memories';
import { experienceReducer, initialState, type Destination } from './experience/state';
import type { StarId } from './content/memories';
import { createBridge } from './experience/bridge';
import { detectWebGL, useCoarsePointer, useDocumentVisible, useLayout, useLookControls, useReducedMotion, useTapGuard } from './experience/hooks';
import { initialTier, lowerTier, type QualityTier } from './experience/quality';
import { Header } from './ui/Header';
import { StarLabels } from './ui/StarLabels';
import { ArrivalPanel, CompletionPanel, ExploreCaption, FlightStatus, Footer, Intro, Navigation } from './ui/Panels';
import { LetterDialog, ListDialog, MemoryDialog } from './ui/Dialogs';
import { Fallback } from './ui/Fallback';
import { StarTarget } from './ui/StarTarget';

const Scene = lazy(() => import('./experience/Scene').then((m) => ({ default: m.Scene })));

type SkyStatus = 'ok' | 'unsupported' | 'lost' | 'error';

const fallbackMessages: Record<Exclude<SkyStatus, 'ok'>, string> = {
  unsupported: 'Bu cihazda üç boyutlu gökyüzü başlatılamadı. Anılarımızı aşağıdan okuyabilirsin.',
  lost: 'Gökyüzü bu cihazda durakladı. İstersen yeniden deneyebilir ya da anılarımızı aşağıdan okuyabilirsin.',
  error: 'Gökyüzü yüklenirken bir sorun oldu. Anılarımız yine aşağıda.',
};

export default function App() {
  const [state, dispatch] = useReducer(experienceReducer, initialState);
  const [reducedMotion, setReducedMotion] = useReducedMotion();
  const layout = useLayout();
  const coarse = useCoarsePointer();
  const visible = useDocumentVisible();
  const [status, setStatus] = useState<SkyStatus>(() => (detectWebGL() ? 'ok' : 'unsupported'));
  const [sceneKey, setSceneKey] = useState(0);
  const [tier, setTier] = useState<QualityTier>(initialTier);
  const [bridge] = useState(() => createBridge(reducedMotion));
  const stageRef = useRef<HTMLDivElement>(null);
  const arrivalTitle = useRef<HTMLHeadingElement>(null);
  const arrivalRef = useRef(state.arrivalId);
  arrivalRef.current = state.arrivalId;
  const tapGuard = useTapGuard(arrivalRef);

  const travelling = state.phase === 'travelling';
  const started = state.phase !== 'intro';
  const complete = isComplete(state.visited);
  const openLetter = () => dispatch({ type: 'openLetter' });
  const starTarget = useCallback(() => bridge.starTarget, [bridge]);
  const letterDialog = (
    <LetterDialog open={complete && state.letterOpen} onClose={() => dispatch({ type: 'closeLetter' })} returnFocus={starTarget} />
  );

  bridge.reducedMotion = reducedMotion;
  bridge.current = travelling ? null : state.current;
  // Anısı henüz açılmamış yıldız, ince bir ışık halkasıyla dokunulabilir olduğunu sezdirir.
  bridge.fx.invite =
    state.phase === 'arrived' && !!state.current && !state.opened.includes(state.current) && !state.detailOpen;

  // Anı açılırken: yüzeyde kısa ışık tepkisi ve yayılan dalga; bakış yıldıza geri yerleşir
  // ki kapanınca aynı kadraja dönülsün.
  useEffect(() => {
    if (!state.detailOpen) return;
    bridge.fx.flareAt = performance.now();
    bridge.look.yaw = 0;
    bridge.look.pitch = 0;
  }, [state.detailOpen, bridge]);

  useEffect(() => {
    document.body.classList.toggle('motion-reduced', reducedMotion);
  }, [reducedMotion]);

  useEffect(() => {
    document.body.dataset.layout = layout;
  }, [layout]);

  useLookControls(stageRef, bridge, status === 'ok');

  const travel = useCallback((to: Destination) => dispatch({ type: 'travel', to }), []);
  // Yıldıza dokunma (kanvas, etiket ya da erişilebilir hedef): uzak yıldıza yolculuk,
  // bulunulan yıldızda anı. Sürükleme, iptal ve çoklu dokunma burada elenir.
  const tapStar = useCallback(
    (id: StarId, fromKeyboard = false) => {
      const arrival = tapGuard.claim(fromKeyboard, arrivalRef.current);
      if (arrival !== null) dispatch({ type: 'touchStar', id, arrival });
    },
    [tapGuard],
  );
  const onArrive = useCallback((flightId: number) => dispatch({ type: 'arrive', flightId }), []);
  const onContextLost = useCallback(() => setStatus('lost'), []);
  const onSlow = useCallback(() => setTier((t) => lowerTier(t)), []);

  // Varışta odak anı başlığına taşınır (klavye ile gezinenler için).
  useEffect(() => {
    if (state.phase !== 'arrived') return;
    const active = document.activeElement as HTMLButtonElement | null;
    if (!active || active === document.body || active.disabled) {
      arrivalTitle.current?.focus({ preventScroll: true });
    }
  }, [state.phase, state.current]);

  const destinationLabel =
    state.flight?.to === 'home'
      ? 'Gökyüzümüze dönüyoruz'
      : state.flight
        ? `${memoryById(state.flight.to).short} yıldızına doğru`
        : '';

  const hint = !started
    ? 'Sürükle, etrafına bak. · Bir yıldız seç.'
    : layout === 'portrait'
      ? 'Etrafına bakmak için sürükle.'
      : 'Bakışını değiştirmek için sürükle.';

  const current = state.current ? memoryById(state.current) : null;

  if (status !== 'ok') {
    return (
      <div className="app in-fallback">
        <div className="fallback-sky" aria-hidden="true" />
        <Fallback
          message={fallbackMessages[status]}
          visited={state.visited}
          onDiscover={(id) => dispatch({ type: 'discoverFallback', id })}
          onLetter={openLetter}
          onRetry={
            status === 'lost' || status === 'error'
              ? () => {
                  if (detectWebGL()) {
                    setSceneKey((k) => k + 1);
                    setStatus('ok');
                  }
                }
              : undefined
          }
        />
        {letterDialog}
      </div>
    );
  }

  return (
    <div className={`app phase-${state.phase}${state.detailOpen ? ' memory-open' : ''}`}>
      <div className="stage" ref={stageRef}>
        <SceneBoundary onError={() => setStatus('error')}>
          <Suspense fallback={<div className="stage-loading" aria-hidden="true" />}>
            <Scene
              key={sceneKey}
              layout={layout}
              at={state.current ?? 'home'}
              flight={state.flight}
              visited={state.visited}
              bridge={bridge}
              tier={tier}
              running={visible}
              interactive={!travelling && !state.listOpen && !state.detailOpen && !state.letterOpen}
              dialogOpen={state.listOpen || state.detailOpen || state.letterOpen}
              onArrive={onArrive}
              onSelect={tapStar}
              onContextLost={onContextLost}
              onSlow={onSlow}
            />
          </Suspense>
        </SceneBoundary>
      </div>
      <div className="veil" aria-hidden="true" ref={(el) => void (bridge.veil = el)} />

      <Header
        started={started}
        complete={complete}
        remaining={memories.length - state.visited.length}
        onLetter={openLetter}
        locked={travelling}
        reducedMotion={reducedMotion}
        onHome={() => travel('home')}
        onList={() => dispatch({ type: 'openList' })}
        onToggleMotion={() => setReducedMotion(!reducedMotion)}
      />

      <main className="experience">
        {state.phase === 'intro' && <Intro onBegin={() => travel('gold')} />}
        {state.phase === 'overview' && (complete ? <CompletionPanel onLetter={openLetter} /> : <ExploreCaption />)}
        {travelling && <FlightStatus label={destinationLabel} ref={(el) => void (bridge.progressBar = el)} />}
        {state.phase === 'arrived' && current && (
          <ArrivalPanel memory={current} ref={arrivalTitle} complete={complete} onLetter={openLetter} />
        )}
        {state.phase === 'arrived' && current && (
          <StarTarget
            key={current.id}
            memory={current}
            bridge={bridge}
            coarse={coarse}
            invite={!state.opened.includes(current.id) && !state.detailOpen}
            onTap={(fromKeyboard) => tapStar(current.id, fromKeyboard)}
          />
        )}
        <StarLabels bridge={bridge} visited={state.visited} onSelect={tapStar} />
        {started && (
          <Navigation
            current={state.current}
            visited={state.visited}
            locked={travelling}
            atHome={state.phase === 'overview'}
            onTravel={travel}
            onHome={() => travel('home')}
            onLetter={openLetter}
          />
        )}
      </main>

      <Footer hint={hint} />

      <MemoryDialog
        memory={current}
        open={state.detailOpen}
        onClose={() => dispatch({ type: 'closeDetail' })}
        nextLabel={complete ? 'Mektubunu aç' : 'Sıradaki yıldıza git'}
        star={starTarget}
        openDelay={reducedMotion ? 0 : 320}
        onNext={() => {
          dispatch({ type: 'closeDetail' });
          if (complete) openLetter();
          else travel(nextUnvisited(state.current, state.visited));
        }}
      />
      {letterDialog}
      <ListDialog
        open={state.listOpen}
        visited={state.visited}
        onClose={() => dispatch({ type: 'closeList' })}
        onPick={(id) => {
          dispatch({ type: 'closeList' });
          travel(id);
        }}
      />
    </div>
  );
}

class SceneBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.error('Gökyüzü başlatılamadı:', error);
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
