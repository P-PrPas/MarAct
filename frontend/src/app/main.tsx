import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { defaultIdeaId, demoIdeas, ideaPath, ideas } from '../ideas/registry';
import './styles.css';
import '../ideas/idea-a/dashboard.css';

function IdeaPage() {
  const { ideaId } = useParams();
  const navigate = useNavigate();
  const idea = ideas.find(({ id, status }) => id === ideaId && status !== 'retired');
  const selected = idea?.status === 'demo' ? idea.id : '';

  return (
    <div className={idea?.id === 'idea-a' ? 'idea-a-page' : undefined}>
      <header>
        <strong>MarAct</strong>
        <label>
          Idea
          <select value={selected} onChange={(event) => navigate(ideaPath(event.target.value))}>
            {!selected && <option value="" disabled>Choose a demo</option>}
            {demoIdeas.map(({ id, label }) => <option key={id} value={id}>{label}</option>)}
          </select>
        </label>
      </header>
      <main>{idea ? <idea.Screen key={idea.id} /> : <h1>Idea unavailable</h1>}</main>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Navigate to={ideaPath(defaultIdeaId)} replace />} />
      <Route path="/ideas/:ideaId/*" element={<IdeaPage />} />
      <Route path="*" element={<IdeaPage />} />
    </Routes>
  </BrowserRouter>,
);
