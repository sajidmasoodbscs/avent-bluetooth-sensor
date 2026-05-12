import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';

const PANEL_BG = '#161b22';
const GRID_COL = '#21262d';
const TEXT_COL = '#e6edf3';
const DIM_COL = '#8b949e';
const TRAJ_COL = '#58a6ff';
const TRAJ_START = '#6bcb77';
const TRAJ_END = '#ff6b6b';

const axisCommon = {
  color: DIM_COL,
  gridcolor: GRID_COL,
  zerolinecolor: GRID_COL,
  showbackground: true,
  backgroundcolor: PANEL_BG,
};

/**
 * Interactive 3D trajectory using Plotly (`plotly.js` + `react-plotly.js`).
 * Drag to orbit, scroll to zoom, mode bar for reset / download.
 */
export default function TrajectoryCanvas3D({ px, py, pz, width = '100%', height = 360, dataRevision = 0 }) {
  const data = useMemo(() => {
    const n = px.length;
    if (n < 2) return [];

    return [
      {
        type: 'scatter3d',
        mode: 'lines',
        x: px,
        y: py,
        z: pz,
        line: { color: TRAJ_COL, width: 5 },
        name: 'Trajectory',
        hovertemplate: 'x: %{x:.3f} m<br>y: %{y:.3f} m<br>z: %{z:.3f} m<extra></extra>',
      },
      {
        type: 'scatter3d',
        mode: 'markers+text',
        x: [px[0]],
        y: [py[0]],
        z: [pz[0]],
        text: ['Start'],
        textposition: 'top center',
        textfont: { color: TEXT_COL, size: 10 },
        marker: { size: 9, color: TRAJ_START, line: { color: TEXT_COL, width: 0.5 } },
        name: 'Start',
        hovertemplate: 'Start<br>x: %{x:.3f}<br>y: %{y:.3f}<br>z: %{z:.3f}<extra></extra>',
      },
      {
        type: 'scatter3d',
        mode: 'markers+text',
        x: [px[n - 1]],
        y: [py[n - 1]],
        z: [pz[n - 1]],
        text: ['Now'],
        textposition: 'top center',
        textfont: { color: TEXT_COL, size: 10 },
        marker: { size: 9, color: TRAJ_END, line: { color: TEXT_COL, width: 0.5 } },
        name: 'Now',
        hovertemplate: 'Now<br>x: %{x:.3f}<br>y: %{y:.3f}<br>z: %{z:.3f}<extra></extra>',
      },
    ];
  }, [px, py, pz]);

  const layout = useMemo(
    () => ({
      paper_bgcolor: PANEL_BG,
      plot_bgcolor: PANEL_BG,
      autosize: true,
      margin: { l: 0, r: 0, t: 8, b: 0 },
      showlegend: false,
      uirevision: 'imu-traj',
      datarevision: dataRevision,
      scene: {
        bgcolor: PANEL_BG,
        aspectmode: 'data',
        xaxis: { ...axisCommon, title: { text: 'X (m)', font: { color: TEXT_COL, size: 11 } } },
        yaxis: { ...axisCommon, title: { text: 'Y (m)', font: { color: TEXT_COL, size: 11 } } },
        zaxis: { ...axisCommon, title: { text: 'Z (m)', font: { color: TEXT_COL, size: 11 } } },
        camera: {
          eye: { x: 1.45, y: 1.45, z: 1.15 },
        },
      },
    }),
    [dataRevision],
  );

  if (px.length < 2) {
    return (
      <div
        style={{
          width,
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: PANEL_BG,
          borderRadius: 4,
          color: DIM_COL,
          fontSize: 13,
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        Waiting for trajectory points…
      </div>
    );
  }

  return (
    <Plot
      data={data}
      layout={layout}
      config={{
        displayModeBar: true,
        responsive: true,
        scrollZoom: true,
        displaylogo: false,
        modeBarButtonsToRemove: ['lasso2d', 'select2d'],
      }}
      style={{ width, height }}
      useResizeHandler
    />
  );
}
