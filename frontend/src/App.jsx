import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Gate from './pages/Gate'
import Report from './pages/Report'
import Compare from './pages/Compare'
import AdminLogin from './pages/admin/AdminLogin'
import AdminLayout from './pages/admin/AdminLayout'
import AdminVehicles from './pages/admin/AdminVehicles'
import AdminVehicleDetail from './pages/admin/AdminVehicleDetail'
import AdminUsers from './pages/admin/AdminUsers'
import AdminReports from './pages/admin/AdminReports'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"            element={<Home />} />
        <Route path="/gate/:vin"   element={<Gate />} />
        <Route path="/report"      element={<Report />} />
        <Route path="/report/:vin" element={<Report />} />
        <Route path="/compare"     element={<Compare />} />

        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/vehicles" replace />} />
          <Route path="vehicles"     element={<AdminVehicles />} />
          <Route path="vehicles/:vin" element={<AdminVehicleDetail />} />
          <Route path="users"        element={<AdminUsers />} />
          <Route path="reports"      element={<AdminReports />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
