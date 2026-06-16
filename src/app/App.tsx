import { ReactFlowProvider } from 'reactflow';
import { WorkflowCanvas } from '../components/canvas/WorkflowCanvas';
import { NodeLibrary } from '../components/panels/NodeLibrary';
import { ArtifactViewer } from '../components/panels/ArtifactViewer';
import { SettingsPanel } from '../components/panels/SettingsPanel';
import { TopBar } from '../components/panels/TopBar';
import { useWorkflowStore } from '../store/workflowStore';

export function App() {
  const settingsOpen = useWorkflowStore((state) => state.settingsOpen);
  const artifactOpen = useWorkflowStore((state) => state.artifactOpen);

  return (
    <ReactFlowProvider>
      <main className="relative flex h-full overflow-hidden bg-canvas">
        <NodeLibrary />
        <section className="relative min-w-0 flex-1">
          <TopBar />
          <WorkflowCanvas />
        </section>
        {artifactOpen && <ArtifactViewer />}
        {settingsOpen && <SettingsPanel />}
      </main>
    </ReactFlowProvider>
  );
}
