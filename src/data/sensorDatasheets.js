/** Sensor datasheet rows — import logos from src/assets/sensors/ */
import amphenolLogo from '../assets/sensors/Amphenol.png';
import murataLogo from '../assets/sensors/Murata_Logo.png';
import teconnectivityLogo from '../assets/sensors/te_logo.png';


const sensorDatasheets = [
  {
    id: 'htu31d',
    modelNumber: 'HTU31D',
    sensorType: 'Temperature & Humidity Sensor',
    supplier: 'TE Connectivity',
    datasheetUrl: 'https://www.te.com/en/product-CAT-HSC0007.html',
    logo: teconnectivityLogo,
  },
  {
    id: 'ms5849',
    modelNumber: 'MS5849-02BA (20032999-50)',
    sensorType: 'Pressure Sensor (Absolute)',
    supplier: 'TE Connectivity',
    datasheetUrl: 'https://www.te.com/en/product-20033838-50.html',
    logo: teconnectivityLogo,
  },
  {
    id: 'npa-730b',
    modelNumber: 'NPA-730B-005-D',
    sensorType: 'Pressure Sensor (Differential)',
    supplier: 'Amphenol',
    datasheetUrl: 'https://amphenol-sensors.com/hubfs/Documents/AAS-920-477J-NovaSensor-NPA-SurfaceMnt-013019-web.pdf',
    logo: amphenolLogo,
  },
  {
    id: 'ztpd-2210',
    modelNumber: 'ZTPD-2210',
    sensorType: 'IR Thermopile Detector',
    supplier: 'Amphenol',
    datasheetUrl: 'https://amphenol-sensors.com/hubfs/Specification%20sheet%20of%20ZTPD-2210(IRF042M00-00A0)%20(2).pdf',
    logo: amphenolLogo,
  },
  {
    id: 'sch16t',
    modelNumber: 'SCH16T-K01-004',
    sensorType: 'IMU-Sensor 6-axis',
    supplier: 'Murata',
    datasheetUrl: 'https://www.murata.com/en-us/products/sensor/gyro/overview/lineup/sch16t',
    logo: murataLogo,
  },
  {
    id: 'mmict5838',
    modelNumber: 'MMICT5838-00-012',
    sensorType: 'Microphone',
    supplier: 'TDK InvenSense',
    datasheetUrl: 'https://www.tdk.com/en/search?q=MMICT5838',
    logo: null,
  },
  {
    id: 'irs-d200',
    modelNumber: 'IRS-D200ST00R1',
    sensorType: 'Passive Infrared Sensor',
    supplier: 'Murata',
    datasheetUrl: 'https://www.murata.com/en-us/products/sensor/pir/overview/lineup/irs-d200',
    logo: murataLogo,
  },
];

export default sensorDatasheets;
