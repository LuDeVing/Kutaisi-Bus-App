import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import TimetablePanel from './components/TimetablePanel.jsx'
import './index.css'
import { applyTimetableStops } from './timetableStops'
import { initialBuses } from './data/buses'

const root = ReactDOM.createRoot(document.getElementById('root'));
let revision = 0;
let previousTopology = '';
let timetable = null;

function DesktopApp({ segments, topologyRevision }) {
  const [showTimetable, setShowTimetable] = React.useState(false);
  return (
    <>
      <App key={topologyRevision} fleet={initialBuses}
        onOpenTimetable={segments && (() => setShowTimetable(true))} />
      {showTimetable && segments && <TimetablePanel segments={segments} onClose={() => setShowTimetable(false)} />}
    </>
  );
}

function render() {
  root.render(<React.StrictMode><DesktopApp segments={timetable} topologyRevision={revision} /></React.StrictMode>);
}

window.chrome?.webview?.addEventListener('message', ({ data }) => {
  if (data?.type !== 'timetable-data' || !Array.isArray(data.segments)) return;
  timetable = data.segments;
  const topology = JSON.stringify(timetable.map(({ route, stop, startWaypoint, customWaypoint }) =>
    [route, stop, startWaypoint, customWaypoint]));
  if (topology !== previousTopology) {
    previousTopology = topology;
    applyTimetableStops(timetable);
    revision++;
  }
  render();
});

render();
