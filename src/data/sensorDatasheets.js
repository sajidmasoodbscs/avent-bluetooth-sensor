/** Sensor datasheet rows — import logos from src/assets/sensors/ */
import amphenolLogo from '../assets/sensors/Amphenol.png';
import murataLogo from '../assets/sensors/Murata_Logo.png';
import teconnectivityLogo from '../assets/sensors/te_logo.png';
import tdklogo from '../assets/sensors/TDK_logo_vertical_blue.png';


import htu31Pdf from '../assets/datasheets/HTU31.pdf';
import ms5849Pdf from '../assets/datasheets/MS5849-02BA (20032999-50).pdf';
import npa730bPdf from '../assets/datasheets/NPA-730B-005-D.pdf';
import ztpd2210Pdf from '../assets/datasheets/ZTPD-2210.pdf';
import sch16tPdf from '../assets/datasheets/SCH16T-K01-004.pdf';
import mmict5838Pdf from '../assets/datasheets/MMICT5838-00-012.pdf';
import irsD200Pdf from '../assets/datasheets/IRS-D200ST00R1.pdf';

const sensorDatasheets = [
  {
    id: 'htu31d',
    modelNumber: 'HTU31D',
    sensorType: 'Temperature & Humidity Sensor',
    supplier: 'TE Connectivity',
    datasheetUrl: 'https://www.te.com/en/product-CAT-HSC0007.html',
    logo: teconnectivityLogo,
    datasheetPdf: htu31Pdf,
  },
  {
    id: 'ms5849',
    modelNumber: 'MS5849-02BA (20032999-50)',
    sensorType: 'Pressure Sensor (Absolute)',
    supplier: 'TE Connectivity',
    datasheetUrl: 'https://www.te.com/en/product-20033838-50.html',
    logo: teconnectivityLogo,
    datasheetPdf: ms5849Pdf,
  },
  {
    id: 'npa-730b',
    modelNumber: 'NPA-730B-005-D',
    sensorType: 'Pressure Sensor (Differential)',
    supplier: 'Amphenol',
    datasheetUrl: 'https://amphenol-sensors.com/hubfs/Documents/AAS-920-477J-NovaSensor-NPA-SurfaceMnt-013019-web.pdf',
    logo: amphenolLogo,
    datasheetPdf: npa730bPdf,
  },
  {
    id: 'ztpd-2210',
    modelNumber: 'ZTPD-2210',
    sensorType: 'IR Thermopile Detector',
    supplier: 'Amphenol',
    datasheetUrl: 'https://amphenol-sensors.com/hubfs/Specification%20sheet%20of%20ZTPD-2210(IRF042M00-00A0)%20(2).pdf',
    logo: amphenolLogo,
    datasheetPdf: ztpd2210Pdf,
  },
  {
    id: 'sch16t',
    modelNumber: 'SCH16T-K01-004',
    sensorType: 'IMU-Sensor 6-axis',
    supplier: 'Murata',
    datasheetUrl: 'https://www.murata.com/en-us/products/sensor/gyro/overview/lineup/sch16t',
    logo: murataLogo,
    datasheetPdf: sch16tPdf,
  },
  {
    id: 'mmict5838',
    modelNumber: 'MMICT5838-00-012',
    sensorType: 'Microphone',
    supplier: 'TDK InvenSense',
    datasheetUrl: 'https://invensense.tdk.com/en-us/products/microphone/t5838',
    logo: tdklogo,
    datasheetPdf: mmict5838Pdf,
  },
  {
    id: 'irs-d200',
    modelNumber: 'IRS-D200ST00R1',
    sensorType: 'Passive Infrared Sensor',
    supplier: 'Murata',
    datasheetUrl: 'https://www.murata.com/en-us/products/sensor/pir/overview/lineup/irs-d200',
    logo: murataLogo,
    datasheetPdf: irsD200Pdf,
  },
];

export default sensorDatasheets;
