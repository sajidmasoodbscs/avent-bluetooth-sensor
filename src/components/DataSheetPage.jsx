import React, { useState } from 'react';
import {
  Box,
  Link,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import sensorDatasheets from '../data/sensorDatasheets';

const LOGO_COL_WIDTH = 180;
const LOGO_CELL_HEIGHT = 72;

function resolveAssetUrl(src) {
  if (!src) return null;
  if (typeof src !== 'string') return src;
  if (src.startsWith('http') || src.startsWith('/static/') || src.startsWith('data:')) return src;
  return src.startsWith('/') ? src : `/${src}`;
}

function resolveLogoSrc(src) {
  return resolveAssetUrl(src);
}

const linkSx = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 0.5,
  color: '#2e7d32',
  fontWeight: 500,
  textDecoration: 'none',
  '&:hover': { textDecoration: 'underline' },
};

function LogoCell({ src, alt }) {
  const [failed, setFailed] = useState(false);
  const logoSrc = resolveLogoSrc(src);

  if (!logoSrc || failed) {
    return (
      <Typography variant="caption" sx={{ color: '#bbb' }}>
        —
      </Typography>
    );
  }

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Box
        component="img"
        src={logoSrc}
        alt={alt}
        onError={() => setFailed(true)}
        sx={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
        }}
      />
    </Box>
  );
}

export default function DataSheetPage() {
  return (
    <Box sx={{ maxWidth: '1400px', mx: 'auto', p: 1 }}>
      <Box
        sx={{
          backgroundColor: '#53ba64',
          borderRadius: '6px',
          p: { xs: 3, md: 4 },
          mb: 4,
          color: '#fff',
          minHeight: 140,
          boxShadow: '0 10px 40px rgba(83, 186, 100, 0.2)',
        }}
      >
        <Typography variant="h3" sx={{ fontWeight: 'medium', mb: 1, fontSize: '26px' }}>
          Sensor Data Sheets
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 'normal', fontSize: '15px' }}>
          Component specifications and supplier documentation for the evaluation board
        </Typography>
      </Box>

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #f0f0f0', borderRadius: 2 }}>
        <Table sx={{ minWidth: 720 }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f9f9f9' }}>
              <TableCell sx={{ fontWeight: 700, width: LOGO_COL_WIDTH, minWidth: LOGO_COL_WIDTH }}>Logo</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Supplier</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Model Number</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Sensor Type</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Datasheet / Product Page Link</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Data Sheet PDF</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sensorDatasheets.map((row) => (
              <TableRow
                key={row.id}
                hover
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell
                  sx={{
                    width: LOGO_COL_WIDTH,
                    minWidth: LOGO_COL_WIDTH,
                    height: LOGO_CELL_HEIGHT,
                    p: 1,
                    verticalAlign: 'middle',
                    boxSizing: 'border-box',
                  }}
                >
                  <LogoCell src={row.logo} alt={`${row.supplier} logo`} />
                </TableCell>
                <TableCell>{row.supplier}</TableCell>
                <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {row.modelNumber}
                </TableCell>
                <TableCell>{row.sensorType}</TableCell>
                <TableCell>
                  <Link
                    href={row.datasheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={linkSx}
                  >
                    <DescriptionIcon sx={{ fontSize: 18 }} />
                    Product Page
                  </Link>
                </TableCell>
                <TableCell>
                  {row.datasheetPdf ? (
                    <Link
                      href={resolveAssetUrl(row.datasheetPdf)}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={linkSx}
                    >
                      <PictureAsPdfIcon sx={{ fontSize: 18 }} />
                      View Data Sheet
                    </Link>
                  ) : (
                    <Typography variant="caption" sx={{ color: '#bbb' }}>
                      —
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
