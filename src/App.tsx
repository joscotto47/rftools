import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import DbmConverter from './pages/RF/DbmConverter'
import EirpCalculator from './pages/RF/EirpCalculator'
import LinkBudget from './pages/RF/LinkBudget'
import RfAttenuationReference from './pages/RF/RfAttenuationReference'
import AntennaCalculator from './pages/RF/AntennaCalculator'
import NoiseSnrCalculator from './pages/RF/NoiseSnrCalculator'
import PhyRateCalculator from './pages/RF/PhyRateCalculator'
import Channels from './pages/Wifi/Channels'
import WifiCapacityCalculator from './pages/Wifi/WifiCapacityCalculator'
import WifiNetworkPlanner from './pages/Wifi/WifiNetworkPlanner'
import SubnetCalculator from './pages/Networking/SubnetCalculator'
import PoeCalculator from './pages/Networking/PoeCalculator'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/rf/dbm" element={<DbmConverter />} />
        <Route path="/rf/eirp" element={<EirpCalculator />} />
        <Route path="/rf/link-budget" element={<LinkBudget />} />
        <Route path="/rf/attenuation" element={<RfAttenuationReference />} />
        <Route path="/rf/antenna" element={<AntennaCalculator />} />
        <Route path="/rf/noise-snr" element={<NoiseSnrCalculator />} />
        <Route path="/wifi/channels" element={<Channels />} />
        <Route path="/wifi/phy-rate" element={<PhyRateCalculator />} />
        <Route path="/wifi/capacity" element={<WifiCapacityCalculator />} />
        <Route path="/wifi/planner" element={<WifiNetworkPlanner />} />
        <Route path="/networking/subnet" element={<SubnetCalculator />} />
        <Route path="/networking/poe" element={<PoeCalculator />} />
        <Route path="/poe" element={<PoeCalculator />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}