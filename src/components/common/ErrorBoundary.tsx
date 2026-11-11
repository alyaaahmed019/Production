import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Paper } from '@mui/material';
import { ErrorState } from './ErrorState';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/** Catches render errors so one broken view doesn't blank the whole app. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Unhandled render error', error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <Paper>
          <ErrorState
            message="This page failed to display. Reload it, or go back and try again."
            onRetry={() => this.setState({ error: null })}
          />
        </Paper>
      );
    }
    return this.props.children;
  }
}
