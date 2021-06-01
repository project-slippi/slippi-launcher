import styled from "@emotion/styled";

export const Spinner = styled.div<{
  size?: string;
  borderSize?: string;
}>`
  &,
  &:after {
    border-radius: 50%;
    width: ${(p) => p.size};
    height: ${(p) => p.size};
  }

  & {
    position: relative;
    border: ${(p) => p.borderSize} solid rgba(255, 255, 255, 0.2);
    border-left: ${(p) => p.borderSize} solid #ffffff;
    transform: translateZ(0);
    animation: load8 1.1s infinite linear;
  }

  @keyframes load8 {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

Spinner.defaultProps = {
  size: "60px",
  borderSize: "8px",
};
