import React from "react";
import { Box, Grid, Paper, Typography } from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";

const data = {
  reading1: 65,
  reading2: 72,
  levelChange: 7, // positive = increase, negative = decrease
};

export default function BreathMoistureLevel() {
  const isIncrease = data.levelChange >= 0;

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Typography variant="h6" gutterBottom>
        Today Breath Moisture Level
      </Typography>
      <Grid container spacing={2}>
        {/* Reading 1 */}
        <Grid item xs={12} md={4}>
          <Paper
            elevation={3}
            sx={{
              p: 3,
              backgroundColor: "#53ba64",
              color: "#fff",
              textAlign: "center",
              borderRadius: 2,
              width: "100%",
            }}
          >
            <Typography variant="h5">Reading 1</Typography>
            <Typography variant="h4">{data.reading1}%</Typography>
          </Paper>
        </Grid>

        {/* Reading 2 */}
        <Grid item xs={12} md={4}>
          <Paper
            elevation={3}
            sx={{
              p: 3,
              backgroundColor: "#53ba64",
              color: "#fff",
              textAlign: "center",
              borderRadius: 2,
              width: "100%",
            }}
          >
            <Typography variant="h5">Reading 2</Typography>
            <Typography variant="h4">{data.reading2}%</Typography>
          </Paper>
        </Grid>

        {/* Level Change */}
        <Grid item xs={12} md={4}>
          <Paper
            elevation={3}
            sx={{
              p: 3,
              backgroundColor: isIncrease ? "#53ba64" : "#53ba64",
              color: "#fff",
              textAlign: "center",
              borderRadius: 2,
              width: "100%",
            }}
          >
            <Typography variant="h5">Level Change</Typography>
            <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
              {isIncrease ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />}
              <Typography variant="h4">{Math.abs(data.levelChange)}%</Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
