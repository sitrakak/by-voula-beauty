import Sidebar from './Sidebar.jsx';

export default function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="content">{children}</main>
    </div>
  );
}

