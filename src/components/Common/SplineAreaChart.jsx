import { Box, Card, CardContent, Typography } from "@mui/material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

const data = [
  { name: "Jan", value: 30 },
  { name: "Feb", value: 40 },
  { name: "Mar", value: 30 },
  { name: "Apr", value: 50 },
  { name: "May", value: 45 },
  { name: "Jun", value: 85 },
  { name: "Jul", value: 75 },
];

const SplineAreaChart = () => {
  return (
    <Card sx={{ mb: 4, p: 2, flex: 1 }}>
      <Typography variant="h6" gutterBottom>
        Chart
      </Typography>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#53ba64" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#53ba64" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="name" />
          <YAxis domain={[20, 90]} />
          <CartesianGrid strokeDasharray="3 3" />
          <Tooltip />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#53ba64"
            fillOpacity={1}
            fill="url(#colorValue)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default SplineAreaChart;
