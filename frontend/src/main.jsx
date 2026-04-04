import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import './index.css'
import App from './App.jsx'

import { TaskProvider } from './context/TaskContext'

import { FocusProvider } from './context/FocusContext'

import { AnalyticsProvider } from './context/AnalyticsContext'
import { InboxProvider } from './context/InboxContext'
import { NotificationProvider } from './context/NotificationContext'
import { ThemeProvider } from './context/ThemeContext'
import { RuleProvider } from './context/RuleContext'
import { SubjectProvider } from './context/SubjectContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <RuleProvider>
            <TaskProvider>
              <SubjectProvider>
                <InboxProvider>
                  <NotificationProvider>
                    <AnalyticsProvider>
                      <FocusProvider>
                        <App />
                      </FocusProvider>
                    </AnalyticsProvider>
                  </NotificationProvider>
                </InboxProvider>
              </SubjectProvider>
            </TaskProvider>
          </RuleProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
