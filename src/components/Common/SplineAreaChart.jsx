import { Card, Typography } from "@mui/material";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// Reusable real-time line chart ("waveform" style)
// Props:
// - title: string
// - data: array of { time: string, value: number }
// - height: number (optional)
// - hideXAxis: boolean (optional)
const SplineAreaChart = ({ title, data = [], height = 300, hideXAxis = true }) => {
  return (
    <Card sx={{ mb: 2, p: 2, flex: 1 }}>
      {title && (
        <Typography variant="subtitle1" gutterBottom>
          {title}
        </Typography>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <XAxis dataKey="time" hide={hideXAxis} tick={{ fontSize: 12 }} />
          <YAxis width={40} tick={{ fontSize: 12 }} stroke="#9e9e9e" />
          <CartesianGrid strokeDasharray="2 4" stroke="#e0e0e0" />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke="#2e7d32" strokeWidth={3} dot={false} isAnimationActive />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default SplineAreaChart;
