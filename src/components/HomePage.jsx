import * as React from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import SplineAreaChart from './Common/SplineAreaChart';
import BreathMoistureLevel from './Common/BreathMoistureLevel';

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'center',
  color: (theme.vars ?? theme).palette.text.secondary,
  ...theme.applyStyles('dark', {
    backgroundColor: '#1A2027',
  }),
}));

export default function HomePage() {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
            <SplineAreaChart />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
        <SplineAreaChart />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
            <BreathMoistureLevel />
        </Grid>
      </Grid>
    </Box>
  );
}
