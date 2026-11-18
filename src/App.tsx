/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Layout } from './components/Layout';
import { ToastContainer } from './components/ToastContainer';
import { StudySpaceProvider, useStudySpace } from './context/StudySpaceContext';
import { CalendarPage } from './pages/CalendarPage';
import { DashboardPage } from './pages/DashboardPage';
import { NotesPage } from './pages/NotesPage';
import { ProductivityPage } from './pages/ProductivityPage';
import { SchedulePage } from './pages/SchedulePage';
import { SettingsPage } from './pages/SettingsPage';
import { TasksPage } from './pages/TasksPage';
import { TodoPage } from './pages/TodoPage';

const PageRouter: React.FC = () => {
  const { activePage } = useStudySpace();

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'tugas':
        return <TasksPage />;
      case 'jadwal':
        return <SchedulePage />;
      case 'kalender':
        return <CalendarPage />;
      case 'catatan':
        return <NotesPage />;
      case 'produktivitas':
        return <ProductivityPage />;
      case 'todo':
        return <TodoPage />;
      case 'pengaturan':
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activePage}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
      >
        {renderPage()}
      </motion.div>
    </AnimatePresence>
  );
};

export default function App() {
  return (
    <StudySpaceProvider>
      <Layout>
        <PageRouter />
      </Layout>
      <ToastContainer />
    </StudySpaceProvider>
  );
}
