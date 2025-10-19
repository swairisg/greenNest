import { Link, useLocation } from 'react-router-dom';
import { FaTachometerAlt, FaUsers, FaBoxOpen  } from 'react-icons/fa';
import './Sidebar.css';

const Sidebar = ({ vanishState , setVanishState = () => {} }) => {
  const location = useLocation();
  const menuItems = [
    { path: '/admin/customerdashboard', name: 'Dashboard', icon: <FaTachometerAlt /> },
    { path: '/admin/customers', name: 'View Customers', icon: <FaUsers /> },
    { path: '/visits/bookings', name: 'View Bookings', icon: <FaBoxOpen /> },
  ];

  return (
    <div>
    <div
      className={`harvest_sidebar ${vanishState === 1 ? 'is-vanished' : ''}`}
      aria-hidden={vanishState === 1}
    >
      <div className="harvest_sidebar-header">
        <h3>User Management</h3>
      </div>

      <nav className="harvest_sidebar-nav">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setVanishState(1)}   // vanish on click
            className={`harvest_nav-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            <span className="harvest_nav-icon">{item.icon}</span>
            <span className="harvest_nav-text">{item.name}</span>
          </Link>
        ))}
      </nav>
    </div>
    
</div>
  );
};

export default Sidebar;
