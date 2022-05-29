import styled from "@emotion/styled";
import WarningIcon from "@mui/icons-material/Warning";
import Button from "@mui/material/Button";
import Collapse from "@mui/material/Collapse";
import React from "react";

const StackTraceContainer = styled.div`
  background-color: #290000;
  width: 100%;
  overflow: auto;
  margin-top: 10px;
  border-radius: 5px;
`;

interface ErrorBoundaryState {
  hasError: boolean;
  errorInfo: any;
  showStackTrace: boolean;
}

export class ErrorBoundary extends React.Component<any, ErrorBoundaryState> {
  constructor(props: any) {
    super(props);
    this.state = {
      hasError: false,
      errorInfo: null,
      showStackTrace: false,
    };
  }

  public static getDerivedStateFromError() {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  public componentDidCatch(_error: any, errorInfo: any) {
    // You can also log the error to an error reporting service
    this.setState({ errorInfo });
  }

  public render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    // Render fallback error UI
    return (
      <div style={{ padding: "0 20px 20px", color: "#DB6A6A" }}>
        <h2 style={{ display: "flex", alignItems: "center" }}>
          <WarningIcon />
          <span style={{ marginLeft: 10 }}>Uh oh... Something went wrong!</span>
        </h2>
        {window.electron.common.isDevelopment && this.state.errorInfo !== null && (
          <div>
            <Button onClick={() => this.setState({ showStackTrace: !this.state.showStackTrace })} size="small">
              Toggle stack trace
            </Button>
            <div style={{ width: "100%", overflow: "auto" }}>
              <Collapse in={this.state.showStackTrace} timeout="auto" unmountOnExit>
                <StackTraceContainer>
                  <pre style={{ userSelect: "text" }}>{this.state.errorInfo.componentStack}</pre>
                </StackTraceContainer>
              </Collapse>
            </div>
          </div>
        )}
      </div>
    );
  }
}
